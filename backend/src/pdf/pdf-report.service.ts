import { Injectable, Logger } from '@nestjs/common';
import PDFDocument = require('pdfkit'); // toquei o import devido aos erros.
import * as path from 'path';
import * as fs from 'fs';
import { GenerateReportDto } from './dto/pdf.dto';

/**
 * Interface alinhada com o banco real do SECTEC.
 *
 * Campos mapeados das tabelas:
 *   id              → projetos.id
 *   titulo          → projetos.titulo
 *   tema            → temas_orientadores.tema
 *   subTema         → temas_orientadores.sub_tema
 *   statusMaterial  → projeto_materiais.status ('em_analise' | 'aprovado' | 'recusado')
 *   nomeOrientador  → usuarios.nome (do orientador vinculado em projeto_orientador)
 *   totalIntegrantes → COUNT(projeto_alunos) + 1 (autor)
 *   temPdf          → EXISTS projeto_materiais WHERE tipo='pdf'
 *   temYoutube      → EXISTS projeto_materiais WHERE tipo='link'
 *   aprovadoEm      → projeto_orientador.respondido_em (quando status='aceito')
 */
export interface ProjectReportData {
  id: number;                  // projetos.id (int)
  titulo: string;              // projetos.titulo
  tema: string;                // temas_orientadores.tema
  subTema?: string;            // temas_orientadores.sub_tema
  statusMaterial: string;      // projeto_materiais.status: 'em_analise' | 'aprovado' | 'recusado'
  nomeOrientador: string;      // usuarios.nome do orientador
  totalIntegrantes: number;    // tamanho da equipe incluindo o autor
  temPdf: boolean;             // projeto_materiais tipo='pdf' existe
  temYoutube: boolean;         // projeto_materiais tipo='link' existe
  aprovadoEm?: Date;           // projeto_orientador.respondido_em
}

@Injectable()
export class PdfReportService {
  private readonly logger = new Logger(PdfReportService.name);

  private get reportsDir(): string {
    const dir = path.join(process.cwd(), 'uploads', 'reports');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  /**
   * Gera o relatório consolidado de projetos.
   * Filtros disponíveis via GenerateReportDto:
   *   - tema          → filtra por temas_orientadores.tema
   *   - eventoId      → filtra por projetos.evento_id
   *   - apenasAprovados → filtra projeto_materiais.status = 'aprovado'
   */
  async generateApprovedProjectsReport(
    projects: ProjectReportData[],
    dto: GenerateReportDto,
    generatedBy: string,
  ): Promise<string> {
    // Aplica filtro de status de material (projeto_materiais.status)
    let filtered = dto.apenasAprovados
      ? projects.filter((p) => p.statusMaterial === 'aprovado')
      : projects;

    // Aplica filtro de tema (temas_orientadores.tema)
    if (dto.tema) {
      filtered = filtered.filter((p) =>
        p.tema.toLowerCase().includes(dto.tema!.toLowerCase()),
      );
    }

    const fileName = `relatorio_${Date.now()}.pdf`;
    const filePath = path.join(this.reportsDir, fileName);

    await this.buildReportPdf(filePath, filtered, generatedBy, dto);

    this.logger.log(`Relatório gerado: ${filePath} | ${filtered.length} projetos`);
    return filePath;
  }

  private buildReportPdf(
    outputPath: string,
    projects: ProjectReportData[],
    generatedBy: string,
    dto: GenerateReportDto,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        bufferPages: true, // necessário para o rodapé com número de páginas
      });
      const stream = fs.createWriteStream(outputPath);

      doc.pipe(stream);

      this.drawHeader(doc, dto);

      // Metadados
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#555555')
        .text(`Gerado por: ${generatedBy}`, { align: 'right' })
        .text(`Data: ${new Date().toLocaleDateString('pt-BR', {
          day: '2-digit', month: 'long', year: 'numeric',
        })}`, { align: 'right' })
        .text(`Total de projetos: ${projects.length}`, { align: 'right' });

      doc.moveDown(1.5);

      // Linha divisória
      doc
        .moveTo(50, doc.y).lineTo(545, doc.y)
        .strokeColor('#002b6e').lineWidth(2).stroke();

      doc.moveDown(1);

