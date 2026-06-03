import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { EventoStatus } from '../evento/entities/evento.entity';
import {
  ProjetoOrientador,
  StatusOrientacao,
} from './entities/projeto-orientador.entity';
import { ResponderOrientacaoDto } from './dto/responder-orientacao.dto';
import { User } from '../users/entities/user.entity'; // Ajuste o caminho correto se necessário
import { Projeto } from '../projetos/entities/projeto.entity';   // Ajuste o caminho correto se necessário

@Injectable()
export class OrientacoesService {
  constructor(
    @InjectRepository(ProjetoOrientador)
    private orientacoesRepository: Repository<ProjetoOrientador>,
    
    @InjectRepository(User)
    private userRepository: Repository<User>, // 👈 Adicionado
    
    @InjectRepository(Projeto)
    private projetoRepository: Repository<Projeto>, // 👈 Adicionado
  ) {}

    async findMinhasPendentes(orientadorId: number): Promise<ProjetoOrientador[]> {
  const anoAtual = new Date().getFullYear();

  return this.orientacoesRepository.createQueryBuilder('projetoOrientador')
    .leftJoinAndSelect('projetoOrientador.orientador', 'orientador')
    .leftJoinAndSelect('projetoOrientador.projeto', 'projeto')
    .leftJoinAndSelect('projeto.evento', 'evento')
    .leftJoinAndSelect('projeto.tema', 'tema')
    .leftJoinAndSelect('projeto.alunoAutor', 'alunoAutor')
    .leftJoinAndSelect('projeto.projetoAlunos', 'projetoAlunos')
    .leftJoinAndSelect('projetoAlunos.aluno', 'aluno')

    // 1. Filtros básicos: id do orientador e status pendente
    .where('orientador.id = :orientadorId', { orientadorId })
    .andWhere('projetoOrientador.status = :statusPendente', { statusPendente: StatusOrientacao.PENDENTE })

    // 2. FILTRO DO ANO ATUAL: Filtra pelo status ATIVO do evento e garante que ele está no range do ano corrente
    .andWhere('evento.status = :eventoStatus', { eventoStatus: 'ativo' })
    .andWhere('evento.prazoInicial BETWEEN :inicioAno AND :fimAno', {
      inicioAno: `${anoAtual}-01-01`,
      fimAno: `${anoAtual}-12-31`,
    })

    // 3. Validação de concorrência (Se outra pessoa já aceitou, limpa da lista)
    .andWhere((qb) => {
      const subQuery = qb
        .subQuery()
        .select('1')
        .from(ProjetoOrientador, 'subPo')
        .where('subPo.projeto_id = projeto.id') 
        .andWhere('subPo.status = :statusAceito', { statusAceito: StatusOrientacao.ACEITO })
        .getQuery();
      
      return `NOT EXISTS ${subQuery}`;
    })
    .getMany();
}




  async findMinhasOrientacoes(orientadorId: number): Promise<ProjetoOrientador[]> {
    return this.orientacoesRepository.find({
      where: { orientador: { id: orientadorId } },
      relations: [
        'projeto',
        'projeto.evento',
        'projeto.tema',
        'projeto.alunoAutor',
        'projeto.projetoAlunos',
        'projeto.projetoAlunos.aluno',
        'orientador',
      ],
      order: { criadoEm: 'DESC' },
    });
  }

