import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ProjetoMaterial,
  StatusMaterial,
} from './entities/projeto-material.entity';
import {
  ProjetoOrientador,
  StatusOrientacao,
} from '../orientacoes/entities/projeto-orientador.entity';
import { RevisarMaterialDto } from './dto/revisar-material.dto';

@Injectable()
export class MateriaisService {
  constructor(
    @InjectRepository(ProjetoMaterial)
    private materiaisRepository: Repository<ProjetoMaterial>,

    @InjectRepository(ProjetoOrientador)
    private orientacoesRepository: Repository<ProjetoOrientador>,
  ) {}

  private async verificarVinculo(
    projetoId: number,
    orientadorId: number,
  ): Promise<void> {
    const vinculo = await this.orientacoesRepository.findOne({
      where: {
        projeto: { id: projetoId },
        orientador: { id: orientadorId },
        status: StatusOrientacao.ACEITO,
      },
    });

    if (!vinculo) {
      throw new ForbiddenException('Você não é o orientador aceito deste projeto');
    }
  }

  async findByProjeto(
    projetoId: number,
    orientadorId: number,
  ): Promise<ProjetoMaterial[]> {
    await this.verificarVinculo(projetoId, orientadorId);
    return this.materiaisRepository.find({
      where: { projeto: { id: projetoId } },
      order: { criadoEm: 'DESC' },
    });
  }

  async revisar(
    id: number,
    orientadorId: number,
    dto: RevisarMaterialDto,
  ): Promise<ProjetoMaterial> {
    const material = await this.materiaisRepository.findOne({
      where: { id },
      relations: ['projeto'],
    });

    if (!material) {
      throw new NotFoundException('Material não encontrado');
    }

    await this.verificarVinculo(material.projeto.id, orientadorId);

    if (material.status !== StatusMaterial.EM_ANALISE) {
      throw new BadRequestException('Este material já foi revisado');
    }

    material.status  = dto.status;
    material.opiniao = dto.opiniao;

    return this.materiaisRepository.save(material);
  }
}
