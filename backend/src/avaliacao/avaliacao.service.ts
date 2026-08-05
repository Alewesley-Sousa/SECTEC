import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Importe suas entidades reais aqui (ajuste os caminhos se necessário)
import { Evento } from '../evento/entities/evento.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Projeto } from '../projetos/entities/projeto.entity';
import { AvaliadorProjeto } from './entities/avaliador-projeto.entity';

@Injectable()
export class AvaliacaoService {
  constructor(
    @InjectRepository(Evento)
    private readonly eventoRepository: Repository<Evento>,
    
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    
    @InjectRepository(Projeto)
    private readonly projetoRepository: Repository<Projeto>,
    
    @InjectRepository(AvaliadorProjeto)
    private readonly avaliadorProjetoRepository: Repository<AvaliadorProjeto>,
  ) {}

  // 1. Atualizar limites de projetos por avaliador (Coordenação)
  async atualizarLimitesEvento(
    eventoId: number,
    minProjetos: number,
    maxProjetos: number,
  ) {
    // Validação de regra de negócio simples
    if (minProjetos > maxProjetos) {
      throw new BadRequestException('O número mínimo não pode ser maior que o máximo.');
    }

    const evento = await this.eventoRepository.findOne({ where: { id: eventoId } });
    if (!evento) {
      throw new NotFoundException('Evento não encontrado.');
    }

    // Salva os limites no banco
    await this.eventoRepository.update(eventoId, {
      min_projetos_por_avaliador: minProjetos,
      max_projetos_por_avaliador: maxProjetos,
    });

    return {
      message: 'Limites de avaliação atualizados com sucesso!',
      minProjetosPorAvaliador: minProjetos,
      maxProjetosPorAvaliador: maxProjetos,
    };
  }

  // 2. Algoritmo de Distribuição Automática
  async gerarDistribuicao(eventoId: number) {
    const evento = await this.eventoRepository.findOne({ where: { id: eventoId } });
    if (!evento) {
      throw new NotFoundException('Evento não encontrado.');
    }

    const min = evento.min_projetos_por_avaliador;
    const max = evento.max_projetos_por_avaliador;

    if (!min || !max) {
      throw new BadRequestException(
        'Configure os limites mínimo e máximo antes de gerar a distribuição.',
      );
    }

    // Busca todos os avaliadores cadastrados no sistema
    const avaliadores = await this.userRepository.find({
      where: { role_cargo: UserRole.AVALIADOR },
    });

    // Busca todos os projetos do evento
    const projetos = await this.projetoRepository.find({
      where: { eventoId: eventoId },
    });

    if (avaliadores.length === 0 || projetos.length === 0) {
      throw new BadRequestException('É necessário ter avaliadores e projetos cadastrados.');
    }

    // Lógica simples de distribuição respeitando o limite max
    let projetosAtribuidosCount = 0;

    for (const avaliador of avaliadores) {
      // Conta quantos projetos este avaliador já possui
      const qtdAtual = await this.avaliadorProjetoRepository.count({
        where: { avaliadorId: avaliador.id },
      });

      // Se já atingiu o máximo, pula para o próximo
      if (qtdAtual >= max) continue;

      // Define quantos projetos faltam para atingir o mínimo/máximo desejado
      const limiteAtribuicao = max - qtdAtual;

      // Filtra projetos disponíveis e realiza o vínculo
      for (const projeto of projetos) {
        if (projetosAtribuidosCount >= limiteAtribuicao) break;

        const jaExisteVincuol = await this.avaliadorProjetoRepository.findOne({
          where: { avaliadorId: avaliador.id, projetoId: projeto.id },
        });

        if (!jaExisteVincuol) {
          await this.avaliadorProjetoRepository.save({
            avaliadorId: avaliador.id,
            projetoId: projeto.id,
          });
          projetosAtribuidosCount++;
        }
      }
      projetosAtribuidosCount = 0; // reseta para o próximo avaliador
    }

    return { message: 'Distribuição realizada com sucesso!' };
  }
}