import { Module } from '@nestjs/common';
import { EventoService } from './evento.service';
import { EventoController } from './evento.controller';

@Module({
  controllers: [EventoController],
  providers: [EventoService],
})
export class EventoModule {}
