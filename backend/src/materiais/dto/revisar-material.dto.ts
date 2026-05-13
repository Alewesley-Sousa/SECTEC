import { IsEnum, IsString, MinLength } from 'class-validator';
import { StatusMaterial } from '../entities/projeto-material.entity';

export class RevisarMaterialDto {
  @IsEnum([StatusMaterial.APROVADO, StatusMaterial.RECUSADO], {
    message: 'Status deve ser "aprovado" ou "recusado"',
  })
  status!: StatusMaterial.APROVADO | StatusMaterial.RECUSADO;

  @IsString()
  @MinLength(10, { message: 'A opinião deve ter pelo menos 10 caracteres' })
  opiniao!: string;
}
