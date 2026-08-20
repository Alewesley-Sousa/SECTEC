import {
  Controller,
  Post,
  Request,
  Body,
  Get,
  UseGuards,
  ConflictException,
  Param,
  ParseIntPipe,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StreamableFile } from '@nestjs/common';
import { AvaliacaoService } from './avaliacao.service';
import { LimitesAvaliacaoDto } from './dto/limites-avaliacao.dto';
import { CreateAvaliacaoDto } from './dto/avaliacao.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Avaliação')
@ApiBearerAuth()
@Controller(['avaliacao', 'avaliador'])
export class AvaliacaoController {
  constructor(private readonly avaliacaoService: AvaliacaoService) { }



  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtém os limites atuais de avaliação' })
  @Get('configuracao/limites')
  async obterLimites() {
    return this.avaliacaoService.getLimitesAtuais();
  }


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
  @ApiOperation({ summary: 'Valida se o projeto está designado ao avaliador logado' })
  @Get('projetos/:projetoId/designado')
  async validarProjetoDesignado(
    @Request() req,
    @Param('projetoId', ParseIntPipe) projetoId: number,
  ) {
    const avaliadorId = Number(req.user?.userId ?? req.user?.id);
    if (!avaliadorId || Number.isNaN(avaliadorId)) {
      throw new BadRequestException('Avaliador não identificado.');
    }

    return this.avaliacaoService.validarProjetoDesignado(avaliadorId, projetoId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lista todos os projetos com suas médias finais' })
  @Get('projetos/medias')
  async listarMediasProjetos(
    @Query('eventoId') eventoId?: string,
  ) {
    return this.avaliacaoService.listarMediasProjetos(
      eventoId ? Number(eventoId) : undefined,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Exporta relatório CSV com médias dos projetos' })
  @Get('projetos/medias/export')
  async exportarMediasProjetosCsv(
    @Query('eventoId') eventoId?: string,
  ): Promise<StreamableFile> {
    return this.avaliacaoService.exportarMediasProjetosCsv(
      eventoId ? Number(eventoId) : undefined,
    );
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

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lista os projetos designados ao avaliador logado' })
  @Get('projetos/designados')
  async listarProjetosDesignados(@Request() req) {
    const avaliadorId = Number(req.user?.userId ?? req.user?.id);
    if (!avaliadorId || Number.isNaN(avaliadorId)) {
      throw new ConflictException('Avaliador não identificado.');
    }
    return this.avaliacaoService.listarProjetosDesignados(avaliadorId);
  }
}