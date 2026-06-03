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
  Req,
  Query
} from '@nestjs/common';
import { ProjetosService } from './projetos.service';

// DTOs
import { CreateProjetoDto } from './dto/create-projeto.dto';
import { UpdateProjetoDto } from './dto/update-projeto.dto';
import { EnviarSolicitacaoDto } from './dto/enviar-solicitacao.dto';
import { AddIntegrantesProjetoDto } from './dto/add-integrantes-projeto.dto';
import { GerenciarOrientadorProjetoDto } from './dto/gerenciar-orientador-projeto.dto';
<<<<<<< HEAD
import { TransferirAutoriaDto } from './dto/transferir-autoria.dto';
=======
>>>>>>> 65e89bc5d5b878c13e2cbdad46896699fc25e14d

// Auth & Guards
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ApiOperation, ApiResponse, ApiTags, ApiBody, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('projetos')
@ApiBearerAuth()
@ApiBearerAuth('token-jwt')
@UseGuards(JwtAuthGuard)
@Controller('projetos')
export class ProjetosController {
  constructor(private readonly projetosService: ProjetosService) { }

  // ===========================================================================
  // ROTAS DE CRIAÇÃO E AÇÕES ESPECÍFICAS
  // ===========================================================================

  @Post()
  @ApiOperation({ summary: 'Realiza a criação de um novo projeto' })
  @ApiResponse({ status: 201, description: 'Projeto criado com sucesso.' })
  async create(
    @Body() createProjetoDto: CreateProjetoDto,
    @GetUser('userId') userId: number,
    @GetUser('role') role: string
  ) {
    if (role !== 'aluno') {
      throw new ForbiddenException('Apenas alunos podem criar projetos.' + role
        + ' ' + userId);
    }
    return this.projetosService.create(createProjetoDto, userId);
  }

  /**
   * Envia solicitações de orientação para múltiplos professores.
   * Baseia-se no projeto mais recente do aluno logado.
   */
  @Post('solicitar-orientador')
  @ApiOperation({
    summary: 'Solicitar orientação para múltiplos professores',
    description: 'O aluno envia uma lista de IDs de orientadores. O sistema processa cada um e ignora IDs que não pertencem a orientadores.'
  })
  @ApiBody({ type: EnviarSolicitacaoDto }) // Usa o DTO que criamos com o array
  @ApiResponse({ status: 201, description: 'Processamento concluído (verificar status individual no corpo da resposta).' })
  @ApiResponse({ status: 403, description: 'Apenas alunos podem realizar esta ação.' })
  async solicitarOrientador(
    @GetUser('userId') userId: number,
    @GetUser('role') role: string,
    @Body() dto: EnviarSolicitacaoDto
  ) {
    // Validação de acesso
    if (role !== 'aluno') {
      throw new ForbiddenException('Apenas alunos autores podem solicitar orientação.');
    }

    // Chamada para o novo método que criamos no Service
    // Passamos o userId dinâmico do token e o array de IDs do Body
    return this.projetosService.enviarMultiplasSolicitacoes(userId, dto.orientadoresIds);
  }


  // ===========================================================================
  // ROTAS DE CONSULTA (LISTAGEM E DETALHES)
  // ===========================================================================

  @Get()
  @ApiOperation({ summary: 'Listagem dinâmica baseada no cargo do usuário' })
  async findAll(
    @GetUser('userId') userId: number,
    @GetUser('role') role: string
  ) {
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
  @ApiOperation({
    summary: 'Busca o projeto atual do aluno logado (seja como autor ou integrante)'
  })
  @ApiResponse({ status: 200, description: 'Retorna o projeto do ano atual ou null se não estiver em nenhum.' })
  async findMeuProjetoAtual(
    @GetUser('userId') userId: number,
    @GetUser('role') role: string
  ) {
    if (role !== 'aluno') {
      throw new ForbiddenException('Apenas alunos possuem um projeto atual de integrante/autor.');
    }
    return this.projetosService.findProjetoAtualPorAluno(userId);
  }

  @Get('alunos-ocupados')
  async getAlunosOcupados(@Query('projetoId') projetoId?: string) {
    const ids = await this.projetosService.findAlunosOcupados(
      projetoId ? parseInt(projetoId) : undefined
    );
    return ids;
  }

  @Get(':id/orientador-aceito')
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
  @ApiOperation({ summary: 'Busca os detalhes de um projeto específico' })
  @ApiResponse({ status: 200, description: 'Detalhes do projeto retornados com sucesso.', type: Object })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('userId') userId: number,
    @GetUser('role') role: string
  ) {
    const projeto = await this.projetosService.findOne(id);

    if (role === 'aluno' && projeto.alunoAutor.id !== userId) {
      throw new ForbiddenException('Acesso negado: você não possui vínculo com este projeto.');
    }

    return projeto;
  }

  // ===========================================================================
  // ROTAS DE ATUALIZAÇÃO E EXCLUSÃO
  // ===========================================================================

  @Post(':id/integrantes')
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
  @ApiOperation({ summary: 'Adiciona ou troca o orientador aceito de um projeto' })
  @ApiResponse({ status: 200, description: 'Orientador vinculado com sucesso.', type: Object })
  async gerenciarOrientador(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: GerenciarOrientadorProjetoDto,
    @GetUser('userId') userId: number,
    @GetUser('role') role: string,
  ) {
    return this.projetosService.gerenciarOrientador(id, dto.orientadorId, userId, role);
  }

  @Delete(':id/orientador')
  @ApiOperation({ summary: 'Remove logicamente o orientador atual de um projeto' })
  @ApiResponse({ status: 200, description: 'Orientador removido logicamente com sucesso.', type: Object })
  async removerOrientador(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('userId') userId: number,
    @GetUser('role') role: string,
  ) {
    return this.projetosService.removerOrientador(id, userId, role);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza informações do projeto' })
  @ApiResponse({ status: 200, description: 'Projeto atualizado com sucesso.', type: Object })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProjetoDto: UpdateProjetoDto,
    @GetUser('userId') userId: number,
    @GetUser('role') role: string
  ) {
    return this.projetosService.update(id, updateProjetoDto, userId, role);
  }

<<<<<<< HEAD
  @Patch(':id/transferir-autoria')
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

=======
>>>>>>> 65e89bc5d5b878c13e2cbdad46896699fc25e14d
  @Delete(':id')
  @ApiOperation({ summary: 'Remove um projeto do sistema' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('userId') userId: number,
    @GetUser('role') role: string
  ) {
    return this.projetosService.remove(id, userId, role);
  }

}
