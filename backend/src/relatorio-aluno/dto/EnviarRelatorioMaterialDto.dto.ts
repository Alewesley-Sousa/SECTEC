import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TipoRelatorioMaterial } from '../entities/relatorio-material.entity';

export class EnviarRelatorioMaterialDto {
  @IsEnum(TipoRelatorioMaterial)
  tipo?: TipoRelatorioMaterial;

  @IsString()
  @IsOptional()
  conteudo?: string; // usado para links, ignorado para PDF
}