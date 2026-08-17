import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Projeto } from '../projetos/entities/projeto.entity';
import { AvaliadorProjeto } from './entities/avaliador-projeto.entity';
import { Avaliacao } from './entities/avaliacao.entity';
import { AvaliacaoCriterio } from '../avaliacoes/entities/avaliacao-criterio.entity';
import { Evento } from '../evento/entities/evento.entity';
import { LimitesAvaliacaoDto } from './dto/limites-avaliacao.dto';
import { CreateAvaliacaoDto } from './dto/avaliacao.dto';

@Injectable()
export class AvaliacaoService {
  private limitesAtuais = {
    minAvaliacoes: 1,
    maxProjetosPorAvaliador: 5,
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
  ) {}

  private validarNota(nota: number, campo: string) {
    if (Number.isNaN(nota) || nota < 0 || nota > 10) {
      throw new BadRequestException(`${campo} deve estar entre 0 e 10.`);
    }

    if ((nota * 10) % 5 !== 0) {
      throw new BadRequestException(`${campo} deve seguir o passo de 0,5.`);
    }
  }

  async criarAvaliacao(dto: CreateAvaliacaoDto & { avaliadorId: number }) {
    const { avaliadorId, projetoId, apresentacao, metodologia, conteudo, resultado } = dto;

    this.validarNota(apresentacao, 'Apresentação');
    this.validarNota(metodologia, 'Metodologia');
    this.validarNota(conteudo, 'Conteúdo');
    this.validarNota(resultado, 'Resultado');

    const projeto = await this.projetoRepository.findOne({ where: { id: projetoId } });
    if (!projeto) {
      throw new NotFoundException(`Projeto ${projetoId} não encontrado.`);
    }

    const evento = await this.eventoRepository.findOne({ where: { id: projeto.eventoId } });
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

    const jaExiste = await this.avaliacaoRepository.findOne({
      where: { avaliadorId, projetoId },
    });

    if (jaExiste) {
      throw new ConflictException('Este projeto já foi avaliado por este avaliador.');
    }

    const media = Number(
      ((apresentacao + metodologia + conteudo + resultado) / 4).toFixed(1),
    );

    const avaliacaoSalva = await this.avaliacaoRepository.save(
      this.avaliacaoRepository.create({ avaliadorId, projetoId, nota: media }),
    );

    await this.avaliacaoCriterioRepository.save([
      this.avaliacaoCriterioRepository.create({
        avaliacao: avaliacaoSalva,
        criterio: 'apresentacao',
        nota: apresentacao,
      }),
      this.avaliacaoCriterioRepository.create({
        avaliacao: avaliacaoSalva,
        criterio: 'metodologia',
        nota: metodologia,
      }),
      this.avaliacaoCriterioRepository.create({
        avaliacao: avaliacaoSalva,
        criterio: 'conteudo',
        nota: conteudo,
      }),
      this.avaliacaoCriterioRepository.create({
        avaliacao: avaliacaoSalva,
        criterio: 'resultado',
        nota: resultado,
      }),
    ]);

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
  }

  async gerarDistribuicao(avaliadorId: number) {
    const totalJaAtribuidos = await this.avaliadorProjetoRepository.count({
      where: { avaliadorId },
    });

    const maxPermitido = this.limitesAtuais.maxProjetosPorAvaliador;
    if (totalJaAtribuidos >= maxPermitido) {
      return {
        mensagem: `Limite máximo de ${maxPermitido} projeto(s) por avaliador já foi atingido.`,
        projetos: [],
      };
    }

    const jaAtribuidos = await this.avaliadorProjetoRepository.find({
      where: { avaliadorId },
      select: ['projetoId'],
    });
    const idsAtribuidos = jaAtribuidos.map((ap) => ap.projetoId);

    const query = this.projetoRepository
      .createQueryBuilder('projeto')
      .where('projeto.status = :status', { status: 'APROVADO' });

    if (idsAtribuidos.length > 0) {
      query.andWhere('projeto.id NOT IN (:...idsAtribuidos)', { idsAtribuidos });
    }

    const projetosDisponiveis = await query.take(maxPermitido - totalJaAtribuidos).getMany();

    if (!projetosDisponiveis.length) {
      return {
        mensagem: 'Nenhum novo projeto disponível para atribuição no momento.',
        projetos: [],
      };
    }

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