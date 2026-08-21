import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource, Between } from 'typeorm';
import { StreamableFile } from '@nestjs/common';
import { User } from '../users/entities/user.entity';

import { Projeto } from '../projetos/entities/projeto.entity';
import { AvaliadorProjeto } from './entities/avaliador-projeto.entity';
import { Avaliacao } from './entities/avaliacao.entity';
import { AvaliacaoCriterio } from './entities/avaliacao-criterio.entity';
import { LimitesAvaliacaoDto } from './dto/limites-avaliacao.dto';
import { CreateAvaliacaoDto } from './dto/avaliacao.dto';
import { Evento, EventoStatus } from '../evento/entities/evento.entity';

const AREAS_DISPONIVEIS = [
  "informatica",
  "enfermagem",
  "contabilidade",
  "humanas",
  "exatas",
  "naturezas",
  "linguagens",
] as const;

@Injectable()
export class AvaliacaoService {
  private limitesAtuais = {
    minAvaliacoes: 1,
    maxProjetosPorAvaliador: 5,
    maxAvaliadoresPorProjeto: 3,
    areasPermitidas: [] as string[], // inicialmente vazio (todas as áreas)
  };

  getLimitesAtuais() {
    return this.limitesAtuais;
  }

  constructor(
    @InjectRepository(Projeto)
    private readonly projetoRepository: Repository<Projeto>,
    @InjectRepository(AvaliadorProjeto)
    private readonly avaliadorProjetoRepository: Repository<AvaliadorProjeto>,
    @InjectRepository(Avaliacao)
    private readonly avaliacaoRepository: Repository<Avaliacao>,
    @InjectRepository(AvaliacaoCriterio)
    private readonly avaliacaoCriterioRepository: Repository<AvaliacaoCriterio>,
    @InjectRepository(Evento)
    private readonly eventoRepository: Repository<Evento>,
    private readonly dataSource: DataSource,
  ) { }

  private validarNota(nota: number, campo: string) {
    if (Number.isNaN(nota) || nota < 0 || nota > 10) {
      throw new BadRequestException(`${campo} deve estar entre 0 e 10.`);
    }

    if ((nota * 10) % 5 !== 0) {
      throw new BadRequestException(`${campo} deve seguir o passo de 0,5.`);
    }
  }

  async validarProjetoDesignado(avaliadorId: number, projetoId: number) {
    // Busca a atribuição, se existir
    const atribuicao = await this.avaliadorProjetoRepository.findOne({
      where: { avaliadorId, projetoId },
      relations: [
        'projeto',
        'projeto.evento',
        'projeto.tema',
        'projeto.alunoAutor',
        'projeto.projetoAlunos',
        'projeto.projetoAlunos.aluno',
      ],
    });

    // Se não houver atribuição, busca apenas o projeto para exibir dados
    let projeto = atribuicao?.projeto;
    if (!projeto) {
      projeto = await this.projetoRepository.findOne({
        where: { id: projetoId },
        relations: ['evento', 'tema', 'alunoAutor', 'projetoAlunos', 'projetoAlunos.aluno'],
      });

      if (!projeto) {
        throw new NotFoundException(`Projeto ${projetoId} não encontrado.`);
      }
    }

    const autores = [
      projeto.alunoAutor?.nome,
      ...(projeto.projetoAlunos?.map((pa) => pa.aluno?.nome) ?? []),
    ]
      .filter(Boolean)
      .join(', ');

    return {
      id: projeto.id,
      titulo: projeto.titulo,
      descricao: projeto.descricao,
      local: `${projeto.alunoAutor?.turma ?? ''}${projeto.alunoAutor?.ano ? ` · ${projeto.alunoAutor.ano}º ano` : ''}`.trim() || 'Sem turma/ano',
      autores,
      tag: projeto.tema?.nome ?? 'Sem tema',
      status: atribuicao?.status ?? 'pendente',
      designado: !!atribuicao, // true se existe atribuição, false caso contrário
    };
  }

