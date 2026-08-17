import {
  Controller,
  Post,
  Request,
  Body,
  UseGuards,
  ConflictException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AvaliacaoService } from './avaliacao.service';
import { LimitesAvaliacaoDto } from './dto/limites-avaliacao.dto';
import { CreateAvaliacaoDto } from './dto/avaliacao.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Avaliação')
@ApiBearerAuth()
@Controller(['avaliacao', 'avaliador'])
export class AvaliacaoController {
  constructor(private readonly avaliacaoService: AvaliacaoService) {}

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Submete a avaliação de um projeto com cálculo da média e validação do prazo' })
  @Post()
  async criarAvaliacao(@Body() dto: CreateAvaliacaoDto, @Request() req) {
    const avaliadorId = Number(req.user?.userId ?? dto.avaliadorId ?? req.user?.id);

    if (!avaliadorId || Number.isNaN(avaliadorId)) {
      throw new ConflictException('Avaliador não identificado.');
    }

    return this.avaliacaoService.criarAvaliacao({
      ...dto,
      avaliadorId,
    });
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Gera a distribuição de projetos para o avaliador logado' })
  @Post('projetos/gerar')
  async gerarProjetos(@Request() req) {
    const avaliadorId = req.user?.userId ?? req.user?.id ?? 107;
    return this.avaliacaoService.gerarDistribuicao(Number(avaliadorId));
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Configura os limites de avaliação (Exclusivo Coordenação)' })
  @Post('configuracao/limites')
  async salvarLimites(@Body() dto: LimitesAvaliacaoDto) {
    return this.avaliacaoService.salvarLimites(dto);
  }
}