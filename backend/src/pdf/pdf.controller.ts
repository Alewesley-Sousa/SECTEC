import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  Res,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express'; // MODIFICADO DEVIDO AOS ERROS GERADOS
import * as fs from 'fs';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';

import { PdfService } from './pdf.service';
import { PdfIntegrityService } from './pdf-integrity.service';
import { PdfReportService, ProjectReportData } from './pdf-report.service';
import { UploadProjectPdfDto, GenerateReportDto } from './dto/pdf.dto';

// ── Decorators de autenticação/autorização ────────────────────────────────────
// Descomente conforme o seu AuthModule estiver pronto:
// import { JwtAuthGuard }  from '../auth/guards/jwt-auth.guard';
// import { RolesGuard }    from '../auth/guards/roles.guard';
// import { Roles }         from '../auth/decorators/roles.decorator';
// import { CurrentUser }   from '../auth/decorators/current-user.decorator';

@ApiTags('PDF & Arquivos')
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pdf')
export class PdfController {
  constructor(
    private readonly pdfService: PdfService,
    private readonly integrityService: PdfIntegrityService,
    private readonly reportService: PdfReportService,
    // Injete o ProjetosService aqui após exportá-lo do ProjetosModule:
    // private readonly projetosService: ProjetosService,
  ) {}

  // ── UPLOAD ──────────────────────────────────────────────────────────────────

  /**
   * POST /pdf/upload
   * Upload do PDF do projeto — Fase 3 (Submissão de Materiais).
   *
   * Pré-requisitos (validados pelo PdfService):
   *   1. projeto_orientador.status = 'aceito' para este projeto
   *   2. Arquivo deve ser um PDF real (magic bytes %PDF-)
   *   3. Máximo 10MB
   *
   * O campo materialId deve ser o ID do registro em projeto_materiais
   * (tipo='pdf') criado previamente pelo ProjetosService.
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload do PDF do projeto (Fase 3 — Submissão de Materiais)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'projetoId', 'materialId'],
      properties: {
        file:       { type: 'string', format: 'binary', description: 'Arquivo PDF (máx. 10MB)' },
        projetoId:  { type: 'integer', example: 1,  description: 'projetos.id' },
        materialId: { type: 'integer', example: 5,  description: 'projeto_materiais.id (tipo=pdf)' },
        youtubeUrl: { type: 'string',  example: 'https://www.youtube.com/watch?v=abc123' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'PDF enviado e verificado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Arquivo não é um PDF real ou campos inválidos.' })
  @ApiResponse({ status: 403, description: 'Orientador ainda não aceitou o projeto.' })
  async uploadPdf(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadProjectPdfDto,
    // @CurrentUser() user: any,
  ) {
    // ── TODO: substituir pelos dados reais quando o AuthModule estiver pronto ──
    const mockUserId = 1; // usuarios.id do aluno autenticado (vem do JWT)

    // Consulta se o orientador aceitou o projeto:
    // const projeto = await this.projetosService.findById(dto.projetoId);
    // const orientadorAceito = await this.projetosService.orientadorAceitou(dto.projetoId);
    const mockOrientadorAceito = true; // substituir pela consulta real em projeto_orientador

    const saved = await this.pdfService.uploadProjectPdf(
      file,
      dto,
      mockUserId,
      mockOrientadorAceito,
    );

    return {
      message:    'PDF enviado e verificado com sucesso.',
      fileId:     saved.id,          // project_files.id (int)
      materialId: saved.materialId,  // projeto_materiais.id
      projetoId:  saved.projetoId,   // projetos.id
      version:    saved.version,
      checksum:   saved.checksumSha256,
      sizeBytes:  saved.fileSizeBytes,
    };
  }

  // ── DOWNLOAD ─────────────────────────────────────────────────────────────────

  /**
   * GET /pdf/:fileId/download
   * Verifica integridade e serve o arquivo via stream.
   * fileId = project_files.id (int)
   */
  @Get(':fileId/download')
  @ApiOperation({ summary: 'Download do PDF com verificação de integridade SHA-256' })
  @ApiParam({ name: 'fileId', type: Number, description: 'project_files.id' })
  async downloadPdf(
    @Param('fileId', ParseIntPipe) fileId: number,
    @Res() res: Response,
  ) {
    const filePath = await this.pdfService.getFilePath(fileId);
    const stat     = fs.statSync(filePath);

    res.set({
      'Content-Type':           'application/pdf',
      'Content-Disposition':    `attachment; filename="${fileId}.pdf"`,
      'Content-Length':         stat.size,
      'X-Content-Type-Options': 'nosniff',
    });

    fs.createReadStream(filePath).pipe(res);
  }

  // ── METADADOS ────────────────────────────────────────────────────────────────

  /**
   * GET /pdf/projeto/:projetoId
   * Retorna metadados do PDF mais recente de um projeto.
   * projetoId = projetos.id (int)
   */
  @Get('projeto/:projetoId')
  @ApiOperation({ summary: 'Metadados do PDF de um projeto' })
  @ApiParam({ name: 'projetoId', type: Number, description: 'projetos.id' })
  async getProjectPdf(@Param('projetoId', ParseIntPipe) projetoId: number) {
    const file = await this.pdfService.getProjectPdf(projetoId);
    return {
      fileId:       file.id,
      materialId:   file.materialId,
      projetoId:    file.projetoId,
      originalName: file.originalName,
      sizeBytes:    file.fileSizeBytes,
      pageCount:    file.pageCount,
      version:      file.version,
      status:       file.status,
      enviadoEm:    file.criadoEm,
    };
  }

