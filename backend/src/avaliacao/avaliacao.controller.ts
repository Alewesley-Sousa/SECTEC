import {
  Controller,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { AvaliacaoService } from './avaliacao.service';
import { ConfiguracaoLimitesDto } from './dto/configuracao-limites.dto';

@Controller('avaliacao')
export class AvaliacaoController {
  constructor(private readonly avaliacaoService: AvaliacaoService) {}

  // Rota para a Coordenação definir os limites (Tarefa 3)
  @Patch('evento/:eventoId/limites')
  async atualizarLimites(
    @Param('eventoId', ParseIntPipe) eventoId: number,
    @Body() dto: ConfiguracaoLimitesDto,
  ) {
    return this.avaliacaoService.atualizarLimitesEvento(
      eventoId,
      dto.minProjetosPorAvaliador,
      dto.maxProjetosPorAvaliador,
    );
  }

  // Rota para disparar o algoritmo de distribuição automática
  @Post('evento/:eventoId/distribuir')
  async gerarDistribuicao(@Param('eventoId', ParseIntPipe) eventoId: number) {
    return this.avaliacaoService.gerarDistribuicao(eventoId);
  }
}