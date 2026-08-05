import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateAvaliacaoDto } from './dto/avaliacao.dto';

@Injectable()
export class AvaliacaoService {
  
  private validarIncremento(nota: number): boolean {
    // Exemplo: valida se a nota segue o incremento permitido (ex: múltiplos de 0.5)
    return true; 
  }

  async submeterAvaliacao(dto: CreateAvaliacaoDto) {
    const notas = [dto.criterio1, dto.criterio2, dto.criterio3, dto.criterio4];

    // Validação dos incrementos das notas
    for (let i = 0; i < notas.length; i++) {
      const nota = notas[i];
      if (!this.validarIncremento(nota)) {
        throw new BadRequestException(
          `A nota do critério ${i + 1} (${nota}) é inválida.`
        );
      }
    }

    // Cálculo da média das notas
    const media = (dto.criterio1 + dto.criterio2 + dto.criterio3 + dto.criterio4) / 4;

    // Arredonda para 1 casa decimal mantendo o tipo 'number'
    const mediaFormatada = Number(media.toFixed(1));

    return {
      sucesso: true,
      mensagem: "Avaliação processada com sucesso!",
      mediaAvaliacao: mediaFormatada
    };
  }
}