      this.drawSummary(doc, projects);
      doc.moveDown(1.5);

      if (projects.length === 0) {
        doc
          .font('Helvetica-Oblique').fontSize(12).fillColor('#999999')
          .text('Nenhum projeto encontrado com os filtros aplicados.', { align: 'center' });
      } else {
        projects.forEach((project, index) => {
          this.drawProjectCard(doc, project, index + 1);
        });
      }

      this.drawFooter(doc);
      doc.end();

      stream.on('finish', resolve);
      stream.on('error', reject);
    });
  }

  private drawHeader(doc: PDFKit.PDFDocument, dto: GenerateReportDto): void {
    doc.rect(0, 0, 595, 100).fill('#002b6e');

    doc
      .fillColor('#ffffff')
      .font('Helvetica-Bold').fontSize(20)
      .text('SECTEC', 50, 25)
      .font('Helvetica').fontSize(11)
      .text('Sistema de Gestão de Projetos Técnicos', 50, 50)
      .font('Helvetica-Bold').fontSize(14)
      .text(
        dto.apenasAprovados
          ? 'Relatório de Projetos com Materiais Aprovados'
          : 'Relatório Consolidado de Projetos',
        50, 70,
      );

    // Mostra o tema filtrado no cabeçalho se aplicado
    if (dto.tema) {
      doc.fontSize(10).font('Helvetica')
        .text(`Tema: ${dto.tema}`, 50, 87);
    }

    doc.y = 120;
  }

  private drawSummary(doc: PDFKit.PDFDocument, projects: ProjectReportData[]): void {
    const total       = projects.length;
    const comPdf      = projects.filter((p) => p.temPdf).length;
    const comYoutube  = projects.filter((p) => p.temYoutube).length;
    const aprovados   = projects.filter((p) => p.statusMaterial === 'aprovado').length;

    doc.font('Helvetica-Bold').fontSize(13).fillColor('#002b6e')
      .text('Resumo Estatístico', { underline: true });
    doc.moveDown(0.5);

    const cols = [
      { label: 'Total de Projetos', value: String(total) },
      { label: 'Com PDF',           value: `${comPdf} (${this.pct(comPdf, total)})` },
      { label: 'Com Vídeo',         value: `${comYoutube} (${this.pct(comYoutube, total)})` },
      { label: 'Mat. Aprovados',    value: `${aprovados} (${this.pct(aprovados, total)})` },
    ];

    const boxW = 115, boxH = 55, startX = 50, gap = 10;
    const startY = doc.y;

    cols.forEach((col, i) => {
      const x = startX + i * (boxW + gap);
      doc.rect(x, startY, boxW, boxH).fillAndStroke('#f0f4ff', '#002b6e');
      doc.fillColor('#002b6e').font('Helvetica-Bold').fontSize(18)
        .text(col.value, x, startY + 8, { width: boxW, align: 'center' });
      doc.fillColor('#444444').font('Helvetica').fontSize(9)
        .text(col.label, x, startY + 33, { width: boxW, align: 'center' });
    });

    doc.y = startY + boxH + 10;
  }

  private drawProjectCard(
    doc: PDFKit.PDFDocument,
    project: ProjectReportData,
    index: number,
  ): void {
    if (doc.y > 700) doc.addPage();

    const cardY    = doc.y;
    const bgColor  = index % 2 === 0 ? '#f8f9ff' : '#ffffff';

    doc.rect(50, cardY, 495, 75).fillAndStroke(bgColor, '#dde3f0');

    // Título do projeto
    doc.fillColor('#002b6e').font('Helvetica-Bold').fontSize(11)
      .text(`${index}. ${project.titulo}`, 60, cardY + 8, { width: 390 });

    // Badge de status do material (projeto_materiais.status)
    doc.fillColor(this.statusColor(project.statusMaterial)).fontSize(9)
      .text(this.statusLabel(project.statusMaterial), 420, cardY + 10, { width: 115, align: 'right' });

    // Linha 2: tema e orientador
    doc.fillColor('#555555').font('Helvetica').fontSize(9)
      .text(
        `Tema: ${project.tema}${project.subTema ? ` › ${project.subTema}` : ''}  |  Orientador: ${project.nomeOrientador}  |  Equipe: ${project.totalIntegrantes} integrante(s)`,
        60, cardY + 30,
      );

    // Linha 3: materiais e data de aprovação
    doc.text(
      `PDF: ${project.temPdf ? '✓ Enviado' : '✗ Pendente'}  |  ` +
      `Vídeo: ${project.temYoutube ? '✓ Enviado' : '✗ Pendente'}` +
      (project.aprovadoEm
        ? `  |  Orientação aceita em: ${new Date(project.aprovadoEm).toLocaleDateString('pt-BR')}`
        : ''),
      60, cardY + 48,
    );

    doc.y = cardY + 85;
  }

  private drawFooter(doc: PDFKit.PDFDocument): void {
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.moveTo(50, 800).lineTo(545, 800)
        .strokeColor('#cccccc').lineWidth(0.5).stroke();
      doc.font('Helvetica').fontSize(8).fillColor('#999999')
        .text(
          `SECTEC — Sistema de Gestão de Projetos Técnicos  |  Página ${i + 1} de ${pages.count}`,
          50, 808, { align: 'center' },
        );
    }
  }

  // ── HELPERS ──────────────────────────────────────────────────────────────────

  private pct(part: number, total: number): string {
    if (total === 0) return '0%';
    return `${Math.round((part / total) * 100)}%`;
  }

  /**
   * Converte projeto_materiais.status para label legível em português.
   */
  private statusLabel(status: string): string {
    const map: Record<string, string> = {
      em_analise: 'Em Análise',
      aprovado:   'Aprovado',
      recusado:   'Recusado',
    };
    return map[status] ?? status;
  }

  /**
   * Cor do badge de status alinhada ao enum de projeto_materiais.
   */
  private statusColor(status: string): string {
    const map: Record<string, string> = {
      em_analise: '#e67e00', // laranja — aguardando avaliação do orientador
      aprovado:   '#007700', // verde   — orientador aprovou
      recusado:   '#cc0000', // vermelho — orientador recusou
    };
    return map[status] ?? '#555555';
  }
}
// ================================
// CODIGO COM ERRO!!!
// ===============================


