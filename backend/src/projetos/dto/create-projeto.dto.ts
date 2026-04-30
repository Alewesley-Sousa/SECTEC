import { IsString, IsNotEmpty, IsOptional, IsNumber, MinLength } from 'class-validator';

export class CreateProjetoDto {
@IsString()
@IsNotEmpty()
titulo: string;

@IsString()
@IsOptional()
tema?: string;

@IsString()
@IsNotEmpty()
@MinLength(30, { message: 'A descrição deve ter pelo menos 30 caracteres' })
descricao: string;

@IsString()
@IsOptional()
subTema?: string;

// Recebe o ID do evento ao qual o projeto pertence
@IsNumber()
@IsNotEmpty()
evento: number;

// Recebe o ID do aluno autor
@IsNumber()
@IsNotEmpty()
alunoAutor: number;
}