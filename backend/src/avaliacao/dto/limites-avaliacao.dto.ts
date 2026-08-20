import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, Min, IsOptional, IsString, IsArray } from 'class-validator';

export class LimitesAvaliacaoDto {
  @ApiProperty({
    description: 'Quantidade mínima de avaliações por projeto',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  minAvaliacoes: number;

  @ApiProperty({
    description: 'Quantidade máxima de projetos por avaliador',
    example: 2,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  maxProjetosPorAvaliador: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  areasPermitidas?: string[];
}