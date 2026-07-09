// src/relatorio/__tests__/relatorio-aluno.controller/meusProjetos.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { RelatorioAlunoController } from '../../relatorio-aluno.controller';
import { RelatorioAlunoService } from '../../relatorio-aluno.service';
import { UserTurma } from '../../../users/entities/user.entity';

describe('RelatorioAlunoController - meusProjetos', () => {
  let controller: RelatorioAlunoController;
  let service: RelatorioAlunoService;

  const mockRelatorioAlunoService = {
    meusProjetos: jest.fn().mockResolvedValue({
      aluno: {
        id: 1,
        nome: 'João Silva',
        turma: UserTurma.INFORMATICA,
      },
      status: 'distribuido',
      quantidade_projetos: 2,
      total_atribuidos: 2,
      projetos: [
        {
          id: 1,
          titulo: 'Projeto A',
          descricao: 'Descrição do Projeto A',
          area: 'Ciências da Natureza',
          autores: [
            { id: 3, nome: 'Carlos Silva', turma: UserTurma.ENFERMAGEM, tipo: 'autor_principal' },
            { id: 4, nome: 'Ana Souza', turma: UserTurma.CONTABILIDADE, tipo: 'coautor' },
          ],
          visualizado: false,
          data_atribuicao: new Date('2026-07-09T10:00:00.000Z'),
        },
        {
          id: 2,
          titulo: 'Projeto B',
          descricao: 'Descrição do Projeto B',
          area: 'Ciências Humanas',
          autores: [
            { id: 6, nome: 'Maria Oliveira', turma: UserTurma.INFORMATICA, tipo: 'autor_principal' },
          ],
          visualizado: true,
          data_atribuicao: new Date('2026-07-09T10:30:00.000Z'),
        },
      ],
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

  it('should call meusProjetos from service', async () => {
    const req = { user: { id: 1 } };

    await controller.meusProjetos(req);

    expect(service.meusProjetos).toHaveBeenCalledWith(1);
  });

  it('should return the result from service', async () => {
    const req = { user: { id: 1 } };

    const result = await controller.meusProjetos(req);

    expect(result).toEqual({
      aluno: {
        id: 1,
        nome: 'João Silva',
        turma: UserTurma.INFORMATICA,
      },
      status: 'distribuido',
      quantidade_projetos: 2,
      total_atribuidos: 2,
      projetos: expect.any(Array),
    });
  });

  it('should return projects with correct structure', async () => {
    const req = { user: { id: 1 } };

    const result = await controller.meusProjetos(req);

    expect(result.projetos[0]).toMatchObject({
      id: 1,
      titulo: 'Projeto A',
      descricao: 'Descrição do Projeto A',
      area: 'Ciências da Natureza',
      visualizado: false,
    });
    expect(result.projetos[0].autores).toHaveLength(2);
  });

  it('should handle empty projetos list', async () => {
    mockRelatorioAlunoService.meusProjetos.mockResolvedValueOnce({
      aluno: { id: 1, nome: 'João Silva', turma: UserTurma.INFORMATICA },
      status: 'distribuido',
      quantidade_projetos: 2,
      total_atribuidos: 0,
      projetos: [],
    });

    const req = { user: { id: 1 } };
    const result = await controller.meusProjetos(req);

    expect(result.projetos).toHaveLength(0);
    expect(result.total_atribuidos).toBe(0);
  });
});