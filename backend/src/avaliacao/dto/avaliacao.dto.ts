import { IsNumber, Min, Max } from 'class-validator';

export class CreateAvaliacaoDto {
  @IsNumber()
  projetoId: number;

  @IsNumber()
  avaliadorId: number;

  @IsNumber()
  @Min(0, { message: 'A nota do critério 1 deve ser no mínimo 0.' })
  @Max(10, { message: 'A nota do critério 1 deve ser no máximo 10.' })
  criterio1: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  criterio2: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  criterio3: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  criterio4: number;
}