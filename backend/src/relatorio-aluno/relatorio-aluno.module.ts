// relatorio-aluno.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // <-- Importe isso
import { RelatorioAlunoService } from './relatorio-aluno.service';
import { RelatorioAlunoController } from './relatorio-aluno.controller';
import { RelatorioAluno } from './entities/relatorio-aluno.entity'; // ajuste o caminho
import { AlunoRelatorioProjetos } from './entities/aluno-relatorio-projetos.entity';
import { Evento } from '../evento/entities/evento.entity'; // caminho real
import { Projeto } from '../projetos/entities/projeto.entity'; // caminho real
import { ScheduleModule } from '@nestjs/schedule';
import { User } from '../users/entities/user.entity';
import { Cron } from '@nestjs/schedule';
import { Logger } from '@nestjs/common';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RelatorioAluno,
      AlunoRelatorioProjetos,
      Evento,
      Projeto,
      User,
      // Se o serviço também usar RelatorioMaterial, adicione aqui:
      // RelatorioMaterial,
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [RelatorioAlunoController],
  providers: [RelatorioAlunoService],
})
export class RelatorioAlunoModule { }