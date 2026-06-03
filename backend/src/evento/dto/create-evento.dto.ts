import { 
  IsString, 
  IsOptional, 
  IsDateString, 
  IsNotEmpty, 
  IsNumber, 
  MaxLength,
  ValidateNested,
  IsDefined
} from 'class-validator';
import { Type } from 'class-transformer';

// DTO Auxiliar para o Período
class PeriodoDto {
  @IsDateString({}, { message: 'A data de início deve ser uma data válida' })
  @IsOptional()
  inicio?: string;

  @IsDateString({}, { message: 'A data de fim deve ser uma data válida' })
  @IsOptional()
  fim?: string;
}

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

  // --- Novos Prazos Estruturados ---

  @IsOptional()
  @ValidateNested()
  @Type(() => PeriodoDto)
  inscricao?: PeriodoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PeriodoDto)
  submissao?: PeriodoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PeriodoDto)
  avaliacao?: PeriodoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PeriodoDto)
  aceitacao?: PeriodoDto;

  // --- Datas Gerais do Evento ---

  @IsDateString({}, { message: 'A data inicial deve ser uma data válida (ISO8601)' })
  @IsNotEmpty()
  prazoInicial: string;

  @IsDateString({}, { message: 'A data final deve ser uma data válida (ISO8601)' })
  @IsNotEmpty()
  prazoFinal: string;
}
