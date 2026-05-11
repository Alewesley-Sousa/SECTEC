import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as path from 'path';

import { ProjectFile, FileStatus } from './entities/project-file.entity';
import { PdfIntegrityService } from './pdf-integrity.service';
import { UploadProjectPdfDto } from './dto/pdf.dto';

/**
 * Status de projeto_orientador que liberam o upload de materiais (Fase 3).
 * O orientador precisa ter aceitado (status='aceito') antes do aluno poder subir o PDF.
 * Esses valores correspondem ao enum do campo status em projeto_orientador.
 */
const STATUS_ORIENTADOR_ACEITO = 'aceito';

/**
 * Status de projeto_materiais que indica aprovação pelo orientador.
 * Corresponde ao enum('em_analise','aprovado','recusado') de projeto_materiais.status.
 */
export const STATUS_MATERIAL = {
  EM_ANALISE: 'em_analise',
  APROVADO:   'aprovado',
  RECUSADO:   'recusado',
} as const;

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  constructor(
    @InjectRepository(ProjectFile)
    private readonly fileRepo: Repository<ProjectFile>,
    private readonly integrityService: PdfIntegrityService,
  ) {}

  /**
   * Realiza o upload e registro do PDF do projeto.
   *
   * Regras de negócio aplicadas (conforme banco e documentação):
   * ─ Upload só é permitido se o orientador aceitou (projeto_orientador.status = 'aceito')
   * ─ Validação de magic bytes anti-spoofing (%PDF-)
   * ─ Geração de checksum SHA-256 via stream
   * ─ Apenas 1 registro VALID por projeto; versão anterior é arquivada
   * ─ O registro em projeto_materiais (tipo='pdf') já deve existir, criado pelo ProjetosService
   *
   * @param file           Arquivo recebido pelo Multer
   * @param dto            DTO com projetoId, materialId e youtubeUrl opcional
   * @param uploadedBy     ID do usuário aluno (usuarios.id) vindo do JWT
   * @param orientadorAceito  true se projeto_orientador.status = 'aceito' para este projeto
   */
  async uploadProjectPdf(
    file: Express.Multer.File,
    dto: UploadProjectPdfDto,
    uploadedBy: number,
    orientadorAceito: boolean,
  ): Promise<ProjectFile> {

    // 1. Verifica se o orientador já aceitou o projeto (libera Fase 3)
    if (!orientadorAceito) {
      await this.integrityService.deletePhysicalFile(file.path);
      throw new ForbiddenException(
        'O upload de materiais só é liberado após o orientador aceitar o projeto. ' +
        'Verifique o status de orientação em projeto_orientador.',
      );
    }

    // 2. Valida magic bytes — impede arquivos .exe/.zip renomeados para .pdf
    const isRealPdf = await this.integrityService.validatePdfMagicBytes(file.path);
    if (!isRealPdf) {
      await this.integrityService.deletePhysicalFile(file.path);
      throw new BadRequestException(
        'O arquivo enviado não é um PDF válido. ' +
        'Apenas arquivos PDF reais são aceitos (verificação de assinatura de bytes).',
      );
    }

    // 3. Gera checksum SHA-256 via stream (sem carregar o arquivo inteiro na memória)
    const checksum = await this.integrityService.generateChecksum(file.path);

    // 4. Verifica se já existe um registro de integridade para este projeto
    //    (aluno resubmetendo o PDF — permitido enquanto em Fase 3)
    const existing = await this.fileRepo.findOne({
      where: { projetoId: dto.projetoId, status: FileStatus.VALID },
      order: { version: 'DESC' },
    });

    let newVersion = 1;

    if (existing) {
      // Remove o arquivo físico anterior do disco
      await this.integrityService.deletePhysicalFile(existing.filePath);

      // Marca o registro anterior como substituído
      await this.fileRepo.update(existing.id, { status: FileStatus.CORRUPTED });

      newVersion = existing.version + 1;
      this.logger.log(
        `PDF anterior substituído | projeto_id: ${dto.projetoId} | ` +
        `material_id: ${existing.materialId} | Nova versão: ${newVersion}`,
      );
    }

    // 5. Cria o novo registro de integridade vinculado ao projeto_materiais existente
    const newFile = this.fileRepo.create({
      materialId:      dto.materialId,   // FK → projeto_materiais.id (tipo='pdf')
      projetoId:       dto.projetoId,    // FK → projetos.id
      uploadedBy,                        // FK → usuarios.id
      originalName:    file.originalname,
      storedName:      path.basename(file.path),
      filePath:        file.path,
      checksumSha256:  checksum,
      fileSizeBytes:   file.size,
      status:          FileStatus.VALID,
      version:         newVersion,
    });

    const saved = await this.fileRepo.save(newFile);

    this.logger.log(
      `PDF registrado | projeto_id: ${dto.projetoId} | material_id: ${dto.materialId} | ` +
      `file_id: ${saved.id} | checksum: ${checksum.slice(0, 16)}... | versão: ${newVersion}`,
    );

    return saved;
  }

  /**
   * Retorna o registro de integridade do PDF mais recente de um projeto.
   * Usa projetos.id (int) para buscar — não UUID.
   */
  async getProjectPdf(projetoId: number): Promise<ProjectFile> {
    const file = await this.fileRepo.findOne({
      where: { projetoId, status: FileStatus.VALID },
      order: { version: 'DESC' },
    });

    if (!file) {
      throw new NotFoundException(
        `Nenhum PDF válido encontrado para o projeto ${projetoId}. ` +
        `Verifique se o upload foi realizado e o status em project_files.`,
      );
    }

    return file;
  }

  /**
   * Retorna o caminho físico do arquivo para download via stream.
   * Verifica integridade antes de servir — recusa arquivo corrompido.
   */
  async getFilePath(fileId: number): Promise<string> {
    const result = await this.integrityService.verifyFileIntegrity(fileId);

    if (!result.isValid) {
      throw new ConflictException(
        'O arquivo está corrompido ou foi adulterado após o upload. ' +
        'Entre em contato com a coordenação para regularização.',
      );
    }

    const file = await this.fileRepo.findOne({ where: { id: fileId } });
    return file!.filePath;
  }

  /**
   * Remove o PDF de um projeto (ação restrita à coordenação — RF06 Auditoria).
   * Deleta o arquivo físico e o registro de integridade.
   * NOTA: o registro em projeto_materiais deve ser tratado pelo ProjetosService.
   */
  async deleteProjectPdf(projetoId: number): Promise<void> {
    const file = await this.fileRepo.findOne({
      where: { projetoId, status: FileStatus.VALID },
    });

    if (!file) {
      throw new NotFoundException(
        `PDF não encontrado para o projeto ${projetoId}.`,
      );
    }

    await this.integrityService.deletePhysicalFile(file.filePath);
    await this.fileRepo.remove(file);

    this.logger.log(
      `PDF removido pela coordenação | projeto_id: ${projetoId} | file_id: ${file.id}`,
    );
  }

  /**
   * Lista registros com status CORRUPTED.
   * Usado pelo painel da coordenação para identificar problemas de integridade.
   */
  async listCorruptedFiles(): Promise<ProjectFile[]> {
    return this.fileRepo.find({
      where: { status: FileStatus.CORRUPTED },
      order: { atualizadoEm: 'DESC' },
    });
  }
}