  async listarProjetosDesignados(avaliadorId: number) {
    const eventoAtual = await this.buscarEventoAtivoDoAno();
    if (!eventoAtual) return { projetos: [] };

    const atribuicoes = await this.avaliadorProjetoRepository.find({
      where: { avaliadorId, projeto: { eventoId: eventoAtual.id } },
      relations: [
        'projeto',
        'projeto.evento',
        'projeto.tema',
        'projeto.alunoAutor',
        'projeto.projetoAlunos',
        'projeto.projetoAlunos.aluno',
      ],
    });

    if (atribuicoes.length === 0) {
      return { projetos: [] };
    }

    const projetosIds = atribuicoes.map((a) => a.projetoId);

    // Busca avaliações já existentes deste avaliador para esses projetos
    const avaliacoesExistentes = await this.avaliacaoRepository.find({
      where: {
        avaliadorId,
        projeto: { id: In(projetosIds) }, // ✅ relação com id
      },
      relations: ['projeto'],
    });

    const avaliadosSet = new Set(avaliacoesExistentes.map((av) => av.projeto.id)); // ✅ id

    // Mapeia para o formato esperado pelo frontend
    const projetos = atribuicoes.map((atribuicao) => {
      const projeto = atribuicao.projeto;
      const autores = [
        projeto.alunoAutor?.nome,
        ...(projeto.projetoAlunos?.map((pa) => pa.aluno?.nome) ?? []),
      ]
        .filter(Boolean)
        .join(', ');

      return {
        id: projeto.id,
        titulo: projeto.titulo,
        descricao: projeto.descricao,
        local: projeto.alunoAutor
          ? `${projeto.alunoAutor.ano ?? ''}º ${projeto.alunoAutor.turma ?? ''}`.trim()
          : 'Sem turma/ano',
        autores,
        tag: projeto.tema?.nome ?? 'Sem tema',
        status: avaliadosSet.has(projeto.id) ? 'Avaliado' : 'Pendente',
        // Opcional: id da atribuição para ações futuras
        atribuicaoId: atribuicao.id,
      };
    });

    return { projetos };
  }


  private async buscarEventoAtivoDoAno(): Promise<Evento | null> {
    const anoAtual = new Date().getFullYear();
    const inicio = new Date(`${anoAtual}-01-01T00:00:00`);
    const fim = new Date(`${anoAtual}-12-31T23:59:59`);

    return this.eventoRepository.findOne({
      where: {
        prazoInicial: Between(inicio, fim),
        status: EventoStatus.ATIVO,
      },
    });
  }








