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

// Auth & Guards
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; 
import { GetUser } from '../auth/decorators/get-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('projetos')
export class ProjetosController {
  constructor(private readonly projetosService: ProjetosService) {}

  // ===========================================================================
  // ROTAS DE CRIAÇÃO E AÇÕES ESPECÍFICAS
  // ===========================================================================

  /**
   * Realiza a criação de um novo projeto.
   * Acesso restrito a usuários com cargo de 'aluno'.
   */
  @Post()
  async create(
    @Body() createProjetoDto: CreateProjetoDto, 
    @GetUser('sub') userId: number,
    @GetUser('role_cargo') role: string
  ) {
    if (role !== 'aluno') {
      throw new ForbiddenException('Apenas alunos podem criar projetos.');
    }
    return this.projetosService.create(createProjetoDto, userId);
  }

  /**
   * Envia uma solicitação de orientação para um professor.
   * O aluno autor solicita um orientador específico para seu projeto mais recente.
   */
  @Post('solicitar-orientador')
  async solicitarOrientador(
    @GetUser('sub') userId: number,
    @GetUser('role_cargo') role: string,
    @Body('orientadorId', ParseIntPipe) orientadorId: number
  ) {
    if (role !== 'aluno') {
      throw new ForbiddenException('Apenas alunos autores podem solicitar orientação.');
    }
    return this.projetosService.enviarSolicitacaoOrientador(userId, orientadorId);
  }

  // ===========================================================================
  // ROTAS DE CONSULTA (LISTAGEM E DETALHES)
  // ===========================================================================

  /**
   * Listagem dinâmica baseada no cargo do usuário:
   * - Aluno: Vê seus próprios projetos.
   * - Orientador: Vê projetos que orienta (aceitos).
   * - Coordenador: Vê todos os projetos agrupados por evento.
   */
  @Get()
  async findAll(
    @GetUser('sub') userId: number,
    @GetUser('role_cargo') role: string 
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

  /**
   * Busca os detalhes de um projeto específico.
   * Aplica regra de visibilidade: alunos só acessam seus próprios projetos.
   */
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number, 
    @GetUser('sub') userId: number,
    @GetUser('role_cargo') role: string
  ) {
    const projeto = await this.projetosService.findOne(id);

    // Validação de Propriedade: Aluno não autor não pode visualizar
    if (role === 'aluno' && projeto.alunoAutor.id !== userId) {
      throw new ForbiddenException('Acesso negado: você não possui vínculo com este projeto.');
    }

    return projeto;
  }

  // ===========================================================================
  // ROTAS DE ATUALIZAÇÃO E EXCLUSÃO
  // ===========================================================================

  /**
   * Atualiza informações do projeto.
   * A lógica de quem pode editar o quê (Dono vs Coordenador) é tratada no Service.
   */
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateProjetoDto: UpdateProjetoDto,
    @GetUser('sub') userId: number,
    @GetUser('role_cargo') role: string
  ) {
    return this.projetosService.update(id, updateProjetoDto, userId, role);
  }

  /**
   * Remove um projeto do sistema.
   * Requer que o usuário seja o autor ou possua cargo de coordenador.
   */
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number, 
    @GetUser('sub') userId: number,
    @GetUser('role_cargo') role: string
  ) {
    return this.projetosService.remove(id, userId, role);
  }
}
