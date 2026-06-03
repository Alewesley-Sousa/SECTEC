import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Email inválido.' })
  @IsNotEmpty()
  email: string;
}