  async criarAvaliacao(dto: CreateAvaliacaoDto & { avaliadorId: number }) {
    const { avaliadorId, projetoId, apresentacao, metodologia, conteudo, resultado } = dto;

    console.log('📥 [criarAvaliacao] Dados recebidos:', { avaliadorId, projetoId });

    this.validarNota(apresentacao, 'Apresentação');
    this.validarNota(metodologia, 'Metodologia');
    this.validarNota(conteudo, 'Conteúdo');
    this.validarNota(resultado, 'Resultado');

    try {
      return await this.dataSource.transaction(async (manager) => {
        const projeto = await manager.findOne(Projeto, {
          where: { id: projetoId },
        });

        if (!projeto) {
          throw new NotFoundException(`Projeto ${projetoId} não encontrado.`);
        }

        console.log('✅ [criarAvaliacao] Projeto encontrado:', { id: projeto.id, titulo: projeto.titulo });

        const evento = await manager.findOne(Evento, {
          where: { id: projeto.eventoId },
        });

        const agora = new Date();
        if (evento?.avaliacao) {
          const inicio = evento.avaliacao.inicio ? new Date(evento.avaliacao.inicio) : null;
          const fim = evento.avaliacao.fim ? new Date(evento.avaliacao.fim) : null;

          if (inicio && agora < inicio) {
            throw new BadRequestException('O período de avaliação ainda não começou.');
          }
          if (fim && agora > fim) {
            throw new BadRequestException('O prazo de avaliação do evento já foi encerrado.');
          }
        }

        const jaExiste = await manager.findOne(Avaliacao, {
          where: { avaliadorId, projeto: { id: projetoId } },
        });

        if (jaExiste) {
          throw new ConflictException('Este projeto já foi avaliado por este avaliador.');
        }

        const media = Number(
          ((apresentacao + metodologia + conteudo + resultado) / 4).toFixed(1),
        );
        console.log('🧮 [criarAvaliacao] Média calculada:', media);

        // Salva avaliação
        const avaliacaoSalva = await manager.save(Avaliacao, {
          avaliadorId,
          projeto: { id: projetoId },
          nota: media,
        });

        console.log('💾 [criarAvaliacao] Avaliação salva com ID:', avaliacaoSalva.id);

        // Salva critérios
        await manager.save(AvaliacaoCriterio, [
          {
            avaliacao: avaliacaoSalva,
            criterio: 'apresentacao',
            nota: apresentacao,
          },
          {
            avaliacao: avaliacaoSalva,
            criterio: 'metodologia',
            nota: metodologia,
          },
          {
            avaliacao: avaliacaoSalva,
            criterio: 'conteudo',
            nota: conteudo,
          },
          {
            avaliacao: avaliacaoSalva,
            criterio: 'resultado',
            nota: resultado,
          },
        ]);

        console.log('✅ [criarAvaliacao] Critérios salvos com sucesso.');

        // ⚠️ Verifica se a atribuição existe antes de atualizar
        const atribuicao = await manager.findOne(AvaliadorProjeto, {
          where: { avaliadorId, projetoId },
        });

        // Atualiza a atribuição para 'avaliado'
        const updateResult = await manager.update(
          AvaliadorProjeto,
          { avaliadorId, projetoId },
          { status: 'avaliado' },
        );

        console.log('🔄 [criarAvaliacao] Resultado do update:', updateResult);

        return {
          message: 'Avaliação registrada com sucesso.',
          avaliacao: {
            id: avaliacaoSalva.id,
            avaliadorId,
            projetoId,
            notaFinal: media,
            criterios: {
              apresentacao,
              metodologia,
              conteudo,
              resultado,
            },
          },
        };
      });
    } catch (error) {
      console.error('❌ [criarAvaliacao] Erro capturado:', error);
      throw error;
    }
  }



  async exportarMediasProjetosCsv(eventoId?: number): Promise<StreamableFile> {
    const dados = await this.listarMediasProjetos(eventoId);

    // Cabeçalho do CSV (apenas 3 colunas)
    const cabecalho = ['Titulo', 'Orientador', 'Media Final'];
    const linhas = dados.map((item) => [
      item.titulo ?? item.projeto_titulo ?? '',
      item.orientador ?? '',
      Number(item.mediaFinal ?? 0).toFixed(2).replace('.', ','),
    ]);

    // Junta tudo com \r\n para quebra de linha no Windows
    const conteudo = [
      cabecalho.join(';'),
      ...linhas.map((linha) => linha.join(';')),
    ].join('\r\n');

    // Adiciona BOM para acentuação correta no Excel
    const buffer = Buffer.from(`\uFEFF${conteudo}`, 'utf-8');

    return new StreamableFile(buffer, {
      type: 'text/csv',
      disposition: 'attachment; filename="medias-projetos.csv"',
    });
  }


