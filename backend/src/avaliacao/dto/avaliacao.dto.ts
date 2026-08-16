import { IsNumber, Min, Max, IsNotEmpty } from 'class-validator';

export class CreateAvaliacaoDto {
  @IsNumber()
  @IsNotEmpty()
  avaliador_id!: number;

  @IsNumber()
  @IsNotEmpty()
  projeto_id!: number;

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