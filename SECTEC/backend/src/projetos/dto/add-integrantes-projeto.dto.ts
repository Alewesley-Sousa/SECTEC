import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsInt } from 'class-validator';

export class AddIntegrantesProjetoDto {
  @ApiProperty({
    description: 'IDs dos alunos que serão adicionados como integrantes do projeto',
    example: [12, 18],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  alunosIds!: number[];
}
