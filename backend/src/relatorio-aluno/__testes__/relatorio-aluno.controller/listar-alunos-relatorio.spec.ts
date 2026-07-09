// src/relatorio/relatorio-aluno.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { RelatorioAlunoController } from '../../relatorio-aluno.controller';
import { RelatorioAlunoService } from '../../relatorio-aluno.service';
import { StatusRelatorio } from '../../entities/relatorio-aluno.entity';
import { ListarRelatorioAlunoDto } from '../../dto';

describe('RelatorioAlunoController', () => {
  let controller: RelatorioAlunoController;
  let service: RelatorioAlunoService;

  // ============================================
  // MOCK DO SERVICE
  // ============================================
  const mockRelatorioAlunoService = {
    listarAlunosRelatorio: jest.fn().mockResolvedValue({
      data: [
        {
          id: 1,
          aluno: {
            id: 1,
            nome: 'João Silva',
            email: 'joao@aluno.ce.gov.br',
            turma: '3° A',
          },
          status: StatusRelatorio.DISTRIBUIDO,
          quantidade_projetos: 3,
          projetos_atribuidos: [
            {
              id: 1,
              titulo: 'Energia Solar no Sertão',
              area: 'Ciências da Natureza',
              visualizado: false,
              data_atribuicao: new Date('2026-07-09T10:00:00.000Z'),
            },
          ],
          data_ativacao: new Date('2026-07-02T00:00:00.000Z'),
          data_envio: null,
          created_at: new Date('2026-07-02T00:00:00.000Z'),
        },
      ],
      meta: {
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
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

  // ============================================
  // TESTES
  // ============================================
  describe('listarAlunosRelatorio', () => {
    it('should return paginated list of alunos relatorio', async () => {
      const filtros: ListarRelatorioAlunoDto = {};

      const result = await controller.listarAlunosRelatorio(filtros);

      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
      expect(service.listarAlunosRelatorio).toHaveBeenCalledWith(filtros);
    });

    it('should filter by status', async () => {
      const filtros: ListarRelatorioAlunoDto = {
        status: StatusRelatorio.PENDENTE,
      };

      await controller.listarAlunosRelatorio(filtros);

      expect(service.listarAlunosRelatorio).toHaveBeenCalledWith(filtros);
    });

    it('should filter by nome', async () => {
      const filtros: ListarRelatorioAlunoDto = {
        nome: 'João',
      };

      await controller.listarAlunosRelatorio(filtros);

      expect(service.listarAlunosRelatorio).toHaveBeenCalledWith(filtros);
    });

    it('should filter by both status and nome', async () => {
      const filtros: ListarRelatorioAlunoDto = {
        status: StatusRelatorio.DISTRIBUIDO,
        nome: 'Maria',
      };

      await controller.listarAlunosRelatorio(filtros);

      expect(service.listarAlunosRelatorio).toHaveBeenCalledWith(filtros);
    });

    it('should use custom pagination', async () => {
      const filtros: ListarRelatorioAlunoDto = {
        page: 2,
        limit: 5,
      };

      await controller.listarAlunosRelatorio(filtros);

      expect(service.listarAlunosRelatorio).toHaveBeenCalledWith(filtros);
    });

    it('should call service with empty filters when none provided', async () => {
      const filtros: ListarRelatorioAlunoDto = {};

      await controller.listarAlunosRelatorio(filtros);

      expect(service.listarAlunosRelatorio).toHaveBeenCalledWith(filtros);
    });

    it('should return the exact result from service', async () => {
      const filtros: ListarRelatorioAlunoDto = {};
      const expectedResult = await service.listarAlunosRelatorio(filtros);

      const result = await controller.listarAlunosRelatorio(filtros);

      expect(result).toEqual(expectedResult);
    });
  });
});