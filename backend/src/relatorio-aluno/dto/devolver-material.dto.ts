import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DevolverMaterialDto {
  @ApiProperty({ description: 'Justificativa da devolução', example: 'Áudio inaudível, refaça o vídeo.' })
  @IsString()
  @MinLength(10)
  opiniao: string;
}