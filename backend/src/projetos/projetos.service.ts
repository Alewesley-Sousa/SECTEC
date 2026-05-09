import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, QueryRunner } from 'typeorm';

// Entities
import { Projeto } from './entities/projeto.entity';
import { ProjetoAluno } from './entities/projeto-aluno.entity';
import { ProjetoOrientador } from './entities/projeto-orientador.entity';
import { TemaEvento } from 'src/evento/entities/tema-evento.entity';
import { Evento } from 'src/evento/entities/evento.entity';

// DTOs
import { CreateProjetoDto } from './dto/create-projeto.dto';
import { UpdateProjetoDto } from './dto/update-projeto.dto';
import { AuditoriaService } from 'src/auditoria/auditoria.service';

@Injectable()
export class ProjetosService {
  constructor(
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


    private readonly dataSource: DataSource,
    private readonly auditoriaService: AuditoriaService,
  ) { }

  // ===========================================================================
  // MÉTODOS DE CRIAÇÃO (ESCRITA)
  // ===========================================================================

  /**
   * Cria um novo projeto e vincula automaticamente os integrantes e o autor.
   * @param dto Dados de criação do projeto
   * @param userId ID do aluno autor
   * @throws BadRequestException Se o grupo for inválido ou alunos já estiverem ocupados
   */
  async create(dto: CreateProjetoDto, userId: number): Promise<Projeto> {
    await this.validarEventoETema(dto.evento, dto.temaId); // 👈 Nova validação
    this.validateGroupSize(dto.alunosIds);
    await this.ensureAlunosAreAvailable(dto.evento, [...(dto.alunosIds || []), userId]);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const projeto = await this.saveProjeto(queryRunner, dto, userId);
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

  /**
   * Envia uma solicitação para um orientador específico baseada no projeto mais recente do aluno.
   * @param userId ID do autor do projeto
   * @param orientadorId ID do professor orientador
   */
  async enviarSolicitacaoOrientador(userId: number, orientadorId: number): Promise<ProjetoOrientador> {
    const projeto = await this.getUltimoProjetoDoAluno(userId);

    await this.validarTemaNoEvento(projeto.temaId, projeto.evento.id);
    await this.validarSolicitacaoDuplicada(projeto.id, orientadorId);

    const novaSolicitacao = this.projetoOrientadorRepository.create({
      projeto: { id: projeto.id },
      orientador: { id: orientadorId },
      status: 'pendente'
    });

    const solicitacao = await this.projetoOrientadorRepository.save(novaSolicitacao);

    await this.auditoriaService.registrar(
      userId,
      'ORIENTADOR_SOLICITADO',
      `Solicitacao enviada ao orientador #${orientadorId} para o projeto #${projeto.id}.`,
      projeto.id,
    );

    return solicitacao;
  }

  // ===========================================================================
  // MÉTODOS DE CONSULTA (LEITURA)
  // ===========================================================================

  /**
   * Retorna um projeto detalhado por ID.
   */
  async findOne(id: number): Promise<Projeto> {
    const projeto = await this.projetoRepository.findOne({
      where: { id },
      relations: {
        evento: true,
        alunoAutor: true,
        projetoAlunos: { aluno: true },
      },
      select: this.getProjetoSelectFields(),
    });

    if (!projeto) {
      throw new NotFoundException(`Projeto #${id} não encontrado`);
    }
    return projeto;
  }

  /**
   * Lista projetos onde o usuário é o autor principal.
   */
  async findAllAlunos(userId: number): Promise<Projeto[]> {
    return this.projetoRepository.find({
      where: { alunoAutor: { id: userId } },
      relations: {
        evento: true,
        alunoAutor: true,
        projetoAlunos: { aluno: true },
      },
      select: this.getProjetoSelectFields(),
    });
  }

  /**
   * Lista projetos onde o professor logado já aceitou a orientação.
   */
  async findAllOrientador(userId: number): Promise<Projeto[]> {
    const projetosOrientados = await this.projetoOrientadorRepository.find({
      where: { orientador: { id: userId }, status: 'aceito' },
      relations: {
        projeto: {
          evento: true,
          alunoAutor: true,
          projetoAlunos: { aluno: true },
        }
      }
    });

    return projetosOrientados.map(solicitacao => solicitacao.projeto);
  }

  /**
   * Visão geral para coordenação: Retorna eventos com seus respectivos projetos agrupados.
   */
  async findAllCoordenador(): Promise<Evento[]> {
    return this.dataSource.getRepository(Evento).find({
      relations: {
        projetos: {
          alunoAutor: true,
          projetoAlunos: { aluno: true }
        }
      },
      order: { id: 'DESC' }
    });
  }

  // ===========================================================================
  // MÉTODOS DE ATUALIZAÇÃO E REMOÇÃO
  // ===========================================================================

  /**
   * Atualiza dados do projeto. Regras de permissão variam por Role.
   */
  async update(id: number, dto: UpdateProjetoDto, userId: number, role: string): Promise<Projeto> {
    const projeto = await this.findOne(id);

    if (role !== 'coordenador' && projeto.alunoAutor.id !== userId) {
      throw new ForbiddenException('Sem permissão para editar este projeto.');
    }

    if (dto.alunosIds && role !== 'coordenador') {
      throw new ForbiddenException('Apenas coordenadores alteram integrantes.');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const dadosAtualizados = {
        ...dto,
        ...(dto.evento && { evento: { id: dto.evento } as any }),
        alunoAutor: { id: projeto.alunoAutor.id } as any,
      };

      this.projetoRepository.merge(projeto, dadosAtualizados);
      await queryRunner.manager.save(projeto);

      if (dto.alunosIds && role === 'coordenador') {
        await queryRunner.manager.delete(ProjetoAluno, { projeto: { id: projeto.id } });
        await this.saveParticipantes(queryRunner, projeto.id, dto.alunosIds, projeto.alunoAutor.id);
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
   * Remove um projeto do sistema.
   */
  async remove(id: number, userId: number, role: string): Promise<void> {
    const projeto = await this.findOne(id);

    if (role !== 'coordenador' && projeto.alunoAutor.id !== userId) {
      throw new ForbiddenException('Sem permissão para remover este projeto.');
    }

    await this.projetoRepository.remove(projeto);

    await this.auditoriaService.registrar(
      userId,
      'PROJETO_REMOVIDO',
      `Projeto #${id} removido por usuario com cargo "${role}". Titulo: "${projeto.titulo}".`,
    );
  }

  // ===========================================================================
  // MÉTODOS PRIVADOS AUXILIARES (LÓGICA INTERNA)
  // ===========================================================================

  private validateGroupSize(alunosIds: number[] = []) {
    const total = alunosIds.length + 1;
    if (total < 3 || total > 6) {
      throw new BadRequestException(`O grupo deve ter entre 3 e 6 integrantes.`);
    }
  }

  private async ensureAlunosAreAvailable(eventoId: number, todosIds: number[]) {
    const ocupados = await this.projetoAlunoRepository.find({
      where: {
        aluno: { id: In(todosIds) },
        projeto: { evento: { id: eventoId } }
      },
      relations: ['aluno']
    });

    if (ocupados.length > 0) {
      const nomes = ocupados.map(p => p.aluno.nome).join(', ');
      throw new BadRequestException(`Alunos já vinculados a este evento: ${nomes}`);
    }
  }

  private async saveProjeto(qr: QueryRunner, dto: CreateProjetoDto, autorId: number): Promise<Projeto> {
    const projeto = qr.manager.create(Projeto, {
      ...dto,
      evento: { id: dto.evento } as any,
      alunoAutor: { id: autorId } as any,
    });
    return qr.manager.save(projeto);
  }

  private async saveParticipantes(qr: QueryRunner, projetoId: number, convidadosIds: number[] = [], autorId: number) {
    const idsUnicos = [...new Set([...convidadosIds, autorId])];
    const vinculos = idsUnicos.map(id =>
      qr.manager.create(ProjetoAluno, {
        projeto: { id: projetoId },
        aluno: { id: id }
      })
    );
    return qr.manager.save(vinculos);
  }

  private async getUltimoProjetoDoAluno(userId: number): Promise<Projeto> {
    const projeto = await this.projetoRepository.findOne({
      where: { alunoAutor: { id: userId } },
      order: { criadoEm: 'DESC' },
      relations: ['evento'],
    });

    if (!projeto) {
      throw new NotFoundException('Você ainda não possui nenhum projeto cadastrado.');
    }
    return projeto;
  }

  private async validarTemaNoEvento(temaId: number, eventoId: number) {
    const existe = await this.temaEventoRepository.exists({
      where: { id: temaId, evento: { id: eventoId } }
    });

    if (!existe) {
      throw new BadRequestException('O tema do projeto não está disponível para este evento.');
    }
  }

  private async validarSolicitacaoDuplicada(projetoId: number, orientadorId: number) {
    const solicitacao = await this.projetoOrientadorRepository.findOne({
      where: { projeto: { id: projetoId }, orientador: { id: orientadorId } }
    });

    if (!solicitacao) return;

    const mensagensErro = {
      pendente: 'Já existe uma solicitação pendente para este orientador.',
      aceito: 'Este orientador já aceitou orientar este projeto.',
    };

    const erro = mensagensErro[solicitacao.status];
    if (erro) throw new BadRequestException(erro);
  }

  private getProjetoSelectFields() {
    return {
      id: true,
      titulo: true,
      descricao: true,
      temaId: true,
      alunoAutor: { id: true, nome: true, role_cargo: true },
      projetoAlunos: { id: true, aluno: { id: true, nome: true } },
    };
  }

  /**
 * Valida se o evento existe e se o tema pertence a ele.
 */
  private async validarEventoETema(eventoId: number, temaId: number) {
    // Verifica se o evento existe
    const evento = await this.eventoRepository.findOne({ where: { id: eventoId } });
    if (!evento) {
      throw new NotFoundException(`O evento #${eventoId} não existe.`);
    }

    // Verifica se o tema existe e está vinculado a esse evento
    const temaValido = await this.temaEventoRepository.findOne({
      where: {
        id: temaId,
        evento: { id: eventoId }
      }
    });

    if (!temaValido) {
      throw new BadRequestException('O tema selecionado não pertence a este evento ou não existe.');
    }
  }

}