  // ── INTEGRIDADE ──────────────────────────────────────────────────────────────

  /**
   * GET /pdf/:fileId/verify
   * Recalcula SHA-256 e compara com o checksum armazenado no upload.
   * fileId = project_files.id (int)
   */
  @Get(':fileId/verify')
  @ApiOperation({ summary: 'Verifica integridade do PDF via checksum SHA-256' })
  @ApiParam({ name: 'fileId', type: Number, description: 'project_files.id' })
  async verifyIntegrity(@Param('fileId', ParseIntPipe) fileId: number) {
    const result = await this.integrityService.verifyFileIntegrity(fileId);
    return {
      fileId,
      isValid:         result.isValid,
      status:          result.status,
      checksumMatch:   result.storedChecksum === result.currentChecksum,
      storedChecksum:  result.storedChecksum,
      currentChecksum: result.currentChecksum,
      verificadoEm:    new Date().toISOString(),
    };
  }

  /**
   * POST /pdf/integrity/batch
   * Verificação em lote de todos os arquivos VALID — uso da coordenação.
   */
  @Post('integrity/batch')
  @HttpCode(HttpStatus.OK)
  // @Roles('coordenador')  ← role_cargo = 'coordenador' em usuarios
  @ApiOperation({ summary: '[Coordenador] Verificação em lote de todos os PDFs' })
  async batchIntegrityCheck() {
    const result = await this.integrityService.runBatchIntegrityCheck();
    return {
      message: 'Verificação em lote concluída.',
      ...result,
      executadoEm: new Date().toISOString(),
    };
  }

  /**
   * GET /pdf/corrompidos
   * Lista arquivos com status CORRUPTED — painel da coordenação.
   */
  @Get('corrompidos')
  // @Roles('coordenador')
  @ApiOperation({ summary: '[Coordenador] Lista PDFs corrompidos ou adulterados' })
  async listCorrupted() {
    const files = await this.pdfService.listCorruptedFiles();
    return { total: files.length, arquivos: files };
  }

  // ── REMOÇÃO ──────────────────────────────────────────────────────────────────

  /**
   * DELETE /pdf/projeto/:projetoId
   * Remove o PDF de um projeto — ação restrita à coordenação (RF06 Auditoria).
   * projetoId = projetos.id (int)
   *
   * ATENÇÃO: isso remove apenas o arquivo físico e o registro em project_files.
   * O registro em projeto_materiais deve ser tratado pelo ProjetosService.
   */
  @Delete('projeto/:projetoId')
  // @Roles('coordenador')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '[Coordenador] Remove o PDF de um projeto' })
  @ApiParam({ name: 'projetoId', type: Number, description: 'projetos.id' })
  async deletePdf(@Param('projetoId', ParseIntPipe) projetoId: number) {
    await this.pdfService.deleteProjectPdf(projetoId);
  }

  // ── RELATÓRIOS ────────────────────────────────────────────────────────────────

  /**
   * POST /pdf/relatorios/projetos
   * Gera relatório consolidado de projetos em PDF.
   * Filtros disponíveis: tema (temas_orientadores.tema), eventoId, apenasAprovados.
   */
  @Post('relatorios/projetos')
  @HttpCode(HttpStatus.OK)
  // @Roles('coordenador')
  @ApiOperation({ summary: '[Coordenador] Gera relatório consolidado de projetos' })
  async generateReport(
    @Body() dto: GenerateReportDto,
    @Res() res: Response,
  ) {
    // TODO: substituir pelos dados reais buscados via JOIN entre
    //       projetos → temas_orientadores → projeto_materiais → project_files
    const mockProjects: ProjectReportData[] = [
      {
        id: 1,
        titulo:           'Sistema de Monitoramento Agrícola com IoT',
        tema:             'Tecnologia e Inovação',
        subTema:          'Internet das Coisas',
        statusMaterial:   'aprovado',        // projeto_materiais.status
        nomeOrientador:   'Prof. Carlos Silva',
        totalIntegrantes: 6,
        temPdf:           true,
        temYoutube:       true,
        aprovadoEm:       new Date('2025-03-15'), // projeto_orientador.respondido_em
      },
      {
        id: 2,
        titulo:           'App de Acessibilidade para Deficientes Visuais',
        tema:             'Saúde e Inclusão',
        statusMaterial:   'em_analise',      // projeto_materiais.status
        nomeOrientador:   'Profa. Ana Rodrigues',
        totalIntegrantes: 5,
        temPdf:           true,
        temYoutube:       false,
      },
    ];

    const filePath = await this.reportService.generateApprovedProjectsReport(
      mockProjects,
      dto,
      'Coordenador', // TODO: pegar nome de usuarios.nome via JWT
    );

    const stat = fs.statSync(filePath);

    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="relatorio_sectec_${Date.now()}.pdf"`,
      'Content-Length':      stat.size,
    });

    fs.createReadStream(filePath).pipe(res);
  }
}
