import { 
  IsString, 
  IsOptional, 
  IsDateString, 
  IsNotEmpty, 
  IsNumber, 
  MaxLength 
} from 'class-validator';

export class CreateEventoDto {
  @IsString()
  @IsNotEmpty({ message: 'O título do evento é obrigatório' })
  @MaxLength(255)
  titulo: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsNumber()
  @IsOptional()
  coordenadorId?: number;

  @IsDateString({}, { message: 'A data inicial deve ser uma data válida (ISO8601)' })
  @IsNotEmpty()
  prazoInicial: string; // Recebemos como string (JSON) e o Nest/TypeORM lida com o Date

  @IsDateString({}, { message: 'A data final deve ser uma data válida (ISO8601)' })
  @IsNotEmpty()
  prazoFinal: string;
}