// /**
//  * Serviço responsável pela geração de PDFs de relatório do sistema SECTEC.
//  * Usa PDFKit (nativo para Node.js/NestJS) para renderização.
//  *
//  * Instalar: npm install pdfkit @types/pdfkit
//  */
// @Injectable()
// export class PdfReportService {
//   private readonly logger = new Logger(PdfReportService.name);

//   private get reportsDir(): string {
//     const dir = path.join(process.cwd(), 'uploads', 'reports');
//     if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
//     return dir;
//   }

//   /**
//    * Gera o relatório consolidado de projetos aptos para avaliação.
//    * Serviço de Relatórios (RF - Consolidação de Dados).
//    */
//   async generateApprovedProjectsReport(
//     projects: ProjectReportData[],
//     dto: GenerateReportDto,
//     generatedBy: string,
//   ): Promise<string> {
//     const filtered = dto.approvedOnly
//       ? projects.filter((p) => p.status === 'APROVADO_PARA_AVALIACAO' || p.status === 'AVALIADO')
//       : projects;

//     const byAxis = dto.thematicAxis
//       ? filtered.filter((p) => p.thematicAxis === dto.thematicAxis)
//       : filtered;

//     const fileName = `relatorio_${Date.now()}.pdf`;
//     const filePath = path.join(this.reportsDir, fileName);

//     await this.buildReportPdf(filePath, byAxis, generatedBy, dto);

//     this.logger.log(`Relatório gerado: ${filePath} | ${byAxis.length} projetos`);
//     return filePath;
//   }

//   /**
//    * Constrói o PDF usando PDFKit com formatação institucional.
//    */
//   private buildReportPdf(
//     outputPath: string,
//     projects: ProjectReportData[],
//     generatedBy: string,
//     dto: GenerateReportDto,
//   ): Promise<void> {
//     return new Promise((resolve, reject) => {
//       const doc = new PDFDocument({ size: 'A4', margin: 50 });
//       const stream = fs.createWriteStream(outputPath);

//       doc.pipe(stream);

