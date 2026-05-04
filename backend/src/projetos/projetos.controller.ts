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
import { CreateProjetoDto } from './dto/create-projeto.dto';
import { UpdateProjetoDto } from './dto/update-projeto.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; 
import { GetUser } from '../auth/decorators/get-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('projetos')
export class ProjetosController {
  constructor(private readonly projetosService: ProjetosService) {}

  /**
   * Criação de projeto - Restrito a alunos
   */
  @Post()
  create(
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
   * Listagem Inteligente:
   * Chama o método específico baseado no cargo do usuário logado.
   */
  @Get()
  findAll(
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
   * Busca um projeto específico com regra de visibilidade
   */
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number, 
    @GetUser('sub') userId: number,
    @GetUser('role_cargo') role: string
  ) {
    const projeto = await this.projetosService.findOne(id);

    // Se for aluno, só vê se for o dono (autor)
    if (role === 'aluno' && projeto.alunoAutor.id !== userId) {
      throw new ForbiddenException('Acesso negado: você não é o autor deste projeto.');
    }

    return projeto;
  }

  /**
   * Rota para solicitar orientador
   * Recebe o ID do orientador no corpo da requisição
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

  /**
   * Atualização de projeto
   */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateProjetoDto: UpdateProjetoDto,
    @GetUser('sub') userId: number,
    @GetUser('role_cargo') role: string
  ) {
    return this.projetosService.update(id, updateProjetoDto, userId, role);
  }

  /**
   * Remoção de projeto
   */
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number, 
    @GetUser('sub') userId: number,
    @GetUser('role_cargo') role: string
  ) {
    return this.projetosService.remove(id, userId, role);
  }
}
