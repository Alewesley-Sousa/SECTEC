import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Projeto } from '../projetos/entities/projeto.entity';
import { AvaliadorProjeto } from './entities/avaliador-projeto.entity';
import { LimitesAvaliacaoDto } from './dto/limites-avaliacao.dto';

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
  ) {}

  /**
   * Gera a distribuição individual de projetos para um avaliador,
   * priorizando projetos com menos avaliadores (cobertura balanceada).
   */
  async gerarDistribuicao(avaliadorId: number) {
    // 1. Busca projetos aprovados
    const projetosAprovados = await this.projetoRepository.find({
      where: { status: 'APROVADO' },
    });

    // 2. Busca todas as atribuições existentes (para saber quantos avaliadores cada projeto tem)
    const todasAtribuicoes = await this.avaliadorProjetoRepository.find();

    // Projetos que este avaliador já possui
    const projetosDoAvaliador = todasAtribuicoes
      .filter((a) => a.avaliadorId === avaliadorId)
      .map((a) => a.projetoId);

    // Quantidade de projetos que o avaliador já tem
    const totalJaAtribuidos = projetosDoAvaliador.length;

    const maxPorAvaliador = this.limitesAtuais.maxProjetosPorAvaliador;
    if (totalJaAtribuidos >= maxPorAvaliador) {
      return {
        mensagem: `Limite máximo de ${maxPorAvaliador} projeto(s) por avaliador já foi atingido.`,
        projetos: [],
      };
    }

    // Capacidade restante
    const limiteRestante = maxPorAvaliador - totalJaAtribuidos;

    // Constrói mapa: projetoId -> Set de avaliadorId
    const avaliadoresPorProjeto = new Map<number, Set<number>>();
    for (const atrib of todasAtribuicoes) {
      if (!avaliadoresPorProjeto.has(atrib.projetoId)) {
        avaliadoresPorProjeto.set(atrib.projetoId, new Set<number>());
      }
      avaliadoresPorProjeto.get(atrib.projetoId)!.add(atrib.avaliadorId);
    }

    // Projetos que este avaliador ainda não possui e que não ultrapassam o máximo de avaliadores por projeto
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

    // Ordena os projetos elegíveis por quantidade atual de avaliadores (menor primeiro)
    // e embaralha dentro de cada grupo para manter aleatoriedade
    const projetosOrdenados = this.ordenarPorMenosAvaliadores(projetosElegiveis, avaliadoresPorProjeto);

    // Seleciona até o limite restante
    const selecionados = projetosOrdenados.slice(0, limiteRestante);

    // Cria as novas atribuições
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
    // Ordena as chaves (quantidades) de forma crescente
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