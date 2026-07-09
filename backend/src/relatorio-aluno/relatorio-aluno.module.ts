import { Module } from '@nestjs/common';
import { RelatorioAlunoService } from './relatorio-aluno.service';
import { RelatorioAlunoController } from './relatorio-aluno.controller';

@Module({
  controllers: [RelatorioAlunoController],
  providers: [RelatorioAlunoService],
})
export class RelatorioAlunoModule {}