  async listarMediasProjetos(eventoId?: number): Promise<any[]> {
    try {
      console.log('🔍 Buscando projetos com relações...');

      let where: any = {};

      if (eventoId) {
        where.eventoId = eventoId;
      } else {
        // Busca o evento ativo do ano atual
        const anoAtual = new Date().getFullYear();
        const inicioAno = `${anoAtual}-01-01`;
        const fimAno = `${anoAtual}-12-31`;

        const eventoAtual = await this.eventoRepository.findOne({
          where: {
            prazoInicial: Between(inicioAno as any, fimAno as any),
            status: EventoStatus.ATIVO,
          },
          order: { criadoEm: 'DESC' },
        });

        if (!eventoAtual) {
          console.warn('⚠️ Nenhum evento ativo do ano atual encontrado.');
          return [];
        }

        where.eventoId = eventoAtual.id;
        console.log(`🎯 Evento atual selecionado: ${eventoAtual.id}`);
      }

      const projetos = await this.projetoRepository.find({
        where,
        relations: ['avaliacoes', 'orientadores', 'orientadores.orientador'],
      });

      console.log(`📊 Total de projetos encontrados: ${projetos.length}`);

      const resultado = projetos
        .map((projeto) => {
          const avaliacoes = projeto.avaliacoes ?? [];
          const notas = avaliacoes.map((a) => Number(a.nota) || 0);
          const media = notas.length
            ? Number((notas.reduce((soma, n) => soma + n, 0) / notas.length).toFixed(2))
            : 0;

          const orientadores = projeto.orientadores
            ?.filter((po) => po.status === 'aceito')
            .map((po) => po.orientador?.nome)
            .filter(Boolean) ?? [];

          return {
            id: projeto.id,
            titulo: projeto.titulo,
            orientador: orientadores.join(', ') || 'Sem orientador',
            mediaFinal: media,
            quantidadeAvaliacoes: notas.length,
          };
        })
        .sort((a, b) => b.mediaFinal - a.mediaFinal);

      console.log('✅ Médias calculadas:', JSON.stringify(resultado, null, 2));
      return resultado;
    } catch (error) {
      console.error('❌ Erro ao listar médias dos projetos:', error);
      throw error;
    }
  }

