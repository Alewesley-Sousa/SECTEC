// src/relatorio/dto/distribuir-relatorio.dto.ts
import { IsInt, IsOptional, IsArray, ArrayMinSize } from 'class-validator';

/**
 * DTO para distribuição automática de projetos para alunos em modalidade relatório
 * 
 * Usado pela coordenação ao clicar em "Distribuir Projetos".
 * Pode ser usado para distribuir para todos os alunos ou para um específico.
 */
export class DistribuirRelatorioDto {
  @IsInt()
  @IsOptional()
  aluno_relatorio_id?: number;

  @IsArray()
  @IsInt({ each: true })
  @ArrayMinSize(1)
  @IsOptional()
  projeto_ids?: number[];
}