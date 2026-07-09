// src/relatorio/dto/update-aluno-relatorio-projeto.dto.ts
import { IsInt, IsOptional, IsBoolean, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para atualização de uma atribuição de projeto a um aluno
 * 
 * Usado para marcar um projeto como visualizado ou atualizar a data de atribuição.
 */
export class UpdateAlunoRelatorioProjetoDto {
  @IsInt()
  @IsOptional()
  aluno_relatorio_id?: number;

  @IsInt()
  @IsOptional()
  projeto_id?: number;

  @IsBoolean()
  @IsOptional()
  visualizado?: boolean;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  data_atribuicao?: Date;
}