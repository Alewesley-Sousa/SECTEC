// src/projetos/dto/gerar-pdf.dto.ts
import { IsIn, IsOptional, IsArray, IsInt, IsString } from 'class-validator';

export class GerarPdfDto {
  @IsIn(['individual', 'filtro'])
  modo!: 'individual' | 'filtro';

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  projetos?: number[];

  @IsOptional()
  @IsString()
  turma?: string;
}