import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Readable } from 'stream';

import { Projeto } from './entities/projeto.entity';
import { Evento, EventoStatus } from 'src/evento/entities/evento.entity';
import { TipoMaterial } from '../materiais/entities/projeto-material.entity';
import { GoogleDriveService } from '../pdf/google-drive.service';
import { ProjectFile, FileStatus } from '../pdf/entities/project-file.entity';

@Injectable()
export class ProjetosConsultaService {
  constructor(
    @InjectRepository(Projeto)
    private readonly projetoRepository: Repository<Projeto>,
    @InjectRepository(Evento)
    private readonly eventoRepository: Repository<Evento>,
    @InjectRepository(ProjectFile)
    private readonly projectFileRepository: Repository<ProjectFile>,
    private readonly googleDriveService: GoogleDriveService,
  ) { }

  // --------------------------------------------------
  // LISTAGEM PÚBLICA COM FILTROS E PAGINAÇÃO
  // --------------------------------------------------
  async findAllPublic(
    filters: {
      search?: string;
      curso?: string;
      eixo?: string;
      evento?: string;
    },
    page: number = 1,
    limit: number = 8,
  ) {
    const queryBuilder = this.projetoRepository
      .createQueryBuilder('projeto')
      .leftJoinAndSelect('projeto.alunoAutor', 'autor')
      .leftJoinAndSelect('projeto.projetoAlunos', 'projetoAlunos')
      .leftJoinAndSelect('projetoAlunos.aluno', 'integrante')
      .leftJoinAndSelect('projeto.tema', 'tema')
      .leftJoinAndSelect('projeto.evento', 'evento')
      .leftJoinAndSelect('projeto.materiais', 'materiais');

    if (filters.search) {
      queryBuilder.andWhere(
        '(projeto.titulo LIKE :search OR autor.nome LIKE :search OR integrante.nome LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.curso) {
      queryBuilder.andWhere(
        '(autor.curso = :curso OR integrante.curso = :curso)',
        { curso: filters.curso },
      );
    }

    if (filters.eixo) {
      queryBuilder.andWhere('tema.nome LIKE :eixo', {
        eixo: `%${filters.eixo}%`,
      });
    }

    if (filters.evento) {
      queryBuilder.andWhere('evento.titulo LIKE :evento', {
        evento: `%${filters.evento}%`,
      });
    }

    const total = await queryBuilder.getCount();
    const projetos = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const data = projetos.map((projeto) => {
      const equipe: { id: number; nome: string; role: 'autor' | 'integrante' }[] = [];
      if (projeto.alunoAutor) {
        equipe.push({
          id: projeto.alunoAutor.id,
          nome: projeto.alunoAutor.nome,
          role: 'autor',
        });
      }
      if (projeto.projetoAlunos) {
        projeto.projetoAlunos.forEach((pa) => {
          if (pa.aluno) {
            equipe.push({
              id: pa.aluno.id,
              nome: pa.aluno.nome,
              role: 'integrante',
            });
          }
        });
      }

      let video: string | false = false;
      let hasBanner = false;
      if (projeto.materiais) {
        projeto.materiais.forEach((material) => {
          if (material.tipo === TipoMaterial.LINK) {
            video = material.conteudo || false;
          }
          if (material.tipo === TipoMaterial.PDF) {
            hasBanner = true;
          }
        });
      }

      return {
        id: projeto.id,
        titulo: projeto.titulo,
        descricao: projeto.descricao,
        tema: projeto.tema
          ? { id: projeto.tema.id, nome: projeto.tema.nome }
          : null,
        equipe,
        video,
        hasBanner,
      };
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAllProjetosComFiltros(filtros: {
    page?: number;
    limit?: number;
    search?: string;
    evento?: string;
    eixo_tematico?: string;
    orientador?: string;
  }) {
    const { page = 1, limit = 10, search, evento, eixo_tematico, orientador } =
      filtros;

    const query = this.projetoRepository
      .createQueryBuilder('projeto')
      .leftJoinAndSelect('projeto.tema', 'tema')
      .leftJoinAndSelect('projeto.evento', 'evento')
      .leftJoinAndSelect('projeto.alunoAutor', 'alunoAutor')
      .leftJoinAndSelect('projeto.orientadores', 'orientadores')
      .leftJoinAndSelect('orientadores.orientador', 'orientadorUser')
      .where('1 = 1');

    if (search) {
      query.andWhere(
        '(projeto.titulo LIKE :search OR alunoAutor.nome LIKE :search OR orientadorUser.nome LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (evento) {
      query.andWhere('evento.id = :evento', { evento });
    }

    if (eixo_tematico) {
      query.andWhere('tema.nome = :eixo_tematico', { eixo_tematico });
    }

    if (orientador) {
      query.andWhere('orientadorUser.nome LIKE :orientador', {
        orientador: `%${orientador}%`,
      });
    }

    query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('projeto.id', 'DESC');

    const [projetos, total] = await query.getManyAndCount();

    const projetosComUrl = projetos.map((projeto) => ({
      ...projeto,
      urlQrCode: projeto.qrcodeGerado
        ? `${process.env.FRONTEND_PUBLIC_URL ?? ''}/publico/projeto/${projeto.id}`
        : undefined,
    }));

    return {
      projetos: projetosComUrl,
      total,
      page,
      limit,
    };
  }

  // --------------------------------------------------
  // PROJETOS COM MATERIAIS APROVADOS (QR CODE)
  // --------------------------------------------------
  async findComMateriaisAprovados(filtros: {
    page?: number;
    limit?: number;
    search?: string;
    evento?: string;
    eixo_tematico?: string;
    orientador?: string;
    areasPermitidas?: string[]; // ✅ novas áreas
  }): Promise<{ projetos: any[]; total: number; page: number; limit: number }> {
    const page = Number(filtros.page) > 0 ? Number(filtros.page) : 1;
    const limit = Number(filtros.limit) > 0 ? Number(filtros.limit) : 20;

    const qb = this.projetoRepository
      .createQueryBuilder('projeto')
      .leftJoinAndSelect('projeto.evento', 'evento')
      .leftJoinAndSelect('projeto.alunoAutor', 'alunoAutor')
      .leftJoinAndSelect('projeto.tema', 'tema')
      .leftJoinAndSelect(
        'projeto.orientadores',
        'projetoOrientador',
        "projetoOrientador.status = 'aceito'",
      )
      .leftJoinAndSelect('projetoOrientador.orientador', 'orientador')
      .leftJoinAndSelect('orientador.areas', 'areasOrientador'); // ✅ relação de áreas do orientador

    // ❌ Removido o filtro de material aprovado (EXISTS)
    // Agora TODOS os projetos são considerados

    if (filtros.search?.trim()) {
      const termo = filtros.search.trim();
      const idBusca = Number(termo);
      if (Number.isFinite(idBusca) && String(idBusca) === termo) {
        qb.andWhere('projeto.id = :idBusca', { idBusca });
      } else {
        qb.andWhere('projeto.titulo LIKE :termo', { termo: `%${termo}%` });
      }
    }

    if (filtros.evento) {
      qb.andWhere('evento.id = :eventoId', { eventoId: Number(filtros.evento) });
    }

    if (filtros.eixo_tematico?.trim()) {
      qb.andWhere('tema.nome = :eixo', { eixo: filtros.eixo_tematico.trim() });
    }

    if (filtros.orientador?.trim()) {
      const nomes = filtros.orientador
        .split(',')
        .map((n) => n.trim())
        .filter(Boolean);
      if (nomes.length > 0) {
        qb.andWhere('orientador.nome IN (:...nomes)', { nomes });
      }
    }

    // ✅ Filtro por áreas permitidas
    if (filtros.areasPermitidas && filtros.areasPermitidas.length > 0) {
      qb.andWhere(
        '(orientador.area IN (:...areasPermitidas) OR areasOrientador.area IN (:...areasPermitidas))',
        { areasPermitidas: filtros.areasPermitidas },
      );
    }

    qb.orderBy('projeto.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [projetos, total] = await qb.getManyAndCount();

    const projetosMapeados = projetos.map((projeto) => {
      const orientadorAceito = projeto.orientadores?.[0]?.orientador;
      return {
        id: projeto.id,
        titulo: projeto.titulo,
        turma: projeto.alunoAutor
          ? `${projeto.alunoAutor.ano ?? ''}º ${projeto.alunoAutor.turma ?? ''}`.trim()
          : '',
        orientador: orientadorAceito?.nome ?? 'Sem orientador',
        qrcode: Boolean(projeto.qrcodeGerado),
        eixo_tematico: projeto.tema?.nome ?? '',
        evento: projeto.evento?.titulo ?? String(projeto.evento?.id ?? ''),
      };
    });

    return { projetos: projetosMapeados, total, page, limit };
  }

  // --------------------------------------------------
  // ALUNOS OCUPADOS NO EVENTO ATUAL
  // --------------------------------------------------
  async findAlunosOcupados(projetoIdAtual?: number): Promise<number[]> {
    try {
      const eventoAtual = await this.buscarUltimoEvento();
      if (!eventoAtual) return [];

      let query: string;
      let params: any[];

      if (projetoIdAtual) {
        query = `
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
      } else {
        query = `
            SELECT DISTINCT aluno_id FROM (
              SELECT aluno_autor_id as aluno_id FROM projetos 
              WHERE evento_id = ? AND aluno_autor_id IS NOT NULL
              UNION
              SELECT aluno_id FROM projeto_alunos pa
              INNER JOIN projetos p ON p.id = pa.projeto_id
              WHERE p.evento_id = ? AND pa.aluno_id IS NOT NULL
            ) AS alunos_ocupados
          `;
        params = [eventoAtual.id, eventoAtual.id];
      }

      const rows = await this.projetoRepository.query(query, params);
      return rows.map((row: any) => Number(row.aluno_id));
    } catch (error) {
      console.error('Erro ao buscar alunos ocupados:', error);
      return [];
    }
  }

  // --------------------------------------------------
  // EVENTO ATUAL (compartilhado com ProjetosService)
  // --------------------------------------------------
  private async buscarUltimoEvento(): Promise<Evento | null> {
    const anoAtual = new Date().getFullYear();
    const inicioAno = new Date(`${anoAtual}-01-01T00:00:00`);
    const fimAno = new Date(`${anoAtual}-12-31T23:59:59`);

    return this.eventoRepository
      .createQueryBuilder('evento')
      .where('evento.status = :status', { status: EventoStatus.ATIVO })
      .andWhere('evento.prazo_inicial BETWEEN :inicioAno AND :fimAno', {
        inicioAno,
        fimAno,
      })
      .orderBy('evento.criado_em', 'DESC')
      .getOne();
  }

  /**
   * Retorna o buffer e nome do arquivo PDF público de um projeto,
   * buscando o ProjectFile mais recente com status VALID.
   */
  async obterPdfProjetoPublico(projetoId: number): Promise<{ stream: Readable; originalName: string }> {
    const projectFile = await this.projectFileRepository.findOne({
      where: {
        projetoId,
        status: FileStatus.VALID,
      },
      order: { criadoEm: 'DESC' },
    });

    if (!projectFile || !projectFile.driveFileId) {
      throw new NotFoundException('Nenhum PDF válido encontrado para este projeto.');
    }

    const stream = await this.googleDriveService.downloadFileStream(projectFile.driveFileId);

    return {
      stream,
      originalName: projectFile.originalName,
    };
  }
}