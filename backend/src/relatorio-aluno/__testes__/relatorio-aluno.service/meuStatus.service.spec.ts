// src/relatorio/__tests__/relatorio-aluno.service/meuStatus.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { RelatorioAlunoService } from '../../relatorio-aluno.service';
import { RelatorioAluno, StatusRelatorio } from '../../entities/relatorio-aluno.entity';
import { AlunoRelatorioProjetos } from '../../entities/aluno-relatorio-projetos.entity';
import { Evento } from '../../../evento/entities/evento.entity';
import { Projeto } from '../../../projetos/entities/projeto.entity';

describe('RelatorioAlunoService - meuStatus', () => {
  let service: RelatorioAlunoService;
  let relatorioAlunoRepository: jest.Mocked<any>;
  let eventoRepository: jest.Mocked<any>;
  let alunoRelatorioProjetosRepository: jest.Mocked<any>;

  const mockEvento = {
    id: 1,
    titulo: 'Semana Científica 2026',
    ativo: true,
    created_at: new Date('2026-01-01'),
  };

  const mockRelatorioAluno = {
    id: 1,
    aluno: { id: 1, nome: 'João Silva' },
    aluno_id: 1,
    evento: mockEvento,
    evento_id: 1,
    quantidade_projetos: 3,
    status: StatusRelatorio.DISTRIBUIDO,
    data_ativacao: new Date('2026-07-01T00:00:00.000Z'),
    data_envio: null,
  };

  const mockProjetosAtribuidos = [
    { id: 1, visualizado: true },
    { id: 2, visualizado: false },
    { id: 3, visualizado: true },
  ];

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(mockEvento),
  };

  beforeEach(async () => {
    relatorioAlunoRepository = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    eventoRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    alunoRelatorioProjetosRepository = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RelatorioAlunoService,
        {
          provide: getRepositoryToken(RelatorioAluno),
          useValue: relatorioAlunoRepository,
        },
        {
          provide: getRepositoryToken(Evento),
          useValue: eventoRepository,
        },
        {
          provide: getRepositoryToken(Projeto),
          useValue: {},
        },
        {
          provide: getRepositoryToken(AlunoRelatorioProjetos),
          useValue: alunoRelatorioProjetosRepository,
        },
      ],
    }).compile();

    service = module.get<RelatorioAlunoService>(RelatorioAlunoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return status and counts correctly', async () => {
    relatorioAlunoRepository.findOne.mockResolvedValue(mockRelatorioAluno);
    alunoRelatorioProjetosRepository.find.mockResolvedValue(mockProjetosAtribuidos);

    const result = await service.meuStatus(1);

    expect(result).toEqual({
      status: StatusRelatorio.DISTRIBUIDO,
      quantidade_projetos: 3,
      total_atribuidos: 3,
      total_visualizados: 2,
      data_ativacao: mockRelatorioAluno.data_ativacao,
      data_envio: null,
    });
  });

  it('should return zero visualizados when no projects assigned', async () => {
    relatorioAlunoRepository.findOne.mockResolvedValue(mockRelatorioAluno);
    alunoRelatorioProjetosRepository.find.mockResolvedValue([]);

    const result = await service.meuStatus(1);

    expect(result.total_atribuidos).toBe(0);
    expect(result.total_visualizados).toBe(0);
  });

  it('should throw NotFoundException if student not in relatorio modalidade', async () => {
    relatorioAlunoRepository.findOne.mockResolvedValue(null);

    await expect(service.meuStatus(1)).rejects.toThrow(NotFoundException);
  });

  it('should throw NotFoundException if no active event', async () => {
    const mockQueryBuilderSemEvento = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };

    eventoRepository.createQueryBuilder.mockReturnValue(mockQueryBuilderSemEvento);

    await expect(service.meuStatus(1)).rejects.toThrow(NotFoundException);
  });
});