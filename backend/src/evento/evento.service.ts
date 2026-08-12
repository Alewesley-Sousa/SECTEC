import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Between, Repository } from 'typeorm';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { CreateTemasDto } from './dto/create-tema.dto';
import { Evento, EventoStatus } from './entities/evento.entity';
import { TemaEvento } from './entities/tema-evento.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { ProjetoOrientador } from '../projetos/entities/projeto-orientador.entity';

@Injectable()
export class EventoService {
  constructor(
    @InjectRepository(Evento)
    private readonly eventoRepository: Repository<Evento>,
    @InjectRepository(TemaEvento)
    private readonly temaRepository: Repository<TemaEvento>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ProjetoOrientador)
    private readonly projetoOrientadorRepository: Repository<ProjetoOrientador>,
  ) {}

  // ──── CRUD Básico ──────────────────────────────────────────────
  async create(createEventoDto: CreateEventoDto) {
    const novoEvento = this.eventoRepository.create(createEventoDto);
    return await this.eventoRepository.save(novoEvento);
  }

  async findAll() {
    return await this.eventoRepository.find({
      relations: ['temas'],
      order: { criadoEm: 'DESC' },
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
    const evento = await this.findOne(id);
    this.eventoRepository.merge(evento, updateEventoDto);
    return await this.eventoRepository.save(evento);
  }

  async remove(id: number) {
    const evento = await this.findOne(id);
    evento.status = EventoStatus.INATIVO;
    await this.eventoRepository.save(evento);
    return { message: `Evento ${id} desativado com sucesso.` };
  }

  // ──── Gestão de Temas do Evento ────────────────────────────────
  async addTemas(eventoId: number, createTemasDto: CreateTemasDto) {
    const evento = await this.findOne(eventoId);

    const novosTemas = createTemasDto.nomes.map((nome) =>
      this.temaRepository.create({ nome, evento }),
    );

    return await this.temaRepository.save(novosTemas);
  }

  async removeTema(temaId: number) {
    const tema = await this.temaRepository.findOne({
      where: { id: temaId },
      relations: ['orientadores'],
    });

    if (!tema) {
      throw new NotFoundException(`Tema com ID ${temaId} não encontrado.`);
    }

    if (tema.orientadores?.length) {
      throw new BadRequestException(
        `Não é possível excluir este tema porque existem ${tema.orientadores.length} orientador(es) vinculados a ele.`,
      );
    }

    const projetoVinculado = await this.projetoOrientadorRepository.exists({
      where: { projeto: { temaId } },
    });

    if (projetoVinculado) {
      throw new BadRequestException(
        'Não é possível excluir este tema porque existem projetos ou solicitações vinculadas a ele.',
      );
    }

    await this.temaRepository.delete(temaId);
    return { message: `Tema "${tema.nome}" removido com sucesso do evento.` };
  }

  // ──── Professores × Temas ──────────────────────────────────────
  async findProfessoresPorTema(temaId: number) {
    const tema = await this.temaRepository.findOne({
      where: { id: temaId },
      relations: ['orientadores'],
    });

    if (!tema) {
      throw new NotFoundException(`Tema com ID ${temaId} não encontrado`);
    }

    return tema.orientadores;
  }

  async findTemasDoOrientador(professorId: number) {
    const professor = await this.userRepository.findOne({
      where: { id: Number(professorId) },
      relations: ['temasSelecionados'],
    });

    if (!professor || professor.role_cargo !== UserRole.ORIENTADOR) {
      throw new BadRequestException('Orientador não encontrado ou cargo inválido.');
    }

    return professor.temasSelecionados ?? [];
  }

  async sincronizarTemas(professorId: number, temasIds: number[]) {
    const temasIdsValidos = Array.isArray(temasIds)
      ? temasIds.map(Number).filter((id) => Number.isInteger(id) && id > 0)
      : [];

    const professor = await this.userRepository.findOne({
      where: { id: Number(professorId) },
      relations: ['temasSelecionados'],
    });

    if (!professor || professor.role_cargo !== UserRole.ORIENTADOR) {
      throw new BadRequestException('Orientador não encontrado ou cargo inválido.');
    }

    const temasAtuaisIds = professor.temasSelecionados.map((t) => t.id);
    const temasSendoRemovidos = temasAtuaisIds.filter((id) => !temasIdsValidos.includes(id));

    if (temasSendoRemovidos.length) {
      const vinculosAtivos = await this.projetoOrientadorRepository.find({
        where: {
          orientador: { id: Number(professorId) },
          status: In(['aceito', 'pendente']),
          projeto: { temaId: In(temasSendoRemovidos) },
        },
        relations: ['projeto', 'projeto.tema'],
      });

      if (vinculosAtivos.length) {
        const nomesTemasBloqueados = Array.from(
          new Set(vinculosAtivos.map((v) => v.projeto?.tema?.nome || `ID: ${v.projeto?.temaId}`)),
        )
          .map((nome) => `"${nome}"`)
          .join(', ');

        throw new BadRequestException(
          `Não é possível remover os seguintes temas pois existem solicitações pendentes ou projetos sob sua orientação vinculados a eles: ${nomesTemasBloqueados}`,
        );
      }
    }

    const novosTemas = await this.temaRepository.findBy({
      id: In(temasIdsValidos),
    });

    if (novosTemas.length < 1) {
      throw new BadRequestException(
        `Você precisa selecionar no mínimo 1 tema válido. (Selecionados: ${novosTemas.length})`,
      );
    }

    professor.temasSelecionados = novosTemas;
    await this.userRepository.save(professor);

    return {
      message: 'Temas sincronizados com sucesso',
      totalSelecionado: novosTemas.length,
    };
  }

  // ──── Evento Atual (ano vigente) ──────────────────────────────
  async eventoAtual() {
    const anoAtual = new Date().getFullYear();
    const inicioAno = `${anoAtual}-01-01`;
    const fimAno = `${anoAtual}-12-31`;

    return await this.eventoRepository.findOne({
      where: {
        prazoInicial: Between(inicioAno as any, fimAno as any),
        status: EventoStatus.ATIVO,
      },
      order: { criadoEm: 'DESC' },
      relations: ['temas'],
    });
  }
}