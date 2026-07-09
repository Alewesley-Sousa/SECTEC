// src/relatorio/__tests__/relatorio-aluno.service/distribuirProjetos.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RelatorioAlunoService } from '../../relatorio-aluno.service';
import { RelatorioAluno, StatusRelatorio } from '../../entities/relatorio-aluno.entity';
import { AlunoRelatorioProjetos } from '../../entities/aluno-relatorio-projetos.entity';
import { Evento } from '../../../evento/entities/evento.entity';
import { Projeto } from '../../../projetos/entities/projeto.entity';
import { UserTurma } from '../../../users/entities/user.entity';

describe('RelatorioAlunoService - distribuirProjetos', () => {
  let service: RelatorioAlunoService;
  let relatorioAlunoRepository: jest.Mocked<any>;
  let eventoRepository: jest.Mocked<any>;
  let projetoRepository: jest.Mocked<any>;
  let alunoRelatorioProjetosRepository: jest.Mocked<any>;

  const mockEvento = {
    id: 1,
    titulo: 'Semana Científica 2026',
    ativo: true,
    created_at: new Date('2026-01-01'),
  };

  const mockAluno1 = {
    id: 1,
    nome: 'João Silva',
    turma: UserTurma.INFORMATICA,
  };

  const mockAluno2 = {
    id: 2,
    nome: 'Maria Santos',
    turma: UserTurma.ENFERMAGEM,
  };

  const mockAlunoRelatorio1 = {
    id: 1,
    aluno: mockAluno1,
    aluno_id: 1,
    evento: mockEvento,
    evento_id: 1,
    quantidade_projetos: 2,
    status: StatusRelatorio.PENDENTE,
  };

  const mockAlunoRelatorio2 = {
    id: 2,
    aluno: mockAluno2,
    aluno_id: 2,
    evento: mockEvento,
    evento_id: 1,
    quantidade_projetos: 3,
    status: StatusRelatorio.PENDENTE,
  };

  const mockProjetos = [
    {
      id: 1,
      titulo: 'Projeto A',
      alunoAutor: { id: 3, nome: 'Carlos', turma: UserTurma.ENFERMAGEM },
    },
    {
      id: 2,
      titulo: 'Projeto B',
      alunoAutor: { id: 4, nome: 'Ana', turma: UserTurma.CONTABILIDADE },
    },
    {
      id: 3,
      titulo: 'Projeto C',
      alunoAutor: { id: 5, nome: 'Pedro', turma: UserTurma.INFORMATICA },
    },
    {
      id: 4,
      titulo: 'Projeto D',
      alunoAutor: { id: 6, nome: 'Lucia', turma: UserTurma.ENFERMAGEM },
    },
  ];

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(mockEvento),
  };

  beforeEach(async () => {
    relatorioAlunoRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    eventoRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    projetoRepository = {
      find: jest.fn(),
    };

    alunoRelatorioProjetosRepository = {
      find: jest.fn(),
      create: jest.fn(),
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
        {
          provide: getRepositoryToken(Projeto),
          useValue: projetoRepository,
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

  it('should distribute projects successfully', async () => {
    relatorioAlunoRepository.find.mockResolvedValue([mockAlunoRelatorio1, mockAlunoRelatorio2]);
    projetoRepository.find.mockResolvedValue(mockProjetos);
    alunoRelatorioProjetosRepository.find.mockResolvedValue([]);
    alunoRelatorioProjetosRepository.create.mockImplementation((data) => data);
    alunoRelatorioProjetosRepository.save.mockResolvedValue({ id: 1 });
    relatorioAlunoRepository.save.mockResolvedValue({});

    const result = await service.distribuirProjetos();

    expect(result.mensagem).toBe('Distribuição concluída com sucesso!');
    expect(result.total_alunos).toBe(2);
    expect(result.total_projetos_atribuidos).toBeGreaterThan(0);
    expect(result.alunos_processados).toHaveLength(2);
    expect(result.alunos_processados[0].status).toBe('distribuido');
  });

  it('should return no alunos elegíveis message', async () => {
    relatorioAlunoRepository.find.mockResolvedValue([]);

    const result = await service.distribuirProjetos();

    expect(result.mensagem).toBe('Nenhum aluno elegível para distribuição.');
    expect(result.total_alunos).toBe(0);
    expect(result.alunos_processados).toHaveLength(0);
  });

  it('should throw NotFoundException if no active event', async () => {
    const mockQueryBuilderSemEvento = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };

    eventoRepository.createQueryBuilder.mockReturnValue(mockQueryBuilderSemEvento);

    await expect(service.distribuirProjetos()).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException if no projects available', async () => {
    relatorioAlunoRepository.find.mockResolvedValue([mockAlunoRelatorio1]);
    projetoRepository.find.mockResolvedValue([]);

    await expect(service.distribuirProjetos()).rejects.toThrow(BadRequestException);
  });

  it('should handle aluno already has all projects', async () => {
    const mockProjetosAtribuidos = [
      { projeto_id: 1, projeto: mockProjetos[0] },
      { projeto_id: 2, projeto: mockProjetos[1] },
    ];

    relatorioAlunoRepository.find.mockResolvedValue([mockAlunoRelatorio1]);
    projetoRepository.find.mockResolvedValue(mockProjetos);
    alunoRelatorioProjetosRepository.find.mockResolvedValue(mockProjetosAtribuidos);

    const result = await service.distribuirProjetos();

    expect(result.alunos_processados[0].status).toBe('ja_atribuido');
    expect(result.alunos_processados[0].mensagem).toBe('Aluno já possui todos os projetos atribuídos.');
  });

  it('should distribute projects with cross-turma priority', async () => {
    const alunoInformatica = {
      ...mockAlunoRelatorio1,
      aluno: { ...mockAluno1, turma: UserTurma.INFORMATICA },
    };

    relatorioAlunoRepository.find.mockResolvedValue([alunoInformatica]);
    projetoRepository.find.mockResolvedValue(mockProjetos);
    alunoRelatorioProjetosRepository.find.mockResolvedValue([]);
    alunoRelatorioProjetosRepository.create.mockImplementation((data) => data);
    alunoRelatorioProjetosRepository.save.mockResolvedValue({ id: 1 });
    relatorioAlunoRepository.save.mockResolvedValue({});

    const result = await service.distribuirProjetos();

    // Verificar que os projetos atribuídos são de turmas diferentes (prioridade)
    const projetosAtribuidos = result.alunos_processados[0].projetos_atribuidos;
    const turmasProjetos = projetosAtribuidos.map((p) => p.turma_autor);
    
    // Deve ter pelo menos um projeto de turma diferente
    expect(turmasProjetos.some((t) => t !== UserTurma.INFORMATICA)).toBe(true);
  });
});