  /**
   * Gera a distribuição individual de projetos para um avaliador,
   * priorizando projetos com menos avaliadores (cobertura balanceada).
   */
  async gerarDistribuicao(avaliadorId: number) {
    // 0. Busca o evento ativo do ano atual
    const eventoAtual = await this.buscarEventoAtivoDoAno();
    if (!eventoAtual) {
      return {
        mensagem: 'Nenhum evento ativo encontrado para o ano atual.',
        projetos: [],
      };
    }

    // 1. Busca projetos aprovados do evento atual
    let projetosAprovados = await this.projetoRepository.find({
      where: { status: 'APROVADO', eventoId: eventoAtual.id },
      relations: [
        'orientadores',
        'orientadores.orientador',
        'orientadores.orientador.areas', // ✅ relação com a tabela orientador_areas
      ],
    });

    // ✅ Filtra por áreas permitidas, se configurado
    const areasPermitidas = this.limitesAtuais.areasPermitidas ?? [];
    if (areasPermitidas.length > 0) {
      projetosAprovados = projetosAprovados.filter((projeto) => {
        const orientadorAceito = projeto.orientadores?.find(
          (po) => po.status === 'aceito',
        );
        if (!orientadorAceito || !orientadorAceito.orientador) return false;

        // Verifica primeiro o campo direto `area`
        const areaDireta = orientadorAceito.orientador.area;
        if (areaDireta && areasPermitidas.includes(areaDireta)) {
          return true;
        }

        // Verifica se alguma das áreas da relação `areas` está permitida
        const areasDoOrientador = orientadorAceito.orientador.areas ?? [];
        return areasDoOrientador.some((a) => areasPermitidas.includes(a.area));
      });
    }

    // 2. Busca todas as atribuições existentes
    const todasAtribuicoes = await this.avaliadorProjetoRepository.find();

    // Projetos que este avaliador já possui
    const projetosDoAvaliador = todasAtribuicoes
      .filter((a) => a.avaliadorId === avaliadorId)
      .map((a) => a.projetoId);

    const totalJaAtribuidos = projetosDoAvaliador.length;

    const maxPorAvaliador = this.limitesAtuais.maxProjetosPorAvaliador;
    if (totalJaAtribuidos >= maxPorAvaliador) {
      return {
        mensagem: `Limite máximo de ${maxPorAvaliador} projeto(s) por avaliador já foi atingido.`,
        projetos: [],
      };
    }

    const limiteRestante = maxPorAvaliador - totalJaAtribuidos;

    // 3. Constrói mapa: projetoId -> Set de avaliadorId
    const avaliadoresPorProjeto = new Map<number, Set<number>>();
    for (const atrib of todasAtribuicoes) {
      if (!avaliadoresPorProjeto.has(atrib.projetoId)) {
        avaliadoresPorProjeto.set(atrib.projetoId, new Set<number>());
      }
      avaliadoresPorProjeto.get(atrib.projetoId)!.add(atrib.avaliadorId);
    }

    // 4. Projetos elegíveis: ainda não avaliados por este avaliador e com menos avaliadores que o máximo
    const projetosElegiveis = projetosAprovados.filter((projeto) => {
      const avaliadoresNoProjeto = avaliadoresPorProjeto.get(projeto.id) || new Set<number>();
      return (
        !avaliadoresNoProjeto.has(avaliadorId) &&
        avaliadoresNoProjeto.size < this.limitesAtuais.maxAvaliadoresPorProjeto
      );
    });

    if (projetosElegiveis.length === 0) {
      return {
        mensagem: 'Nenhum projeto disponível para atribuição no momento.',
        projetos: [],
      };
    }

    // 5. Ordena os projetos elegíveis por quantidade atual de avaliadores (menor primeiro)
    const projetosOrdenados = this.ordenarPorMenosAvaliadores(projetosElegiveis, avaliadoresPorProjeto);

    // 6. Seleciona até o limite restante
    const selecionados = projetosOrdenados.slice(0, limiteRestante);

    // 7. Cria as novas atribuições
    const novasAtribuicoes = selecionados.map((projeto) =>
      this.avaliadorProjetoRepository.create({
        avaliadorId,
        projetoId: projeto.id,
        status: 'pendente',
      }),
    );

    await this.avaliadorProjetoRepository.save(novasAtribuicoes);

    return {
      mensagem: `${novasAtribuicoes.length} projeto(s) atribuído(s) com sucesso!`,
      projetos: selecionados,
    };
  }

  /**
   * Ordena projetos para que os com menos avaliadores venham primeiro,
   * embaralhando a ordem dentro de cada grupo (mesma quantidade de avaliadores).
   */
  private ordenarPorMenosAvaliadores(
    projetos: Projeto[],
    avaliadoresPorProjeto: Map<number, Set<number>>,
  ): Projeto[] {
    const grupos = new Map<number, Projeto[]>();

    for (const projeto of projetos) {
      const qtd = (avaliadoresPorProjeto.get(projeto.id) || new Set<number>()).size;
      if (!grupos.has(qtd)) {
        grupos.set(qtd, []);
      }
      grupos.get(qtd)!.push(projeto);
    }

    const resultado: Projeto[] = [];
    const chavesOrdenadas = Array.from(grupos.keys()).sort((a, b) => a - b);

    for (const chave of chavesOrdenadas) {
      const grupo = grupos.get(chave)!;
      resultado.push(...this.embaralhar(grupo));
    }

    return resultado;
  }

