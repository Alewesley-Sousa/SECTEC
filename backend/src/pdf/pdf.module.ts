import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';

import { PdfController } from './pdf.controller';
import { PdfService } from './pdf.service';
import { PdfIntegrityService } from './pdf-integrity.service';
import { PdfIntegrityCron } from './pdf-integrity.cron';
import { PdfReportService } from './pdf-report.service';
import { ProjectFile } from './entities/project-file.entity';
import { ProjetosModule } from '../projetos/projetos.module';

@Module({
  imports: [
    // Entidade desta feature — cria o repositório ProjectFile para injeção
    TypeOrmModule.forFeature([ProjectFile]),

    /**
     * ProjetosModule exporta o ProjetosService, que é usado pelo PdfController
     * para verificar se o orientador aceitou o projeto antes de liberar o upload.
     * Certifique-se de adicionar `exports: [ProjetosService]` em projetos.module.ts.
     */
    ProjetosModule,

    // Configuração do Multer para receber o PDF via multipart/form-data
    MulterModule.register({
      storage: diskStorage({
        // Pasta onde os PDFs são salvos fisicamente
        // Valor padrão: ./uploads/pdfs (criada pelo setup-pdf-module.sh)
        destination: process.env.UPLOAD_PATH
          ? join(process.cwd(), process.env.UPLOAD_PATH)
          : join(process.cwd(), 'uploads', 'pdfs'),

        // Nome único em disco para evitar colisões entre projetos
        filename: (_req, file, callback) => {
          const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
          callback(null, uniqueName);
        },
      }),

      // Primeira barreira: rejeita na entrada se o MIME não for PDF
      // Segunda barreira (no service): valida magic bytes %PDF-
      fileFilter: (_req, file, callback) => {
        if (file.mimetype !== 'application/pdf') {
          return callback(
            new Error('Apenas arquivos PDF são permitidos. Tipo recebido: ' + file.mimetype),
            false,
          );
        }
        callback(null, true);
      },

      limits: {
        // 10MB padrão — configurável via MAX_PDF_SIZE_BYTES no .env
        fileSize: Number(process.env.MAX_PDF_SIZE_BYTES) || 10 * 1024 * 1024,
      },
    }),
  ],
  controllers: [PdfController],
  providers: [
    PdfService,
    PdfIntegrityService,
    PdfReportService,
    PdfIntegrityCron, // cron job diário de verificação de integridade às 02:00
  ],
  exports: [PdfService, PdfIntegrityService, PdfReportService],
})
export class PdfModule {}
