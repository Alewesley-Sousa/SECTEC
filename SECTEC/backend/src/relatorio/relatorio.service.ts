import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { User, UserRole } from 'src/users/entities/user.entity';
import { Evento, EventoStatus } from 'src/evento/entities/evento.entity';
import { Projeto } from 'src/projetos/entities/projeto.entity';
import { ProjetoAluno } from 'src/projetos/entities/projeto-aluno.entity';
import { ComissaoEvento } from 'src/evento/entities/comissao-evento.entity';
import { TemaEvento } from 'src/evento/entities/tema-evento.entity'; // ajuste o caminho se necessário
export interface ProjetosPorTurma {
  [chaveTurma: string]: {
    turma: string;
    ano: number;
    totalCriados: number;
    totalAprovados: number;
  };
}


// Interface para tipar o relatório da comissão agrupado por evento
export interface ComissaoPorEvento {
  [eventoTitulo: string]: {
    eventoId: number;
    alunos: {
      id: number;
      nome: string;
      email: string;
      turma: string | null;
      ano: number;
    }[];
  };
}

// 1. Adicionado o "export" para o controller enxergar e ajustado o tipo de turma
export interface AlunosAgrupados {
  [chaveTurma: string]: {
    id: number;
    nome: string;
    email: string;
    ano: number;
    turma: any; // Ajustado para evitar conflito com UserTurma ou null
  }[];
}

export interface EixosPorEvento {
  [eventoTitulo: string]: {
    eventoId: number;
    eixos: {
      temaId: number;
      temaNome: string;
      totalProjetos: number;
      projetosPendentes: number;
      projetosAceitos: number;
    }[];
  };
}



export interface ProjetosPorOrientador {
  orientadorId: number;
  orientadorNome: string;
  email: string;
  totalProjetosAceitos: number;
  projetos: string[]; // Lista contendo apenas os títulos dos projetos aceitos
}




