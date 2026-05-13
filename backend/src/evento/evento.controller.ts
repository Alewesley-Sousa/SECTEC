import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { EventoService } from './evento.service';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { CreateTemaDto } from './dto/create-tema.dto'; // Certifique-se de ter criado este DTO

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
  addTema(
    @Param('id', ParseIntPipe) id: number, 
    @Body() createTemaDto: CreateTemaDto
  ) {
    return this.eventoService.addTema(id, createTemaDto);
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
}