//       // ── CABEÇALHO ─────────────────────────────────────────────
//       this.drawHeader(doc, dto);

//       // ── METADADOS DO RELATÓRIO ────────────────────────────────
//       doc
//         .font('Helvetica')
//         .fontSize(10)
//         .fillColor('#555555')
//         .text(`Gerado por: ${generatedBy}`, { align: 'right' })
//         .text(`Data: ${new Date().toLocaleDateString('pt-BR', {
//           day: '2-digit', month: 'long', year: 'numeric',
//         })}`, { align: 'right' })
//         .text(`Total de projetos: ${projects.length}`, { align: 'right' });

//       doc.moveDown(1.5);

//       // ── LINHA DIVISÓRIA ───────────────────────────────────────
//       doc
//         .moveTo(50, doc.y)
//         .lineTo(545, doc.y)
//         .strokeColor('#002b6e')
//         .lineWidth(2)
//         .stroke();

//       doc.moveDown(1);

//       // ── SUMÁRIO ───────────────────────────────────────────────
//       this.drawSummary(doc, projects);

//       doc.moveDown(1.5);

//       // ── LISTA DE PROJETOS ─────────────────────────────────────
//       if (projects.length === 0) {
//         doc
//           .font('Helvetica-Oblique')
//           .fontSize(12)
//           .fillColor('#999999')
//           .text('Nenhum projeto encontrado com os filtros aplicados.', { align: 'center' });
//       } else {
//         projects.forEach((project, index) => {
//           this.drawProjectCard(doc, project, index + 1);
//         });
//       }

//       // ── RODAPÉ ────────────────────────────────────────────────
//       this.drawFooter(doc);

//       doc.end();

//       stream.on('finish', resolve);
//       stream.on('error', reject);
//     });
//   }

//   private drawHeader(doc: PDFKit.PDFDocument, dto: GenerateReportDto): void {
//     // Fundo azul institucional
//     doc
//       .rect(0, 0, 595, 100)
//       .fill('#002b6e');

//     doc
//       .fillColor('#ffffff')
//       .font('Helvetica-Bold')
//       .fontSize(20)
//       .text('SECTEC', 50, 25)
//       .fontSize(11)
//       .font('Helvetica')
//       .text('Sistema de Gestão de Projetos Técnicos', 50, 50)
//       .fontSize(14)
//       .font('Helvetica-Bold')
//       .text(
//         dto.approvedOnly
//           ? 'Relatório de Projetos Aprovados para Avaliação'
//           : 'Relatório Consolidado de Projetos',
//         50,
//         70,
//       );

//     if (dto.thematicAxis) {
//       doc
//         .fontSize(10)
//         .font('Helvetica')
//         .text(`Eixo temático: ${dto.thematicAxis}`, 50, 87);
//     }

//     doc.y = 120;
//   }

//   private drawSummary(doc: PDFKit.PDFDocument, projects: ProjectReportData[]): void {
//     const total         = projects.length;
//     const withPdf       = projects.filter((p) => p.hasPdf).length;
//     const withYoutube   = projects.filter((p) => p.hasYoutubeLink).length;
//     const complete      = projects.filter((p) => p.hasPdf && p.hasYoutubeLink).length;

//     doc
//       .font('Helvetica-Bold')
//       .fontSize(13)
//       .fillColor('#002b6e')
//       .text('Resumo Estatístico', { underline: true });

//     doc.moveDown(0.5);

//     const cols = [
//       { label: 'Total de Projetos', value: String(total) },
//       { label: 'Com PDF',           value: `${withPdf} (${this.pct(withPdf, total)})` },
//       { label: 'Com Vídeo',         value: `${withYoutube} (${this.pct(withYoutube, total)})` },
//       { label: 'Completos',         value: `${complete} (${this.pct(complete, total)})` },
//     ];

//     const boxW = 115;
//     const boxH = 55;
//     const startX = 50;
//     const startY = doc.y;
//     const gap = 10;

//     cols.forEach((col, i) => {
//       const x = startX + i * (boxW + gap);
//       doc
//         .rect(x, startY, boxW, boxH)
//         .fillAndStroke('#f0f4ff', '#002b6e');

