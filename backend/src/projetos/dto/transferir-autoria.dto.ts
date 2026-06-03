import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt } from 'class-validator';

export class TransferirAutoriaDto {
  @ApiProperty({
    description: 'ID do integrante da equipe que assumirá a autoria do projeto',
    example: 42,
  })
  @IsInt()
  novoAutorId!: number;

  @ApiProperty({
    description:
      'Define o que acontece com o autor atual. ' +
      'true = autor atual vira integrante comum; ' +
      'false = autor atual é removido da equipe',
    example: true,
  })
  @IsBoolean()
  manterAutorAtual!: boolean;
}
