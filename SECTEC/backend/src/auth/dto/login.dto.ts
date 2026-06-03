// src/auth/dto/login.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'aluno@sectec.com', description: 'E-mail do usuário' })
  email!: string;

  @ApiProperty({ example: '123456', description: 'Senha de acesso' })
  password!: string;
}
  