@Injectable()
export class RelatorioService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Evento)
    private readonly eventoRepository: Repository<Evento>,
    
        @InjectRepository(ComissaoEvento)
    private readonly comissaoRepository: Repository<ComissaoEvento>,
    
    @InjectRepository(TemaEvento) private readonly temaRepository:
    Repository<TemaEvento>,
    
      @InjectRepository(Projeto)
    private readonly projetoRepository: Repository<Projeto>,
    
  ) {}

  async obterAlunosSemProjeto(): Promise<AlunosAgrupados> {
    const anoAtual = new Date().getFullYear();
    const inicioAno = `${anoAtual}-01-01`;
    const fimAno = `${anoAtual}-12-31`;

    const eventoAtual = await this.eventoRepository.findOne({
      where: {
        prazoInicial: Between(inicioAno as any, fimAno as any),
        status: EventoStatus.ATIVO,
      },
    });

    if (!eventoAtual) {
      throw new NotFoundException(`Nenhum evento ativo encontrado para o ano de ${anoAtual}.`);
    }

    const alunosSemProjeto = await this.userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.nome', 'user.email_institucional', 'user.ano', 'user.turma'])
      .where('user.role_cargo = :role', { role: UserRole.ALUNO }) 
      .andWhere('user.ativo = :ativo', { ativo: true })
      
      .andWhere((qb) => {
        const subQueryAutor = qb
          .subQuery()
          .select('1')
          .from(Projeto, 'p')
          .where('p.aluno_autor_id = user.id')
          .andWhere('p.evento_id = :eventoId', { eventoId: eventoAtual.id })
          .getQuery();
        return `NOT EXISTS ${subQueryAutor}`;
      })
      
      .andWhere((qb) => {
        const subQueryIntegrante = qb
          .subQuery()
          .select('1')
          .from(ProjetoAluno, 'pa')
          .innerJoin('pa.projeto', 'proj')
          .where('pa.aluno_id = user.id')
          .andWhere('proj.evento_id = :eventoId', { eventoId: eventoAtual.id })
          .getQuery();
        return `NOT EXISTS ${subQueryIntegrante}`;
      })
      .orderBy('user.turma', 'ASC')
      .addOrderBy('user.ano', 'ASC')
      .getMany();

    const agrupado: AlunosAgrupados = {};

    alunosSemProjeto.forEach((aluno) => {
      // Força a conversão para string com segurança para gerar a chave do objeto
      const curso = aluno.turma ? String(aluno.turma).toLowerCase().trim() : 'indefinido';
      const ano = aluno.ano || '';
      const chaveTurma = `${curso}${ano}`;

      if (!agrupado[chaveTurma]) {
        agrupado[chaveTurma] = [];
      }

      agrupado[chaveTurma].push({
        id: aluno.id,
        nome: aluno.nome,
        email: aluno.email_institucional,
        ano: aluno.ano,
        turma: aluno.turma, // Agora aceita sem reclamar de null
      });
    });

    return agrupado;
  }
  
  async obterHistoricoComissao(): Promise<ComissaoPorEvento> {
    // Busca todo o histórico trazendo os dados do evento e as colunas seguras do usuário
    const historicoBruto = await this.comissaoRepository.find({
      relations: ['evento', 'user'],
      order: {
        evento: { criadoEm: 'DESC' }, // Eventos mais recentes primeiro
        user: { nome: 'ASC' },        // Alunos em ordem alfabética
      },
    });

    const agrupado: ComissaoPorEvento = {};

    historicoBruto.forEach((registro) => {
      const evento = registro.evento;
      const aluno = registro.user;

      // Se o evento ou aluno por algum motivo bizarro sumirem, evita quebra de script
      if (!evento || !aluno) return;

      // Usamos o título do evento como chave do agrupamento
      const chaveEvento = evento.titulo;

      if (!agrupado[chaveEvento]) {
        agrupado[chaveEvento] = {
          eventoId: evento.id,
          alunos: [],
        };
      }

      agrupado[chaveEvento].alunos.push({
        id: aluno.id,
        nome: aluno.nome,
        email: aluno.email_institucional,
        turma: aluno.turma,
        ano: aluno.ano,
      });
    });

    return agrupado;
  }
  
  async obterMetricasEixosTematicos(): Promise<EixosPorEvento> {
    const resultados = await this.temaRepository
      .createQueryBuilder('tema')
      .innerJoin('tema.evento', 'evento')
      .select([
        'tema.id AS temaId',
        'tema.nome AS temaNome',
        'evento.id AS eventoId',
        'evento.titulo AS eventoTitulo',
      ])
      // Subquery: Total de projetos atrelados a este tema e a este evento específico
      .addSelect((qb) => {
        return qb
          .select('COUNT(p.id)', 'total')
          .from(Projeto, 'p')
          .where('p.tema_id = tema.id')
          .andWhere('p.evento_id = evento.id'); // 👈 Link dinâmico com o evento da linha
      }, 'totalProjetos')
      // Subquery: Projetos com solicitações pendentes de orientação
      .addSelect((qb) => {
        return qb
          .select('COUNT(DISTINCT p_pend.id)', 'pendentes')
          .from(Projeto, 'p_pend')
          .innerJoin('p_pend.orientadores', 'po_pend')
          .where('p_pend.tema_id = tema.id')
          .andWhere('p_pend.evento_id = evento.id') // 👈 Link dinâmico
          .andWhere('po_pend.status = :statusPendente', { statusPendente: 'pendente' });
      }, 'projetosPendentes')
      // Subquery: Projetos que já possuem orientador aceito
      .addSelect((qb) => {
        return qb
          .select('COUNT(DISTINCT p_aceito.id)', 'aceitos')
          .from(Projeto, 'p_aceito')
          .innerJoin('p_aceito.orientadores', 'po_aceito')
          .where('p_aceito.tema_id = tema.id')
          .andWhere('p_aceito.evento_id = evento.id') // 👈 Link dinâmico
          .andWhere('po_aceito.status = :statusAceito', { statusAceito: 'aceito' });
      }, 'projetosAceitos')
      .orderBy('evento.criado_em', 'DESC') // Eventos mais novos aparecem primeiro no topo
      .addOrderBy('tema.nome', 'ASC')
      .getRawMany();

    const agrupado: EixosPorEvento = {};

    resultados.forEach((row) => {
      const chaveEvento = row.eventoTitulo;

      // Se a divisória do evento não existir no objeto, inicializa ela
      if (!agrupado[chaveEvento]) {
        agrupado[chaveEvento] = {
          eventoId: Number(row.eventoId),
          eixos: [],
        };
      }

      // Adiciona o eixo temático com suas métricas computadas no evento correspondente
      agrupado[chaveEvento].eixos.push({
        temaId: Number(row.temaId),
        temaNome: row.temaNome,
        totalProjetos: Number(row.totalProjetos || 0),
        projetosPendentes: Number(row.projetosPendentes || 0),
        projetosAceitos: Number(row.projetosAceitos || 0),
      });
    });

    return agrupado;
  }
  
  async obterProjetosPorOrientador(): Promise<ProjetosPorOrientador[]> {
    const anoAtual = new Date().getFullYear();
    const inicioAno = `${anoAtual}-01-01`;
    const fimAno = `${anoAtual}-12-31`;

    // 1. Localiza o evento ativo para o ano letivo corrente
    const eventoAtual = await this.eventoRepository.findOne({
      where: {
        prazoInicial: Between(inicioAno as any, fimAno as any),
        status: EventoStatus.ATIVO,
      },
    });

    if (!eventoAtual) {
      throw new NotFoundException(`Nenhum evento ativo encontrado para o ano de ${anoAtual}.`);
    }

    // 2. Busca os orientadores ativos e faz o Join estruturado com as orientações aceitas deste evento
    const orientadoresComProjetos = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.solicitacoesOrientacao', 'solicitacao', 'solicitacao.status = :status', { status: 'aceito' })
      .leftJoinAndSelect('solicitacao.projeto', 'projeto', 'projeto.evento_id = :eventoId', { eventoId: eventoAtual.id })
      .where('user.role_cargo = :role', { role: UserRole.ORIENTADOR })
      .andWhere('user.ativo = :ativo', { ativo: true })
      .orderBy('user.nome', 'ASC')
      .getMany();

    // 3. Mapeia e limpa a estrutura para retornar estritamente o necessário
    return orientadoresComProjetos.map((orientador) => {
      // Filtra e limpa registros nulos decorrentes do LEFT JOIN caso o professor não possua projetos vinculados
      const projetosFiltrados = orientador.solicitacoesOrientacao
        .filter((solicitacao) => solicitacao.projeto !== null)
        .map((solicitacao) => solicitacao.projeto.titulo);

      return {
        orientadorId: orientador.id,
        orientadorNome: orientador.nome,
        email: orientador.email_institucional,
        totalProjetosAceitos: projetosFiltrados.length,
        projetos: projetosFiltrados,
      };
    });
  }

