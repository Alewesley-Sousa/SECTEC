// src/relatorio/dto/update-relatorio-aluno.dto.ts
import { IsInt, IsOptional, IsEnum, Min } from 'class-validator';
import { StatusRelatorio } from '../entities/relatorio-aluno.entity';

/**
 * DTO para atualização de um registro de relatório de aluno
 * 
 * Usado pela coordenação para definir a quantidade de projetos
 * ou alterar o status manualmente.
 */
export class UpdateRelatorioAlunoDto {
  @IsInt()
  @Min(0)
  @IsOptional()
  quantidade_projetos?: number;

  @IsEnum(StatusRelatorio)
  @IsOptional()
  status?: StatusRelatorio;
}