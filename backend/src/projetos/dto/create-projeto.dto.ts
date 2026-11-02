import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsNumber, 
  IsInt,
  MinLength, 
  IsArray, 
  ArrayMinSize, 
  ArrayMaxSize
} from 'class-validator';

export class CreateProjetoDto {
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsInt()
  @IsNotEmpty()
  areaId: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(30, { message: 'A descrição deve ter pelo menos 30 caracteres' })
  descricao: string;

  @IsNumber()
@IsOptional()
  evento?: number;

  @IsArray()
  @IsOptional() // Opcional caso o projeto possa ser individual inicialmente
  @IsNumber({}, { each: true }) // Valida se cada item do array é um número
  @ArrayMinSize(2, { message: 'O projeto deve ter pelo menos 3 alunos contando com o autor.' })
  @ArrayMaxSize(6, { message: 'O projeto deve ter no máximo 6 alunos na sua equipe.' })
  alunosIds?: number[];
}