//       doc
//         .fillColor('#002b6e')
//         .font('Helvetica-Bold')
//         .fontSize(18)
//         .text(col.value, x, startY + 8, { width: boxW, align: 'center' });

//       doc
//         .fillColor('#444444')
//         .font('Helvetica')
//         .fontSize(9)
//         .text(col.label, x, startY + 33, { width: boxW, align: 'center' });
//     });

//     doc.y = startY + boxH + 10;
//   }

//   private drawProjectCard(
//     doc: PDFKit.PDFDocument,
//     project: ProjectReportData,
//     index: number,
//   ): void {
//     // Quebra de página se necessário
//     if (doc.y > 700) doc.addPage();

//     const cardY = doc.y;
//     const bgColor = index % 2 === 0 ? '#f8f9ff' : '#ffffff';

//     doc
//       .rect(50, cardY, 495, 70)
//       .fillAndStroke(bgColor, '#dde3f0');

//     // Número e título
//     doc
//       .fillColor('#002b6e')
//       .font('Helvetica-Bold')
//       .fontSize(11)
//       .text(`${index}. ${project.title}`, 60, cardY + 8, { width: 400 });

//     // Status badge
//     const statusColor = this.statusColor(project.status);
//     doc
//       .fillColor(statusColor)
//       .fontSize(9)
//       .text(this.statusLabel(project.status), 420, cardY + 10, { width: 115, align: 'right' });

//     // Detalhes
//     doc
//       .fillColor('#555555')
//       .font('Helvetica')
//       .fontSize(9)
//       .text(
//         `Eixo: ${project.thematicAxis}  |  Orientador: ${project.orientatorName}  |  Equipe: ${project.teamSize} integrantes`,
//         60,
//         cardY + 28,
//       )
//       .text(
//         `PDF: ${project.hasPdf ? '✓ Enviado' : '✗ Pendente'}  |  Vídeo: ${project.hasYoutubeLink ? '✓ Enviado' : '✗ Pendente'}${
//           project.approvedAt
//             ? `  |  Aprovado em: ${new Date(project.approvedAt).toLocaleDateString('pt-BR')}`
//             : ''
//         }`,
//         60,
//         cardY + 44,
//       );

//     doc.y = cardY + 80;
//   }

//   private drawFooter(doc: PDFKit.PDFDocument): void {
//     const pages = doc.bufferedPageRange();
//     for (let i = 0; i < pages.count; i++) {
//       doc.switchToPage(i);

//       doc
//         .moveTo(50, 800)
//         .lineTo(545, 800)
//         .strokeColor('#cccccc')
//         .lineWidth(0.5)
//         .stroke();

//       doc
//         .font('Helvetica')
//         .fontSize(8)
//         .fillColor('#999999')
//         .text(
//           `SECTEC — Sistema de Gestão de Projetos  |  Página ${i + 1} de ${pages.count}`,
//           50,
//           808,
//           { align: 'center' },
//         );
//     }
//   }

//   // ── HELPERS ───────────────────────────────────────────────────

//   private pct(part: number, total: number): string {
//     if (total === 0) return '0%';
//     return `${Math.round((part / total) * 100)}%`;
//   }

//   private statusLabel(status: string): string {
//     const map: Record<string, string> = {
//       RASCUNHO:                 'Rascunho',
//       PENDENTE_ORIENTACAO:      'Pend. Orientação',
//       ACEITO:                   'Aceito',
//       EM_DESENVOLVIMENTO:       'Em Desenvolvimento',
//       SOB_REVISAO:              'Sob Revisão',
//       APROVADO_PARA_AVALIACAO:  'Aprovado p/ Avaliação',
//       AVALIADO:                 'Avaliado',
//     };
//     return map[status] ?? status;
//   }

//   private statusColor(status: string): string {
//     const map: Record<string, string> = {
//       RASCUNHO:                '#888888',
//       PENDENTE_ORIENTACAO:     '#e67e00',
//       ACEITO:                  '#0077cc',
//       EM_DESENVOLVIMENTO:      '#0077cc',
//       SOB_REVISAO:             '#9900cc',
//       APROVADO_PARA_AVALIACAO: '#007700',
//       AVALIADO:                '#004400',
//     };
//     return map[status] ?? '#333333';
//   }
// }
