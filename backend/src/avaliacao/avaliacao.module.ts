import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvaliacaoService } from './avaliacao.service';
import { AvaliacaoController } from './avaliacao.controller';

import { Evento } from '../evento/entities/evento.entity';
import { User } from '../users/entities/user.entity';
import { Projeto } from '../projetos/entities/projeto.entity';
import { AvaliadorProjeto } from './entities/avaliador-projeto.entity';
import { Avaliacao } from './entities/avaliacao.entity';
import { AvaliacaoCriterio } from '../avaliacoes/entities/avaliacao-criterio.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Evento,
      User,
      Projeto,
      AvaliadorProjeto,
      Avaliacao,
      AvaliacaoCriterio,
    ]),
  ],
  controllers: [AvaliacaoController],
  providers: [AvaliacaoService],
})
export class AvaliacaoModule {}