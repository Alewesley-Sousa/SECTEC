import { Injectable, NotFoundException } from '@nestjs/common';
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

  async create(dto: CreateProjetoDto): Promise<Projeto> {
    // Mapeamos os IDs simples do DTO para objetos que o TypeORM entende
    const novoProjeto = this.projetoRepository.create({
      ...dto,
      evento: { id: dto.evento } as any,
      alunoAutor: { id: dto.alunoAutor } as any,
    });
    
    return await this.projetoRepository.save(novoProjeto);
  }

  async findAll(): Promise<Projeto[]> {
    return await this.projetoRepository.find();
  }

  async findOne(id: number): Promise<Projeto> {
    const projeto = await this.projetoRepository.findOne({ where: { id } });
    if (!projeto) {
      throw new NotFoundException(`Projeto #${id} não encontrado`);
    }
    return projeto;
  }

  async update(id: number, dto: UpdateProjetoDto): Promise<Projeto> {
    const projeto = await this.findOne(id);
    
    // Preparar os dados de atualização tratando as relações se elas existirem no DTO
    const dadosAtualizados = {
      ...dto,
      ...(dto.evento && { evento: { id: dto.evento } as any }),
      ...(dto.alunoAutor && { alunoAutor: { id: dto.alunoAutor } as any }),
    };

    this.projetoRepository.merge(projeto, dadosAtualizados);
    return await this.projetoRepository.save(projeto);
  }

  async remove(id: number): Promise<void> {
    const projeto = await this.findOne(id);
    await this.projetoRepository.remove(projeto);
  }
}
