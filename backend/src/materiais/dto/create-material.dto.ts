// src/materiais/dto/create-material.dto.ts
import { IsEnum, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TipoMaterial } from '../entities/projeto-material.entity';

export class CreateMaterialDto {
  @ApiProperty({ 
    description: 'ID do Projeto associado à entrega', 
    example: '1',
    type: String 
  })
  @IsNotEmpty({ message: 'O ID do projeto é obrigatório.' })
  @IsString()
  projetoId: string;

  @ApiProperty({ 
    description: 'Tipo do material sendo entregue (pdf = Banner, pdf_relatorio = Relatório, link = Vídeo)', 
    enum: TipoMaterial,
    example: TipoMaterial.PDF 
  })
  @IsNotEmpty({ message: 'O tipo do material é obrigatório.' })
  @IsEnum(TipoMaterial, { message: 'Tipo de material inválido. Use: pdf, link ou pdf_relatorio.' })
  tipo: TipoMaterial;

  @ApiProperty({ 
    description: 'URL do vídeo (obrigatório se tipo for link) ou uma descrição/resumo breve do arquivo enviado', 
    example: 'https://www.youtube.com/watch?v=exemplo ou Resumo da entrega...',
    required: false 
  })
  @IsOptional()
  @IsString()
  conteudo?: string;

  @ApiProperty({ 
    type: 'string', 
    format: 'binary', 
    description: 'Arquivo físico (obrigatório se o tipo for pdf ou pdf_relatorio)',
    required: false 
  })
  file?: any;
}
