import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'usuario@fatec.sp.gov.br' })
  email_institucional!: string;

  @ApiProperty({ example: 'senha123' })
  senha!: string;
}