    async responder(
    id: number,
    orientadorId: number,
    dto: ResponderOrientacaoDto,
  ): Promise<ProjetoOrientador> {
    const orientacao = await this.orientacoesRepository.findOne({
      where: { id },
      relations: [
        'projeto',
        'projeto.evento',
        'projeto.tema',
        'projeto.alunoAutor',
        'projeto.projetoAlunos',
        'projeto.projetoAlunos.aluno',
        'orientador',
      ],
    });

    if (!orientacao) {
      throw new NotFoundException('Orientação não encontrada');
    }

    if (orientacao.orientador.id !== orientadorId) {
      throw new ForbiddenException('Você não pode responder esta orientação');
    }

    if (orientacao.status !== StatusOrientacao.PENDENTE) {
      throw new BadRequestException('Esta orientação já foi respondida');
    }

    const motivoRecusa = dto.motivoRecusa?.trim();
    if (dto.action === StatusOrientacao.RECUSADO && !motivoRecusa) {
      throw new BadRequestException('Informe o motivo da recusa do projeto.');
    }

    // 👇 NOVA VALIDAÇÃO CRÍTICA: Se o professor atual quer ACEITAR, 
    // precisamos garantir que nenhum outro professor aceitou antes dele.
    if (dto.action === StatusOrientacao.ACEITO) {
      const jaPossuiOrientador = await this.orientacoesRepository.exists({
        where: {
          projeto: { id: orientacao.projeto.id },
          status: StatusOrientacao.ACEITO,
        },
      });

      if (jaPossuiOrientador) {
        throw new BadRequestException(
          'Este projeto já foi aceito por outro orientador.',
        );
      }

      // Se passou na checagem, recusa todas as outras solicitações pendentes deste projeto
      await this.orientacoesRepository
        .createQueryBuilder()
        .update(ProjetoOrientador)
        .set({
          status: StatusOrientacao.RECUSADO,
          respondidoEm: new Date(),
          motivoRecusa: 'Outro orientador aceitou este projeto.',
        })
        .where('projeto_id = :projetoId', { projetoId: orientacao.projeto.id })
        .andWhere('status = :status', { status: StatusOrientacao.PENDENTE })
        .andWhere('id != :id', { id: orientacao.id })
        .execute();
    }

    // Atualiza o status da solicitação atual
    orientacao.status = dto.action;
    orientacao.respondidoEm = new Date();
    orientacao.motivoRecusa = dto.action === StatusOrientacao.RECUSADO ? motivoRecusa! : null;

    return this.orientacoesRepository.save(orientacao);
  }
  
  
  
      async listarDisponiveisParaAluno(alunoId: number) {
  const anoAtual = new Date().getFullYear();

  // 1. Busca o projeto do aluno vinculado ao evento ATIVO do ano corrente
  const projetoAluno = await this.projetoRepository.findOne({
    where: { 
      alunoAutor: { id: alunoId }, 
      evento: { 
        status: EventoStatus.ATIVO, 
        prazoInicial: Between(
          new Date(`${anoAtual}-01-01T00:00:00`), 
          new Date(`${anoAtual}-12-31T23:59:59`)
        )
      } 
    },
    relations: ['evento'],
  });

  let orientadoresRecusadosIds: number[] = [];

  // 2. Se o projeto já existir, localiza quais orientadores deram 'recusado' especificamente nele
  if (projetoAluno) {
    const vinculosRecusados = await this.orientacoesRepository.find({
      where: {
        projeto: { id: projetoAluno.id },
        status: StatusOrientacao.RECUSADO,
      },
      relations: ['orientador'],
    });
    orientadoresRecusadosIds = vinculosRecusados.map((v) => v.orientador.id);
  }

  // 3. Monta a Query buscando TODOS os orientadores cadastrados no evento ativo
  const query = this.userRepository.createQueryBuilder('orientador')
    .innerJoinAndSelect('orientador.temasSelecionados', 'tema')
    .innerJoin('tema.evento', 'evento') 
    .where('orientador.role_cargo = :role', { role: 'orientador' }) // Busca TODOS do cargo orientador
    .andWhere('evento.status = :eventoStatus', { eventoStatus: EventoStatus.ATIVO }) 
    .andWhere('evento.prazo_inicial BETWEEN :inicioAno AND :fimAno', {
      inicioAno: `${anoAtual}-01-01 00:00:00`,
      fimAno: `${anoAtual}-12-31 23:59:59`,
    });

  // 4. Regra de Exclusão: Retira da lista Geral APENAS quem recusou (se houver alguém)
  if (orientadoresRecusadosIds.length > 0) {
    query.andWhere('orientador.id NOT IN (:...recusados)', { recusados: orientadoresRecusadosIds });
  }

  const orientadores = await query.getMany();

  // 5. Retorna a lista completa com id, nome e temas mapeados
  return orientadores.map((ori) => ({
    id: ori.id,
    nome: ori.nome,
    temas: ori.temasSelecionados.map((t) => ({
      id: t.id,
      nome: t.nome,
    })),
  }));
}




}
