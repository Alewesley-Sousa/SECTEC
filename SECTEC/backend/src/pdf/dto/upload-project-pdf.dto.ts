// src/pdf/dto/upload-project-pdf.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class UploadProjectPdfDto {
  @ApiProperty({ type: 'string', format: 'binary', description: 'Arquivo PDF do projeto' })
  file: any;

  @ApiProperty({ example: '1', description: 'ID do Material associado' })
  materialId: string;

  @ApiProperty({ example: '14', description: 'ID do Projeto real existente' })
  projetoId: string;

  @ApiProperty({ example: '1', description: 'ID do Usuário que está fazendo o upload' })
  uploadedBy: string;
}
