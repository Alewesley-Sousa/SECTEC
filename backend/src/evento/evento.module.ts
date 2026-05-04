import { Module } from '@nestjs/common';
import { EventoService } from './evento.service';
import { EventoController } from './evento.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Evento } from './entities/evento.entity';
import { TemaEvento } from './entities/tema-evento.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Evento, TemaEvento])
  ],
  controllers: [EventoController],
  providers: [EventoService],
})
export class EventoModule {}