  /**
   * Lista projetos do evento atual que não possuem nenhum avaliador designado.
   */
  async listarProjetosSemAvaliadores(): Promise<Projeto[]> {
    const eventoAtual = await this.buscarEventoAtivoDoAno();
    if (!eventoAtual) return [];

    // Projetos que já possuem ao menos um avaliador designado
    const subQuery = this.avaliadorProjetoRepository
      .createQueryBuilder('ap')
      .select('ap.projetoId')
      .where('ap.projetoId IS NOT NULL');

    const query = this.projetoRepository
      .createQueryBuilder('projeto')
      .leftJoinAndSelect('projeto.orientadores', 'projetoOrientador', "projetoOrientador.status = 'aceito'")
      .leftJoinAndSelect('projetoOrientador.orientador', 'orientador')
      .leftJoinAndSelect('orientador.areas', 'area')
      .where('projeto.status = :status', { status: 'APROVADO' })
      .andWhere('projeto.eventoId = :eventoId', { eventoId: eventoAtual.id })
      .andWhere(`projeto.id NOT IN (${subQuery.getQuery()})`)
      .setParameters(subQuery.getParameters());

    // Aplica filtro de áreas permitidas, se configurado
    if (this.limitesAtuais.areasPermitidas.length > 0) {
      query.andWhere(
        '(orientador.area IN (:...areasPermitidas) OR area.area IN (:...areasPermitidas))',
        { areasPermitidas: this.limitesAtuais.areasPermitidas },
      );
    }

    return query.getMany();
  }


  /**
   * Embaralha array usando Fisher-Yates.
   */
  private embaralhar<T>(array: T[]): T[] {
    const copia = [...array];
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
  }

  /**
   * Salva os limites atualizados.
   */
  async salvarLimites(dto: LimitesAvaliacaoDto) {
    this.limitesAtuais = { ...this.limitesAtuais, ...dto };
    return {
      mensagem: 'Limites atualizados com sucesso!',
      configuracao: this.limitesAtuais,
    };
  }

  private async getAreaDoOrientadorAceito(projetoId: number): Promise<string | null> {
    const projeto = await this.projetoRepository.findOne({
      where: { id: projetoId },
      relations: ['orientadores', 'orientadores.orientador', 'orientadores.orientador.areas'],
    });

    if (!projeto) return null;

    const orientadorAceito = projeto.orientadores?.find(
      (po) => po.status === 'aceito',
    );

    if (!orientadorAceito || !orientadorAceito.orientador) return null;

    // Pega a primeira área (ou você pode ter regra para múltiplas)
    const area = orientadorAceito.orientador.areas?.[0]?.area ?? null;
    return area;
  }
  // Dentro da classe AvaliacaoService

  /**
   * Conta quantos projetos o avaliador já possui.
   */
  async contarProjetosDoAvaliador(avaliadorId: number): Promise<number> {
    const eventoAtual = await this.buscarEventoAtivoDoAno();
    if (!eventoAtual) return 0;

    return this.avaliadorProjetoRepository.count({
      where: { avaliadorId, projeto: { eventoId: eventoAtual.id } },
    });
  }

  /**
   * Lista projetos disponíveis para designação a um avaliador.
   * Retorna projetos aprovados que ainda não foram designados a ele.
   */
  async listarProjetosDisponiveis(avaliadorId: number): Promise<(Projeto & { qtdAvaliadores: number })[]> {
    const eventoAtual = await this.buscarEventoAtivoDoAno();
    if (!eventoAtual) return [];

    const areasPermitidas = this.limitesAtuais.areasPermitidas;

    const subQuery = this.avaliadorProjetoRepository
      .createQueryBuilder('ap')
      .select('ap.projetoId')
      .where('ap.avaliadorId = :avaliadorId', { avaliadorId });

    const query = this.projetoRepository
      .createQueryBuilder('projeto')
      .leftJoinAndSelect('projeto.orientadores', 'projetoOrientador', "projetoOrientador.status = 'aceito'")
      .leftJoinAndSelect('projetoOrientador.orientador', 'orientador')
      .leftJoinAndSelect('orientador.areas', 'area')
      .where('projeto.status = :status', { status: 'APROVADO' })
      .andWhere('projeto.eventoId = :eventoId', { eventoId: eventoAtual.id })
      .andWhere(`projeto.id NOT IN (${subQuery.getQuery()})`)
      .setParameters(subQuery.getParameters());

    if (areasPermitidas.length > 0) {
      query.andWhere('(area.area IN (:...areasPermitidas) OR orientador.area IN (:...areasPermitidas))', {
        areasPermitidas,
      });
    }

    const projetos = await query.getMany();

    if (projetos.length === 0) return [];

    const projetosIds = projetos.map((p) => p.id);

    const contagem = await this.avaliadorProjetoRepository
      .createQueryBuilder('ap')
      .select('ap.projetoId', 'projetoId')
      .addSelect('COUNT(ap.avaliadorId)', 'qtd')
      .where('ap.projetoId IN (:...projetosIds)', { projetosIds })
      .groupBy('ap.projetoId')
      .getRawMany();

    const mapaContagem = new Map<number, number>(
      contagem.map((c) => [Number(c.projetoId), Number(c.qtd)])
    );

    return projetos.map((p) => ({
      ...p,
      qtdAvaliadores: mapaContagem.get(p.id) ?? 0,
    }));
  }

