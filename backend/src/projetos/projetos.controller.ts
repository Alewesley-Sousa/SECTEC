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
  ParseIntPipe
} from '@nestjs/common';
import { ProjetosService } from './projetos.service';

// DTOs
import { CreateProjetoDto } from './dto/create-projeto.dto';
import { UpdateProjetoDto } from './dto/update-projeto.dto';
import { EnviarSolicitacaoDto } from './dto/enviar-solicitacao.dto'; 

// Auth & Guards
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; 
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ApiOperation, ApiResponse, ApiTags, ApiBody, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('projetos')
@ApiBearerAuth()
//@UseGuards(JwtAuthGuard)
@Controller('projetos')
export class ProjetosController {
  constructor(private readonly projetosService: ProjetosService) {}

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
    // if (role !== 'aluno') {
    //   throw new ForbiddenException('Apenas alunos podem criar projetos.');
    // }
    return this.projetosService.create(createProjetoDto, 425);
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
   // if (role !== 'aluno') {
     // throw new ForbiddenException('Apenas alunos autores podem solicitar orientação.');
 //   }

    // Chamada para o novo método que criamos no Service
    // Passamos o userId dinâmico do token e o array de IDs do Body
    return this.projetosService.enviarMultiplasSolicitacoes(109, dto.orientadoresIds);
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

  @Get(':id')
  @ApiOperation({ summary: 'Busca os detalhes de um projeto específico' })
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

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza informações do projeto' })
  async update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateProjetoDto: UpdateProjetoDto,
    @GetUser('userId') userId: number,
    @GetUser('role') role: string
  ) {
    return this.projetosService.update(id, updateProjetoDto, userId, role);
  }

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
