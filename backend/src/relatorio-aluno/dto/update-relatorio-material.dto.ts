// src/relatorio/dto/update-relatorio-material.dto.ts
import { IsEnum, IsString, IsOptional } from 'class-validator';
import { TipoRelatorioMaterial, StatusRelatorioMaterial } from '../entities/relatorio-material.entity';

/**
 * DTO para atualização de um material de relatório
 * 
 * Usado para editar o conteúdo ou status do material.
 */
export class UpdateRelatorioMaterialDto {
  @IsEnum(TipoRelatorioMaterial)
  @IsOptional()
  tipo?: TipoRelatorioMaterial;

  @IsEnum(StatusRelatorioMaterial)
  @IsOptional()
  status?: StatusRelatorioMaterial;

  @IsString()
  @IsOptional()
  conteudo?: string;

  @IsString()
  @IsOptional()
  opiniao?: string;
}