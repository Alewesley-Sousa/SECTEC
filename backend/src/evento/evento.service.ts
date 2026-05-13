import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'; // 1. Adicionado BadRequestException
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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



async selecionarTema(temaId: number, professorId: number) {
    // 1. Buscamos o tema (importante carregar a relação 'orientadores')
    const tema = await this.temaRepository.findOne({
      where: { id: temaId },
      relations: ['orientadores']
    });

    if (!tema) throw new NotFoundException('Tema não encontrado');

    // 2. Buscamos o professor - Agora o this.userRepository existe!
    const professor = await this.userRepository.findOneBy({ id: professorId });

    // Verificamos o cargo usando o UserRole importado
    if (!professor || professor.role_cargo !== UserRole.ORIENTADOR) {
      throw new BadRequestException('Usuário deve ser um orientador.');
    }

    // 3. Adicionamos o professor à lista do tema (Tabela Pivot)
    const jaSelecionou = tema.orientadores.some(p => p.id === professorId);
    if (!jaSelecionou) {
      tema.orientadores.push(professor);
      await this.temaRepository.save(tema);
    }

    return { message: 'Tema selecionado com sucesso!' };
  }


}
