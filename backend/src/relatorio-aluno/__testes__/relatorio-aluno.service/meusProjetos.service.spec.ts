// src/relatorio/__tests__/relatorio-aluno.service/meusProjetos.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { RelatorioAlunoService } from '../../relatorio-aluno.service';
import { RelatorioAluno, StatusRelatorio } from '../../entities/relatorio-aluno.entity';
import { AlunoRelatorioProjetos } from '../../entities/aluno-relatorio-projetos.entity';
import { Evento } from '../../../evento/entities/evento.entity';
import { Projeto } from '../../../projetos/entities/projeto.entity';
import { UserTurma } from '../../../users/entities/user.entity';

describe('RelatorioAlunoService - meusProjetos', () => {
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

  const mockAluno = {
    id: 1,
    nome: 'João Silva',
    turma: UserTurma.INFORMATICA,
  };

  const mockRelatorioAluno = {
    id: 1,
    aluno: mockAluno,
    aluno_id: 1,
    evento: mockEvento,
    evento_id: 1,
    quantidade_projetos: 2,
    status: StatusRelatorio.DISTRIBUIDO,
  };

  const mockProjetosAtribuidos = [
    {
      id: 1,
      visualizado: false,
      data_atribuicao: new Date('2026-07-09T10:00:00.000Z'),
      projeto: {
        id: 1,
        titulo: 'Projeto A',
        descricao: 'Descrição do Projeto A',
        tema: { nome: 'Ciências da Natureza' },
        alunoAutor: { id: 3, nome: 'Carlos Silva', turma: UserTurma.ENFERMAGEM },
        projetoAlunos: [
          { aluno: { id: 4, nome: 'Ana Souza', turma: UserTurma.CONTABILIDADE } },
          { aluno: { id: 5, nome: 'Pedro Santos', turma: UserTurma.ENFERMAGEM } },
        ],
      },
    },
    {
      id: 2,
      visualizado: true,
      data_atribuicao: new Date('2026-07-09T10:30:00.000Z'),
      projeto: {
        id: 2,
        titulo: 'Projeto B',
        descricao: 'Descrição do Projeto B',
        tema: { nome: 'Ciências Humanas' },
        alunoAutor: { id: 6, nome: 'Maria Oliveira', turma: UserTurma.INFORMATICA },
        projetoAlunos: [],
      },
    },
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

  it('should return projects assigned to the student', async () => {
    relatorioAlunoRepository.findOne.mockResolvedValue(mockRelatorioAluno);
    alunoRelatorioProjetosRepository.find.mockResolvedValue(mockProjetosAtribuidos);

    const result = await service.meusProjetos(1);

    expect(result).toBeDefined();
    expect(result.aluno).toEqual({
      id: 1,
      nome: 'João Silva',
      turma: UserTurma.INFORMATICA,
    });
    expect(result.status).toBe(StatusRelatorio.DISTRIBUIDO);
    expect(result.quantidade_projetos).toBe(2);
    expect(result.total_atribuidos).toBe(2);
    expect(result.projetos).toHaveLength(2);
  });

  it('should return correct project structure', async () => {
    relatorioAlunoRepository.findOne.mockResolvedValue(mockRelatorioAluno);
    alunoRelatorioProjetosRepository.find.mockResolvedValue(mockProjetosAtribuidos);

    const result = await service.meusProjetos(1);

    expect(result.projetos[0]).toMatchObject({
      id: 1,
      titulo: 'Projeto A',
      descricao: 'Descrição do Projeto A',
      area: 'Ciências da Natureza',
      visualizado: false,
    });
    expect(result.projetos[0].autores).toHaveLength(3);
    expect(result.projetos[0].autores[0]).toMatchObject({
      id: 3,
      nome: 'Carlos Silva',
      turma: UserTurma.ENFERMAGEM,
      tipo: 'autor_principal',
    });
  });

  it('should handle project without co-authors', async () => {
    relatorioAlunoRepository.findOne.mockResolvedValue(mockRelatorioAluno);
    alunoRelatorioProjetosRepository.find.mockResolvedValue([mockProjetosAtribuidos[1]]);

    const result = await service.meusProjetos(1);

    expect(result.projetos).toHaveLength(1);
    expect(result.projetos[0].autores).toHaveLength(1);
    expect(result.projetos[0].autores[0].tipo).toBe('autor_principal');
  });

  it('should throw NotFoundException if student not in relatorio modalidade', async () => {
    relatorioAlunoRepository.findOne.mockResolvedValue(null);

    await expect(service.meusProjetos(1)).rejects.toThrow(NotFoundException);
  });

  it('should return empty projetos array when none assigned', async () => {
    relatorioAlunoRepository.findOne.mockResolvedValue(mockRelatorioAluno);
    alunoRelatorioProjetosRepository.find.mockResolvedValue([]);

    const result = await service.meusProjetos(1);

    expect(result.projetos).toHaveLength(0);
    expect(result.total_atribuidos).toBe(0);
  });

  it('should throw NotFoundException if no active event', async () => {
    const mockQueryBuilderSemEvento = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };

    eventoRepository.createQueryBuilder.mockReturnValue(mockQueryBuilderSemEvento);

    await expect(service.meusProjetos(1)).rejects.toThrow(NotFoundException);
  });
});