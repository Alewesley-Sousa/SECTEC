import { Module } from '@nestjs/common';
import { EventoService } from './evento.service';
import { EventoController } from './evento.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Evento } from './entities/evento.entity';
import { TemaEvento } from './entities/tema-evento.entity';
import { User } from '../users/entities/user.entity';
import { ProjetoOrientador } from '../projetos/entities/projeto-orientador.entity'; 
// 💡 NOTA: Ajuste o caminho relativo acima se a pasta do módulo de projetos não for essa exatamente.


@Module({
  imports: [
    TypeOrmModule.forFeature([Evento, TemaEvento, User, ProjetoOrientador])
  ],
  controllers: [EventoController],
  providers: [EventoService],
})
export class EventoModule {}
