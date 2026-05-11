import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import * as fs from 'fs';

import { ProjectFile, FileStatus } from './entities/project-file.entity';

/**
 * Assinatura magic bytes de todo arquivo PDF válido: "%PDF-"
 * Impede uploads de arquivos com extensão .pdf mas conteúdo diferente (exe, zip, etc).
 */
const PDF_MAGIC_BYTES = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d]);

@Injectable()
export class PdfIntegrityService {
  private readonly logger = new Logger(PdfIntegrityService.name);

  constructor(
    @InjectRepository(ProjectFile)
    private readonly fileRepo: Repository<ProjectFile>,
  ) {}

  /**
   * Gera o hash SHA-256 de um arquivo via stream.
   * Não carrega o arquivo inteiro na memória — seguro para arquivos grandes.
   */
  async generateChecksum(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash   = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);

      stream.on('data',  (chunk) => hash.update(chunk));
      stream.on('end',   ()      => resolve(hash.digest('hex')));
      stream.on('error', (err)   => {
        this.logger.error(`Erro ao gerar checksum: ${filePath}`, err.stack);
        reject(err);
      });
    });
  }

  /**
   * Lê os primeiros 5 bytes do arquivo e compara com %PDF-.
   * Detecta arquivos falsos renomeados para .pdf.
   */
  async validatePdfMagicBytes(filePath: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(filePath, { start: 0, end: 4 });
      const chunks: Buffer[] = [];

      stream.on('data',  (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on('end',   ()      => resolve(Buffer.concat(chunks).equals(PDF_MAGIC_BYTES)));
      stream.on('error', reject);
    });
  }

  /**
   * Verifica integridade de um arquivo recalculando o SHA-256 e comparando
   * com o checksum salvo em project_files na hora do upload.
   * Atualiza o campo status no banco conforme o resultado.
   *
   * @param fileId  project_files.id (int)
   */
  async verifyFileIntegrity(fileId: number): Promise<{
    isValid: boolean;
    storedChecksum: string;
    currentChecksum: string;
    status: FileStatus;
  }> {
    const record = await this.fileRepo.findOne({ where: { id: fileId } });
    if (!record) {
      throw new BadRequestException(
        `Registro de integridade não encontrado: project_files.id = ${fileId}`,
      );
    }

    let currentChecksum: string;
    let isValid: boolean;
    let status: FileStatus;

    try {
      if (!fs.existsSync(record.filePath)) {
        this.logger.warn(`Arquivo ausente no disco: ${record.filePath}`);
        currentChecksum = 'FILE_NOT_FOUND';
        isValid = false;
        status  = FileStatus.CORRUPTED;
      } else {
        currentChecksum = await this.generateChecksum(record.filePath);
        isValid = currentChecksum === record.checksumSha256;
        status  = isValid ? FileStatus.VALID : FileStatus.CORRUPTED;
      }
    } catch (error) {
      this.logger.error(`Falha na leitura do arquivo [id=${fileId}]`, error.stack);
      currentChecksum = 'READ_ERROR';
      isValid = false;
      status  = FileStatus.CORRUPTED;
    }

    // Persiste o novo status no banco
    await this.fileRepo.update(fileId, { status });

    this.logger.log(
      `Integridade [id=${fileId}] projeto_id=${record.projetoId}: ` +
      `${isValid ? '✅ VÁLIDO' : '❌ CORROMPIDO'} | ` +
      `salvo: ${record.checksumSha256.slice(0, 16)}... | ` +
      `atual: ${currentChecksum.slice(0, 16)}...`,
    );

    return { isValid, storedChecksum: record.checksumSha256, currentChecksum, status };
  }

  /**
   * Verifica todos os arquivos com status VALID em lote.
   * Executado pelo cron job diário às 02:00.
   * Detecta corrupções e arquivos removidos do disco após o upload.
   */
  async runBatchIntegrityCheck(): Promise<{
    total: number;
    valid: number;
    corrupted: number;
    missing: number;
  }> {
    const files = await this.fileRepo.find({ where: { status: FileStatus.VALID } });

    let valid = 0, corrupted = 0, missing = 0;

    for (const file of files) {
      const result = await this.verifyFileIntegrity(file.id);
      if (result.currentChecksum === 'FILE_NOT_FOUND') missing++;
      else if (result.isValid) valid++;
      else corrupted++;
    }

    this.logger.log(
      `Batch check: total=${files.length} | ✅ ${valid} | ❌ ${corrupted} | 🔍 ${missing} ausentes`,
    );

    return { total: files.length, valid, corrupted, missing };
  }

  /**
   * Remove um arquivo do disco com segurança (verifica existência antes).
   */
  async deletePhysicalFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.logger.log(`Arquivo removido do disco: ${filePath}`);
      }
    } catch (error) {
      this.logger.error(`Erro ao remover arquivo: ${filePath}`, error.stack);
    }
  }
}
