import { Test, TestingModule } from '@nestjs/testing';
import { ProjetosService } from './projetos.service';

describe('ProjetosService', () => {
  let service: ProjetosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjetosService],
    }).compile();

    service = module.get<ProjetosService>(ProjetosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
