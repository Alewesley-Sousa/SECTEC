import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PdfController } from './pdf.controller';
import { PdfService } from './pdf.service';
import { GoogleDriveService } from './google-drive.service';
import { ProjectFile } from './entities/project-file.entity';
import { Projeto } from '../projetos/entities/projeto.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectFile, Projeto]),
  ],
  controllers: [PdfController],
  providers: [PdfService, GoogleDriveService],
  exports: [PdfService],
})
export class PdfModule {}
