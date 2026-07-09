// src/relatorio/dto/avaliar-relatorio-material.dto.ts
import { IsEnum, IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { StatusRelatorioMaterial } from '../entities/relatorio-material.entity';

/**
 * DTO para avaliação de um material de relatório pela coordenação
 * 
 * Usado para aprovar ou devolver o relatório do aluno.
 */
export class AvaliarRelatorioMaterialDto {
  @IsEnum(StatusRelatorioMaterial)
  @IsNotEmpty()
  status!: StatusRelatorioMaterial;

  @IsString()
  @IsOptional()
  opiniao?: string;
}