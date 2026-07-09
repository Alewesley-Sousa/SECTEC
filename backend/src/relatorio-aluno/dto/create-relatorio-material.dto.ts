// src/relatorio/dto/create-relatorio-material.dto.ts
import { IsEnum, IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';
import { TipoRelatorioMaterial } from '../entities/relatorio-material.entity';

/**
 * DTO para envio de um material de relatório pelo aluno
 * 
 * Usado quando o aluno envia o PDF ou link do relatório.
 */
export class CreateRelatorioMaterialDto {
  @IsInt()
  @IsNotEmpty()
  aluno_relatorio_id!: number;

  @IsEnum(TipoRelatorioMaterial)
  @IsNotEmpty()
  tipo!: TipoRelatorioMaterial;

  @IsString()
  @IsNotEmpty()
  conteudo!: string;
}