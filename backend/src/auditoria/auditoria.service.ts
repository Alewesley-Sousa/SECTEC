import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOptionsWhere,
  LessThanOrEqual,
  Like,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { CreateAuditoriaDto } from './dto/create-auditoria.dto';
import { FilterAuditoriaDto } from './dto/filter-auditoria.dto';
import { Auditoria } from './entities/auditoria.entity';
import { Projeto } from '../projetos/entities/projeto.entity';
import { User } from '../users/entities/user.entity';
@Injectable()
export class AuditoriaService {
  constructor(
    @InjectRepository(Auditoria)
    private readonly auditoriaRepository: Repository<Auditoria>,
  ) {}

  async create(dto: CreateAuditoriaDto) {
    const log = this.auditoriaRepository.create({
      usuario: { id: dto.usuarioId } as User,
      projeto: dto.projetoId ? ({ id: dto.projetoId } as Projeto) : null,
      acao: dto.acao,
      detalhe: dto.detalhe,
    });

    const salvo = await this.auditoriaRepository.save(log);
    return this.findOne(salvo.id);
  }

  async registrar(usuarioId: number,
    acao: string,
    detalhe?: string,
    projetoId?: number,
  ) {
    return this.create({ usuarioId, projetoId, acao, detalhe });
  }

  async findAll(filtros: FilterAuditoriaDto = {}) {
    const where = this.montarFiltros(filtros);

    const logs = await this.auditoriaRepository.find({
      where,
      relations: {
        usuario: true,
        projeto: true,
      },
      order: { feitoEm: 'DESC' },
    });

    return logs.map((log) => this.formatarLog(log));
  }

  async findOne(id: number) {
    const log = await this.auditoriaRepository.findOne({
      where: { id },
      relations: {
        usuario: true,
        projeto: true,
      },
    });

    if (!log) {
      throw new NotFoundException(`Log de auditoria #${id} nao encontrado`);
    }

    return this.formatarLog(log);
  }

  private montarFiltros(filtros: FilterAuditoriaDto) {
    const where: FindOptionsWhere<Auditoria> = {};

    if (filtros.usuarioId) {
      where.usuario = { id: this.parseNumero(filtros.usuarioId, 'usuarioId') };
    }
    if (filtros.projetoId) {
      where.projeto = { id: this.parseNumero(filtros.projetoId, 'projetoId') };
    }
    if (filtros.acao) {
      where.acao = Like(`%${filtros.acao}%`);
    }

    const dataInicio = this.parseData(filtros.dataInicio, 'dataInicio');
    const dataFim = this.parseData(filtros.dataFim, 'dataFim');

    if (dataInicio && dataFim) {
      where.feitoEm = Between(dataInicio, dataFim);
    } else if (dataInicio) {
      where.feitoEm = MoreThanOrEqual(dataInicio);
    } else if (dataFim) {
      where.feitoEm = LessThanOrEqual(dataFim);
    } return where;
  }

  private parseNumero(valor: string, campo: string) {
    const numero = Number(valor);

    if (!Number.isInteger(numero) || numero <= 0) {
      throw new BadRequestException(`${campo} deve ser um numero inteiro positivo`);
    } return numero;
  }

  private parseData(valor: string | undefined, campo: string) {
    if (!valor) return undefined;

    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) {
      throw new BadRequestException(`${campo} deve ser uma data valida`);
    } return data;
  }

  private formatarLog(log: Auditoria) {
    return {
      id: log.id,
      quem: log.usuario
        ? {
            id: log.usuario.id,
            nome: log.usuario.nome,
            email: log.usuario.email_institucional,
            cargo: log.usuario.role_cargo,
          }
        : null,
      quando: log.feitoEm,
      oQue: {
        acao: log.acao,
        detalhe: log.detalhe,
      },
      projeto: log.projeto
        ? {
            id: log.projeto.id,
            titulo: log.projeto.titulo,
          }
        : null,
    };
  }
}
