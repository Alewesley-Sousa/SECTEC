import { Transform } from 'class-transformer';
import { IsIn, IsNumber, IsNotEmpty, Max, Min } from 'class-validator';

const notasValidas = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];

const toNumber = ({ value }: { value: unknown }) => {
  if (value === '' || value === null || value === undefined) return value;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
};

export class CreateAvaliacaoDto {
  @IsNumber()
  @IsNotEmpty()
  @Transform(toNumber)
  avaliadorId!: number;

  @IsNumber()
  @IsNotEmpty()
  @Transform(toNumber)
  projetoId!: number;

  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(10)
  @IsIn(notasValidas)
  @Transform(toNumber)
  apresentacao!: number;

  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(10)
  @IsIn(notasValidas)
  @Transform(toNumber)
  metodologia!: number;

  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(10)
  @IsIn(notasValidas)
  @Transform(toNumber)
  conteudo!: number;

  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(10)
  @IsIn(notasValidas)
  @Transform(toNumber)
  resultado!: number;
}