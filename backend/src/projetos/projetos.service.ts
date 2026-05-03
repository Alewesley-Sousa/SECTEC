import { 
  Injectable, 
  NotFoundException, 
  ForbiddenException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Projeto } from './entities/projeto.entity';
import { CreateProjetoDto } from './dto/create-projeto.dto';
import { UpdateProjetoDto } from './dto/update-projeto.dto';

@Injectable()
export class ProjetosService {
  constructor(
    @InjectRepository(Projeto)
    private readonly projetoRepository: Repository<Projeto>,
  ) {}

  async create(dto: CreateProjetoDto, userId: number): Promise<Projeto> {
    const novoProjeto = this.projetoRepository.create({
      ...dto,
      evento: { id: dto.evento } as any,
      alunoAutor: { id: userId } as any, // Resolve o erro de tipagem DeepPartial
    });
    return await this.projetoRepository.save(novoProjeto);
  }

  /**
   * - Aluno: Vê apenas os seus.
   * - Coordenador: Vê todos.
   * - Orientador: Erro 403 (Não lista todos).
   */
  async findAll(userId: number, role: string): Promise<Projeto[]> {
    if (role === 'orientador') {
      throw new ForbiddenException('Orientadores não podem listar todos os projetos.');
    }

    const filtro = role === 'coordenador' ? {} : { alunoAutor: { id: userId } };

    return await this.projetoRepository.find({
      where: filtro,
      relations: ['evento', 'alunoAutor'],
    });
  }

  async findOne(id: number): Promise<Projeto> {
    const projeto = await this.projetoRepository.findOne({
      where: { id },
      relations: ['alunoAutor', 'evento'],
    });

    if (!projeto) {
      throw new NotFoundException(`Projeto #${id} não encontrado`);
    }
    return projeto;
  }

  /**
   * - Apenas dono ou coordenador editam.
   */
  async update(id: number, dto: UpdateProjetoDto, userId: number, role: string): Promise<Projeto> {
    const projeto = await this.findOne(id);

    if (role !== 'coordenador' && projeto.alunoAutor.id !== userId) {
      throw new ForbiddenException('Sem permissão para editar este projeto.');
    }

    const dadosAtualizados = {
      ...dto,
      ...(dto.evento && { evento: { id: dto.evento } as any }),
      // Mantém o autor original do banco de dados
      alunoAutor: { id: projeto.alunoAutor.id } as any,
    };

    this.projetoRepository.merge(projeto, dadosAtualizados);
    return await this.projetoRepository.save(projeto);
  }

  /**
   * - Apenas dono ou coordenador removem.
   */
  async remove(id: number, userId: number, role: string): Promise<void> {
    const projeto = await this.findOne(id);

    if (role !== 'coordenador' && projeto.alunoAutor.id !== userId) {
      throw new ForbiddenException('Sem permissão para remover este projeto.');
    }

    await this.projetoRepository.remove(projeto);
  }
}
