// src/relatorio-aluno/__testes__/relatorio-aluno.controller/atribuirProjetosManualmente.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { RelatorioAlunoController } from '../../relatorio-aluno.controller';
import { RelatorioAlunoService } from '../../relatorio-aluno.service';
import { AtribuirProjetosDto } from '../../dto';
import { StatusRelatorio } from '../../entities/relatorio-aluno.entity';
import { UserTurma } from '../../../users/entities/user.entity';
import { TemaEvento } from '../../../evento/entities/tema-evento.entity';

describe('RelatorioAlunoController - atribuirProjetosManualmente', () => {
  let controller: RelatorioAlunoController;
  let service: jest.Mocked<RelatorioAlunoService>;

  // Mock do TemaEvento
  const mockTema: TemaEvento = {
    id: 1,
    nome: 'Ciências da Natureza',
    evento: null as any,
    projetos: [],
    orientadores: [],
  } as TemaEvento;

  // Mock da resposta com os tipos corretos
  const mockResponse = {
    mensagem: 'Projetos atribuídos com sucesso.',
    data: {
      id: 1,
      aluno: {
        id: 10,
        nome: 'João Silva',
        email: 'joao.silva@aluno.com',
        turma: UserTurma.INFORMATICA,
      },
      quantidade_projetos: 3,
      total_atribuidos: 3,
      status: StatusRelatorio.DISTRIBUIDO,
      projetos: [
        {
          id: 1,
          titulo: 'Projeto A',
          area: mockTema, // 👈 TemaEvento em vez de string
          visualizado: false,
          data_atribuicao: new Date(), // 👈 Date em vez de string
        },
      ],
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RelatorioAlunoController],
      providers: [
        {
          provide: RelatorioAlunoService,
          useValue: {
            atribuirProjetosManualmente: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<RelatorioAlunoController>(RelatorioAlunoController);
    service = module.get(RelatorioAlunoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('when role is coordenador', () => {
    it('should call service with correct parameters and return result', async () => {
      const relatorioId = 1;
      const body: AtribuirProjetosDto = { projetosIds: [1, 2, 3] };
      const role = 'coordenador';

      service.atribuirProjetosManualmente.mockResolvedValue(mockResponse);

      const result = await controller.atribuirProjetosManualmente(
        relatorioId,
        body,
        role,
      );

      expect(service.atribuirProjetosManualmente).toHaveBeenCalledWith(
        relatorioId,
        body.projetosIds,
      );
      expect(result).toBe(mockResponse);
    });

    it('should handle single project assignment', async () => {
      const relatorioId = 2;
      const body: AtribuirProjetosDto = { projetosIds: [5] };
      const role = 'coordenador';

      const singleResponse = {
        ...mockResponse,
        data: {
          ...mockResponse.data,
          total_atribuidos: 1,
          projetos: [mockResponse.data.projetos[0]],
        },
      };

      service.atribuirProjetosManualmente.mockResolvedValue(singleResponse);

      const result = await controller.atribuirProjetosManualmente(
        relatorioId,
        body,
        role,
      );

      expect(service.atribuirProjetosManualmente).toHaveBeenCalledWith(
        relatorioId,
        [5],
      );
      expect(result.data?.total_atribuidos).toBe(1);
    });
  });

  describe('when role is not coordenador', () => {
    it('should throw ForbiddenException for role "aluno"', async () => {
      const relatorioId = 1;
      const body: AtribuirProjetosDto = { projetosIds: [1] };
      const role = 'aluno';

      await expect(
        controller.atribuirProjetosManualmente(relatorioId, body, role),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        controller.atribuirProjetosManualmente(relatorioId, body, role),
      ).rejects.toThrow('Apenas coordenadores podem executar esta ação.');
      expect(service.atribuirProjetosManualmente).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException for role "orientador"', async () => {
      const relatorioId = 1;
      const body: AtribuirProjetosDto = { projetosIds: [1] };
      const role = 'orientador';

      await expect(
        controller.atribuirProjetosManualmente(relatorioId, body, role),
      ).rejects.toThrow(ForbiddenException);
      expect(service.atribuirProjetosManualmente).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException for role "comissao"', async () => {
      const relatorioId = 1;
      const body: AtribuirProjetosDto = { projetosIds: [1] };
      const role = 'comissao';

      await expect(
        controller.atribuirProjetosManualmente(relatorioId, body, role),
      ).rejects.toThrow(ForbiddenException);
      expect(service.atribuirProjetosManualmente).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException for any other role', async () => {
      const relatorioId = 1;
      const body: AtribuirProjetosDto = { projetosIds: [1] };
      const role = 'unknown';

      await expect(
        controller.atribuirProjetosManualmente(relatorioId, body, role),
      ).rejects.toThrow(ForbiddenException);
      expect(service.atribuirProjetosManualmente).not.toHaveBeenCalled();
    });
  });

  describe('parameter validation', () => {
    it('should pass relatorioId as number (ParseIntPipe)', () => {
      const relatorioId = 1;
      const body: AtribuirProjetosDto = { projetosIds: [1] };
      const role = 'coordenador';

      service.atribuirProjetosManualmente.mockResolvedValue(mockResponse);

      controller.atribuirProjetosManualmente(relatorioId, body, role);

      expect(service.atribuirProjetosManualmente).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Array),
      );
    });

    it('should pass projetosIds as array of numbers', () => {
      const relatorioId = 1;
      const body: AtribuirProjetosDto = { projetosIds: [1, 2, 3] };
      const role = 'coordenador';

      service.atribuirProjetosManualmente.mockResolvedValue(mockResponse);

      controller.atribuirProjetosManualmente(relatorioId, body, role);

      expect(service.atribuirProjetosManualmente).toHaveBeenCalledWith(
        expect.any(Number),
        expect.arrayContaining([1, 2, 3]),
      );
    });
  });

  describe('error propagation', () => {
    it('should propagate NotFoundException from service', async () => {
      const relatorioId = 999;
      const body: AtribuirProjetosDto = { projetosIds: [1] };
      const role = 'coordenador';

      const error = new Error('Relatório não encontrado');
      service.atribuirProjetosManualmente.mockRejectedValue(error);

      await expect(
        controller.atribuirProjetosManualmente(relatorioId, body, role),
      ).rejects.toThrow(error);
    });

    it('should propagate BadRequestException from service', async () => {
      const relatorioId = 1;
      const body: AtribuirProjetosDto = { projetosIds: [1, 2, 3] };
      const role = 'coordenador';

      const error = new Error('Limite de projetos excedido');
      service.atribuirProjetosManualmente.mockRejectedValue(error);

      await expect(
        controller.atribuirProjetosManualmente(relatorioId, body, role),
      ).rejects.toThrow(error);
    });
  });
});