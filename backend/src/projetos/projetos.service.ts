import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { ProjetoMaterial } from '../materiais/entities/projeto-material.entity';

import { AuditoriaService } from 'src/auditoria/auditoria.service';
import { Evento } from 'src/evento/entities/evento.entity';
import { TemaEvento } from 'src/evento/entities/tema-evento.entity';
import { User } from 'src/users/entities/user.entity';
import { CreateProjetoDto } from './dto/create-projeto.dto';
import { UpdateProjetoDto } from './dto/update-projeto.dto';
import { ProjetoAluno } from './entities/projeto-aluno.entity';
import { ProjetoOrientador } from './entities/projeto-orientador.entity';
import { Projeto } from './entities/projeto.entity';
import { ProjetosEquipeService } from './ProjetosEquipe.service';
import { ProjetosValidacaoService } from './ProjetosValidacao.service';

@Injectable()
export class ProjetosService {
  constructor(

    @InjectRepository(ProjetoMaterial)
    private readonly projetoMaterialRepository: Repository<ProjetoMaterial>,

    @InjectRepository(Projeto)
    private readonly projetoRepository: Repository<Projeto>,

    @InjectRepository(ProjetoAluno)
    private readonly projetoAlunoRepository: Repository<ProjetoAluno>,

    @InjectRepository(ProjetoOrientador)
    private readonly projetoOrientadorRepository: Repository<ProjetoOrientador>,

    @InjectRepository(TemaEvento)
    private readonly temaEventoRepository: Repository<TemaEvento>,

    @InjectRepository(Evento)
    private readonly eventoRepository: Repository<Evento>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly dataSource: DataSource,
    private readonly auditoriaService: AuditoriaService,
    private readonly equipeService: ProjetosEquipeService,
    private readonly validacaoService: ProjetosValidacaoService,
  ) { }

  // =========================================================================
  // CRIAÇÃO (CREATE)
  // =========================================================================

