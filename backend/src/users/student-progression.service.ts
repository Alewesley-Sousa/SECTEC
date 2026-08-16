import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class StudentProgressionService {
  private readonly logger = new Logger(StudentProgressionService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async onApplicationBootstrap() {
    await this.executarSmartCheckAnoAlunos('startup');
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    timeZone: 'America/Fortaleza',
  })
  async executarSmartCheckAnoAlunosDiario() {
    await this.executarSmartCheckAnoAlunos('cron');
  }

  /**
   * Atualiza o ano dos alunos ativos e desativa os que chegaram ao 4º ano.
   * Busca apenas alunos ativos para melhor performance.
   */
  async executarSmartCheckAnoAlunos(origem = 'manual') {
    const anoAtual = new Date().getFullYear();

    const alunos = await this.usersRepository.find({
      where: { role_cargo: UserRole.ALUNO, ativo: true },
      select: ['id', 'ano', 'criado_em', 'ano_progressao_processado'],
    });

    const alunosParaSalvar: User[] = [];
    let incrementados = 0;
    let desativados = 0;

    for (const aluno of alunos) {
      const anoProcessado =
        aluno.ano_progressao_processado ??
        aluno.criado_em?.getFullYear() ??
        anoAtual;
      let mudou = false;

      if (anoAtual > anoProcessado) {
        const anosPassados = anoAtual - anoProcessado;
        aluno.ano = Math.min(aluno.ano + anosPassados, 4);
        aluno.ano_progressao_processado = anoAtual;
        incrementados += 1;
        mudou = true;
      } else if (aluno.ano_progressao_processado === null) {
        aluno.ano_progressao_processado = anoAtual;
        mudou = true;
      }

      if (aluno.ano >= 4) {
        aluno.ativo = false;
        aluno.ano = 4;
        aluno.ano_progressao_processado = anoAtual;
        desativados += 1;
        mudou = true;
      }

      if (mudou) alunosParaSalvar.push(aluno);
    }

    if (alunosParaSalvar.length > 0) {
      await this.usersRepository.save(alunosParaSalvar);
    }

    this.logger.log(
      `Smart check de anos (${origem}): ${incrementados} progredido(s), ${desativados} desativado(s).`,
    );

    return {
      anoAtual,
      incrementados,
      desativados,
      atualizados: alunosParaSalvar.length,
    };
  }
}