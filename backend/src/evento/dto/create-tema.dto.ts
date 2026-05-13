import { IsString, IsNotEmpty, MaxLength, IsArray, ArrayMinSize } from 'class-validator';

export class CreateTemasDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Forneça pelo menos um eixo temático.' })
  @IsString({ each: true, message: 'Cada tema deve ser uma string.' })
  @MaxLength(255, { each: true })
  nomes: string[];
}
