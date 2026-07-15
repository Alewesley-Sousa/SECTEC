// src/relatorio-aluno/__testes__/relatorio-aluno.controller/removerProjetosManualmente.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { RelatorioAlunoController } from '../../relatorio-aluno.controller';
import { RelatorioAlunoService } from '../../relatorio-aluno.service';
import { RemoverProjetosDto } from '../../dto';
import { StatusRelatorio } from '../../entities/relatorio-aluno.entity';
import { UserTurma } from '../../../users/entities/user.entity';
import { TemaEvento } from '../../../evento/entities/tema-evento.entity';

describe('RelatorioAlunoController - removerProjetosManualmente', () => {
  let controller: RelatorioAlunoController;
  let service: jest.Mocked<RelatorioAlunoService>;

  // Mock do TemaEvento
  const mockTema: TemaEvento = {
    id: 1,
    nome: 'Matemática',
    evento: null as any,
    projetos: [],
    orientadores: [],
  } as TemaEvento;

  const mockResponse = {
    mensagem: 'Projetos removidos com sucesso.',
    data: {
      id: 1,
      aluno: {
        id: 10,
        nome: 'João Silva',
        email: 'joao.silva@aluno.com',
        turma: UserTurma.INFORMATICA,
      },
      quantidade_projetos: 3,
      total_atribuidos: 1,
      status: StatusRelatorio.PENDENTE,
      projetos: [
        {
          id: 2,
          titulo: 'Projeto B',
          area: mockTema, // Usa TemaEvento em vez de string
          visualizado: false,
          data_atribuicao: new Date(),
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
            removerProjetosManualmente: jest.fn(),
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
      const body: RemoverProjetosDto = { projetosIds: [1, 2] };
      const role = 'coordenador';

      service.removerProjetosManualmente.mockResolvedValue(mockResponse);

      const result = await controller.removerProjetosManualmente(
        relatorioId,
        body,
        role,
      );

      expect(service.removerProjetosManualmente).toHaveBeenCalledWith(
        relatorioId,
        body.projetosIds,
      );
      expect(result).toBe(mockResponse);
    });

    it('should handle single project removal', async () => {
      const relatorioId = 2;
      const body: RemoverProjetosDto = { projetosIds: [5] };
      const role = 'coordenador';

      const singleResponse = {
        ...mockResponse,
        data: {
          ...mockResponse.data,
          total_atribuidos: 2,
          projetos: [mockResponse.data.projetos[0]],
        },
      };

      service.removerProjetosManualmente.mockResolvedValue(singleResponse);

      const result = await controller.removerProjetosManualmente(
        relatorioId,
        body,
        role,
      );

      expect(service.removerProjetosManualmente).toHaveBeenCalledWith(
        relatorioId,
        [5],
      );
      expect(result.data.total_atribuidos).toBe(2);
    });
  });

  describe('when role is not coordenador', () => {
    it('should throw ForbiddenException for role "aluno"', async () => {
      const relatorioId = 1;
      const body: RemoverProjetosDto = { projetosIds: [1] };
      const role = 'aluno';

      await expect(
        controller.removerProjetosManualmente(relatorioId, body, role),
      ).rejects.toThrow(ForbiddenException);
      expect(service.removerProjetosManualmente).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException for role "orientador"', async () => {
      const relatorioId = 1;
      const body: RemoverProjetosDto = { projetosIds: [1] };
      const role = 'orientador';

      await expect(
        controller.removerProjetosManualmente(relatorioId, body, role),
      ).rejects.toThrow(ForbiddenException);
      expect(service.removerProjetosManualmente).not.toHaveBeenCalled();
    });
  });

  describe('error propagation', () => {
    it('should propagate NotFoundException from service', async () => {
      const relatorioId = 999;
      const body: RemoverProjetosDto = { projetosIds: [1] };
      const role = 'coordenador';

      const error = new Error('Relatório não encontrado');
      service.removerProjetosManualmente.mockRejectedValue(error);

      await expect(
        controller.removerProjetosManualmente(relatorioId, body, role),
      ).rejects.toThrow(error);
    });

    it('should propagate BadRequestException from service', async () => {
      const relatorioId = 1;
      const body: RemoverProjetosDto = { projetosIds: [99] };
      const role = 'coordenador';

      const error = new Error('Projeto não atribuído');
      service.removerProjetosManualmente.mockRejectedValue(error);

      await expect(
        controller.removerProjetosManualmente(relatorioId, body, role),
      ).rejects.toThrow(error);
    });
  });
});