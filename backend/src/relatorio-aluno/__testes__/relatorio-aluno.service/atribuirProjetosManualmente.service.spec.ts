import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RelatorioAlunoService } from '../../relatorio-aluno.service';
import { RelatorioAluno, StatusRelatorio } from '../../entities/relatorio-aluno.entity';
import { AlunoRelatorioProjetos } from '../../entities/aluno-relatorio-projetos.entity';
import { Evento, EventoStatus } from '../../../evento/entities/evento.entity';
import { Projeto } from '../../../projetos/entities/projeto.entity';
import { User } from '../../../users/entities/user.entity';

describe('RelatorioAlunoService - atribuirProjetosManualmente', () => {
  let service: RelatorioAlunoService;
  let relatorioAlunoRepository: jest.Mocked<any>;
  let projetoRepository: jest.Mocked<any>;
  let alunoRelatorioProjetosRepository: jest.Mocked<any>;
  let eventoRepository: jest.Mocked<any>;
  let userRepository: jest.Mocked<any>;

  const anoAtual = new Date().getFullYear();
  const dataEvento = new Date(anoAtual, 0, 1);

  const mockAluno = {
    id: 10,
    nome: 'João Silva',
    email_institucional: 'joao@aluno.com',
    turma: 'informatica',
  };

  const mockEvento = {
    id: 1,
    titulo: 'Evento 2026',
    status: EventoStatus.ATIVO,
    criadoEm: dataEvento,
  };

  const mockProjetos = [
    { id: 1, titulo: 'Projeto A', evento: mockEvento, tema: 'Ciências' },
    { id: 2, titulo: 'Projeto B', evento: mockEvento, tema: 'Matemática' },
    { id: 3, titulo: 'Projeto C', evento: mockEvento, tema: 'Física' },
  ];

  const mockRelatorio = {
    id: 1,
    aluno: mockAluno,
    evento: mockEvento,
    quantidade_projetos: 3,
    status: StatusRelatorio.PENDENTE,
    projetosAtribuidos: [],
    aluno_id: 10,
    evento_id: 1,
  };

  beforeEach(async () => {
    relatorioAlunoRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };
    projetoRepository = {
      find: jest.fn(),
    };
    alunoRelatorioProjetosRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };
    eventoRepository = {} as any;
    userRepository = {} as any;

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
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
      ],
    }).compile();

    service = module.get<RelatorioAlunoService>(RelatorioAlunoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should atribuir projetos com sucesso e atualizar status para DISTRIBUIDO', async () => {
    relatorioAlunoRepository.findOne.mockResolvedValueOnce({
      ...mockRelatorio,
      projetosAtribuidos: [],
    });

    projetoRepository.find.mockResolvedValue(mockProjetos);

    alunoRelatorioProjetosRepository.create.mockImplementation((data) => data);
    alunoRelatorioProjetosRepository.save.mockResolvedValue({ id: 1 });

    relatorioAlunoRepository.save.mockResolvedValue({
      ...mockRelatorio,
      status: StatusRelatorio.DISTRIBUIDO,
    });

    // 🔥 CORREÇÃO: status DISTRIBUIDO na segunda chamada
    relatorioAlunoRepository.findOne.mockResolvedValueOnce({
      ...mockRelatorio,
      status: StatusRelatorio.DISTRIBUIDO,
      projetosAtribuidos: mockProjetos.map((p) => ({
        id: p.id,
        projeto: p,
        visualizado: false,
        data_atribuicao: new Date(),
      })),
    });

    const result = await service.atribuirProjetosManualmente(1, [1, 2, 3]);

    expect(result.mensagem).toBe('Projetos atribuídos com sucesso.');
    expect(result.data?.total_atribuidos).toBe(3);
    expect(result.data?.status).toBe(StatusRelatorio.DISTRIBUIDO);
    expect(relatorioAlunoRepository.save).toHaveBeenCalled();
    expect(alunoRelatorioProjetosRepository.save).toHaveBeenCalledTimes(3);
  });

  it('should atribuir projetos e manter status PENDENTE se não completar a quantidade', async () => {
    const relatorioComQuantidade3 = {
      ...mockRelatorio,
      quantidade_projetos: 3,
      projetosAtribuidos: [],
    };

    relatorioAlunoRepository.findOne.mockResolvedValueOnce(relatorioComQuantidade3);
    projetoRepository.find.mockResolvedValue(mockProjetos.slice(0, 2));

    alunoRelatorioProjetosRepository.create.mockImplementation((data) => data);
    alunoRelatorioProjetosRepository.save.mockResolvedValue({ id: 1 });

    relatorioAlunoRepository.save.mockResolvedValue({
      ...relatorioComQuantidade3,
      status: StatusRelatorio.PENDENTE,
    });

    relatorioAlunoRepository.findOne.mockResolvedValueOnce({
      ...relatorioComQuantidade3,
      status: StatusRelatorio.PENDENTE, // mantém PENDENTE
      projetosAtribuidos: mockProjetos.slice(0, 2).map((p) => ({
        id: p.id,
        projeto: p,
        visualizado: false,
        data_atribuicao: new Date(),
      })),
    });

    const result = await service.atribuirProjetosManualmente(1, [1, 2]);

    expect(result.data?.total_atribuidos).toBe(2);
    expect(result.data?.status).toBe(StatusRelatorio.PENDENTE);
    expect(alunoRelatorioProjetosRepository.save).toHaveBeenCalledTimes(2);
  });

  it('should throw NotFoundException if relatorio not found', async () => {
    relatorioAlunoRepository.findOne.mockResolvedValue(null);

    await expect(service.atribuirProjetosManualmente(999, [1])).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw BadRequestException if evento not active', async () => {
    const eventoInativo = { ...mockEvento, status: EventoStatus.INATIVO };
    const relatorioInativo = { ...mockRelatorio, evento: eventoInativo };

    relatorioAlunoRepository.findOne.mockResolvedValue(relatorioInativo);

    await expect(service.atribuirProjetosManualmente(1, [1])).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.atribuirProjetosManualmente(1, [1])).rejects.toThrow(
      'O evento não está ativo.',
    );
  });

  it('should throw BadRequestException if evento not from current year', async () => {
    const eventoAnoPassado = {
      ...mockEvento,
      criadoEm: new Date(2025, 0, 1),
    };
    const relatorioAnoPassado = { ...mockRelatorio, evento: eventoAnoPassado };

    relatorioAlunoRepository.findOne.mockResolvedValue(relatorioAnoPassado);

    await expect(service.atribuirProjetosManualmente(1, [1])).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.atribuirProjetosManualmente(1, [1])).rejects.toThrow(
      'O evento não pertence ao ano atual.',
    );
  });

  it('should throw NotFoundException if some project not found', async () => {
    relatorioAlunoRepository.findOne.mockResolvedValue({
      ...mockRelatorio,
      projetosAtribuidos: [],
    });

    projetoRepository.find.mockResolvedValue([mockProjetos[0]]);

    await expect(service.atribuirProjetosManualmente(1, [1, 999])).rejects.toThrow(
      NotFoundException,
    );
    await expect(service.atribuirProjetosManualmente(1, [1, 999])).rejects.toThrow(
      'Um ou mais projetos não foram encontrados.',
    );
  });

  it('should throw BadRequestException if project belongs to different event', async () => {
    const mockEventoDiferente = { id: 2, titulo: 'Outro Evento' };
    const projetoDiferente = {
      ...mockProjetos[0],
      evento: mockEventoDiferente,
    };

    relatorioAlunoRepository.findOne.mockResolvedValue({
      ...mockRelatorio,
      projetosAtribuidos: [],
    });

    projetoRepository.find.mockResolvedValue([projetoDiferente]);

    await expect(service.atribuirProjetosManualmente(1, [1])).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.atribuirProjetosManualmente(1, [1])).rejects.toThrow(
      'não pertence ao evento atual do aluno.',
    );
  });

  it('should throw BadRequestException if trying to assign duplicate projects', async () => {
    const relatorioComProjeto = {
      ...mockRelatorio,
      projetosAtribuidos: [
        {
          id: 10,
          projeto: mockProjetos[0],
          visualizado: false,
          data_atribuicao: new Date(),
        },
      ],
    };

    relatorioAlunoRepository.findOne.mockResolvedValue(relatorioComProjeto);
    projetoRepository.find.mockResolvedValue([mockProjetos[0], mockProjetos[1]]);

    await expect(service.atribuirProjetosManualmente(1, [1, 2])).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.atribuirProjetosManualmente(1, [1, 2])).rejects.toThrow(
      'já estão atribuídos a este aluno.',
    );
  });

  it('should throw BadRequestException if exceeds max projects limit', async () => {
    const relatorioComUmProjeto = {
      ...mockRelatorio,
      quantidade_projetos: 2,
      projetosAtribuidos: [
        {
          id: 10,
          projeto: mockProjetos[0],
          visualizado: false,
          data_atribuicao: new Date(),
        },
      ],
    };

    relatorioAlunoRepository.findOne.mockResolvedValue(relatorioComUmProjeto);
    projetoRepository.find.mockResolvedValue([mockProjetos[1], mockProjetos[2]]);

    await expect(service.atribuirProjetosManualmente(1, [2, 3])).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.atribuirProjetosManualmente(1, [2, 3])).rejects.toThrow(
      'Não é possível atribuir',
    );
  });
});