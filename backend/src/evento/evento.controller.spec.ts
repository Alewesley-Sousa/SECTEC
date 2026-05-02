import { Test, TestingModule } from '@nestjs/testing';
import { EventoController } from './evento.controller';
import { EventoService } from './evento.service';

describe('EventoController', () => {
  let controller: EventoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventoController],
      providers: [EventoService],
    }).compile();

    controller = module.get<EventoController>(EventoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