async obterProjetosPorTurma(): Promise<ProjetosPorTurma> {
    const anoAtual = new Date().getFullYear();
    const inicioAno = `${anoAtual}-01-01`;
    const fimAno = `${anoAtual}-12-31`;

    // 1. Localiza o evento ativo do ano corrente
    const eventoAtual = await this.eventoRepository.findOne({
      where: {
        prazoInicial: Between(inicioAno as any, fimAno as any),
        status: EventoStatus.ATIVO,
      },
    });

    if (!eventoAtual) {
      throw new NotFoundException(`Nenhum evento ativo encontrado para o ano de ${anoAtual}.`);
    }

    // 2. Busca todos os projetos do evento trazendo os dados de turma/ano do Aluno Autor e os status dos Orientadores
    const projetos = await this.projetoRepository
      .createQueryBuilder('projeto')
      .innerJoinAndSelect('projeto.alunoAutor', 'autor')
      .leftJoinAndSelect('projeto.orientadores', 'orientador')
      .where('projeto.evento_id = :eventoId', { eventoId: eventoAtual.id })
      .getMany();

    const agrupado: ProjetosPorTurma = {};

    // 3. Agrupa os resultados gerando a chave combinada (ex: informatica2)
    projetos.forEach((projeto) => {
      const autor = projeto.alunoAutor;
      
      // Tratamento preventivo caso o aluno não possua turma preenchida
      const curso = autor.turma ? String(autor.turma).toLowerCase().trim() : 'indefinido';
      const ano = autor.ano || 1;
      const chaveTurma = `${curso}${ano}`;

      // Inicializa o grupo da turma se ele não existir
      if (!agrupado[chaveTurma]) {
        agrupado[chaveTurma] = {
          turma: curso,
          ano: ano,
          totalCriados: 0,
          totalAprovados: 0,
        };
      }

      // Incrementa o total de projetos criados por aquela turma
      agrupado[chaveTurma].totalCriados++;

      // Verifica se o projeto possui pelo menos uma orientação aceita (Aprovado)
      const possuiAprovacao = projeto.orientadores.some(
        (orientador) => orientador.status === 'aceito'
      );

      if (possuiAprovacao) {
        agrupado[chaveTurma].totalAprovados++;
      }
    });

    return agrupado;
  }
  
  
}
