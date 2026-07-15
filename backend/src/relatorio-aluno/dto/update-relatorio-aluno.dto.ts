// dto/update-relatorio-aluno.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { StatusRelatorio } from '../entities/relatorio-aluno.entity';

export class UpdateRelatorioAlunoDto {
  @ApiProperty({
    description: 'Quantidade de projetos que o aluno deve receber',
    example: 3,
    minimum: 0,
    maximum: 10,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  quantidade_projetos?: number;

  @ApiProperty({
    description: 'Status do aluno na modalidade relatório',
    enum: StatusRelatorio,
    example: StatusRelatorio.DISTRIBUIDO,
    required: false,
  })
  @IsOptional()
  @IsEnum(StatusRelatorio)
  status?: StatusRelatorio;
}