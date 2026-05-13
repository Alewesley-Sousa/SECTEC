import { IsEnum } from 'class-validator';
import { StatusOrientacao } from '../entities/projeto-orientador.entity';

export class ResponderOrientacaoDto {
  @IsEnum([StatusOrientacao.ACEITO, StatusOrientacao.RECUSADO], {
    message: 'Ação deve ser "aceito" ou "recusado"',
  })
  action!: StatusOrientacao.ACEITO | StatusOrientacao.RECUSADO;
}
