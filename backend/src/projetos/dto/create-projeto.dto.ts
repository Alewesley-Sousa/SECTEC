import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsNumber, 
  MinLength, 
  IsArray, 
  ArrayMinSize, 
  ArrayMaxSize
} from 'class-validator';

export class CreateProjetoDto {
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsNumber()
  @IsNotEmpty()
  temaId: number; // Alterado para bater com a propriedade da Entity

  @IsString()
  @IsNotEmpty()
  @MinLength(30, { message: 'A descrição deve ter pelo menos 30 caracteres' })
  descricao: string;

  @IsString()
  @IsOptional()
  subTema?: string;

  @IsNumber()
  @IsNotEmpty()
  evento: number;

  @IsArray()
  @IsOptional() // Opcional caso o projeto possa ser individual inicialmente
  @IsNumber({}, { each: true }) // Valida se cada item do array é um número
  @ArrayMinSize(3, { message: 'O projeto deve ter pelo menos 3 alunos na sua equipe.' })
  @ArrayMaxSize(6, { message: 'O projeto deve ter no máximo 6 alunos na sua equipe.' })
  alunosIds?: number[];
}
