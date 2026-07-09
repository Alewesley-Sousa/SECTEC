// src/relatorio/dto/listar-relatorio-aluno.dto.ts
import { IsOptional, IsEnum, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { StatusRelatorio } from '../entities/relatorio-aluno.entity';

export class ListarRelatorioAlunoDto {
  @IsEnum(StatusRelatorio)
  @IsOptional()
  status?: StatusRelatorio;

  @IsString()
  @IsOptional()
  nome?: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 10;
}