  /**
   * Designa uma lista de projetos a um avaliador.
   */
  async designarProjetos(avaliadorId: number, projetosIds: number[]): Promise<void> {
    const novasAtribuicoes = projetosIds.map((projetoId) =>
      this.avaliadorProjetoRepository.create({
        avaliadorId,
        projetoId,
        status: 'pendente',
      }),
    );

    await this.avaliadorProjetoRepository.save(novasAtribuicoes);
  }

  /**
   * Remove projetos designados de um avaliador.
   */
  async removerProjetos(
    avaliadorId: number,
    projetosIds: number[],
    removerTodos: boolean,
  ): Promise<void> {
    if (removerTodos) {
      await this.avaliadorProjetoRepository.delete({ avaliadorId });
    } else {
      await this.avaliadorProjetoRepository.delete({
        avaliadorId,
        projetoId: In(projetosIds),
      });
    }
  }


  async listarDetalhesAvaliacaoProjeto(projetoId: number) {
    const avaliacoes = await this.avaliacaoRepository.find({
      where: { projeto: { id: projetoId } },
    });

    if (avaliacoes.length === 0) {
      throw new NotFoundException('Nenhuma avaliação encontrada para este projeto.');
    }

    const avaliadoresIds = avaliacoes.map((a) => a.avaliadorId);

    const usuarios = await this.dataSource.getRepository(User).find({
      where: { id: In(avaliadoresIds) },
      select: ['id', 'nome', 'email_institucional'],
    });

    const mapaUsuarios = new Map(usuarios.map((u) => [u.id, u]));

    const avaliacoesIds = avaliacoes.map((a) => a.id);
    const criterios = await this.avaliacaoCriterioRepository.find({
      where: { avaliacao: { id: In(avaliacoesIds) } },
      relations: ['avaliacao'], // ✅ ESSENCIAL: carrega a relação para acessar avaliacao.id
    });

    const criteriosPorAvaliacao = new Map<number, AvaliacaoCriterio[]>();
    for (const criterio of criterios) {
      const avaliacaoId = criterio.avaliacao?.id;
      if (!avaliacaoId) continue;
      const lista = criteriosPorAvaliacao.get(avaliacaoId) ?? [];
      lista.push(criterio);
      criteriosPorAvaliacao.set(avaliacaoId, lista);
    }

    return {
      projetoId,
      avaliacoes: avaliacoes.map((avaliacao) => ({
        id: avaliacao.id, // ✅ ADICIONE ESTA LINHA
        avaliador: {
          id: avaliacao.avaliadorId,
          nome: mapaUsuarios.get(avaliacao.avaliadorId)?.nome ?? 'Avaliador',
          email: mapaUsuarios.get(avaliacao.avaliadorId)?.email_institucional ?? '',
        },
        nota: Number(avaliacao.nota),
        criterios: (criteriosPorAvaliacao.get(avaliacao.id) ?? []).map((criterio) => ({
          criterio: criterio.criterio,
          nota: Number(criterio.nota),
        })),
        data: avaliacao.createdAt,
      })),
    };
  }


