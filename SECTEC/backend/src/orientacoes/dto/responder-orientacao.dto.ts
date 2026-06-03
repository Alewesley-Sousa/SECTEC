import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { StatusOrientacao } from '../entities/projeto-orientador.entity';

export class ResponderOrientacaoDto {
  @IsEnum([StatusOrientacao.ACEITO, StatusOrientacao.RECUSADO], {
    message: 'Ação deve ser "aceito" ou "recusado"',
  })
  action!: StatusOrientacao.ACEITO | StatusOrientacao.RECUSADO;

  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Informe uma justificativa com pelo menos 3 caracteres.' })
  motivoRecusa?: string;
}
