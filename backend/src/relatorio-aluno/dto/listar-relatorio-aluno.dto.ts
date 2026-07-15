// dto/listar-relatorio-aluno.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsInt, Min } from 'class-validator';
import { StatusRelatorio } from '../entities/relatorio-aluno.entity';
import { Type } from 'class-transformer';

export class ListarRelatorioAlunoDto {
  @ApiProperty({
    description: 'Filtro por status do relatório',
    enum: StatusRelatorio,
    required: false,
    example: StatusRelatorio.PENDENTE,
  })
  @IsOptional()
  @IsEnum(StatusRelatorio)
  status?: StatusRelatorio;

  @ApiProperty({
    description: 'Filtro por nome do aluno',
    required: false,
    example: 'João',
  })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiProperty({
    description: 'Número da página para paginação',
    required: false,
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Quantidade de itens por página',
    required: false,
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}