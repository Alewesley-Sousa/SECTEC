import { IsDateString, IsOptional, IsString } from 'class-validator';

export class FilterAuditoriaDto {
  @IsString()
  @IsOptional()
  usuarioId?: string;

  @IsString()
  @IsOptional()
  projetoId?: string;

  @IsString()
  @IsOptional()
  acao?: string;

  @IsDateString()
  @IsOptional()
  dataInicio?: string;

  @IsDateString()
  @IsOptional()
  dataFim?: string;
}
