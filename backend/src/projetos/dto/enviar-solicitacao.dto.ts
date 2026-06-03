import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty, IsInt } from 'class-validator';

export class EnviarSolicitacaoDto {
  @ApiProperty({ 
    description: 'Array com IDs dos professores que você deseja como orientadores',
    example: [51, 52, 53] 
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  orientadoresIds!: number[];
}
