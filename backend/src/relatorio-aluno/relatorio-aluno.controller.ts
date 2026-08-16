import { Controller, Get, Post, Body, Patch, Param, Req, Delete, Query, Put, UseGuards, ForbiddenException, ParseIntPipe, UseInterceptors, UploadedFile, StreamableFile, Res } from '@nestjs/common';
import { RelatorioAlunoService } from './relatorio-aluno.service';
import { CreateRelatorioAlunoDto, UpdateRelatorioAlunoDto, ListarRelatorioAlunoDto, AtribuirProjetosDto, RemoverProjetosDto, AtualizarQuantidadeEmLoteDto, EnviarRelatorioMaterialDto, DevolverMaterialDto } from './dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { StatusRelatorio } from './entities/relatorio-aluno.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/decorators/roles.decorator'; // ou do arquivo correto
import { TipoRelatorioMaterial } from './entities/relatorio-material.entity';
import { mkdirSync } from 'fs';
import { extname, join } from 'path';
import { Response } from 'express';

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
      dto.forcarReducao
    );
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
    @GetUser('role') role: string
  ) {
    if (role !== 'coordenador') {
      throw new ForbiddenException('Apenas coordenadores podem atualizar registros de alunos na modalidade relatório.');
    }
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
   * Lista projetos disponíveis para atribuição manual a um aluno
   * (Apenas coordenadores podem executar)
   */
  @Get('coordenador/:relatorioId/projetos-disponiveis')
  @ApiOperation({
    summary: 'Lista projetos disponíveis para atribuição a um aluno',
    description: 'Retorna projetos do mesmo evento que ainda não foram atribuídos ao aluno. Suporta busca por título, descrição ou autor.'
  })
  @ApiParam({
    name: 'relatorioId',
    type: Number,
    description: 'ID do registro em relatorio_aluno',
    example: 1
  })
  @ApiQuery({
    name: 'search',
    type: String,
    required: false,
    description: 'Termo para buscar por título, descrição ou nome do autor'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de projetos disponíveis retornada com sucesso',
    schema: {
      example: [
        {
          id: 5,
          titulo: 'Projeto X',
          descricao: 'Descrição do projeto X',
          tema: { id: 2, nome: 'Ciências' },
          alunoAutor: { id: 15, nome: 'Maria Silva', turma: 'informatica' }
        }
      ]
    }
  })
  @ApiResponse({ status: 404, description: 'Relatório não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Apenas coordenadores podem executar esta ação' })
  async obterProjetosDisponiveis(
    @Param('relatorioId', ParseIntPipe) relatorioId: number,
    @GetUser('role') role: string,
    @Query('search') search?: string,
  ) {
    if (role !== 'coordenador') {
      throw new ForbiddenException('Apenas coordenadores podem executar esta ação.');
    }
    return this.relatorioAlunoService.obterProjetosDisponiveis(relatorioId, search);
  }

  // relatorio-aluno.controller.ts (adicionar na seção "ENDPOINTS PARA COORDENAÇÃO")

  /**
   * Lista os materiais enviados por todos os alunos da modalidade relatório
   * (Apenas coordenadores podem acessar)
   */
  @Get('coordenador/materiais')
  @ApiOperation({
    summary: 'Lista materiais enviados pelos alunos',
    description: 'Retorna alunos com seus materiais (vídeos e PDFs) para análise.'
  })
  @ApiQuery({ name: 'status', enum: StatusRelatorio, required: false })
  @ApiQuery({ name: 'nome', type: String, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false, example: 1 })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 10 })
  async listarMateriaisCoordenador(
    @Query('status') status?: StatusRelatorio,
    @Query('nome') nome?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @GetUser('role') role?: string,
  ) {
    if (role !== 'coordenador') {
      throw new ForbiddenException('Apenas coordenadores podem acessar.');
    }
    return this.relatorioAlunoService.listarMateriaisCoordenador({ status, nome, page, limit });
  }

  // relatorio-aluno.controller.ts

  @Get('coordenador/materiais/:id/pdf')
  @ApiOperation({
    summary: 'Serve o arquivo PDF do material',
    description: 'Retorna o arquivo PDF para visualização no navegador. Apenas coordenadores.'
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID do material' })
  @ApiResponse({ status: 200, description: 'Arquivo PDF servido com sucesso' })
  @ApiResponse({ status: 404, description: 'Material não encontrado ou não é PDF' })
  @ApiResponse({ status: 403, description: 'Apenas coordenadores podem acessar' })
  async servirPdfMaterial(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('role') role: string,
    @Res({ passthrough: true }) res: any,
  ) {
    if (role !== 'coordenador') {
      throw new ForbiddenException('Apenas coordenadores podem acessar.');
    }
    const { buffer, nomeArquivo } = await this.relatorioAlunoService.obterPdfMaterial(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${nomeArquivo}"`);
    res.setHeader('Content-Length', buffer.length);
    return new StreamableFile(buffer);
  }

  @Put('coordenador/materiais/:id/devolver')
  @ApiOperation({ summary: 'Devolve um material com justificativa' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: DevolverMaterialDto })
  async devolverMaterial(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DevolverMaterialDto,
    @GetUser('role') role: string,
  ) {
    if (role !== 'coordenador') throw new ForbiddenException('Apenas coordenadores podem devolver materiais.');
    return this.relatorioAlunoService.devolverMaterialCoordenador(id, dto.opiniao);
  }

  @Put('coordenador/alunos-relatorio/:id/finalizar')
  @ApiOperation({
    summary: 'Finaliza a avaliação de um aluno',
    description: 'Marca o relatório do aluno como finalizado, indicando que a coordenação concluiu a análise dos materiais enviados.'
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID do relatorio_aluno' })
  @ApiResponse({ status: 200, description: 'Relatório finalizado com sucesso' })
  @ApiResponse({ status: 400, description: 'Status atual não permite finalização' })
  @ApiResponse({ status: 404, description: 'Relatório não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Apenas coordenadores podem executar' })
  async finalizarAvaliacao(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('role') role: string,
  ) {
    if (role !== 'coordenador') {
      throw new ForbiddenException('Apenas coordenadores podem finalizar avaliações.');
    }
    return this.relatorioAlunoService.finalizarAvaliacao(id);
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


  @Post('aluno/relatorio/enviar')
  @Roles(UserRole.ALUNO)
  @ApiOperation({ summary: 'Envia um material (vídeo ou PDF) para o relatório do aluno' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: EnviarRelatorioMaterialDto })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = join(process.cwd(), 'tmp');
          mkdirSync(uploadDir, { recursive: true });
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async enviarMaterialRelatorio(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: EnviarRelatorioMaterialDto,
    @GetUser('userId') userId: number,
    @GetUser('role') role: string,
  ) {
    if (role !== 'aluno') throw new ForbiddenException('Apenas alunos podem enviar materiais.');
    const conteudo = dto.tipo === 'link' ? (dto.conteudo ?? '') : (file?.path ?? '');
    return this.relatorioAlunoService.enviarMaterialRelatorio(userId, dto.tipo as TipoRelatorioMaterial, conteudo, file);
  }

  @Delete('aluno/relatorio/cancelar/:id')
  @Roles(UserRole.ALUNO)
  @ApiOperation({ summary: 'Cancela o envio de um material do relatório' })
  async cancelarMaterialRelatorio(
    @Param('id', ParseIntPipe) materialId: number,
    @GetUser('userId') userId: number,
    @GetUser('role') role: string,
  ) {
    if (role !== 'aluno') throw new ForbiddenException('Apenas alunos podem cancelar materiais.');
    return this.relatorioAlunoService.cancelarMaterialRelatorio(materialId, userId);
  }

  @Get('aluno/relatorio/meus-materiais')
  @Roles(UserRole.ALUNO)
  async meusMateriais(@GetUser('userId') userId: number, @GetUser('role') role: string) {
    if (role !== 'aluno') throw new ForbiddenException('Apenas alunos podem acessar.');
    return this.relatorioAlunoService.meusMateriais(userId);
  }
}