import { Transform } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { notasValidas, toNumber } from './avaliacao.dto';

/** Todas as notas são opcionais: envie apenas os critérios que mudaram. */
export class AtualizarAvaliacaoDto {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(10)
  @IsIn(notasValidas)
  @Transform(toNumber)
  apresentacao?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(10)
  @IsIn(notasValidas)
  @Transform(toNumber)
  metodologia?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(10)
  @IsIn(notasValidas)
  @Transform(toNumber)
  conteudo?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(10)
  @IsIn(notasValidas)
  @Transform(toNumber)
  resultado?: number;
}
