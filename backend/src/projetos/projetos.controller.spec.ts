import { Test, TestingModule } from '@nestjs/testing';
import { ProjetosController } from './projetos.controller';
import { ProjetosService } from './projetos.service';

describe('ProjetosController', () => {
  let controller: ProjetosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjetosController],
      providers: [ProjetosService],
    }).compile();

    controller = module.get<ProjetosController>(ProjetosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