  /**
   * Cria um novo projeto dentro do evento ativo, vinculando o autor e os participantes.
   * Realiza validações de prazo de inscrição, tamanho de grupo e disponibilidade dos alunos.
   */
  async create(dto: CreateProjetoDto, userId: number): Promise<Projeto> {
    const ultimoEvento = await this.validacaoService.buscarUltimoEvento();

    await this.validacaoService.validarEventoETema(ultimoEvento.id, dto.temaId);
    await this.validacaoService.validateGroupSize(dto.alunosIds);
    await this.validacaoService.ensureAlunosAreAvailable(ultimoEvento.id, [
      ...(dto.alunosIds || []),
      userId,
    ]);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const projeto = await this.saveProjeto(
        queryRunner,
        dto,
        userId,
        ultimoEvento.id,
      );

      await this.saveParticipantes(queryRunner, projeto.id, dto.alunosIds, userId);
      await queryRunner.commitTransaction();

      await this.auditoriaService.registrar(
        userId,
        'PROJETO_CRIADO',
        `Projeto "${projeto.titulo}" criado pelo aluno #${userId}.`,
        projeto.id,
      );

      return this.findOne(projeto.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // =========================================================================
  // CONSULTA (READ)
  // =========================================================================

  /**
   * Busca um projeto específico pelo ID.
   * Filtra os orientadores para retornar apenas quem deu "aceito".
   */
  async findOne(id: number): Promise<Projeto> {
    const projeto = await this.projetoRepository.findOne({
      where: { id },
      relations: this.getProjetoRelations(),
      select: this.getProjetoSelectFields(),
    });

    if (!projeto) {
      throw new NotFoundException(`Projeto #${id} nao encontrado`);
    }

    this.filtrarOrientadoresAceitos(projeto);
    return projeto;
  }

  /**
   * Encontra o projeto ativo do aluno no evento vigente,
   * seja ele o aluno autor ou um dos integrantes da equipe.
   */
  async findProjetoAtualPorAluno(userId: number): Promise<Projeto | null> {
    try {
      const eventoAtual = await this.validacaoService.buscarUltimoEvento();

      const projetoBase = await this.projetoRepository
        .createQueryBuilder('projeto')
        .leftJoin('projeto.evento', 'evento')
        .leftJoin('projeto.alunoAutor', 'autor')
        .leftJoin('projeto.projetoAlunos', 'pa')
        .leftJoin('pa.aluno', 'aluno')
        .where('evento.id = :eventoId', { eventoId: eventoAtual.id })
        .andWhere('(autor.id = :userId OR aluno.id = :userId)', { userId })
        .select('projeto.id')
        .getOne();

      if (!projetoBase) return null;

      const projeto = await this.projetoRepository.findOne({
        where: { id: projetoBase.id },
        relations: this.getProjetoRelations(),
        select: this.getProjetoSelectFields(),
      });

      if (!projeto) return null;

      this.filtrarOrientadoresAceitos(projeto);
      return projeto;
    } catch (error) {
      if (error instanceof NotFoundException) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Retorna todos os projetos criados por um aluno autor específico.
   */
  async findAllAlunos(userId: number): Promise<Projeto[]> {
    return this.projetoRepository.find({
      where: { alunoAutor: { id: userId } },
      relations: this.getProjetoRelations(),
      select: this.getProjetoSelectFields(),
    });
  }

  /**
   * Retorna todos os projetos em que o orientador foi aceito.
   */
  async findAllOrientador(userId: number): Promise<Projeto[]> {
    const projetosOrientados = await this.projetoOrientadorRepository.find({
      where: { orientador: { id: userId }, status: 'aceito' },
      relations: {
        projeto: this.getProjetoRelations(),
      },
    });

    return projetosOrientados.map((solicitacao) => solicitacao.projeto);
  }

  /**
   * Retorna a lista de eventos com seus respectivos projetos para a visão da Coordenação.
   */
  async findAllCoordenador(): Promise<Evento[]> {
    return this.dataSource.getRepository(Evento).find({
      relations: {
        projetos: this.getProjetoRelations(),
      },
      order: { id: 'DESC' },
    });
  }

  // =========================================================================
  // ATUALIZAÇÃO E REMOÇÃO (UPDATE / DELETE)
  // =========================================================================

  /**
   * Atualiza as informações básicas do projeto.
   * Permite que coordenadores manipulem integrantes da equipe.
   */
  async update(
    id: number,
    dto: UpdateProjetoDto,
    userId: number,
    role: string,
  ): Promise<Projeto> {
    const projeto = await this.findOne(id);

    if (role !== 'coordenador' && projeto.alunoAutor.id !== userId) {
      throw new ForbiddenException('Sem permissao para editar este projeto.');
    }

    let eventoId = dto.evento || projeto.evento?.id;

    if (!eventoId) {
      const ultimo = await this.validacaoService.buscarUltimoEvento();
      eventoId = ultimo.id;
    }

    if (role !== 'coordenador') {
      if (dto.temaId) {
        await this.validacaoService.validarEventoETema(eventoId, dto.temaId);
      }
    }


    if (dto.alunosIds) {
      if (role !== 'coordenador') {
        await this.validacaoService.validateGroupSize(dto.alunosIds);
      }
      await this.validacaoService.ensureAlunosAreAvailable(
        eventoId,
        [...dto.alunosIds, projeto.alunoAutor.id],
        projeto.id,
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const dadosAtualizados: Partial<Projeto> = {
        titulo: dto.titulo ?? projeto.titulo,
        descricao: dto.descricao ?? projeto.descricao,
        evento: { id: eventoId } as Evento,
        alunoAutor: { id: projeto.alunoAutor.id } as User,
      };

      if (dto.temaId) {
        dadosAtualizados.temaId = dto.temaId;
      }

      this.projetoRepository.merge(projeto, dadosAtualizados);
      await queryRunner.manager.save(projeto);

      if (dto.alunosIds) {
        await queryRunner.manager.delete(ProjetoAluno, {
          projeto: { id: projeto.id },
        });
        await this.saveParticipantes(
          queryRunner,
          projeto.id,
          dto.alunosIds,
          projeto.alunoAutor.id,
        );
      }

      await queryRunner.commitTransaction();

      await this.auditoriaService.registrar(
        userId,
        'PROJETO_ATUALIZADO',
        `Projeto #${id} atualizado por usuario com cargo "${role}".`,
        id,
      );

      return this.findOne(id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Remove completamente o projeto do banco de dados (Apenas Autor ou Coordenação).
   */
  async remove(id: number, userId: number, role: string): Promise<void> {
    const projeto = await this.findOne(id);

    if (role !== 'coordenador' && projeto.alunoAutor.id !== userId) {
      throw new ForbiddenException('Sem permissao para remover este projeto.');
    }

    await this.projetoRepository.remove(projeto);

    await this.auditoriaService.registrar(
      userId,
      'PROJETO_REMOVIDO',
      `Projeto #${id} removido por usuario com cargo "${role}". Titulo: "${projeto.titulo}".`,
    );
  }

  // =========================================================================
  // QR CODE
  // =========================================================================

  /**
   * Marca um projeto como "QR Code gerado". Só permite gerar se o projeto
   * tiver pelo menos um material aprovado (mesma regra da listagem).
   */
  async gerarQrCode(
    id: number,
    userId: number,
  ): Promise<{ id: number; qrcode: boolean; url: string }> {
    const projeto = await this.projetoRepository.findOne({
      where: { id },
      relations: ['materiais'],
    });

    if (!projeto) {
      throw new NotFoundException(`Projeto #${id} nao encontrado.`);
    }

    const possuiMaterialAprovado = (projeto.materiais ?? []).some(
      (material) => material.status === 'aprovado',
    );

    if (!possuiMaterialAprovado) {
      throw new BadRequestException(
        'Este projeto nao possui nenhum material aprovado. Nao e possivel gerar o QR Code.',
      );
    }

    projeto.qrcodeGerado = true;
    await this.projetoRepository.save(projeto);

    await this.auditoriaService.registrar(
      userId,
      'PROJETO_QRCODE_GERADO',
      `QR Code gerado para o projeto #${id}.`,
      id,
    );

    return {
      id: projeto.id,
      qrcode: true,
      url: `${process.env.FRONTEND_PUBLIC_URL ?? ''}/publico/projeto/${id}`,
    };
  }

  // =========================================================================
  // MÉTODOS PRIVADOS DE APOIO
  // =========================================================================

  /**
   * Salva o registro inicial da entidade de Projetos.
   */
  private async saveProjeto(
    qr: QueryRunner,
    dto: CreateProjetoDto,
    autorId: number,
    eventoId: number,
  ): Promise<Projeto> {
    const projeto = qr.manager.create(Projeto, {
      titulo: dto.titulo,
      descricao: dto.descricao,
      temaId: dto.temaId,
      evento: { id: eventoId } as Evento,
      alunoAutor: { id: autorId } as User,
    });

    return qr.manager.save(projeto);
  }

  /**
   * Associa os integrantes convidados à tabela pivot do projeto, limpando duplicatas.
   */
  private async saveParticipantes(
    qr: QueryRunner,
    projetoId: number,
    convidadosIds: number[] = [],
    autorId: number,
  ) {
    const participantesApenas = convidadosIds.filter((id) => id !== autorId);
    const idsUnicos = [...new Set(participantesApenas)];

    if (idsUnicos.length === 0) return [];

    const vinculos = idsUnicos.map((id) =>
      qr.manager.create(ProjetoAluno, {
        projeto: { id: projetoId },
        aluno: { id },
      }),
    );

    return qr.manager.save(vinculos);
  }

  /**
   * Centraliza a filtragem de orientadores de um projeto para expor apenas solicitações relevantes ao aluno.
   */
  private filtrarOrientadoresAceitos(projeto: Projeto) {
    if (projeto.orientadores) {
      projeto.orientadores = projeto.orientadores.filter(
        (relacao) =>
          relacao.status === 'aceito' ||
          relacao.status === 'recusado' ||
          relacao.status === 'pendente',
      );
    } else {
      projeto.orientadores = [];
    }
  }

  // =========================================================================
  // CONFIGURAÇÕES DE RELACIONAMENTO E SELEÇÃO DE CAMPOS
  // =========================================================================

  private getProjetoRelations() {
    return {
      evento: true,
      alunoAutor: true,
      tema: true,
      projetoAlunos: { aluno: true },
      orientadores: { orientador: true },
      materiais: true,
    } as const;
  }

  private getProjetoSelectFields() {
    return {
      id: true,
      titulo: true,
      descricao: true,
      temaId: true,
      criadoEm: true,
      evento: { id: true, titulo: true },
      tema: { id: true, nome: true },
      alunoAutor: {
        id: true,
        nome: true,
        role_cargo: true,
        ano: true,
        turma: true,
      },
      projetoAlunos: {
        id: true,
        aluno: { id: true, nome: true, ano: true, turma: true },
      },
      orientadores: {
        id: true,
        status: true,
        criadoEm: true,
        respondidoEm: true,
        orientador: { id: true, nome: true, email_institucional: true },
      },
      materiais: {
        id: true,
        tipo: true,
        status: true,
        conteudo: true,
        opiniao: true,
        criadoEm: true,
      },
    };
  }


}