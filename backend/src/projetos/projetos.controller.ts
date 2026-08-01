import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ForbiddenException,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ProjetosService } from './projetos.service';

// DTOs
import { CreateProjetoDto } from './dto/create-projeto.dto';
import { UpdateProjetoDto } from './dto/update-projeto.dto';
import { EnviarSolicitacaoDto } from './dto/enviar-solicitacao.dto';
import { AddIntegrantesProjetoDto } from './dto/add-integrantes-projeto.dto';
import { GerenciarOrientadorProjetoDto } from './dto/gerenciar-orientador-projeto.dto';
import { TransferirAutoriaDto } from './dto/transferir-autoria.dto';

// Auth & Guards
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

// Swagger
import { ApiOperation, ApiResponse, ApiTags, ApiBody, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('projetos')
@ApiBearerAuth()
@ApiBearerAuth('token-jwt')
@Controller('projetos')
export class ProjetosController {
  constructor(private readonly projetosService: ProjetosService) { }

  // ===========================================================================
  // ROTA PÚBLICA (SEM AUTENTICAÇÃO)
  // ===========================================================================

  @Get('public')
  @Public()
  @ApiOperation({ summary: 'Listagem pública de projetos com filtros e paginação' })
  @ApiResponse({ status: 200, description: 'Lista de projetos públicos.' })
  @ApiQuery({ name: 'search', required: false, description: 'Busca por título ou nome do aluno' })
  @ApiQuery({ name: 'curso', required: false, description: 'Filtro por curso (ex: informatica, contabilidade, enfermagem)' })
  @ApiQuery({ name: 'eixo', required: false, description: 'Filtro por eixo temático (nome do tema)' })
  @ApiQuery({ name: 'evento', required: false, description: 'Filtro por título do evento' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limite por página (padrão: 8, máximo: 50)' })
  async findAllPublic(
    @Query('search') search?: string,
    @Query('curso') curso?: string,
    @Query('eixo') eixo?: string,
    @Query('evento') evento?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const pageNum = page ? Number(page) : 1;
    const limitNum = limit ? Number(limit) : 8;
    return this.projetosService.findAllPublic(
      { search, curso, eixo, evento },
      pageNum,
      limitNum,
    );
  }
  
  // ===========================================================================
  // ROTAS DE CRIAÇÃO E AÇÕES ESPECÍFICAS (REQUEREM AUTENTICAÇÃO)
  // ===========================================================================

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Realiza a criação de um novo projeto' })
  @ApiResponse({ status: 201, description: 'Projeto criado com sucesso.' })
  async create(
    @Body() createProjetoDto: CreateProjetoDto,
    @GetUser('userId') userId: number,
    @GetUser('role') role: string,
  ) {
    if (role !== 'aluno') {
      throw new ForbiddenException(
        'Apenas alunos podem criar projetos. ' + role + ' ' + userId,
      );
    }
    return this.projetosService.create(createProjetoDto, userId);
  }

  @Post('solicitar-orientador')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Solicitar orientação para múltiplos professores',
    description:
      'O aluno envia uma lista de IDs de orientadores. O sistema processa cada um e ignora IDs que não pertencem a orientadores.',
  })
  @ApiBody({ type: EnviarSolicitacaoDto })
  @ApiResponse({
    status: 201,
    description: 'Processamento concluído (verificar status individual no corpo da resposta).',
  })
  @ApiResponse({ status: 403, description: 'Apenas alunos podem realizar esta ação.' })
  async solicitarOrientador(
    @GetUser('userId') userId: number,
    @GetUser('role') role: string,
    @Body() dto: EnviarSolicitacaoDto,
  ) {
    if (role !== 'aluno') {
      throw new ForbiddenException('Apenas alunos autores podem solicitar orientação.');
    }
    return this.projetosService.enviarMultiplasSolicitacoes(userId, dto.orientadoresIds);
  }

  // ===========================================================================
  // ROTAS DE CONSULTA (REQUEREM AUTENTICAÇÃO, EXCETO A PÚBLICA)
  // ===========================================================================

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Listagem dinâmica baseada no cargo do usuário' })
  async findAll(@GetUser('userId') userId: number, @GetUser('role') role: string) {
    switch (role) {
      case 'aluno':
        return this.projetosService.findAllAlunos(userId);
      case 'orientador':
        return this.projetosService.findAllOrientador(userId);
      case 'coordenador':
        return this.projetosService.findAllCoordenador();
      default:
        throw new ForbiddenException('Cargo não identificado para listagem.');
    }
  }

  @Get('meu-projeto')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Busca o projeto atual do aluno logado (seja como autor ou integrante)',
  })
  @ApiResponse({
    status: 200,
    description: 'Retorna o projeto do ano atual ou null se não estiver em nenhum.',
  })
  async findMeuProjetoAtual(
    @GetUser('userId') userId: number,
    @GetUser('role') role: string,
  ) {
    if (role !== 'aluno') {
      throw new ForbiddenException(
        'Apenas alunos possuem um projeto atual de integrante/autor.',
      );
    }
    return this.projetosService.findProjetoAtualPorAluno(userId);
  }

  @Get('alunos-ocupados')
  @UseGuards(JwtAuthGuard)
  async getAlunosOcupados(@Query('projetoId') projetoId?: string) {
    const ids = await this.projetosService.findAlunosOcupados(
      projetoId ? parseInt(projetoId, 10) : undefined,
    );
    return ids;
  }

  @Get(':id/orientador-aceito')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Retorna o orientador que aceitou orientar o projeto pelo ID' })
  async findOrientadorAceito(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('userId') userId: number,
    @GetUser('role') role: string,
  ) {
    const projeto = await this.projetosService.findOne(id);
    if (role === 'aluno' && projeto.alunoAutor.id !== userId) {
      throw new ForbiddenException('Acesso negado: você não possui vínculo com este projeto.');
    }
    return this.projetosService.getOrientadorAceitoByProjetoId(id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Busca os detalhes de um projeto específico' })
  @ApiResponse({ status: 200, description: 'Detalhes do projeto retornados com sucesso.' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('userId') userId: number,
    @GetUser('role') role: string,
  ) {
    const projeto = await this.projetosService.findOne(id);
    if (role === 'aluno' && projeto.alunoAutor.id !== userId) {
      throw new ForbiddenException('Acesso negado: você não possui vínculo com este projeto.');
    }
    return projeto;
  }

  // ===========================================================================
  // ROTAS DE ATUALIZAÇÃO E EXCLUSÃO (REQUEREM AUTENTICAÇÃO)
  // ===========================================================================

  @Post(':id/integrantes')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Adiciona alunos integrantes a um projeto' })
  @ApiResponse({ status: 201, description: 'Integrantes adicionados com sucesso.' })
  async addIntegrantes(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddIntegrantesProjetoDto,
    @GetUser('userId') userId: number,
    @GetUser('role') role: string,
  ) {
    return this.projetosService.addIntegrantes(id, dto.alunosIds, userId, role);
  }

  @Delete(':id/integrantes/:alunoId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Remove um aluno integrante de um projeto' })
  @ApiResponse({ status: 200, description: 'Integrante removido com sucesso.' })
  async removeIntegrante(
    @Param('id', ParseIntPipe) id: number,
    @Param('alunoId', ParseIntPipe) alunoId: number,
    @GetUser('userId') userId: number,
    @GetUser('role') role: string,
  ) {
    return this.projetosService.removeIntegrante(id, alunoId, userId, role);
  }

  @Patch(':id/orientador')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Adiciona ou troca o orientador aceito de um projeto' })
  @ApiResponse({ status: 200, description: 'Orientador vinculado com sucesso.' })
  async gerenciarOrientador(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: GerenciarOrientadorProjetoDto,
    @GetUser('userId') userId: number,
    @GetUser('role') role: string,
  ) {
    return this.projetosService.gerenciarOrientador(id, dto.orientadorId, userId, role);
  }

  @Delete(':id/orientador')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Remove logicamente o orientador atual de um projeto' })
  @ApiResponse({ status: 200, description: 'Orientador removido logicamente com sucesso.' })
  async removerOrientador(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('userId') userId: number,
    @GetUser('role') role: string,
  ) {
    return this.projetosService.removerOrientador(id, userId, role);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Atualiza informações do projeto' })
  @ApiResponse({ status: 200, description: 'Projeto atualizado com sucesso.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProjetoDto: UpdateProjetoDto,
    @GetUser('userId') userId: number,
    @GetUser('role') role: string,
  ) {
    return this.projetosService.update(id, updateProjetoDto, userId, role);
  }

  @Patch(':id/transferir-autoria')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: '[Coordenador] Transferir autoria do projeto para outro integrante',
    description:
      'Se manterAutorAtual = true, o autor atual é rebaixado para integrante. ' +
      'Se manterAutorAtual = false, o autor atual é removido da equipe.',
  })
  @ApiResponse({ status: 200, description: 'Autoria transferida com sucesso.' })
  @ApiResponse({ status: 400, description: 'Requisição inválida.' })
  @ApiResponse({ status: 403, description: 'Apenas coordenadores podem executar esta ação.' })
  @ApiResponse({ status: 404, description: 'Projeto ou integrante não encontrado.' })
  async transferirAutoria(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: TransferirAutoriaDto,
    @GetUser('userId') userId: number,
    @GetUser('role') role: string,
  ) {
    if (role !== 'coordenador') {
      throw new ForbiddenException('Apenas coordenadores podem transferir a autoria de projetos.');
    }
    return this.projetosService.transferirAutoria(id, dto.novoAutorId, dto.manterAutorAtual, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Remove um projeto do sistema' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('userId') userId: number,
    @GetUser('role') role: string,
  ) {
    return this.projetosService.remove(id, userId, role);
  }

}