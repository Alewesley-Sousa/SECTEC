// src/relatorio/__tests__/relatorio-aluno.controller/distribuirProjetos.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { RelatorioAlunoController } from '../../relatorio-aluno.controller';
import { RelatorioAlunoService } from '../../relatorio-aluno.service';

describe('RelatorioAlunoController - distribuirProjetos', () => {
  let controller: RelatorioAlunoController;
  let service: RelatorioAlunoService;

  const mockRelatorioAlunoService = {
    distribuirProjetos: jest.fn().mockResolvedValue({
      mensagem: 'Distribuição concluída com sucesso!',
      total_alunos: 2,
      total_projetos_atribuidos: 5,
      alunos_processados: [
        {
          aluno_id: 1,
          aluno_nome: 'João Silva',
          turma_aluno: 'informatica',
          status: 'distribuido',
          projetos_atribuidos: [
            { projeto_id: 5, titulo: 'Projeto A', turma_autor: 'enfermagem' },
            { projeto_id: 8, titulo: 'Projeto B', turma_autor: 'contabilidade' },
          ],
          total_atribuido: 2,
        },
        {
          aluno_id: 2,
          aluno_nome: 'Maria Santos',
          turma_aluno: 'enfermagem',
          status: 'distribuido',
          projetos_atribuidos: [
            { projeto_id: 3, titulo: 'Projeto C', turma_autor: 'informatica' },
            { projeto_id: 7, titulo: 'Projeto D', turma_autor: 'contabilidade' },
            { projeto_id: 10, titulo: 'Projeto E', turma_autor: 'informatica' },
          ],
          total_atribuido: 3,
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

  it('should call distribuirProjetos from service', async () => {
    await controller.distribuirProjetos();

    expect(service.distribuirProjetos).toHaveBeenCalled();
  });

  it('should return the result from service', async () => {
    const result = await controller.distribuirProjetos();

    expect(result).toEqual({
      mensagem: 'Distribuição concluída com sucesso!',
      total_alunos: 2,
      total_projetos_atribuidos: 5,
      alunos_processados: expect.any(Array),
    });
  });

  it('should return success message when distribution is done', async () => {
    const result = await controller.distribuirProjetos();

    expect(result.mensagem).toBe('Distribuição concluída com sucesso!');
    expect(result.total_alunos).toBe(2);
    expect(result.total_projetos_atribuidos).toBe(5);
  });

  it('should return alunos_processados with correct structure', async () => {
    const result = await controller.distribuirProjetos();

    expect(result.alunos_processados).toHaveLength(2);
    expect(result.alunos_processados[0]).toMatchObject({
      aluno_id: 1,
      aluno_nome: 'João Silva',
      turma_aluno: 'informatica',
      status: 'distribuido',
      total_atribuido: 2,
    });
    expect(result.alunos_processados[0].projetos_atribuidos).toHaveLength(2);
  });

  it('should handle case with no alunos elegíveis', async () => {
    mockRelatorioAlunoService.distribuirProjetos.mockResolvedValueOnce({
      mensagem: 'Nenhum aluno elegível para distribuição.',
      total_alunos: 0,
      total_projetos_atribuidos: 0,
      alunos_processados: [],
    });

    const result = await controller.distribuirProjetos();

    expect(result.mensagem).toBe('Nenhum aluno elegível para distribuição.');
    expect(result.total_alunos).toBe(0);
    expect(result.alunos_processados).toHaveLength(0);
  });
});