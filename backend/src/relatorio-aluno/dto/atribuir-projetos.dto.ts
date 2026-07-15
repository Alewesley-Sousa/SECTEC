// src/relatorio/dto/atribuir-projetos.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsNotEmpty, ArrayMinSize, IsDefined } from 'class-validator';

export class AtribuirProjetosDto {
  @ApiProperty({
    description: 'Array de IDs dos projetos a serem atribuídos',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsDefined({ message: 'O campo projetosIds é obrigatório.' })
  @IsArray({ message: 'projetosIds deve ser um array.' })
  @IsNotEmpty({ message: 'projetosIds não pode estar vazio.' })
  @ArrayMinSize(1, { message: 'projetosIds deve ter pelo menos 1 item.' })
  @IsInt({ each: true, message: 'Cada ID de projeto deve ser um número inteiro.' })
  projetosIds: number[];
}