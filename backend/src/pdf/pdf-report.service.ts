import { Injectable, Logger } from '@nestjs/common';
import PDFDocument = require('pdfkit');
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
  id: number;
  titulo: string;
  tema: string;
  subTema?: string;
  statusMaterial: string;
  nomeOrientador: string;
  totalIntegrantes: number;
  temPdf: boolean;
  temYoutube: boolean;
  aprovadoEm?: Date;
}
 
@Injectable()
export class PdfReportService {
  private readonly logger = new Logger(PdfReportService.name);
 
  private get reportsDir(): string {
    const dir = path.join(process.cwd(), 'uploads', 'reports');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  }
 
  async generateApprovedProjectsReport(
    projects: ProjectReportData[],
    dto: GenerateReportDto,
    generatedBy: string,
  ): Promise<string> {
    let filtered = dto.apenasAprovados
      ? projects.filter((p) => p.statusMaterial === 'aprovado')
      : projects;
 
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
        bufferPages: true,
      });
      const stream = fs.createWriteStream(outputPath);
 
      doc.pipe(stream);
 
      this.drawHeader(doc, dto);
 
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
 
    if (dto.tema) {
      doc.fontSize(10).font('Helvetica').text(`Tema: ${dto.tema}`, 50, 87);
    }
 
    doc.y = 120;
  }
 
  private drawSummary(doc: PDFKit.PDFDocument, projects: ProjectReportData[]): void {
    const total      = projects.length;
    const comPdf     = projects.filter((p) => p.temPdf).length;
    const comYoutube = projects.filter((p) => p.temYoutube).length;
    const aprovados  = projects.filter((p) => p.statusMaterial === 'aprovado').length;
 
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
 
    const cardY   = doc.y;
    const bgColor = index % 2 === 0 ? '#f8f9ff' : '#ffffff';
 
    doc.rect(50, cardY, 495, 75).fillAndStroke(bgColor, '#dde3f0');
 
    doc.fillColor('#002b6e').font('Helvetica-Bold').fontSize(11)
      .text(`${index}. ${project.titulo}`, 60, cardY + 8, { width: 390 });
 
    doc.fillColor(this.statusColor(project.statusMaterial)).fontSize(9)
      .text(this.statusLabel(project.statusMaterial), 420, cardY + 10, { width: 115, align: 'right' });
 
    doc.fillColor('#555555').font('Helvetica').fontSize(9)
      .text(
        `Tema: ${project.tema}${project.subTema ? ` › ${project.subTema}` : ''}  |  ` +
        `Orientador: ${project.nomeOrientador}  |  Equipe: ${project.totalIntegrantes} integrante(s)`,
        60, cardY + 30,
      );
 
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
 
  private pct(part: number, total: number): string {
    if (total === 0) return '0%';
    return `${Math.round((part / total) * 100)}%`;
  }
 
  private statusLabel(status: string): string {
    const map: Record<string, string> = {
      em_analise: 'Em Análise',
      aprovado:   'Aprovado',
      recusado:   'Recusado',
    };
    return map[status] ?? status;
  }
 
  private statusColor(status: string): string {
    const map: Record<string, string> = {
      em_analise: '#e67e00',
      aprovado:   '#007700',
      recusado:   '#cc0000',
    };
    return map[status] ?? '#555555';
  }
}
