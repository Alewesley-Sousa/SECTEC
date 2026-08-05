import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class ConfiguracaoLimitesDto {
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  minProjetosPorAvaliador!: number;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  maxProjetosPorAvaliador!: number;
}