import { IsInt, Min } from 'class-validator';

export class GerenciarOrientadorProjetoDto {
  @IsInt()
  @Min(1)
  orientadorId!: number;
}
