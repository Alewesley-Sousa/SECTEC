import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateAuditoriaDto {
  @IsInt()
  @IsPositive()
  usuarioId: number;
  
  @IsInt()
  @IsPositive()
  @IsOptional()
  projetoId?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  acao: string;

  @IsString()
  @IsOptional()
  detalhe?: string;
}
