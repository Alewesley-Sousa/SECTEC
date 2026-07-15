import { Controller, Get, Post, Body, Patch, Param, Req, Delete, Query, Put, UseGuards, ForbiddenException, ParseIntPipe } from '@nestjs/common';
import { RelatorioAlunoService } from './relatorio-aluno.service';
import { CreateRelatorioAlunoDto, UpdateRelatorioAlunoDto, ListarRelatorioAlunoDto, AtribuirProjetosDto, RemoverProjetosDto, AtualizarQuantidadeEmLoteDto } from './dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { StatusRelatorio } from './entities/relatorio-aluno.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('Relatório - Alunos')
@ApiBearerAuth()
@ApiBearerAuth('token-jwt')
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
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID do registro em relatorio_aluno',
    example: 1
  })
  @ApiBody({
    type: UpdateRelatorioAlunoDto,
    examples: {
      'Atualizar quantidade de projetos': {
        summary: 'Exemplo 1: Atualizar quantidade de projetos',
        description: 'Define a quantidade de projetos que o aluno deve receber',
        value: {
          quantidade_projetos: 3
        }
      },
      'Atualizar status': {
        summary: 'Exemplo 2: Atualizar status',
        description: 'Altera o status do aluno na modalidade relatório',
        value: {
          status: 'distribuido'
        }
      },
      'Atualizar ambos': {
        summary: 'Exemplo 3: Atualizar quantidade e status',
        description: 'Atualiza tanto a quantidade de projetos quanto o status',
        value: {
          quantidade_projetos: 2,
          status: 'pendente'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Registro atualizado com sucesso',
    schema: {
      example: {
        mensagem: 'Registro atualizado com sucesso!',
        data: {
          id: 1,
          aluno: {
            id: 10,
            nome: 'João Silva',
            email: 'joao.silva@aluno.com',
            turma: 'informatica'
          },
          evento: {
            id: 5,
            nome: 'Evento 2026'
          },
          quantidade_projetos: 3,
          status: 'distribuido',
          data_ativacao: '2026-07-14T00:00:00.000Z',
          data_envio: null,
          created_at: '2026-07-14T00:00:00.000Z'
        }
      }
    }
  })
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

  // relatorio-aluno.controller.ts (adicionar ao final da seção de coordenação)

  /**
   * Atribui projetos manualmente a um aluno
   * (Apenas coordenadores podem executar)
   */
  @Post('coordenador/:relatorioId/projetos')
  @ApiOperation({
    summary: 'Atribui projetos manualmente a um aluno',
    description: 'Permite que a coordenação atribua projetos específicos a um aluno, respeitando o limite definido.'
  })
  @ApiParam({
    name: 'relatorioId',
    type: Number,
    description: 'ID do registro em relatorio_aluno',
    example: 1
  })
  @ApiBody({
    type: AtribuirProjetosDto,
    examples: {
      'Atribuir três projetos': {
        summary: 'Atribuir 3 projetos',
        value: { projetosIds: [1, 2, 3] }
      },
      'Atribuir um projeto': {
        summary: 'Atribuir 1 projeto',
        value: { projetosIds: [5] }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Projetos atribuídos com sucesso',
    schema: {
      example: {
        mensagem: 'Projetos atribuídos com sucesso.',
        data: {
          id: 1,
          aluno: {
            id: 10,
            nome: 'João Silva',
            email: 'joao.silva@aluno.com',
            turma: 'informatica'
          },
          quantidade_projetos: 3,
          total_atribuidos: 3,
          status: 'distribuido',
          projetos: [
            {
              id: 1,
              titulo: 'Projeto A',
              area: 'Ciências da Natureza',
              visualizado: false,
              data_atribuicao: '2026-07-14T10:00:00.000Z'
            }
          ]
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Requisição inválida (limite excedido, duplicidade, etc.)' })
  @ApiResponse({ status: 404, description: 'Relatório ou projeto não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Apenas coordenadores podem executar esta ação' })
  async atribuirProjetosManualmente(
    @Param('relatorioId', ParseIntPipe) relatorioId: number,
    @Body() body: AtribuirProjetosDto,
    @GetUser('role') role: string,
  ) {
    if (role !== 'coordenador') {
      throw new ForbiddenException('Apenas coordenadores podem executar esta ação.');
    }
    return this.relatorioAlunoService.atribuirProjetosManualmente(relatorioId, body.projetosIds);
  }

  // src/relatorio-aluno/relatorio-aluno.controller.ts (adicionar na seção de coordenação)

  /**
   * Remove projetos manualmente de um aluno
   * (Apenas coordenadores podem executar)
   */
  @Delete('coordenador/:relatorioId/projetos')
  @ApiOperation({
    summary: 'Remove projetos manualmente de um aluno',
    description: 'Permite que a coordenação remova projetos específicos de um aluno, em lote.'
  })
  @ApiParam({
    name: 'relatorioId',
    type: Number,
    description: 'ID do registro em relatorio_aluno',
    example: 1
  })
  @ApiBody({
    type: RemoverProjetosDto,
    examples: {
      'Remover dois projetos': {
        summary: 'Remover 2 projetos',
        value: { projetosIds: [1, 2] }
      },
      'Remover um projeto': {
        summary: 'Remover 1 projeto',
        value: { projetosIds: [5] }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Projetos removidos com sucesso',
    schema: {
      example: {
        mensagem: 'Projetos removidos com sucesso.',
        data: {
          id: 1,
          aluno: {
            id: 10,
            nome: 'João Silva',
            email: 'joao.silva@aluno.com',
            turma: 'informatica'
          },
          quantidade_projetos: 3,
          total_atribuidos: 1,
          status: 'pendente',
          projetos: [
            {
              id: 2,
              titulo: 'Projeto B',
              area: 'Matemática',
              visualizado: false,
              data_atribuicao: '2026-07-14T10:00:00.000Z'
            }
          ]
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Requisição inválida (projeto não atribuído, lista vazia, etc.)' })
  @ApiResponse({ status: 404, description: 'Relatório não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Apenas coordenadores podem executar esta ação' })
  async removerProjetosManualmente(
    @Param('relatorioId', ParseIntPipe) relatorioId: number,
    @Body() body: RemoverProjetosDto,
    @GetUser('role') role: string,
  ) {
    if (role !== 'coordenador') {
      throw new ForbiddenException('Apenas coordenadores podem executar esta ação.');
    }
    return this.relatorioAlunoService.removerProjetosManualmente(relatorioId, body.projetosIds);
  }





/**
 * Atualiza a quantidade de projetos em lote para alunos da modalidade relatório
 * (Apenas coordenadores podem executar)
 */
@Put('coordenador/alunos-relatorio/quantidade')
@ApiOperation({
  summary: 'Atualiza quantidade de projetos em lote',
  description: 'Permite atualizar a quantidade de projetos para todos os alunos ou para uma lista específica.'
})
@ApiBody({
  type: AtualizarQuantidadeEmLoteDto,
  examples: {
    'Atualizar para todos (geral = true)': {
      summary: 'Aplicar para todos os alunos',
      value: {
        quantidade_projetos: 2,
        geral: true,
      }
    },
    'Atualizar para lista específica (geral = false)': {
      summary: 'Aplicar para alunos específicos',
      value: {
        quantidade_projetos: 3,
        geral: false,
        ids: [1, 2, 5, 10]
      }
    }
  }
})
@ApiResponse({
  status: 200,
  description: 'Quantidade atualizada com sucesso',
  schema: {
    example: {
      mensagem: '4 aluno(s) atualizado(s) com sucesso.',
      quantidade_definida: 2,
      alunos_atualizados: [
        {
          id: 1,
          aluno: { id: 10, nome: 'João Silva', email: 'joao@aluno.com', turma: 'informatica' },
          quantidade_projetos: 2,
          total_atribuidos: 1,
          status: 'pendente'
        }
      ]
    }
  }
})
@ApiResponse({ status: 400, description: 'Requisição inválida' })
@ApiResponse({ status: 404, description: 'Relatórios não encontrados' })
@ApiResponse({ status: 401, description: 'Não autorizado' })
@ApiResponse({ status: 403, description: 'Apenas coordenadores podem executar esta ação' })
async atualizarQuantidadeEmLote(
  @Body() dto: AtualizarQuantidadeEmLoteDto,
  @GetUser('role') role: string,
) {
  if (role !== 'coordenador') {
    throw new ForbiddenException('Apenas coordenadores podem executar esta ação.');
  }
  return this.relatorioAlunoService.atualizarQuantidadeEmLote(
    dto.quantidade_projetos,
    dto.geral,
    dto.ids,
  );
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

/**
* Endpoint para execução manual da verificação de alunos sem projetos
* (Apenas coordenadores podem executar)
*/
@Post('coordenador/verificar-alunos-sem-projetos')
@ApiOperation({
  summary: 'Verifica alunos sem projetos e cria registros em relatorio_aluno',
  description: 'Executa manualmente a verificação de alunos que não possuem projetos.'
})
@ApiResponse({ status: 200, description: 'Processamento concluído com sucesso' })
@ApiResponse({ status: 401, description: 'Não autorizado' })
@ApiResponse({ status: 403, description: 'Apenas coordenadores podem executar esta ação' })
async verificarAlunosSemProjetos(
  @GetUser('role') role: string,
) {
  if (role !== 'coordenador') {
    throw new ForbiddenException('Apenas coordenadores podem executar esta ação.');
  }
  return this.relatorioAlunoService.verificarAlunosSemProjetos();
}
}