import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
  StreamableFile,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { AvaliacaoService } from './avaliacao.service';

@ApiTags('Avaliadores')
@ApiBearerAuth()
@Controller('avaliadores')
@UseGuards(JwtAuthGuard)
export class AvaliadoresController {
  constructor(
    private readonly usersService: UsersService,
    private readonly avaliacaoService: AvaliacaoService,
  ) { }

  @Get()
  @ApiOperation({ summary: 'Lista avaliadores com suas cotas de projetos' })
  async listar(@Query('busca') busca?: string) {
    const avaliadores = await this.usersService.findAllAvaliadores();
    const limiteTotal = this.avaliacaoService.getLimitesAtuais().maxProjetosPorAvaliador;

    const resultado = await Promise.all(
      avaliadores.map(async (avaliador) => {
        const qtdProjetos = await this.avaliacaoService.contarProjetosDoAvaliador(
          Number(avaliador.id),
        );
        return {
          id: Number(avaliador.id),
          nome: avaliador.nome,
          email: avaliador.email_institucional,
          qtd_projetos: qtdProjetos,
          faltam: Math.max(0, limiteTotal - qtdProjetos),
          limite_total: limiteTotal,
        };
      }),
    );

    if (busca) {
      const termo = busca.toLowerCase();
      return resultado.filter(
        (a) =>
          a.nome.toLowerCase().includes(termo) ||
          a.email.toLowerCase().includes(termo),
      );
    }

    return resultado;
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

  @Get(':id/projetos')
  @ApiOperation({ summary: 'Lista projetos atuais do avaliador' })
  async projetosAtuais(@Param('id', ParseIntPipe) id: number) {
    const { projetos } = await this.avaliacaoService.listarProjetosDesignados(id);
    return projetos.map((p) => ({
      id: p.id,
      titulo: p.titulo,
      status: p.status, // ✅ envia status
    }));
  }

  @Get(':id/projetos-disponiveis')
  @ApiOperation({ summary: 'Lista projetos disponíveis para designar ao avaliador' })
  async projetosDisponiveis(@Param('id', ParseIntPipe) id: number) {
    const projetos = await this.avaliacaoService.listarProjetosDisponiveis(id);
    return projetos.map((p: any) => ({
      id: p.id,
      titulo: p.titulo,
      qtd_avaliadores: p.qtdAvaliadores ?? 0,
    }));
  }

  @Post(':id/projetos')
  @ApiOperation({ summary: 'Designa projetos ao avaliador' })
  async designar(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { projetos_ids: number[] },
  ) {
    if (!Array.isArray(body.projetos_ids) || body.projetos_ids.length === 0) {
      throw new BadRequestException('Informe pelo menos um projeto.');
    }
    await this.avaliacaoService.designarProjetos(id, body.projetos_ids);
    return { message: 'Projetos designados com sucesso.' };
  }

  @Delete(':id/projetos')
  @ApiOperation({ summary: 'Remove projetos designados do avaliador' })
  async remover(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { remover_todos: boolean; projetos_ids: number[] },
  ) {
    if (!body.remover_todos && (!body.projetos_ids || body.projetos_ids.length === 0)) {
      throw new BadRequestException('Informe projetos para remover ou remover_todos=true.');
    }
    await this.avaliacaoService.removerProjetos(
      id,
      body.projetos_ids || [],
      body.remover_todos,
    );
    return { message: 'Projetos removidos com sucesso.' };
  }

  @Get('projetos-sem-avaliadores')
  @ApiOperation({ summary: 'Lista projetos sem avaliadores no evento atual' })
  async projetosSemAvaliadores() {
    const projetos = await this.avaliacaoService.listarProjetosSemAvaliadores();
    return projetos.map((p) => ({ id: p.id, titulo: p.titulo }));
  }
}