import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards} from '@nestjs/common';
import { EventoService } from './evento.service';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { CreateTemasDto } from './dto/create-tema.dto'; // Certifique-se de ter criado este DTO
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; 
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity'; // 👈 ADICIONE ESTA LINHA

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
@Post('temas/:temaId/selecionar')
  //@UseGuards(JwtAuthGuard) // Protege a rota: só acessa quem tem token válido
  async selecionar(
    @Param('temaId', ParseIntPipe) temaId: number,
    @GetUser() user: User // Extrai o usuário logado diretamente do Token
  ) {
    // Agora passamos o ID do usuário que o Decorator encontrou
    return await this.eventoService.selecionarTema(temaId, 51);
  }

}
