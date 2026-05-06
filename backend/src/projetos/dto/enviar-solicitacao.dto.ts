import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';

export class EnviarSolicitacaoDto {
  @ApiProperty({ 
    description: 'ID do professor que você deseja como orientador',
    example: 1 
  })
  @IsInt({ message: 'O ID do orientador deve ser um número inteiro.' })
  @IsNotEmpty({ message: 'O ID do orientador é obrigatório.' })
  orientadorId!: number;
}
