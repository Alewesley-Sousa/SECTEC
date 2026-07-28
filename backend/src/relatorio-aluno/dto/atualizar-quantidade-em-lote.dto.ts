// dto/atualizar-quantidade-em-lote.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsArray, ArrayMinSize, Min, Max, ValidateIf } from 'class-validator';

export class AtualizarQuantidadeEmLoteDto {
  @ApiProperty({
    description: 'Quantidade de projetos a ser definida para os alunos',
    example: 2,
    minimum: 0,
    maximum: 10,
  })
  @IsInt()
  @Min(0)
  @Max(10)
  quantidade_projetos: number;

  @ApiProperty({
    description: 'Se true, aplica para todos os alunos da modalidade; se false, aplica apenas para os IDs informados',
    example: false,
  })
  @IsBoolean()
  geral: boolean;

  @ApiProperty({
    description: 'Lista de IDs dos relatórios (relatorio_aluno.id) a serem atualizados (obrigatório se geral = false)',
    example: [1, 2, 3],
    required: false,
    type: [Number],
  })
  @IsOptional()
  @ValidateIf(o => o.geral === false)
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  ids?: number[];

  @ApiProperty({
    description: 'permite forçar a redução da quantidade de projetos para os alunos, mesmo que eles já tenham projetos atribuídos. Se false, não será possível reduzir a quantidade de projetos se o aluno já tiver projetos atribuídos.',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  forcarReducao?: boolean;
}