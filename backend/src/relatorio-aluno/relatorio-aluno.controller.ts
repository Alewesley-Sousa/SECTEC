import { Controller, Get, Post, Body, Patch, Param, Req, Delete, Query, Put, UseGuards, ForbiddenException } from '@nestjs/common';
import { RelatorioAlunoService } from './relatorio-aluno.service';
import { CreateRelatorioAlunoDto, UpdateRelatorioAlunoDto, ListarRelatorioAlunoDto } from './dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { StatusRelatorio } from './entities/relatorio-aluno.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('Relatório - Alunos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('relatorio-aluno')
export class RelatorioAlunoController {
  constructor(private readonly relatorioAlunoService: RelatorioAlunoService) { }

  /**
   * ============================================================
   *                ENDPOINTS PARA COORDENAÇÃO
   * ============================================================
   */

  /**
   * Lista todos os alunos da modalidade relatório no evento atual
   * com seus respectivos status, quantidade de projetos e projetos já atribuídos.
   */
  @Get('coordenador/alunos-relatorio')
  @ApiOperation({ 
    summary: 'Lista alunos na modalidade relatório',
    description: 'Retorna lista paginada de alunos com seus status, quantidade de projetos e projetos atribuídos.'
  })
  @ApiQuery({ name: 'status', enum: StatusRelatorio, required: false, description: 'Filtro por status' })
  @ApiQuery({ name: 'nome', type: String, required: false, description: 'Filtro por nome do aluno' })
  @ApiQuery({ name: 'page', type: Number, required: false, example: 1, description: 'Número da página' })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 10, description: 'Quantidade por página' })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async listarAlunosRelatorio(
    @Query() filtros: ListarRelatorioAlunoDto,
  ) {
    return this.relatorioAlunoService.listarAlunosRelatorio(filtros);
  }

  /**
   * Atualiza os dados de um aluno na modalidade relatório.
   */
  @Put('coordenador/alunos-relatorio/:id')
  @ApiOperation({ 
    summary: 'Atualiza dados de um aluno na modalidade relatório',
    description: 'Permite atualizar a quantidade de projetos ou resetar o status do aluno.'
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID do registro em relatorio_aluno' })
  @ApiBody({ type: UpdateRelatorioAlunoDto })
  @ApiResponse({ status: 200, description: 'Registro atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async atualizarRelatorioAluno(
    @Param('id') id: string,
    @Body() updateRelatorioAlunoDto: UpdateRelatorioAlunoDto,
  ) {
    return this.relatorioAlunoService.atualizarRelatorioAluno(+id, updateRelatorioAlunoDto);
  }

  /**
   * Dispara a distribuição automática de projetos para todos os alunos
   * que já têm quantidade_projetos > 0 e status = 'pendente'.
   */
  @Post('coordenador/alunos-relatorio/distribuir')
  @ApiOperation({ 
    summary: 'Distribui projetos automaticamente',
    description: 'Distribuição cruzada: prioriza projetos de turmas diferentes, com baixa probabilidade permite projetos da mesma turma.'
  })
  @ApiResponse({ status: 200, description: 'Distribuição concluída com sucesso' })
  @ApiResponse({ status: 400, description: 'Nenhum projeto disponível' })
  @ApiResponse({ status: 404, description: 'Nenhum evento ativo encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async distribuirProjetos() {
    return this.relatorioAlunoService.distribuirProjetos();
  }

  /**
   * ============================================================
   *                ENDPOINTS PARA ALUNOS
   * ============================================================
   */

  /**
   * Retorna a lista de projetos atribuídos ao aluno logado.
   */
  @Get('aluno/relatorio/meus-projetos')
  @ApiOperation({ 
    summary: 'Lista projetos atribuídos ao aluno',
    description: 'Retorna todos os projetos que foram atribuídos ao aluno logado para relatório.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de projetos retornada com sucesso',
    schema: {
      example: {
        aluno: { id: 1, nome: 'João Silva', turma: 'informatica' },
        status: 'distribuido',
        quantidade_projetos: 2,
        total_atribuidos: 2,
        projetos: [
          {
            id: 1,
            titulo: 'Projeto A',
            descricao: 'Descrição do projeto',
            area: 'Ciências da Natureza',
            autores: [
              { id: 3, nome: 'Carlos', turma: 'enfermagem', tipo: 'autor_principal' }
            ],
            visualizado: false,
            data_atribuicao: '2026-07-09T10:00:00.000Z'
          }
        ]
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Aluno não encontrado na modalidade relatório' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async meusProjetos(
    @GetUser('userId') userId: number,
    @GetUser('role') role: string,
  ) {
    if (role !== 'aluno') {
      throw new ForbiddenException('Apenas alunos podem acessar esta rota.');
    }
    return this.relatorioAlunoService.meusProjetos(userId);
  }

  /**
   * Retorna o status atual do aluno na modalidade relatório.
   */
  @Get('aluno/relatorio/status')
  @ApiOperation({ 
    summary: 'Retorna status do aluno na modalidade relatório',
    description: 'Retorna status atual, quantidade de projetos e quantos já foram visualizados.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Status retornado com sucesso',
    schema: {
      example: {
        status: 'distribuido',
        quantidade_projetos: 3,
        total_atribuidos: 3,
        total_visualizados: 2,
        data_ativacao: '2026-07-01T00:00:00.000Z',
        data_envio: null
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Aluno não encontrado na modalidade relatório' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async meuStatus(
    @GetUser('userId') userId: number,
    @GetUser('role') role: string,
  ) {
    if (role !== 'aluno') {
      throw new ForbiddenException('Apenas alunos podem acessar esta rota.');
    }
    return this.relatorioAlunoService.meuStatus(userId);
  }
}