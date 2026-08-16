import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, DataSource } from 'typeorm';
import { Evento, EventoStatus } from 'src/evento/entities/evento.entity';
import { TemaEvento } from 'src/evento/entities/tema-evento.entity';
import { User, UserRole } from 'src/users/entities/user.entity';

@Injectable()
export class ProjetosValidacaoService {
  constructor(
    @InjectRepository(Evento)
    private readonly eventoRepository: Repository<Evento>,
    @InjectRepository(TemaEvento)
    private readonly temaEventoRepository: Repository<TemaEvento>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  // --------------------------------------------------
  // EVENTO E TEMA
  // --------------------------------------------------

  /**
   * Valida se o evento existe, se o período de inscrição está aberto e se o tema pertence ao evento.
   */
  async validarEventoETema(eventoId: number, temaId: number): Promise<void> {
    const evento = await this.eventoRepository.findOne({ where: { id: eventoId } });
    if (!evento) {
      throw new NotFoundException(`O evento #${eventoId} não existe.`);
    }

    this.validarPeriodoAberto(evento.inscricao, 'inscricao');

    const temaValido = await this.temaEventoRepository.findOne({
      where: { id: temaId, evento: { id: eventoId } },
    });
    if (!temaValido) {
      throw new BadRequestException('O tema selecionado não pertence a este evento ou não existe.');
    }
  }

  /**
   * Retorna o evento ativo do ano corrente, ordenado por data de criação (o mais recente).
   */
  async buscarUltimoEvento(): Promise<Evento> {
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
      throw new NotFoundException(`Nenhum evento ativo encontrado para o ano de ${anoAtual}.`);
    }
    return evento;
  }

  // --------------------------------------------------
  // PERÍODOS
  // --------------------------------------------------

  private normalizarDataPeriodo(value?: Date | string | null, endOfDay = false): Date | null {
    if (!value) return null;
    const date = value instanceof Date ? new Date(value) : new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    if (endOfDay) date.setHours(23, 59, 59, 999);
    return date;
  }

  /**
   * Verifica se o período (ex.: inscrição) está aberto no momento atual.
   */
  validarPeriodoAberto(
    periodo: { inicio?: Date | string | null; fim?: Date | string | null } | null | undefined,
    nomePeriodo: string,
  ): void {
    const inicio = this.normalizarDataPeriodo(periodo?.inicio);
    const fim = this.normalizarDataPeriodo(periodo?.fim, true);
    const agora = new Date();

    if (!inicio || !fim) {
      throw new BadRequestException(`O prazo de ${nomePeriodo} não está definido.`);
    }
    if (agora < inicio) {
      throw new BadRequestException(
        `O prazo de ${nomePeriodo} ainda não começou. (Início: ${inicio.toLocaleString()})`,
      );
    }
    if (agora > fim) {
      throw new BadRequestException(
        `O prazo de ${nomePeriodo} encerrou em ${fim.toLocaleString()}.`,
      );
    }
  }

  // --------------------------------------------------
  // GRUPO DE ALUNOS
  // --------------------------------------------------

  /**
   * Valida se o tamanho do grupo (autor + integrantes) está entre 3 e 7.
   */
  validateGroupSize(alunosIds: number[] = []): void {
    const total = alunosIds.length + 1; // +1 para o autor
    if (total < 3 || total > 7) {
      throw new BadRequestException('O grupo deve ter entre 3 e 7 integrantes.');
    }
  }

  /**
   * Garante que os alunos não estão em outro projeto no mesmo evento.
   */
  async ensureAlunosAreAvailable(
    eventoId: number,
    todosIds: number[],
    projetoIdIgnorado?: number,
  ): Promise<void> {
    const idsUnicos = [...new Set(todosIds.filter((id) => Number.isFinite(id)))];
    if (idsUnicos.length === 0) return;

    const placeholders = idsUnicos.map(() => '?').join(', ');
    const filtroProjetoAutor = projetoIdIgnorado ? 'AND p.id != ?' : '';
    const filtroProjetoIntegrante = projetoIdIgnorado ? 'AND p.id != ?' : '';
    const params = projetoIdIgnorado
      ? [eventoId, ...idsUnicos, projetoIdIgnorado, eventoId, ...idsUnicos, projetoIdIgnorado]
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
      throw new BadRequestException(`Alunos já vinculados a este evento: ${nomes}`);
    }
  }

  // --------------------------------------------------
  // USUÁRIOS
  // --------------------------------------------------

  /**
   * Verifica se todos os IDs fornecidos pertencem a alunos ativos.
   */
  async ensureUsersAreActiveStudents(alunosIds: number[]): Promise<void> {
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
      throw new BadRequestException(`Alunos inválidos ou inativos: ${invalidos.join(', ')}`);
    }
  }

  /**
   * Verifica se um usuário é um orientador ativo.
   */
  async ensureUserIsActiveOrientador(orientadorId: number): Promise<void> {
    const orientador = await this.userRepository.findOne({
      where: {
        id: orientadorId,
        role_cargo: UserRole.ORIENTADOR,
        ativo: true,
      },
      select: ['id'],
    });
    if (!orientador) {
      throw new BadRequestException('Orientador inválido ou inativo.');
    }
  }
}