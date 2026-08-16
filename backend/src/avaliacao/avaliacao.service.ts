import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Avaliacao } from './entities/avaliacao.entity';
import { CreateAvaliacaoDto } from './dto/avaliacao.dto';

@Injectable()
export class AvaliacaoService {
  constructor(
    @InjectRepository(Avaliacao)
    private readonly avaliacaoRepository: Repository<Avaliacao>,
  ) {}

  private validarIncremento(nota: number): boolean {
    return nota % 0.5 === 0;
  }

  async submeterAvaliacao(dto: CreateAvaliacaoDto) {
    const notas = [dto.criterio1, dto.criterio2, dto.criterio3, dto.criterio4];

    for (let i = 0; i < notas.length; i++) {
      const nota = notas[i];
      if (!this.validarIncremento(nota)) {
        throw new BadRequestException(
          `A nota do critério ${i + 1} (${nota}) é inválida.`
        );
      }
    }

    const media = (dto.criterio1 + dto.criterio2 + dto.criterio3 + dto.criterio4) / 4;
    const mediaFormatada = Number(media.toFixed(1));

    const novaAvaliacao = this.avaliacaoRepository.create({
      avaliadorId: dto.avaliador_id,
      projetoId: dto.projeto_id,
      nota: mediaFormatada,
    });

    const avaliacaoSalva = await this.avaliacaoRepository.save(novaAvaliacao);

    return {
      sucesso: true,
      mensagem: "Avaliação processada e salva com sucesso!",
      avaliacaoId: avaliacaoSalva.id,
      mediaAvaliacao: mediaFormatada,
    };
  }
}