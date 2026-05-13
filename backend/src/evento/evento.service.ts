import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { CreateTemaDto } from './dto/create-tema.dto';
import { Evento } from './entities/evento.entity';
import { TemaEvento } from './entities/tema-evento.entity';

@Injectable()
export class EventoService {
  constructor(
    @InjectRepository(Evento)
    private readonly eventoRepository: Repository<Evento>,
    
    @InjectRepository(TemaEvento)
    private readonly temaRepository: Repository<TemaEvento>,
  ) {}

  async create(createEventoDto: CreateEventoDto) {
    const novoEvento = this.eventoRepository.create(createEventoDto);
    return await this.eventoRepository.save(novoEvento);
  }

  async findAll() {
    return await this.eventoRepository.find({
      relations: ['temas'], // Traz os eixos temáticos junto se precisar
    });
  }

  async findOne(id: number) {
    const evento = await this.eventoRepository.findOne({
      where: { id },
      relations: ['temas', 'coordenador'],
    });

    if (!evento) {
      throw new NotFoundException(`Evento com ID ${id} não encontrado`);
    }

    return evento;
  }

  async update(id: number, updateEventoDto: UpdateEventoDto) {
    const evento = await this.findOne(id); // Garante que existe
    this.eventoRepository.merge(evento, updateEventoDto);
    return await this.eventoRepository.save(evento);
  }

  async remove(id: number) {
    const evento = await this.findOne(id);
    return await this.eventoRepository.remove(evento);
  }

  // Novo método para resolver o erro do Controller
  async addTema(eventoId: number, createTemaDto: CreateTemaDto) {
    const evento = await this.findOne(eventoId); // Valida se o evento existe

    const novoTema = this.temaRepository.create({
      nome: createTemaDto.nome,
      evento: evento, // Associa o objeto do evento
    });

    return await this.temaRepository.save(novoTema);
  }
}
