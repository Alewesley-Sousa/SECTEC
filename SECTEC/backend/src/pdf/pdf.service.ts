// src/pdf/pdf.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { extname } from 'path';

import { Projeto } from '../projetos/entities/projeto.entity';
import { GoogleDriveService } from './google-drive.service';
import { ProjectFile, FileStatus } from './entities/project-file.entity';

@Injectable()
export class PdfService {
  constructor(
    @InjectRepository(ProjectFile)
    public readonly projectFileRepository: Repository<ProjectFile>,

    @InjectRepository(Projeto)
    private readonly projetoRepository: Repository<Projeto>,

    private readonly googleDriveService: GoogleDriveService,
  ) {}

  // =========================================================================
  // GESTÃO DE UPLOAD (MÉTODOS CORE)
  // =========================================================================

  /**
   * Realiza o upload do PDF de um projeto existente para o Google Drive.
   * Renomeia o arquivo seguindo o padrão institucional (ANO-MES-TITULO-ID.pdf),
   * calcula o hash SHA-256 de segurança e limpa o armazenamento local após o término.
   */
  async uploadExistingProjectPdf(
    file: Express.Multer.File,
    dto: { materialId: number; projetoId: number; uploadedBy: number }
  ): Promise<ProjectFile> {
    const filePath = file.path;
    const fileSizeBytes = file.size;
    const originalName = file.originalname;

    try {
      // 1. Valida a existência do projeto antes de qualquer operação pesada
      const projeto = await this.projetoRepository.findOne({ where: { id: dto.projetoId } });
      if (!projeto) {
        throw new NotFoundException(`Projeto com ID ${dto.projetoId} nao foi encontrado.`);
      }

      // 2. Formata a data atual para compor o nome padrão
      const hoje = new Date();
      const ano = hoje.getFullYear();
      const mes = String(hoje.getMonth() + 1).padStart(2, '0');

      // 3. Sanitiza o título do projeto removendo espaços extras
      const tituloProjetoClean = projeto.titulo.replace(/\s+/g, '-');
      const extensao = extname(originalName);
      const novoNomeDrive = `${ano}-${mes}-${tituloProjetoClean}-${dto.projetoId}${extensao}`;

      // 4. Calcula o Checksum de integridade do arquivo
      const checksumSha256 = await this.calculateFileHash(filePath);

      // 5. Registra o arquivo inicialmente com status PENDENTE
      const projectFile = this.projectFileRepository.create({
        materialId: dto.materialId,
        projetoId: dto.projetoId,
        uploadedBy: dto.uploadedBy,
        originalName: originalName,
        driveFolderId: process.env.GOOGLE_DRIVE_FOLDER_ID || '',
        fileSizeBytes: fileSizeBytes,
        checksumSha256: checksumSha256,
        status: FileStatus.PENDING,
        version: 1,
      });

      const savedFile = await this.projectFileRepository.save(projectFile);

      // 6. Transmite o arquivo para o Google Drive via Stream
      try {
        const fileStream = fs.createReadStream(filePath);
        const driveResponse = await this.googleDriveService.uploadFile(
          novoNomeDrive,
          fileStream,
          file.mimetype,
          savedFile.driveFolderId
        );

        savedFile.driveFileId = driveResponse.id || null;
        savedFile.driveWebViewLink = driveResponse.webViewLink || null;
        savedFile.status = FileStatus.VALID;

        return await this.projectFileRepository.save(savedFile);
      } catch (uploadError) {
        // Marca o arquivo como corrompido/falho no banco caso o Drive rejeite
        savedFile.status = FileStatus.CORRUPTED;
        await this.projectFileRepository.save(savedFile);
        throw new Error(`Falha ao enviar para o Drive: ${uploadError.message}`);
      }
    } finally {
      // 7. Garante que o arquivo temporário local será apagado, protegendo o storage do ambiente
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }

  /**
   * Substitui o binário de um arquivo existente mantendo o mesmo ID do Google Drive.
   * Alinha metadados locais, recalcula hash de integridade e atualiza a versão da entrega.
   */
  // src/pdf/pdf.service.ts

  /**
   * Substitui o binário de um arquivo existente mantendo o mesmo ID do Google Drive.
   * Alinha metadados locais, recalcula hash de integridade e atualiza a versão da entrega.
   */
  async substituirProjectPdf(
    file: Express.Multer.File,
    dto: { materialId: number; projetoId: number; uploadedBy: number },
    projeto: Projeto, // <- ADICIONE O OBJETO PROJETO COMO PARÂMETRO AQUI
  ): Promise<ProjectFile> {
    const filePath = file.path;
    const fileSizeBytes = file.size;
    const originalName = file.originalname;

    // 1. Busca o registro do arquivo anterior independente do status para reaproveitar o ID do Drive
    const arquivoAntigo = await this.projectFileRepository.findOne({
      where: {
        projetoId: dto.projetoId,
        materialId: dto.materialId,
      },
      order: { criadoEm: 'DESC' },
    });

    if (!arquivoAntigo || !arquivoAntigo.driveFileId) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      throw new NotFoundException(
        `Não foi encontrado nenhum arquivo anterior válido no banco para substituir neste material.`,
      );
    }

    try {
      // 2. Removemos a query repetida e usamos o objeto projeto limpo que veio por parâmetro
      const hoje = new Date();
      const ano = hoje.getFullYear();
      const mes = String(hoje.getMonth() + 1).padStart(2, '0');
      const tituloProjetoClean = projeto.titulo ? projeto.titulo.replace(/\s+/g, '-') : 'projeto';
      const extensao = extname(originalName);
      const novoNomeDrive = `${ano}-${mes}-${tituloProjetoClean}-${dto.projetoId}${extensao}`;

      // 3. Calcula o novo Checksum de integridade
      const novoChecksum = await this.calculateFileHash(filePath);

      // 4. Prepara a stream do novo arquivo temporário
      const fileStream = fs.createReadStream(filePath);

      // 5. Atualiza o arquivo diretamente no Google Drive
      await this.googleDriveService.updateFile(
        arquivoAntigo.driveFileId,
        novoNomeDrive,
        fileStream,
        file.mimetype
      );

      // 6. Atualiza os dados do registro no seu banco de dados local
      await this.projectFileRepository.update(arquivoAntigo.id, {
        originalName: originalName,
        fileSizeBytes: fileSizeBytes,
        checksumSha256: novoChecksum,
        uploadedBy: dto.uploadedBy,
        version: (arquivoAntigo.version || 1) + 1,
        status: FileStatus.VALID
      });

      // Busca o registro atualizado para retornar no fluxo correto
      const arquivoAtualizado = await this.projectFileRepository.findOne({
        where: { id: arquivoAntigo.id }
      });

      return arquivoAtualizado!;

} catch (error) {
  // Executa um update cirúrgico apenas no status, ignorando validações de colunas ausentes no objeto
  await this.projectFileRepository.update(arquivoAntigo.id, { 
    status: FileStatus.CORRUPTED 
  });
  
  throw new BadRequestException(`Erro interno no fluxo de substituição: ${error.message}`);
}
 finally {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }


  // =========================================================================
  // GESTÃO DE DOWNLOAD e CONSULTA (READ)
  // =========================================================================

  /**
   * Localiza o registro do PDF válido mais recente no banco de dados 
   * e retorna o stream de download vindo diretamente do Google Drive.
   */
  async downloadProjectPdf(projetoId: number, materialId: number) {
    const projectFile = await this.projectFileRepository.findOne({
      where: {
        projetoId: projetoId,
        materialId: materialId,
        status: FileStatus.VALID,
      },
      order: { criadoEm: 'DESC' },
    });

    if (!projectFile || !projectFile.driveFileId) {
      throw new NotFoundException(
        `Nenhum PDF valido foi encontrado para o projeto ID ${projetoId} e material ID ${materialId}.`,
      );
    }

    const fileStream = await this.googleDriveService.downloadFileStream(projectFile.driveFileId);

    return {
      stream: fileStream,
      originalName: projectFile.originalName,
    };
  }

  // =========================================================================
  // UTILITÁRIOS PRIVADOS (HELPERS)
  // =========================================================================

  private calculateFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);

      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', (err) => reject(err));
    });
  }
}
