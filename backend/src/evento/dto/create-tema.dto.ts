import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateTemaDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome do eixo temático não pode estar vazio' })
  @MaxLength(255)
  nome: string;
}
