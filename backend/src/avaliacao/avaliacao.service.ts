import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Projeto } from '../projetos/entities/projeto.entity';
import { AvaliadorProjeto } from './entities/avaliador-projeto.entity';
import { LimitesAvaliacaoDto } from './dto/limites-avaliacao.dto';

@Injectable()
export class AvaliacaoService {
  // Configuração padrão de limites em memória (ou substitua pela consulta ao banco se houver entity)
  private limitesAtuais = {
    minAvaliacoes: 1,
    maxProjetosPorAvaliador: 5,
  };

  constructor(
    @InjectRepository(Projeto)
    private readonly projetoRepository: Repository<Projeto>,
    @InjectRepository(AvaliadorProjeto)
    private readonly avaliadorProjetoRepository: Repository<AvaliadorProjeto>,
  ) {}

  async gerarDistribuicao(avaliadorId: number) {
    // 1. Contar quantos projetos este avaliador já possui
    const totalJaAtribuidos = await this.avaliadorProjetoRepository.count({
      where: { avaliadorId },
    });

    // 2. Verificar se já atingiu o limite máximo configurado
    const maxPermitido = this.limitesAtuais.maxProjetosPorAvaliador;
    if (totalJaAtribuidos >= maxPermitido) {
      return {
        mensagem: `Limite máximo de ${maxPermitido} projeto(s) por avaliador já foi atingido.`,
        projetos: [],
      };
    }

    // Calcular quantos novos projetos ainda podem ser atribuídos
    const limiteRestante = maxPermitido - totalJaAtribuidos;

    // 3. Obter IDs dos projetos já atribuídos para excluir da busca
    const jaAtribuidos = await this.avaliadorProjetoRepository.find({
      where: { avaliadorId },
      select: ['projetoId'],
    });
    const idsAtribuidos = jaAtribuidos.map((ap) => ap.projetoId);

    // 4. Buscar apenas a quantidade restante permitida
    const query = this.projetoRepository
      .createQueryBuilder('projeto')
      .where('projeto.status = :status', { status: 'APROVADO' });

    if (idsAtribuidos.length > 0) {
      query.andWhere('projeto.id NOT IN (:...idsAtribuidos)', { idsAtribuidos });
    }

    const projetosDisponiveis = await query.take(limiteRestante).getMany();

    if (!projetosDisponiveis.length) {
      return {
        mensagem: 'Nenhum novo projeto disponível para atribuição no momento.',
        projetos: [],
      };
    }

    // 5. Salvar as novas atribuições
    const novasAtribuicoes = projetosDisponiveis.map((projeto) =>
      this.avaliadorProjetoRepository.create({
        avaliadorId,
        projetoId: projeto.id,
        status: 'pendente',
      }),
    );

    await this.avaliadorProjetoRepository.save(novasAtribuicoes);

    return {
      mensagem: `${novasAtribuicoes.length} projeto(s) distribuído(s) com sucesso!`,
      projetos: projetosDisponiveis,
    };
  }

  async salvarLimites(dto: LimitesAvaliacaoDto) {
    this.limitesAtuais = dto;

    return {
      mensagem: 'Limites atualizados com sucesso!',
      configuracao: this.limitesAtuais,
    };
  }
}