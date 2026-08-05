import { IsNotEmpty, IsNumber, Max, Min } from 'class-validator';

export class AvaliacaoDto {
  @IsNotEmpty()
  @IsNumber()
  projetoId!: number;

  @IsNotEmpty()
  @IsNumber()
  avaliadorId!: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  criterio1!: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  criterio2!: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  criterio3!: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  criterio4!: number;
}