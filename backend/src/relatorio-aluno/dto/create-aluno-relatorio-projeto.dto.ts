// src/relatorio/dto/create-aluno-relatorio-projeto.dto.ts
import { IsInt, IsBoolean, IsDate, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para criação de uma atribuição de projeto a um aluno em modalidade relatório
 * 
 * Usado pelo serviço de distribuição ao vincular projetos a alunos.
 */
export class CreateAlunoRelatorioProjetoDto {
  @IsInt()
  @IsNotEmpty()
  aluno_relatorio_id!: number;

  @IsInt()
  @IsNotEmpty()
  projeto_id!: number;

  @IsBoolean()
  @IsNotEmpty()
  visualizado!: boolean;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  data_atribuicao!: Date;
}