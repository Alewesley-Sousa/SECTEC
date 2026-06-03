import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  ParseIntPipe, 
  UseGuards 
} from '@nestjs/common';
import { EventoService } from './evento.service';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { CreateTemasDto } from './dto/create-tema.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; 
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { ApiOperation, ApiResponse, ApiTags, ApiBody, ApiParam } from '@nestjs/swagger';
// Remova o "Param as ApiParam" que estava dando erro

@ApiTags('evento')
@Controller('evento')
  @UseGuards(JwtAuthGuard) // Comentado para testes iniciais
export class EventoController {
  constructor(private readonly eventoService: EventoService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo evento com cronograma completo' })
  @ApiResponse({ status: 201, description: 'Evento criado com sucesso.' })
  create(@Body() createEventoDto: CreateEventoDto) {
    return this.eventoService.create(createEventoDto);
  }

  @Post(':id/temas')
  @ApiOperation({ summary: 'Adiciona eixos temáticos ao evento' })
  addTemas(
    @Param('id', ParseIntPipe) id: number, 
    @Body() createTemasDto: CreateTemasDto
  ) {
    return this.eventoService.addTemas(id, createTemasDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os eventos cadastrados' })
  findAll() {
    return this.eventoService.findAll();
  }

  @Get('atual/vigente')
  @ApiOperation({ summary: 'Busca o evento mais recente do ano atual' })
  findAtual() {
    return this.eventoService.eventoAtual();
  }

  @Get('orientador/meus-temas')
  @ApiOperation({ summary: 'Lista os temas selecionados pelo orientador logado' })
  findMeusTemas(@GetUser('userId') orientadorId: number) {
    return this.eventoService.findTemasDoOrientador(orientadorId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca detalhes de um evento específico' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.eventoService.findOne(id);
  }


// modulos/eventos/evento.controller.ts

@Get('temas/:id/professores')
@ApiOperation({ 
  summary: 'Busca professores por tema', 
  description: 'Retorna todos os orientadores vinculados a um tema específico.' 
})
@ApiResponse({ status: 200, description: 'Lista de professores retornada com sucesso.' })
async getProfessoresByTema(@Param('id', ParseIntPipe) id: number) {
  return await this.eventoService.findProfessoresPorTema(id);
}





  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza dados e prazos de um evento' })
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateEventoDto: UpdateEventoDto
  ) {
    return this.eventoService.update(id, updateEventoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desativa um evento (Exclusão lógica)' }) // Texto atualizado
  @ApiResponse({ status: 200, description: 'Evento marcado como inativo.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.eventoService.remove(id);
  }


  @Post('temas/sincronizar')
  @ApiOperation({ 
    summary: 'Sincroniza os temas do orientador', 
    description: 'Envia uma lista completa de IDs de temas para o orientador.' 
  })
  @ApiResponse({ status: 201, description: 'Temas sincronizados com sucesso.' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        temasIds: {
          type: 'array',
          items: { type: 'number' },
          example: [1, 2, 3]
        }
      }
    }
  })
  async sincronizar(
    @Body('temasIds') temasIds: number[],
    @GetUser('userId') orientadorId: number,
  ) {
    return await this.eventoService.sincronizarTemas(orientadorId, temasIds);
  }
  
  
  
  
    @Delete('temas/:id')
  @ApiOperation({ 
    summary: 'Remove um tema do evento', 
    description: 'Deleta um eixo temático caso não haja orientadores ou projetos vinculados a ele.' 
  })
  @ApiResponse({ status: 200, description: 'Tema removido com sucesso.' })
  @ApiResponse({ status: 400, description: 'Tema possui dependências ativas no sistema e não pode ser apagado.' })
  @ApiResponse({ status: 404, description: 'Tema não encontrado.' })
  @ApiParam({ name: 'id', description: 'ID do tema que deseja remover', type: Number })
  async removeTema(@Param('id', ParseIntPipe) id: number) {
    return await this.eventoService.removeTema(id);
  }

     
}
