import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource, Between } from 'typeorm';
import { StreamableFile } from '@nestjs/common';

import { Projeto } from '../projetos/entities/projeto.entity';
import { AvaliadorProjeto } from './entities/avaliador-projeto.entity';
import { Avaliacao } from './entities/avaliacao.entity';
import { AvaliacaoCriterio } from './entities/avaliacao-criterio.entity';
import { LimitesAvaliacaoDto } from './dto/limites-avaliacao.dto';
import { CreateAvaliacaoDto } from './dto/avaliacao.dto';
import { Evento, EventoStatus } from '../evento/entities/evento.entity';
@Injectable()
export class AvaliacaoService {
  private limitesAtuais = {
    minAvaliacoes: 1,
    maxProjetosPorAvaliador: 5,
    maxAvaliadoresPorProjeto: 3,
  };

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
      local: projeto.evento?.local ?? 'Local não informado',
      autores,
      tag: projeto.tema?.nome ?? 'Sem tema',
      status: atribuicao?.status ?? 'pendente',
      designado: !!atribuicao, // true se existe atribuição, false caso contrário
    };
  }

  async listarProjetosDesignados(avaliadorId: number) {
    // Busca todas as atribuições do avaliador
    const atribuicoes = await this.avaliadorProjetoRepository.find({
      where: { avaliadorId },
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
        projeto: In(projetosIds),
      },
    });

    const avaliadosSet = new Set(avaliacoesExistentes.map((av) => av.projeto));

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
        local: projeto.evento?.local ?? 'Local não informado', // ajuste se houver campo
        autores,
        tag: projeto.tema?.nome ?? 'Sem tema',
        status: avaliadosSet.has(projeto.id) ? 'Avaliado' : 'Pendente',
        // Opcional: id da atribuição para ações futuras
        atribuicaoId: atribuicao.id,
      };
    });

    return { projetos };
  }



  async criarAvaliacao(dto: CreateAvaliacaoDto & { avaliadorId: number }) {
    const { avaliadorId, projetoId, apresentacao, metodologia, conteudo, resultado } = dto;

    this.validarNota(apresentacao, 'Apresentação');
    this.validarNota(metodologia, 'Metodologia');
    this.validarNota(conteudo, 'Conteúdo');
    this.validarNota(resultado, 'Resultado');

    try {
      // ===== INÍCIO DA TRANSAÇÃO =====
      return await this.dataSource.transaction(async (manager) => {
        const projeto = await manager.findOne(Projeto, {
          where: { id: projetoId },
        });

        if (!projeto) {
          throw new NotFoundException(`Projeto ${projetoId} não encontrado.`);
        }

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

        // Salva avaliação
        const avaliacaoSalva = await manager.save(Avaliacao, {
          avaliadorId,
          projeto: { id: projetoId },
          nota: media,
        });

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

        // Atualiza a atribuição para 'avaliado'
        await manager.update(
          AvaliadorProjeto,
          { avaliadorId, projeto: { id: projetoId } },
          { status: 'avaliado' },
        );

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
      // ===== FIM DA TRANSAÇÃO =====
    } catch (error) {
      console.error('❌ Erro ao criar avaliação:', error);
      throw error; // relança para o NestJS tratar a resposta
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
    // 1. Busca projetos aprovados
    const projetosAprovados = await this.projetoRepository.find({
      where: { status: 'APROVADO' },
    });

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
}