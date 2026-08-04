import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BannersDownloadController } from './banners-download.controller';
import { BannersDownloadService } from './banners-download.service';
import { Projeto } from '../projetos/entities/projeto.entity';
import { ProjetoMaterial } from '../materiais/entities/projeto-material.entity';
import { ProjectFile } from '../pdf/entities/project-file.entity';
import { PdfModule } from '../pdf/pdf.module'; // assume que exporta GoogleDriveService

@Module({
  imports: [
    TypeOrmModule.forFeature([Projeto, ProjetoMaterial, ProjectFile]),
    PdfModule, // ou GoogleDriveModule, conforme sua estrutura
  ],
  controllers: [BannersDownloadController],
  providers: [BannersDownloadService],
})
export class BannersDownloadModule {}