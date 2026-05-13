import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'; // 1. Adicionado BadRequestException
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { CreateTemasDto } from './dto/create-tema.dto';
import { Evento } from './entities/evento.entity';
import { TemaEvento } from './entities/tema-evento.entity';
import { User, UserRole } from '../users/entities/user.entity'; // 2. Adicionado User e UserRole


@Injectable()
export class EventoService {
  constructor(
    @InjectRepository(Evento)
    private readonly eventoRepository: Repository<Evento>,
    
    @InjectRepository(TemaEvento)
    private readonly temaRepository: Repository<TemaEvento>,
    
    @InjectRepository(User) // 3. Injetando o repositório de usuários
    private readonly userRepository: Repository<User>,
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
  async addTemas(eventoId: number, createTemasDto: CreateTemasDto) {
  const evento = await this.findOne(eventoId);

  // Criamos um array de objetos "Tema"
  const novosTemas = createTemasDto.nomes.map(nome => {
    return this.temaRepository.create({
      nome,
      evento,
    });
  });

  // Salva todos de uma vez
  return await this.temaRepository.save(novosTemas);
}



async sincronizarTemas(professorId: number, temasIds: number[]) {
  // 1. Buscamos o professor carregando a relação da tabela pivot
  const professor = await this.userRepository.findOne({
    where: { id: professorId },
    relations: ['temasSelecionados']
  });

  if (!professor || professor.role_cargo !== UserRole.ORIENTADOR) {
    throw new BadRequestException('Orientador não encontrado ou cargo inválido.');
  }

  // 2. Buscamos todos os temas que vieram no array de IDs
  const novosTemas = await this.temaRepository.findBy({
    id: In(temasIds)
  });

  // 3. O Pulo do Gato: Substituímos o array antigo pelo novo
  // O TypeORM detecta a diferença e faz os DELETEs e INSERTs sozinho
  professor.temasSelecionados = novosTemas;

  // 4. Salvamos o professor com a nova lista
  await this.userRepository.save(professor);

  return {
    message: 'Temas sincronizados com sucesso',
    totalSelecionado: novosTemas.length
  };
}

}
