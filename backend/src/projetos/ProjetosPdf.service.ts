import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AuditoriaService } from 'src/auditoria/auditoria.service';
import { Projeto } from './entities/projeto.entity';
import { GerarPdfDto } from '../pdf/dto/gerar-pdf.dto';
import * as PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';

@Injectable()
export class ProjetosPdfService {
  private static readonly ORDEM_CURSOS: Record<string, number> = {
    'informatica': 1,
    'contabilidade': 2,
    'enfermagem': 3,
  };

  constructor(
    @InjectRepository(Projeto)
    private readonly projetoRepository: Repository<Projeto>,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  /**
   * Gera o PDF de placas de identificação (com QR Code).
   * Retorna o PDF em base64, total de projetos gerados e lista de ignorados.
   */
  async gerarPdfIdentificacao(dto: GerarPdfDto): Promise<{
    mensagem: string;
    arquivo: string;
    total_projetos_gerados: number;
    projetos_ignorados: Array<{ id: number; motivo: string }>;
  }> {
    const projetosIgnorados: Array<{ id: number; motivo: string }> = [];
    let projetosValidos: Projeto[] = [];

    if (dto.modo === 'individual') {
      if (!dto.projetos || dto.projetos.length === 0) {
        throw new BadRequestException(
          'Informe ao menos um ID de projeto no modo individual.',
        );
      }

      const projetos = await this.projetoRepository.find({
        where: { id: In(dto.projetos) },
        relations: {
          alunoAutor: true,
          projetoAlunos: { aluno: true },
          orientadores: { orientador: true },
          materiais: true,
        },
      });

      const encontradosIds = new Set(projetos.map((p) => p.id));
      for (const id of dto.projetos) {
        if (!encontradosIds.has(id)) {
          projetosIgnorados.push({ id, motivo: 'projeto nao encontrado' });
        }
      }

      for (const projeto of projetos) {
        const temAprovado = (projeto.materiais ?? []).some(
          (m) => m.status === 'aprovado',
        );
        if (temAprovado) {
          projetosValidos.push(projeto);
        } else {
          projetosIgnorados.push({
            id: projeto.id,
            motivo: 'nao possui material aprovado',
          });
        }
      }
    } else {
      if (!dto.turma?.trim()) {
        throw new BadRequestException('Informe o campo turma no modo filtro.');
      }

      const match = dto.turma.trim().match(/^(\d+)\s+(.+)$/);
      if (!match) {
        throw new BadRequestException(
          'Formato de turma invalido. Use o padrao "1 informatica", "2 contabilidade", etc.',
        );
      }
      const [, anoStr, turmaTexto] = match;

      projetosValidos = await this.projetoRepository
        .createQueryBuilder('projeto')
        .leftJoinAndSelect('projeto.alunoAutor', 'alunoAutor')
        .leftJoinAndSelect('projeto.projetoAlunos', 'projetoAlunos')
        .leftJoinAndSelect('projetoAlunos.aluno', 'aluno')
        .leftJoinAndSelect(
          'projeto.orientadores',
          'projetoOrientador',
          "projetoOrientador.status = 'aceito'",
        )
        .leftJoinAndSelect('projetoOrientador.orientador', 'orientador')
        .where('alunoAutor.ano = :ano', { ano: anoStr })
        .andWhere('alunoAutor.turma LIKE :turma', { turma: `%${turmaTexto}%` })
        .andWhere((qbSub) => {
          const sub = qbSub
            .subQuery()
            .select('1')
            .from('projeto_materiais', 'material')
            .where('material.projeto_id = projeto.id')
            .andWhere("material.status = 'aprovado'")
            .getQuery();
          return `EXISTS (${sub})`;
        })
        .getMany();

      if (projetosValidos.length === 0) {
        throw new NotFoundException(
          `Nenhum projeto aprovado encontrado para a turma "${dto.turma}".`,
        );
      }
    }

    if (projetosValidos.length === 0) {
      throw new NotFoundException(
        'Nenhum projeto valido foi encontrado para gerar o PDF.',
      );
    }

    // Ordenação por curso e ano
    projetosValidos.sort((a, b) => {
      const cursoA = (a.alunoAutor?.turma ?? '').toLowerCase();
      const cursoB = (b.alunoAutor?.turma ?? '').toLowerCase();
      const ordemA = ProjetosPdfService.ORDEM_CURSOS[cursoA] ?? 999;
      const ordemB = ProjetosPdfService.ORDEM_CURSOS[cursoB] ?? 999;
      if (ordemA !== ordemB) return ordemA - ordemB;

      const anoA = a.alunoAutor?.ano ?? 0;
      const anoB = b.alunoAutor?.ano ?? 0;
      return anoA - anoB;
    });

    const pdfBuffer = await this.montarPdfIdentificacao(projetosValidos);

    return {
      mensagem: 'PDF gerado com sucesso',
      arquivo: pdfBuffer.toString('base64'),
      total_projetos_gerados: projetosValidos.length,
      projetos_ignorados: projetosIgnorados,
    };
  }

  /**
   * Marca um projeto como "QR Code gerado". Só permite se houver material aprovado.
   */
  async gerarQrCode(
    id: number,
    userId: number,
  ): Promise<{ id: number; qrcode: boolean; url: string }> {
    const projeto = await this.projetoRepository.findOne({
      where: { id },
      relations: ['materiais'],
    });

    if (!projeto) {
      throw new NotFoundException(`Projeto #${id} nao encontrado.`);
    }

    const possuiMaterialAprovado = (projeto.materiais ?? []).some(
      (material) => material.status === 'aprovado',
    );

    if (!possuiMaterialAprovado) {
      throw new BadRequestException(
        'Este projeto nao possui nenhum material aprovado. Nao e possivel gerar o QR Code.',
      );
    }

    projeto.qrcodeGerado = true;
    await this.projetoRepository.save(projeto);

    await this.auditoriaService.registrar(
      userId,
      'PROJETO_QRCODE_GERADO',
      `QR Code gerado para o projeto #${id}.`,
      id,
    );

    return {
      id: projeto.id,
      qrcode: true,
      url: `${process.env.FRONTEND_PUBLIC_URL ?? ''}/publico/projeto/${id}`,
    };
  }

  // =========================================================================
  // MÉTODOS PRIVADOS (PDF e QR)
  // =========================================================================

  private async gerarQrCodeBuffer(url: string): Promise<Buffer> {
    return QRCode.toBuffer(url, { width: 200, margin: 1 });
  }

  private async montarPdfIdentificacao(projetos: Projeto[]): Promise<Buffer> {
    const PDFDocument = require('pdfkit'); // já importado, ok
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 0 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const quadrantWidth = pageWidth / 2;
      const quadrantHeight = pageHeight / 2;

      const processarTudo = async () => {
        for (let i = 0; i < projetos.length; i++) {
          const posicaoNaPagina = i % 4;

          if (i > 0 && posicaoNaPagina === 0) {
            doc.addPage();
          }

          if (posicaoNaPagina === 0) {
            doc.moveTo(pageWidth / 2, 24)
              .lineTo(pageWidth / 2, pageHeight - 24)
              .lineWidth(0.75)
              .strokeColor('#94a3b8')
              .dash(4, { space: 4 })
              .stroke()
              .undash();

            doc.moveTo(24, pageHeight / 2)
              .lineTo(pageWidth - 24, pageHeight / 2)
              .lineWidth(0.75)
              .strokeColor('#94a3b8')
              .dash(4, { space: 4 })
              .stroke()
              .undash();
          }

          const offsetX = (posicaoNaPagina % 2) * quadrantWidth;
          const offsetY = Math.floor(posicaoNaPagina / 2) * quadrantHeight;

          await this.desenharBlocoProjeto(
            doc,
            projetos[i],
            offsetX,
            offsetY,
            quadrantWidth,
            quadrantHeight,
          );
        }

        doc.end();
      };

      processarTudo().catch(reject);
    });
  }

  private abreviarNome(nome: string): string {
    const partes = nome.trim().split(/\s+/);
    if (partes.length <= 2) return nome;
    return `${partes[0]} ${partes[partes.length - 1]}`;
  }

  private async desenharBlocoProjeto(
    doc: PDFKit.PDFDocument,
    projeto: Projeto,
    offsetX: number,
    offsetY: number,
    blocoLargura: number,
    blocoAltura: number,
  ) {
    const orientadorAceito = projeto.orientadores?.[0]?.orientador;
    const anoTurma = projeto.alunoAutor
      ? `${projeto.alunoAutor.ano ?? ''}º ${projeto.alunoAutor.turma ?? ''}`.trim()
      : '';
    const nomeTema = projeto.tema?.nome ?? '';

    const integrantes = [
      projeto.alunoAutor?.nome,
      ...(projeto.projetoAlunos ?? []).map((pa) => pa.aluno?.nome),
    ]
      .filter(Boolean)
      .map((nome) => this.abreviarNome(nome as string)) as string[];

    const url = `${process.env.FRONTEND_PUBLIC_URL ?? ''}/publico/projeto/${projeto.id}`;
    const qrBuffer = await this.gerarQrCodeBuffer(url);

    const margem = 20;
    const blocoX = offsetX + margem;
    const blocoY = offsetY + margem;
    const blocoLarguraUtil = blocoLargura - margem * 2;
    const blocoAlturaUtil = blocoAltura - margem * 2;

    doc.roundedRect(blocoX, blocoY, blocoLarguraUtil, blocoAlturaUtil, 10)
      .strokeColor('#000000')
      .lineWidth(0.75)
      .stroke();

    const qrTamanho = 100;
    const qrX = blocoX + (blocoLarguraUtil - qrTamanho) / 2;
    const qrY = blocoY + 16;

    doc.image(qrBuffer, qrX, qrY, { width: qrTamanho, height: qrTamanho });

    const textoX = blocoX + 14;
    const textoLargura = blocoLarguraUtil - 28;
    let textoY = qrY + qrTamanho + 12;

    doc.fontSize(14).fillColor('#000000').font('Helvetica-Bold')
      .text(projeto.titulo, textoX, textoY, {
        width: textoLargura,
        lineGap: 3,
        align: 'center',
      });

    const alturaTitulo = doc.heightOfString(projeto.titulo, { width: textoLargura });
    textoY += alturaTitulo + 8;

    doc.moveTo(textoX, textoY)
      .lineTo(textoX + textoLargura, textoY)
      .lineWidth(0.5)
      .strokeColor('#444444')
      .dash(2, { space: 2 })
      .stroke()
      .undash();
    textoY += 10;

    doc.fontSize(10).fillColor('#000000');
    const infoLinhas = [
      `Orientador: ${orientadorAceito?.nome ?? 'Não definido'}`,
      anoTurma,
      nomeTema ? `Tema: ${nomeTema}` : null,
    ].filter(Boolean) as string[];

    for (const linha of infoLinhas) {
      doc.font('Helvetica').text(linha, textoX, textoY, {
        width: textoLargura,
        align: 'center',
      });
      textoY += 16;
    }

    const alturaCaixa = 120;
    const caixaY = blocoY + blocoAlturaUtil - 20 - alturaCaixa;

    const inicioEfetivoCaixa = Math.max(textoY + 8, caixaY);
    const alturaEfetiva = blocoY + blocoAlturaUtil - 20 - inicioEfetivoCaixa;

    doc.roundedRect(textoX, inicioEfetivoCaixa, textoLargura, alturaEfetiva, 4)
      .strokeColor('#777777')
      .lineWidth(0.5)
      .stroke();

    doc.fontSize(8).fillColor('#000000').font('Helvetica-Bold')
      .text('Equipe:', textoX + 8, inicioEfetivoCaixa + 6, { width: textoLargura - 16 });

    const membrosTexto = integrantes.map((nome) => `• ${nome}`).join('\n');

    doc.fontSize(9).font('Helvetica')
      .text(membrosTexto, textoX + 8, inicioEfetivoCaixa + 18, {
        width: textoLargura - 16,
        lineGap: 5,
        height: alturaEfetiva - 24,
        ellipsis: true,
      });
  }
}