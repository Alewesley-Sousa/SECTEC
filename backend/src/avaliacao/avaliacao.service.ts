import { BadRequestException, Injectable } from '@nestjs/common';
import { AvaliacaoDto } from './dto/avaliacao.dto';

@Injectable()
export class AvaliacaoService {
  // Valida se o número termina em .0 ou .5
  private validarPassoMeioPonto(nota: number): boolean {
    return (nota * 10) % 5 === 0;
  }

  async submeterAvaliacao(dto: AvaliacaoDto) {
    const notas = [dto.criterio1, dto.criterio2, dto.criterio3, dto.criterio4];

    // 1. Validação de notas (passo de 0.5)
    for (const nota of notas) {
      if (!this.validarPassoMeioPonto(nota)) {
        throw new BadRequestException(
          `A nota ${nota} é inválida. As notas devem ter incremento de 0.5 (ex: 7.0, 7.5, 8.0).`,
        );
      }
    }

    // 2. Cálculo da média dos 4 critérios
    const mediaAvaliacao =
      (dto.criterio1 + dto.criterio2 + dto.criterio3 + dto.criterio4) / 4;

    // TODO: Adicionar aqui a checagem de avaliação duplicada no banco e o prazo do evento

    return {
      sucesso: true,
      mensagem: 'Avaliação processada com sucesso!',
      mediaAvaliacao,
    };
  }
}
