// src/relatorio/dto/create-relatorio-aluno.dto.ts
import { IsInt, IsOptional, IsEnum, IsDate, Min, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { StatusRelatorio } from '../entities/relatorio-aluno.entity';

/**
 * DTO para criação de um novo registro de relatório de aluno
 * 
 * Usado quando o sistema ativa automaticamente um aluno na modalidade relatório
 * ou quando a coordenação cria manualmente.
 */
export class CreateRelatorioAlunoDto {
  @IsInt()
  @IsNotEmpty()
  aluno_id!: number;

  @IsInt()
  @IsNotEmpty()
  evento_id!: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  quantidade_projetos?: number = 0;

  @IsEnum(StatusRelatorio)
  @IsOptional()
  status?: StatusRelatorio = StatusRelatorio.PENDENTE;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  data_ativacao?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  data_envio?: Date;
}