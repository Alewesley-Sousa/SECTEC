// src/materiais/dto/avaliar-material.dto.ts
import { IsEnum, IsString, IsNotEmpty, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum DecisaoAvaliacao {
  APROVAR = 'APROVAR',
  RECUSAR = 'RECUSAR',
}

export class AvaliarMaterialDto {
  @ApiProperty({ enum: DecisaoAvaliacao, description: 'Decisão do orientador sobre o material' })
  @IsEnum(DecisaoAvaliacao)
  decisao!: DecisaoAvaliacao;

  @ApiProperty({ description: 'Feedback/Justificativa obrigatória em caso de recusa', required: false })
  @ValidateIf((o) => o.decisao === DecisaoAvaliacao.RECUSAR)
  @IsString()
  @IsNotEmpty({ message: 'A opinião/justificativa é obrigatória ao recusar um material.' })
  opiniao?: string;
}