  async listarAvaliadoresDesignadosComStatus(projetoId: number) {
    const atribuicoes = await this.avaliadorProjetoRepository.find({
      where: { projetoId },
      relations: ['avaliador'],
    });

    if (atribuicoes.length === 0) {
      return { avaliadores: [] };
    }

    const avaliadores = atribuicoes.map((atrib) => ({
      avaliadorId: atrib.avaliadorId,
      nome: atrib.avaliador?.nome ?? 'Avaliador',
      email: atrib.avaliador?.email_institucional ?? '',
      status: atrib.status === 'avaliado' ? 'Avaliado' : 'Pendente',
    }));

    return { avaliadores };
  }

  async listarRankingOrientadores(eventoId?: number): Promise<any[]> {
    // Ajuste para usar as relações corretas
    const query = this.projetoRepository
      .createQueryBuilder('projeto')
      .leftJoinAndSelect('projeto.avaliacoes', 'avaliacao')
      .leftJoinAndSelect('projeto.orientadores', 'projetoOrientador', "projetoOrientador.status = 'aceito'")
      .leftJoinAndSelect('projetoOrientador.orientador', 'orientador')
      .select([
        'orientador.id AS orientadorId',
        'orientador.nome AS orientadorNome',
        'orientador.email_institucional AS email',
        'AVG(avaliacao.nota) AS mediaGeral',
        'COUNT(DISTINCT projeto.id) AS totalProjetos',
      ])
      .groupBy('orientador.id')
      .addGroupBy('orientador.nome')
      .addGroupBy('orientador.email_institucional')
      .orderBy('mediaGeral', 'DESC');

    if (eventoId) {
      query.andWhere('projeto.eventoId = :eventoId', { eventoId });
    } else {
      // Se não informado, usa evento atual
      const eventoAtual = await this.buscarEventoAtivoDoAno();
      if (!eventoAtual) return [];
      query.andWhere('projeto.eventoId = :eventoId', { eventoId: eventoAtual.id });
    }

    const raw = await query.getRawMany();

    return raw.map((item) => ({
      orientadorId: Number(item.orientadorId),
      orientadorNome: item.orientadorNome,
      email: item.email,
      mediaGeral: Number(Number(item.mediaGeral).toFixed(2)),
      totalProjetos: Number(item.totalProjetos),
    }));
  }

  /**
   * Deleta uma avaliação e seus critérios, revertendo o status da atribuição para 'pendente'.
   */
  async deletarAvaliacao(avaliacaoId: number): Promise<{ message: string }> {
    const avaliacao = await this.avaliacaoRepository.findOne({
      where: { id: avaliacaoId },
      relations: ['projeto'], // ✅ já está presente, garante que projeto seja carregado
    });

    if (!avaliacao) {
      throw new NotFoundException(`Avaliação #${avaliacaoId} não encontrada.`);
    }

    const avaliadorId = avaliacao.avaliadorId;
    const projetoId = avaliacao.projeto?.id;

    if (!projetoId) {
      throw new BadRequestException('Avaliação sem projeto associado.');
    }

    // 1. Remove os critérios vinculados
    await this.avaliacaoCriterioRepository.delete({
      avaliacao: { id: avaliacaoId },
    });

    // 2. Remove a avaliação
    await this.avaliacaoRepository.delete({ id: avaliacaoId });

    // 3. Atualiza a atribuição para pendente
    await this.avaliadorProjetoRepository.update(
      { avaliadorId, projetoId },
      { status: 'pendente' },
    );

    return { message: 'Avaliação excluída com sucesso.' };
  }

}