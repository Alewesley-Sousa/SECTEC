import { Controller, Post, Request, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AvaliacaoService } from './avaliacao.service';
import { LimitesAvaliacaoDto } from './dto/limites-avaliacao.dto'; // <-- IMPORTAR AQUI

@ApiTags('Avaliador')
@ApiBearerAuth()
@Controller('avaliador')
export class AvaliacaoController {
  constructor(private readonly avaliacaoService: AvaliacaoService) {}

  @ApiOperation({ summary: 'Gera a distribuição de projetos para o avaliador logado' })
  @Post('projetos/gerar')
  async gerarProjetos(@Request() req) {
    const avaliadorId = req.user?.id || 107; 
    return this.avaliacaoService.gerarDistribuicao(avaliadorId);
  }

  @ApiOperation({ summary: 'Configura os limites de avaliação (Exclusivo Coordenação)' })
  @Post('configuracao/limites')
  async salvarLimites(@Body() dto: LimitesAvaliacaoDto) {
    return this.avaliacaoService.salvarLimites(dto);
  }
}