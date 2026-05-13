import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards} from '@nestjs/common';
import { EventoService } from './evento.service';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { CreateTemasDto } from './dto/create-tema.dto'; // Certifique-se de ter criado este DTO
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; 
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity'; // 👈 ADICIONE ESTA LINHA
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
@ApiTags('evento')
@Controller('evento')
export class EventoController {
  constructor(private readonly eventoService: EventoService) {}

  @Post()
  create(@Body() createEventoDto: CreateEventoDto) {
    return this.eventoService.create(createEventoDto);
  }

  /**
   * Adiciona um novo eixo temático a um evento específico via formulário
   * Rota: POST /evento/:id/temas
   */
@Post(':id/temas')
addTemas(
  @Param('id', ParseIntPipe) id: number, 
  @Body() createTemasDto: CreateTemasDto
) {
  // Agora passamos o plural para o service
  return this.eventoService.addTemas(id, createTemasDto);
}


  @Get()
  findAll() {
    return this.eventoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.eventoService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateEventoDto: UpdateEventoDto
  ) {
    return this.eventoService.update(id, updateEventoDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.eventoService.remove(id);
  }
  
  
  
  
  
  
  
  // POST /evento/temas/:temaId/selecionar
@Post('temas/sincronizar')
@ApiOperation({ 
  summary: 'Sincroniza os temas do orientador', 
  description: 'Envia uma lista completa de IDs. Os temas que não estiverem na lista serão removidos e os novos serão adicionados.' 
})
@ApiResponse({ status: 201, description: 'Temas sincronizados com sucesso.' })
@ApiResponse({ status: 400, description: 'Dados inválidos ou usuário não é orientador.' })
// Aqui você define o corpo manualmente para o Swagger
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      temasIds: {
        type: 'array',
        items: { type: 'number' },
        description: 'Lista de IDs dos temas selecionados',
        example: [1, 2, 3]
      }
    }
  }
})
//@UseGuards(JwtAuthGuard)
async sincronizar(
  @Body('temasIds') temasIds: number[], // Espera um array: [1, 2, 3]
  @GetUser() user: User
) {
  // Usamos o ID do orientador logado para garantir que ele só mexa nos temas dele
  return await this.eventoService.sincronizarTemas(51, temasIds);
}


}
