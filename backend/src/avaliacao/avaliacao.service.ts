import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';

import { Projeto } from '../projetos/entities/projeto.entity';
import { AvaliadorProjeto } from './entities/avaliador-projeto.entity';
import { Avaliacao } from './entities/avaliacao.entity';
import { AvaliacaoCriterio } from './entities/avaliacao-criterio.entity';
import { Evento } from '../evento/entities/evento.entity';
import { LimitesAvaliacaoDto } from './dto/limites-avaliacao.dto';
import { CreateAvaliacaoDto } from './dto/avaliacao.dto';

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

    if (!atribuicao) {
      throw new BadRequestException('Este projeto não está designado a você.');
    }

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
      local: projeto.evento?.local ?? 'Local não informado',
      autores,
      tag: projeto.tema?.nome ?? 'Sem tema',
      status: atribuicao.status ?? 'pendente',
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
        projetoId: In(projetosIds),
      },
    });

    const avaliadosSet = new Set(avaliacoesExistentes.map((av) => av.projetoId));

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
          where: { avaliadorId, projetoId },
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
          projetoId,
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
          { avaliadorId, projetoId },
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


async listarMediasProjetos(): Promise<any[]> {
  const query = this.projetoRepository
    .createQueryBuilder('projeto')
    .leftJoinAndSelect('projeto.avaliacoes', 'avaliacao')
    .leftJoinAndSelect('projeto.orientadores', 'orientadores')
    .leftJoinAndSelect('orientadores.orientador', 'orientadorUser')
    .where('orientadores.status = :status', { status: 'aceito' }) // se houver campo status
    .select([
      'projeto.id',
      'projeto.titulo',
      'orientadorUser.nome AS orientador',
      'AVG(avaliacao.nota) AS mediaFinal',
      'COUNT(avaliacao.id) AS quantidadeAvaliacoes',
    ])
    .groupBy('projeto.id')
    .addGroupBy('projeto.titulo')
    .addGroupBy('orientadorUser.nome')
    .orderBy('mediaFinal', 'DESC');

  return query.getRawMany();
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