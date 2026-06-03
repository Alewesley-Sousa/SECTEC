import {
  IsUrl,
  IsOptional,
  IsString,
  MaxLength,
  IsInt,
  Min,
  IsBoolean,
  ValidateIf
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadProjectPdfDto {
  /**
   * ID do projeto (int) — corresponde a projetos.id no banco.
   * O Transform converte a string vinda do multipart/form-data para número.
   */
  @ApiProperty({ description: 'ID do projeto (int)', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  projetoId: number;

  /**
   * ID do registro em projeto_materiais tipo='pdf' já criado pelo ProjetosService.
   * O PdfService vai vincular o arquivo físico a este registro existente.
   */
  @ApiProperty({ description: 'ID do registro em projeto_materiais (tipo=pdf)', example: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  materialId: number;

  /**
   * Link do YouTube do projeto (Fase 3 — Submissão de materiais).
   * Deve ser um URL válido do YouTube. Opcional no momento do upload do PDF.
   */
  @ApiPropertyOptional({
    description: 'Link do vídeo no YouTube (Fase 3)',
    example: 'https://www.youtube.com/watch?v=exemplo',
  })
  @IsOptional()
  @IsUrl(
    { host_whitelist: ['youtube.com', 'www.youtube.com', 'youtu.be'] },
    { message: 'O link de vídeo deve ser um URL válido do YouTube.' },
  )
  youtubeUrl?: string;
}

export class GenerateReportDto {
  /**
   * Filtrar projetos por eixo temático (campo tema de temas_orientadores).
   */
  @ApiPropertyOptional({ description: 'Filtrar por tema do orientador', example: 'Tecnologia' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  tema?: string;

  /**
   * Se true, retorna apenas projetos cujo material foi aprovado pelo orientador
   * (projeto_materiais.status = 'aprovado').
   */
  @ApiPropertyOptional({ description: 'Apenas materiais aprovados pelo orientador' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  apenasAprovados?: boolean;

  /**
   * Filtrar por ID do evento (eventos.id).
   */
  @ApiPropertyOptional({ description: 'ID do evento para filtrar', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  eventoId?: number;
}
