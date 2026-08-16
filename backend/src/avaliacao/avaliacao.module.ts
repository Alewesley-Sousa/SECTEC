import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvaliacaoService } from './avaliacao.service';
import { AvaliacaoController } from './avaliacao.controller';

// Importa todas as entidades envolvidas
import { Evento } from '../evento/entities/evento.entity';
import { User } from '../users/entities/user.entity';
import { Projeto } from '../projetos/entities/projeto.entity';
import { AvaliadorProjeto } from './entities/avaliador-projeto.entity';

@Module({
  imports: [
    // Regista as entidades para que o Repository possa ser injetado no Service
    TypeOrmModule.forFeature([Evento, User, Projeto, AvaliadorProjeto]),
  ],
  controllers: [AvaliacaoController],
  providers: [AvaliacaoService],
})
export class AvaliacaoModule {}