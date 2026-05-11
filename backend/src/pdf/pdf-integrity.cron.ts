import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PdfIntegrityService } from './pdf-integrity.service';

/**
 * Cron job de manutenção de integridade dos PDFs do SECTEC.
 *
 * Pré-requisito: ScheduleModule.forRoot() registrado no AppModule (já feito).
 * Executa automaticamente — não requer nenhuma chamada manual.
 */
@Injectable()
export class PdfIntegrityCron {
  private readonly logger = new Logger(PdfIntegrityCron.name);

  constructor(private readonly integrityService: PdfIntegrityService) {}

  /**
   * Verifica a integridade de todos os PDFs com status VALID diariamente às 02:00.
   *
   * Para cada arquivo, recalcula o SHA-256 e compara com o checksum salvo em
   * project_files na hora do upload. Detecta:
   *   - Arquivos corrompidos (checksum divergiu)
   *   - Arquivos removidos do disco após o upload (FILE_NOT_FOUND)
   *
   * Em caso de problemas, o status em project_files é atualizado para CORRUPTED
   * e um alerta é registrado nos logs para a coordenação verificar.
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async dailyIntegrityCheck(): Promise<void> {
    const inicio = new Date();
    this.logger.log(`🔍 [${inicio.toISOString()}] Iniciando verificação de integridade agendada...`);

    const result = await this.integrityService.runBatchIntegrityCheck();

    const duracao = Date.now() - inicio.getTime();
    this.logger.log(
      `✅ Verificação concluída em ${duracao}ms | ` +
      `${result.valid} válidos | ${result.corrupted} corrompidos | ${result.missing} ausentes`,
    );

    if (result.corrupted > 0 || result.missing > 0) {
      this.logger.warn(
        `⚠️  ATENÇÃO: ${result.corrupted + result.missing} arquivo(s) com problema! ` +
        `Acesse GET /pdf/corrompidos para ver a lista completa.` +
        // TODO: integrar com serviço de e-mail ou notificação push para a coordenação
        ` (notificação automática pendente de configuração)`,
      );
    }
  }
}
