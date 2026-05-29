import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository, Between, In } from 'typeorm';

import { AuditoriaService } from 'src/auditoria/auditoria.service';
import { Evento, EventoStatus } from 'src/evento/entities/evento.entity';
import { TemaEvento } from 'src/evento/entities/tema-evento.entity';
import { User, UserRole } from 'src/users/entities/user.entity';
import { CreateProjetoDto } from './dto/create-projeto.dto';
import { UpdateProjetoDto } from './dto/update-projeto.dto';
import { ProjetoAluno } from './entities/projeto-aluno.entity';
import { ProjetoOrientador } from './entities/projeto-orientador.entity';
import { Projeto } from './entities/projeto.entity';

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

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly dataSource: DataSource,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  // =========================================================================
  // MÉTODO DE CRIAÇÃO (CORE)
  // =========================================================================

  /**
   * Cria um novo projeto dentro do evento ativo, vinculando o autor e os participantes.
   * Realiza validações de prazo de inscrição, tamanho de grupo e disponibilidade dos alunos.
   */
  async create(dto: CreateProjetoDto, userId: number): Promise<Projeto> {
    const ultimoEvento = await this.buscarUltimoEvento();
    
    // Validações de negócio de escopo e regras de grupo
    await this.validarEventoETema(ultimoEvento.id, dto.temaId);
    this.validateGroupSize(dto.alunosIds);
    await this.ensureAlunosAreAvailable(ultimoEvento.id, [
      ...(dto.alunosIds || []),
      userId,
    ]);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Salva a entidade principal do projeto
      const projeto = await this.saveProjeto(
        queryRunner,
        dto,
        userId,
        ultimoEvento.id,
      );

      // Vincula a equipe à tabela intermediária
      await this.saveParticipantes(queryRunner, projeto.id, dto.alunosIds, userId);
      await queryRunner.commitTransaction();

      // Registro de Auditoria do sistema
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
  // MÉTODOS DE CONSULTA / BUSCA (READ)
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
    const eventoAtual = await this.buscarUltimoEvento();

    // 1. Primeiro busca apenas o ID do projeto sem filtrar as relações
    const projetoBase = await this.projetoRepository
      .createQueryBuilder('projeto')
      .leftJoin('projeto.evento', 'evento')
      .leftJoin('projeto.alunoAutor', 'autor')
      .leftJoin('projeto.projetoAlunos', 'pa')
      .leftJoin('pa.aluno', 'aluno')
      .where('evento.id = :eventoId', { eventoId: eventoAtual.id })
      .andWhere(
        '(autor.id = :userId OR aluno.id = :userId)',
        { userId }
      )
      .select('projeto.id')
      .getOne();

    if (!projetoBase) return null;

    // 2. Depois carrega o projeto completo pelo ID sem filtros nas relações
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
  // MÉTODOS DE ATUALIZAÇÃO E REMOÇÃO (UPDATE / DELETE)
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

    // Controle estrito de autoridade/permissão
    if (role !== 'coordenador' && projeto.alunoAutor.id !== userId) {
      throw new ForbiddenException('Sem permissao para editar este projeto.');
    }

    let eventoId = dto.evento || projeto.evento?.id;

    if (!eventoId) {
      const ultimo = await this.buscarUltimoEvento();
      eventoId = ultimo.id;
    }

    if (dto.temaId) {
      await this.validarEventoETema(eventoId, dto.temaId);
    }

    if (dto.alunosIds) {
      this.validateGroupSize(dto.alunosIds);
      await this.ensureAlunosAreAvailable(
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

      // Se a equipe foi alterada, limpa e reinsere os participantes
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

  async addIntegrantes(
    id: number,
    alunosIds: number[],
    userId: number,
    role: string,
  ): Promise<Projeto> {
    const projeto = await this.findOne(id);
    this.validarPermissaoEdicaoProjeto(projeto, userId, role);

    const idsNovos = [...new Set(alunosIds.filter((alunoId) => Number.isFinite(alunoId)))]
      .filter((alunoId) => alunoId !== projeto.alunoAutor.id);

    if (idsNovos.length === 0) {
      throw new BadRequestException('Informe pelo menos um aluno integrante valido.');
    }

    await this.ensureUsersAreActiveStudents(idsNovos);

    const atuaisIds = this.getIntegrantesIds(projeto);
    const proximosIds = [...new Set([...atuaisIds, ...idsNovos])];

    this.validateGroupSize(proximosIds);
    await this.ensureAlunosAreAvailable(
      projeto.evento.id,
      [...proximosIds, projeto.alunoAutor.id],
      projeto.id,
    );

    const idsParaInserir = idsNovos.filter((alunoId) => !atuaisIds.includes(alunoId));

    if (idsParaInserir.length === 0) {
      throw new BadRequestException('Todos os alunos informados ja fazem parte deste projeto.');
    }

    const vinculos = idsParaInserir.map((alunoId) =>
      this.projetoAlunoRepository.create({
        projeto: { id: projeto.id },
        aluno: { id: alunoId },
      }),
    );

    await this.projetoAlunoRepository.save(vinculos);

    await this.auditoriaService.registrar(
      userId,
      'PROJETO_INTEGRANTES_ADICIONADOS',
      `Integrantes [${idsParaInserir.join(', ')}] adicionados ao projeto #${id} por usuario com cargo "${role}".`,
      id,
    );

    return this.findOne(id);
  }

  async removeIntegrante(
    id: number,
    alunoId: number,
    userId: number,
    role: string,
  ): Promise<Projeto> {
    const projeto = await this.findOne(id);
    this.validarPermissaoEdicaoProjeto(projeto, userId, role);

    if (alunoId === projeto.alunoAutor.id) {
      throw new BadRequestException('O aluno autor do projeto nao pode ser removido como integrante.');
    }

    const atuaisIds = this.getIntegrantesIds(projeto);

    if (!atuaisIds.includes(alunoId)) {
      throw new NotFoundException('Este aluno nao esta cadastrado como integrante deste projeto.');
    }

    const proximosIds = atuaisIds.filter((idAtual) => idAtual !== alunoId);
    this.validateGroupSize(proximosIds);

    await this.projetoAlunoRepository.delete({
      projeto: { id: projeto.id },
      aluno: { id: alunoId },
    });

    await this.auditoriaService.registrar(
      userId,
      'PROJETO_INTEGRANTE_REMOVIDO',
      `Integrante #${alunoId} removido do projeto #${id} por usuario com cargo "${role}".`,
      id,
    );

    return this.findOne(id);
  }

  async gerenciarOrientador(
    id: number,
    orientadorId: number,
    userId: number,
    role: string,
  ): Promise<Projeto> {
    if (role !== UserRole.COORDENACAO) {
      throw new ForbiddenException('Apenas coordenadores podem gerenciar o orientador do projeto.');
    }

    await this.findOne(id);
    await this.ensureUserIsActiveOrientador(orientadorId);

    const vinculosAtivos = await this.projetoOrientadorRepository.find({
      where: {
        projeto: { id },
        status: In(['pendente', 'aceito']),
      },
      relations: ['orientador'],
    });

    if (vinculosAtivos.some((vinculo) => vinculo.orientador.id === orientadorId)) {
      throw new BadRequestException('Este orientador ja esta vinculado ao projeto.');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const agora = new Date();

      // mantem o historico: o orientador antigo deixa de ficar ativo, mas o registro continua no banco.
      for (const vinculo of vinculosAtivos) {
        vinculo.status = 'recusado';
        vinculo.respondidoEm = agora;
        await queryRunner.manager.save(ProjetoOrientador, vinculo);
      }

      // como a troca e feita pela coordenacao, o novo orientador ja entra como aceito.
      const novoVinculo = queryRunner.manager.create(ProjetoOrientador, {
        projeto: { id },
        orientador: { id: orientadorId },
        status: 'aceito',
        respondidoEm: agora,
      });

      await queryRunner.manager.save(ProjetoOrientador, novoVinculo);
      await queryRunner.commitTransaction();

      await this.auditoriaService.registrar(
        userId,
        vinculosAtivos.length > 0 ? 'PROJETO_ORIENTADOR_TROCADO' : 'PROJETO_ORIENTADOR_ADICIONADO',
        `Orientador #${orientadorId} vinculado como aceito ao projeto #${id} por coordenador #${userId}.`,
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

  async removerOrientador(
    id: number,
    userId: number,
    role: string,
  ): Promise<Projeto> {
    if (role !== UserRole.COORDENACAO) {
      throw new ForbiddenException('Apenas coordenadores podem remover o orientador do projeto.');
    }

    await this.findOne(id);

    const vinculosAtivos = await this.projetoOrientadorRepository.find({
      where: {
        projeto: { id },
        status: In(['pendente', 'aceito']),
      },
      relations: ['orientador'],
    });

    if (vinculosAtivos.length === 0) {
      throw new NotFoundException('Este projeto nao possui orientador ativo para remover.');
    }

    const agora = new Date();

    // remocao logica: nao apaga o vinculo, apenas tira ele da lista de ativos.
    for (const vinculo of vinculosAtivos) {
      vinculo.status = 'recusado';
      vinculo.respondidoEm = agora;
    }

    await this.projetoOrientadorRepository.save(vinculosAtivos);

    await this.auditoriaService.registrar(
      userId,
      'PROJETO_ORIENTADOR_REMOVIDO',
      `Orientador(es) [${vinculosAtivos.map((vinculo) => vinculo.orientador.id).join(', ')}] removido(s) logicamente do projeto #${id} por coordenador #${userId}.`,
      id,
    );

    return this.findOne(id);
  }

  // =========================================================================
  // GESTÃO DE SOLICITAÇÕES DE ORIENTAÇÃO
  // =========================================================================

  /**
   * Processa o envio em lote de convites de orientação para múltiplos professores.
   */
  async enviarMultiplasSolicitacoes(userId: number, orientadoresIds: number[]) {
    const resultados: {
      orientadorId: number;
      status: string;
      motivo?: string;
      solicitacaoId?: number;
    }[] = [];

    const projeto = await this.getUltimoProjetoDoAluno(userId);

    for (const orientadorId of orientadoresIds) {
      try {
        const professorValido = await this.verificarSeEProfessor(orientadorId);

        if (!professorValido) {
          resultados.push({
            orientadorId,
            status: 'pulado',
            motivo: 'Usuario nao e um orientador valido.',
          });
          continue;
        }

        const solicitacao = await this.enviarSolicitacaoIndividual(
          projeto,
          userId,
          orientadorId,
        );
        resultados.push({
          orientadorId,
          status: 'sucesso',
          solicitacaoId: solicitacao.id,
        });
      } catch (error) {
        resultados.push({
          orientadorId,
          status: 'erro',
          motivo: error instanceof Error ? error.message : 'Erro interno ao processar este ID.',
        });
      }
    }

    return { projetoId: projeto.id, resumo: resultados };
  }

  /**
   * Realiza as validações individuais de compatibilidade de tema e cria a solicitação pendente.
   */
    /**
   * Realiza as validações individuais de compatibilidade de tema e cria a solicitação pendente.
   */
  private async enviarSolicitacaoIndividual(
    projeto: Projeto,
    userId: number,
    orientadorId: number,
  ): Promise<ProjetoOrientador> {
    await this.validarTemaNoEvento(projeto.temaId, projeto.evento.id);
    await this.validarOrientadorSelecionouTema(projeto.temaId, orientadorId);
    await this.validarSolicitacaoDuplicada(projeto.id, orientadorId);

    const novaSolicitacao = this.projetoOrientadorRepository.create({
      projeto: { id: projeto.id },
      orientador: { id: orientadorId },
      status: 'pendente',
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


  // =========================================================================
  // MÉTODOS PRIVADOS DE VALIDAÇÃO E SUPORTE
  // =========================================================================

  /**
   * Valida se as regras de tempo de ciclo de vida respeitam o Embedded Object de inscrições.
   */
  private async validarEventoETema(eventoId: number, temaId: number) {
    const evento = await this.eventoRepository.findOne({ where: { id: eventoId } });

    if (!evento) {
      throw new NotFoundException(`O evento #${eventoId} nao existe.`);
    }

    this.validarPeriodoAberto(evento.inscricao, 'inscricao');

    const temaValido = await this.temaEventoRepository.findOne({
      where: { id: temaId, evento: { id: eventoId } },
    });

    if (!temaValido) {
      throw new BadRequestException(
        'O tema selecionado nao pertence a este evento ou nao existe.',
      );
    }
  }

  /**
   * Localiza o evento ativo do ano corrente filtrando pela data de início das inscrições.
   */
  private async buscarUltimoEvento(): Promise<Evento> {
  const anoAtual = new Date().getFullYear();
  const inicioAno = new Date(`${anoAtual}-01-01T00:00:00`);
  const fimAno = new Date(`${anoAtual}-12-31T23:59:59`);

  const evento = await this.eventoRepository
    .createQueryBuilder('evento')
    .leftJoinAndSelect('evento.temas', 'temas')
    .where('evento.status = :status', { status: EventoStatus.ATIVO })
    .andWhere('evento.prazo_inicial BETWEEN :inicioAno AND :fimAno', { inicioAno, fimAno })
    .orderBy('evento.criado_em', 'DESC')
    .getOne();

  if (!evento) {
    throw new NotFoundException(
      `Nenhum evento ativo encontrado para o ano de ${anoAtual}.`
    );
  }

  return evento;
}
  /**
   * Garante que o tamanho da equipe segue as diretrizes acadêmicas (entre 3 e 7 integrantes).
   */
  private validateGroupSize(alunosIds: number[] = []) {
    const total = alunosIds.length + 1; // Soma 1 para contar com o Aluno Autor
    if (total < 3 || total > 7) {
      throw new BadRequestException('O grupo deve ter entre 3 e 7 integrantes.');
    }
  }

  private validarPermissaoEdicaoProjeto(projeto: Projeto, userId: number, role: string) {
    if (role !== 'coordenador' && projeto.alunoAutor.id !== userId) {
      throw new ForbiddenException('Sem permissao para editar este projeto.');
    }
  }

  private getIntegrantesIds(projeto: Projeto) {
    return (projeto.projetoAlunos ?? [])
      .map((vinculo) => vinculo.aluno?.id)
      .filter((id): id is number => Number.isFinite(id));
  }

  private async ensureUsersAreActiveStudents(alunosIds: number[]) {
    const idsUnicos = [...new Set(alunosIds.filter((id) => Number.isFinite(id)))];
    if (idsUnicos.length === 0) return;

    const alunos = await this.userRepository.find({
      where: {
        id: In(idsUnicos),
        role_cargo: UserRole.ALUNO,
        ativo: true,
      },
      select: ['id'],
    });
    const encontrados = new Set(alunos.map((aluno) => aluno.id));
    const invalidos = idsUnicos.filter((id) => !encontrados.has(id));

    if (invalidos.length > 0) {
      throw new BadRequestException(`Alunos invalidos ou inativos: ${invalidos.join(', ')}`);
    }
  }

  private async ensureUserIsActiveOrientador(orientadorId: number) {
    const orientador = await this.userRepository.findOne({
      where: {
        id: orientadorId,
        role_cargo: UserRole.ORIENTADOR,
        ativo: true,
      },
      select: ['id'],
    });

    if (!orientador) {
      throw new BadRequestException('Orientador invalido ou inativo.');
    }
  }

  /**
   * Certifica-se de que nenhum dos alunos enviados já está alocado em outro projeto no evento atual.
   */
  private async ensureAlunosAreAvailable(
    eventoId: number,
    todosIds: number[],
    projetoIdIgnorado?: number,
  ) {
    const idsUnicos = [...new Set(todosIds.filter((id) => Number.isFinite(id)))];
    if (idsUnicos.length === 0) return;

    const placeholders = idsUnicos.map(() => '?').join(', ');
    const filtroProjetoAutor = projetoIdIgnorado ? 'AND p.id != ?' : '';
    const filtroProjetoIntegrante = projetoIdIgnorado ? 'AND p.id != ?' : '';
    const params = projetoIdIgnorado
      ? [
          eventoId,
          ...idsUnicos,
          projetoIdIgnorado,
          eventoId,
          ...idsUnicos,
          projetoIdIgnorado,
        ]
      : [eventoId, ...idsUnicos, eventoId, ...idsUnicos];

    const ocupados = await this.dataSource.query(
      `
        SELECT DISTINCT u.nome
        FROM (
          SELECT p.aluno_autor_id AS aluno_id
          FROM projetos p
          WHERE p.evento_id = ?
            AND p.aluno_autor_id IN (${placeholders})
            ${filtroProjetoAutor}
          UNION
          SELECT pa.aluno_id AS aluno_id
          FROM projeto_alunos pa
          INNER JOIN projetos p ON p.id = pa.projeto_id
          WHERE p.evento_id = ?
            AND pa.aluno_id IN (${placeholders})
            ${filtroProjetoIntegrante}
        ) ocupados
        INNER JOIN usuarios u ON u.id = ocupados.aluno_id
      `,
      params,
    );

    if (ocupados.length > 0) {
      const nomes = ocupados.map((p: { nome: string }) => p.nome).join(', ');
      throw new BadRequestException(`Alunos ja vinculados a este evento: ${nomes}`);
    }
  }

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

  private async getUltimoProjetoDoAluno(userId: number): Promise<Projeto> {
    const projeto = await this.projetoRepository.findOne({
      where: { alunoAutor: { id: userId } },
      order: { criadoEm: 'DESC' },
      relations: ['evento', 'tema'],
    });

    if (!projeto) {
      throw new NotFoundException('Voce ainda nao possui nenhum projeto cadastrado.');
    }

    return projeto;
  }

  private async verificarSeEProfessor(id: number): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id, role_cargo: UserRole.ORIENTADOR },
    });
    return !!user;
  }

  private async validarTemaNoEvento(temaId: number, eventoId: number) {
    const existe = await this.temaEventoRepository.exists({
      where: { id: temaId, evento: { id: eventoId } },
    });

    if (!existe) {
      throw new BadRequestException('O tema do projeto nao esta disponivel para este evento.');
    }
  }

  private normalizarDataPeriodo(
    value?: Date | string | null,
    endOfDay = false,
  ): Date | null {
    if (!value) return null;

    const date = value instanceof Date ? new Date(value) : new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    if (endOfDay) date.setHours(23, 59, 59, 999);
    return date;
  }

  private validarPeriodoAberto(
    periodo: { inicio?: Date | string | null; fim?: Date | string | null } | null | undefined,
    nomePeriodo: string,
  ) {
    const inicio = this.normalizarDataPeriodo(periodo?.inicio);
    const fim = this.normalizarDataPeriodo(periodo?.fim, true);
    const agora = new Date();

    if (!inicio || !fim) {
      throw new BadRequestException(`O prazo de ${nomePeriodo} nao esta definido.`);
    }

    if (agora < inicio) {
      throw new BadRequestException(
        `O prazo de ${nomePeriodo} ainda nao comecou. (Inicio: ${inicio.toLocaleString()})`,
      );
    }

    if (agora > fim) {
      throw new BadRequestException(
        `O prazo de ${nomePeriodo} encerrou em ${fim.toLocaleString()}.`,
      );
    }
  }

  private async validarOrientadorSelecionouTema(temaId: number, orientadorId: number) {
    const orientadorEscolheuTema = await this.temaEventoRepository
      .createQueryBuilder('tema')
      .innerJoin('tema.orientadores', 'orientador', 'orientador.id = :orientadorId', { orientadorId })
      .where('tema.id = :temaId', { temaId })
      .getExists();

    if (!orientadorEscolheuTema) {
      throw new BadRequestException('Este orientador nao selecionou o eixo tematico do projeto.');
    }
  }

  private async validarSolicitacaoDuplicada(projetoId: number, orientadorId: number) {
    const solicitacao = await this.projetoOrientadorRepository.findOne({
      where: { projeto: { id: projetoId }, orientador: { id: orientadorId } },
    });

    if (!solicitacao) return;

    const mensagensErro: Record<string, string> = {
      pendente: 'Ja existe uma solicitacao pendente para este orientador.',
      aceito: 'Este orientador ja aceitou orientar este projeto.',
      recusado: 'Este orientador ja recusou este projeto. Escolha um novo orientador.',
    };

    const erro = mensagensErro[solicitacao.status];
    if (erro) throw new BadRequestException(erro);
  }

  /**
   * Centraliza a filtragem de orientadores de um projeto para expor apenas solicitações relevantes ao aluno.
   */
 private filtrarOrientadoresAceitos(projeto: Projeto) {
  if (projeto.orientadores) {
    projeto.orientadores = projeto.orientadores.filter(
      (relacao) => relacao.status === 'aceito' || relacao.status === 'recusado' || relacao.status === 'pendente'
    );
  } else {
    projeto.orientadores = [];
  }
}
  
  
    /**
   * Busca o orientador que aceitou a solicitação para um projeto específico.
   */
  async getOrientadorAceitoByProjetoId(projetoId: number): Promise<ProjetoOrientador | null> {
    const vinculo = await this.projetoOrientadorRepository.findOne({
      where: {
        projeto: { id: projetoId },
        status: 'aceito',
      },
      relations: ['orientador'],
      select: {
        id: true,
        status: true,
        respondidoEm: true,
        orientador: {
          id: true,
          nome: true,
          email_institucional: true,
        },
      },
    });

    if (!vinculo) {
      throw new NotFoundException(`Nenhum orientador aceitou o projeto #${projetoId} ainda.`);
    }

    return vinculo;
  }

  // =========================================================================
  // MAPEAMENTO DE CONFIGURAÇÕES DE RELACIONAMENTO E CAMPOS (SELECT/RELATIONS)
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

  // =========================================================================
  // MÉTODO PARA BUSCAR ALUNOS OCUPADOS (CORRIGIDO)
  // =========================================================================

  /**
   * Busca todos os IDs de alunos que já estão vinculados a algum projeto no evento atual.
   * Útil para o frontend saber quais alunos não podem ser convidados para novos projetos.
   */
  // src/projetos/projetos.service.ts

async findAlunosOcupados(projetoIdAtual?: number): Promise<number[]> {
  try {
    // Busca o evento atual primeiro
    const eventoAtual = await this.buscarUltimoEvento();
    
    if (!eventoAtual) {
      return [];
    }

    // Query para buscar todos os alunos ocupados no evento atual
    const query = `
      SELECT DISTINCT aluno_id FROM (
        SELECT aluno_autor_id as aluno_id FROM projetos 
        WHERE evento_id = ? AND aluno_autor_id IS NOT NULL
        UNION
        SELECT aluno_id FROM projeto_alunos pa
        INNER JOIN projetos p ON p.id = pa.projeto_id
        WHERE p.evento_id = ? AND pa.aluno_id IS NOT NULL
      ) AS alunos_ocupados
    `;
    
    let params: any[] = [eventoAtual.id, eventoAtual.id];
    
    // Se for para edição, exclui o projeto atual
    if (projetoIdAtual) {
      const queryComExclusao = `
        SELECT DISTINCT aluno_id FROM (
          SELECT aluno_autor_id as aluno_id FROM projetos 
          WHERE evento_id = ? AND aluno_autor_id IS NOT NULL AND id != ?
          UNION
          SELECT aluno_id FROM projeto_alunos pa
          INNER JOIN projetos p ON p.id = pa.projeto_id
          WHERE p.evento_id = ? AND pa.aluno_id IS NOT NULL AND p.id != ?
        ) AS alunos_ocupados
      `;
      params = [eventoAtual.id, projetoIdAtual, eventoAtual.id, projetoIdAtual];
      
      const rows = await this.dataSource.query(queryComExclusao, params);
      return rows.map((row: any) => Number(row.aluno_id));
    }
    
    const rows = await this.dataSource.query(query, params);
    return rows.map((row: any) => Number(row.aluno_id));
    
  } catch (error) {
    console.error('Erro ao buscar alunos ocupados:', error);
    // Retorna array vazio em caso de erro para não quebrar o frontend
    return [];
  }
}
}
