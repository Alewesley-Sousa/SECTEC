import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards, 
  ForbiddenException 
} from '@nestjs/common';
import { ProjetosService } from './projetos.service';
import { CreateProjetoDto } from './dto/create-projeto.dto';
import { UpdateProjetoDto } from './dto/update-projeto.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; 
import { GetUser } from '../auth/decorators/get-user.decorator';

@UseGuards(JwtAuthGuard) // Protege todas as rotas (precisa de Token JWT)
@Controller('projetos')
export class ProjetosController {
  constructor(private readonly projetosService: ProjetosService) {}

  @Post()
  create(
    @Body() createProjetoDto: CreateProjetoDto, 
    @GetUser('sub') userId: number
  ) {
    // Apenas alunos criam projetos (pode-se adicionar um Guard de Role aqui depois)
    return this.projetosService.create(createProjetoDto, userId);
  }

  @Get()
  findAll(
    @GetUser('sub') userId: number,
    @GetUser('role') role: string // Captura se é 'aluno', 'coordenador' ou 'orientador'
  ) {
    // O Service filtrará os projetos se for aluno, ou mostrará tudo se for coordenador
    return this.projetosService.findAll(userId, role);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string, 
    @GetUser('sub') userId: number,
    @GetUser('role') role: string
  ) {
    const projeto = await this.projetosService.findOne(+id);

    /**
     * REGRA DE VISIBILIDADE UNITÁRIA:
     * - Coordenador e Orientador: Podem ver qualquer projeto.
     * - Aluno: Só pode ver se for o autor.
     */
    if (role === 'aluno' && projeto.alunoAutor.id !== userId) {
      throw new ForbiddenException('Acesso negado: você não é o autor deste projeto.');
    }

    return projeto;
  }

  @Patch(':id')
  update(
    @Param('id') id: string, 
    @Body() updateProjetoDto: UpdateProjetoDto,
    @GetUser('sub') userId: number,
    @GetUser('role') role: string
  ) {
    // Passamos o cargo para o service permitir a edição por Aluno(Dono) ou Coordenador
    return this.projetosService.update(+id, updateProjetoDto, userId, role);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string, 
    @GetUser('sub') userId: number,
    @GetUser('role') role: string
  ) {
    // Passamos o cargo para o service permitir a exclusão por Aluno(Dono) ou Coordenador
    return this.projetosService.remove(+id, userId, role);
  }
}
