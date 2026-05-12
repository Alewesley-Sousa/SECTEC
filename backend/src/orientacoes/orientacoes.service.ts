import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ProjetoOrientador,
  StatusOrientacao,
} from './entities/projeto-orientador.entity';
import { ResponderOrientacaoDto } from './dto/responder-orientacao.dto';

@Injectable()
export class OrientacoesService {
  constructor(
    @InjectRepository(ProjetoOrientador)
    private orientacoesRepository: Repository<ProjetoOrientador>,
  ) {}

  async findMinhasPendentes(orientadorId: number): Promise<ProjetoOrientador[]> {
    return this.orientacoesRepository.find({
      where: { orientador: { id: orientadorId }, status: StatusOrientacao.PENDENTE },
      relations: ['projeto', 'orientador'],
    });
  }

  async findMinhasOrientacoes(orientadorId: number): Promise<ProjetoOrientador[]> {
    return this.orientacoesRepository.find({
      where: { orientador: { id: orientadorId } },
      relations: ['projeto', 'orientador'],
      order: { criadoEm: 'DESC' },
    });
  }

  async responder(
    id: number,
    orientadorId: number,
    dto: ResponderOrientacaoDto,
  ): Promise<ProjetoOrientador> {
    const orientacao = await this.orientacoesRepository.findOne({
      where: { id },
      relations: ['projeto', 'orientador'],
    });

    if (!orientacao) {
      throw new NotFoundException('Orientação não encontrada');
    }

    if (orientacao.orientador.id !== orientadorId) {
      throw new ForbiddenException('Você não pode responder esta orientação');
    }

    if (orientacao.status !== StatusOrientacao.PENDENTE) {
      throw new BadRequestException('Esta orientação já foi respondida');
    }

    if (dto.action === StatusOrientacao.ACEITO) {
      await this.orientacoesRepository
        .createQueryBuilder()
        .update(ProjetoOrientador)
        .set({ status: StatusOrientacao.RECUSADO, respondidoEm: new Date() })
        .where('projeto_id = :projetoId', { projetoId: orientacao.projeto.id })
        .andWhere('status = :status', { status: StatusOrientacao.PENDENTE })
        .andWhere('id != :id', { id: orientacao.id })
        .execute();
    }

    orientacao.status = dto.action;
    orientacao.respondidoEm = new Date();

    return this.orientacoesRepository.save(orientacao);
  }
}
