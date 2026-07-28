// relatorio-aluno.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // <-- Importe isso
import { RelatorioAlunoService } from './relatorio-aluno.service';
import { RelatorioAlunoController } from './relatorio-aluno.controller';
import { RelatorioAluno } from './entities/relatorio-aluno.entity'; // ajuste o caminho
import { AlunoRelatorioProjetos } from './entities/aluno-relatorio-projetos.entity';
import { Evento } from '../evento/entities/evento.entity'; // caminho real
import { Projeto } from '../projetos/entities/projeto.entity'; // caminho real
import { RelatorioMaterial } from './entities/relatorio-material.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { User } from '../users/entities/user.entity';
import { Cron } from '@nestjs/schedule';
import { Logger } from '@nestjs/common';
import { PdfModule } from '../pdf/pdf.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      RelatorioAluno,
      AlunoRelatorioProjetos,
      RelatorioMaterial,
      Evento,
      Projeto,
      User,
    ]),
    PdfModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [RelatorioAlunoController],
  providers: [RelatorioAlunoService],
})
export class RelatorioAlunoModule { }