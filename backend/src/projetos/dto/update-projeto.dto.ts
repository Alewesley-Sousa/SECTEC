import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateProjetoDto {
  @IsOptional() @IsString() @IsNotEmpty() titulo?: string;
  @IsOptional() @IsString() @MinLength(30) descricao?: string;
  @IsOptional() @IsInt() areaId?: number;
  @IsOptional() @IsInt() evento?: number;
  @IsOptional() @IsArray() @IsInt({ each: true }) alunosIds?: number[];
}
