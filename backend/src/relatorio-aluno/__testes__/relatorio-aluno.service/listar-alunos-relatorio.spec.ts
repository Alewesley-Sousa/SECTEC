// src/relatorio/relatorio-aluno.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { RelatorioAlunoService } from '../../relatorio-aluno.service';
import { RelatorioAluno, StatusRelatorio } from '../../entities/relatorio-aluno.entity';
import { Evento } from '../../../evento/entities/evento.entity';
import { ListarRelatorioAlunoDto } from '../../dto';

describe('RelatorioAlunoService', () => {
  let service: RelatorioAlunoService;
  let relatorioAlunoRepository: jest.Mocked<any>;
  let eventoRepository: jest.Mocked<any>;

  // ============================================
  // DADOS MOCK
  // ============================================
  const mockEvento = {
    id: 1,
    nome: 'Semana Científica 2026',
    ativo: true,
    created_at: new Date('2026-01-01'),
  };

  const mockAluno = {
    id: 1,
    nome: 'João Silva',
    email_institucional: 'joao@aluno.ce.gov.br',
    turma: '3° A',
  };

  const mockProjeto = {
    id: 1,
    titulo: 'Energia Solar no Sertão',
    tema: 'Ciências da Natureza',
  };

  const mockProjetosAtribuidos = [
    {
      id: 1,
      projeto: mockProjeto,
      visualizado: false,
      data_atribuicao: new Date(),
      relatorioAluno: null,
    },
  ];

  const mockRelatorioAluno = {
    id: 1,
    aluno: mockAluno,
    aluno_id: 1,
    evento: mockEvento,
    evento_id: 1,
    quantidade_projetos: 3,
    status: StatusRelatorio.DISTRIBUIDO,
    projetosAtribuidos: mockProjetosAtribuidos,
    data_ativacao: new Date(),
    data_envio: null,
    created_at: new Date(),
  };

  // ============================================
  // CONFIGURAÇÃO DOS MOCKS
  // ============================================
  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[mockRelatorioAluno], 1]),
    getOne: jest.fn().mockResolvedValue(mockEvento),
  };

  beforeEach(async () => {
    // Criar mocks dos repositórios
    relatorioAlunoRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
    };

    eventoRepository = {
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockEvento),
      }),
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
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
      ],
    }).compile();

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
      const filtros: ListarRelatorioAlunoDto = {
        page: 1,
        limit: 10,
      };

      const result = await service.listarAlunosRelatorio(filtros);

      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
      expect(result.data[0]).toMatchObject({
        id: 1,
        status: StatusRelatorio.DISTRIBUIDO,
        quantidade_projetos: 3,
      });
      expect(result.data[0].aluno).toMatchObject({
        id: 1,
        nome: 'João Silva',
      });
      expect(result.data[0].projetos_atribuidos).toHaveLength(1);
      expect(result.data[0].projetos_atribuidos[0]).toMatchObject({
        id: 1,
        titulo: 'Energia Solar no Sertão',
        area: 'Ciências da Natureza',
      });
    });

    it('should filter by status', async () => {
      const filtros: ListarRelatorioAlunoDto = {
        status: StatusRelatorio.PENDENTE,
        page: 1,
        limit: 10,
      };

      await service.listarAlunosRelatorio(filtros);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'relatorio.status = :status',
        { status: StatusRelatorio.PENDENTE }
      );
    });

    it('should filter by nome', async () => {
      const filtros: ListarRelatorioAlunoDto = {
        nome: 'João',
        page: 1,
        limit: 10,
      };

      await service.listarAlunosRelatorio(filtros);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'aluno.nome LIKE :nome',
        { nome: '%João%' }
      );
    });

    it('should filter by both status and nome', async () => {
      const filtros: ListarRelatorioAlunoDto = {
        status: StatusRelatorio.DISTRIBUIDO,
        nome: 'Maria',
        page: 1,
        limit: 10,
      };

      await service.listarAlunosRelatorio(filtros);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'relatorio.status = :status',
        { status: StatusRelatorio.DISTRIBUIDO }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'aluno.nome LIKE :nome',
        { nome: '%Maria%' }
      );
    });

    it('should use default pagination when not provided', async () => {
      const filtros: ListarRelatorioAlunoDto = {};

      await service.listarAlunosRelatorio(filtros);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });

    it('should use custom pagination when provided', async () => {
      const filtros: ListarRelatorioAlunoDto = {
        page: 3,
        limit: 25,
      };

      await service.listarAlunosRelatorio(filtros);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(50);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(25);
    });

    it('should throw NotFoundException if no active event found', async () => {
      // Criar um mock específico para este teste
      const mockEventoRepositoryComErro = {
        createQueryBuilder: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getOne: jest.fn().mockResolvedValue(null), // ← RETORNA NULL
        }),
      };

      // Substituir o mock do eventoRepository para este teste
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          RelatorioAlunoService,
          {
            provide: getRepositoryToken(RelatorioAluno),
            useValue: relatorioAlunoRepository,
          },
          {
            provide: getRepositoryToken(Evento),
            useValue: mockEventoRepositoryComErro, // ← USAR O MOCK COM ERRO
          },
        ],
      }).compile();

      const serviceComErro = module.get<RelatorioAlunoService>(RelatorioAlunoService);
      const filtros: ListarRelatorioAlunoDto = {};

      await expect(serviceComErro.listarAlunosRelatorio(filtros)).rejects.toThrow(
        NotFoundException
      );
    });
  });
});