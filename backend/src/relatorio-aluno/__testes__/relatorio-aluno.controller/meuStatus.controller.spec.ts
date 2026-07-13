// src/relatorio/__tests__/relatorio-aluno.controller/meuStatus.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { RelatorioAlunoController } from '../../relatorio-aluno.controller';
import { RelatorioAlunoService } from '../../relatorio-aluno.service';
import { StatusRelatorio } from '../../entities/relatorio-aluno.entity';

describe('RelatorioAlunoController - meuStatus', () => {
  let controller: RelatorioAlunoController;
  let service: RelatorioAlunoService;

  const mockRelatorioAlunoService = {
    meuStatus: jest.fn().mockResolvedValue({
      status: StatusRelatorio.DISTRIBUIDO,
      quantidade_projetos: 3,
      total_atribuidos: 3,
      total_visualizados: 2,
      data_ativacao: new Date('2026-07-01T00:00:00.000Z'),
      data_envio: null,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RelatorioAlunoController],
      providers: [
        {
          provide: RelatorioAlunoService,
          useValue: mockRelatorioAlunoService,
        },
      ],
    }).compile();

    controller = module.get<RelatorioAlunoController>(RelatorioAlunoController);
    service = module.get<RelatorioAlunoService>(RelatorioAlunoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call meuStatus from service', async () => {
    const req = { user: { id: 1 } };

    await controller.meuStatus(req);

    expect(service.meuStatus).toHaveBeenCalledWith(1);
  });

  it('should return the result from service', async () => {
    const req = { user: { id: 1 } };

    const result = await controller.meuStatus(req);

    expect(result).toEqual({
      status: StatusRelatorio.DISTRIBUIDO,
      quantidade_projetos: 3,
      total_atribuidos: 3,
      total_visualizados: 2,
      data_ativacao: expect.any(Date),
      data_envio: null,
    });
  });

  it('should handle different status', async () => {
    mockRelatorioAlunoService.meuStatus.mockResolvedValueOnce({
      status: StatusRelatorio.PENDENTE,
      quantidade_projetos: 0,
      total_atribuidos: 0,
      total_visualizados: 0,
      data_ativacao: new Date(),
      data_envio: null,
    });

    const req = { user: { id: 1 } };
    const result = await controller.meuStatus(req);

    expect(result.status).toBe(StatusRelatorio.PENDENTE);
    expect(result.total_atribuidos).toBe(0);
  });
});