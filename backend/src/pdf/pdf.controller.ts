// src/pdf/pdf.controller.ts
import { Controller, Post, UseInterceptors, UploadedFile, Body, Get, Param, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody, ApiTags, ApiOperation } from '@nestjs/swagger'; // <-- Novos imports
import { PdfService } from './pdf.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UploadProjectPdfDto } from './dto/upload-project-pdf.dto'; // <-- Importa o DTO

@ApiTags('Arquivos do Projeto') // Organiza o Swagger em uma seção elegante
@Controller('files')
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Post('upload-pdf')
  @ApiOperation({ summary: 'Realiza o upload do PDF de um projeto para o Google Drive' })
  @ApiConsumes('multipart/form-data') // Informa ao Swagger o tipo de requisição
  @ApiBody({ type: UploadProjectPdfDto }) // Força o Swagger a mostrar APENAS estes campos
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './tmp',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async uploadRealPdf(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadProjectPdfDto, // Usando a tipagem do DTO aqui
  ) {
    return await this.pdfService.uploadExistingProjectPdf(file, {
      materialId: Number(body.materialId),
      projetoId: Number(body.projetoId),
      uploadedBy: Number(body.uploadedBy),
    });
  }
  
  @Get('download/projeto/:projetoId/material/:materialId')
  @ApiOperation({ summary: 'Baixa o PDF de um projeto baseado no ID do projeto e material' })
  async downloadPdf(
    @Param('projetoId') projetoId: string,
    @Param('materialId') materialId: string,
    @Res() res: any,
  ) {
    const fileData = await this.pdfService.downloadProjectPdf(
      Number(projetoId),
      Number(materialId),
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(fileData.originalName)}"`,
    });

    fileData.stream.pipe(res);
  }
}
