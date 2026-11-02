import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Area } from './entities/area.entity';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';

@Injectable()
export class AreasService {
  constructor(@InjectRepository(Area) private readonly areas: Repository<Area>) {}

  findAll() {
    return this.areas.find({ order: { nome: 'ASC' } });
  }

  async findOne(id: number) {
    const area = await this.areas.findOne({ where: { id } });
    if (!area) throw new NotFoundException(`Área #${id} não encontrada.`);
    return area;
  }

  async create(dto: CreateAreaDto) {
    const nome = dto.nome.trim();
    if (await this.areas.exists({ where: { nome } })) {
      throw new ConflictException(`Já existe uma área chamada "${nome}".`);
    }
    return this.areas.save(this.areas.create({ nome, descricao: dto.descricao?.trim() || null }));
  }

  async update(id: number, dto: UpdateAreaDto) {
    const area = await this.findOne(id);
    if (dto.nome !== undefined) {
      const nome = dto.nome.trim();
      if (await this.areas.exists({ where: { nome } }) && nome !== area.nome) {
        throw new ConflictException(`Já existe uma área chamada "${nome}".`);
      }
      area.nome = nome;
    }
    if (dto.descricao !== undefined) area.descricao = dto.descricao.trim() || null;
    return this.areas.save(area);
  }

  async remove(id: number) {
    const area = await this.areas.findOne({ where: { id }, relations: { projetos: true } });
    if (!area) throw new NotFoundException(`Área #${id} não encontrada.`);
    if (area.projetos.length) {
      throw new ConflictException('Não é possível excluir uma área vinculada a projetos.');
    }
    await this.areas.remove(area);
    return { message: `Área "${area.nome}" removida com sucesso.` };
  }
}
