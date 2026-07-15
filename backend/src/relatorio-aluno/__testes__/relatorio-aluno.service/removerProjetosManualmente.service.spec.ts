// src/relatorio-aluno/__testes__/relatorio-aluno.service/removerProjetosManualmente.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RelatorioAlunoService } from '../../relatorio-aluno.service';
import { RelatorioAluno, StatusRelatorio } from '../../entities/relatorio-aluno.entity';
import { AlunoRelatorioProjetos } from '../../entities/aluno-relatorio-projetos.entity';
import { Evento } from '../../../evento/entities/evento.entity';
import { Projeto } from '../../../projetos/entities/projeto.entity';
import { User } from '../../../users/entities/user.entity';

describe('RelatorioAlunoService - removerProjetosManualmente', () => {
  let service: RelatorioAlunoService;
  let relatorioAlunoRepository: jest.Mocked<any>;
  let alunoRelatorioProjetosRepository: jest.Mocked<any>;

  const mockEvento = {
    id: 1,
    titulo: 'Evento 2026',
    status: 'ativo',
    criadoEm: new Date(),
  };

  const mockAluno = {
    id: 10,
    nome: 'João Silva',
    email_institucional: 'joao@aluno.com',
    turma: 'informatica',
  };

  const mockProjetos = [
    { id: 1, titulo: 'Projeto A', evento: mockEvento, tema: 'Ciências' },
    { id: 2, titulo: 'Projeto B', evento: mockEvento, tema: 'Matemática' },
    { id: 3, titulo: 'Projeto C', evento: mockEvento, tema: 'Física' },
  ];

  const criarMockRelatorio = (quantidade: number, projetosAtribuidos: any[] = []) => ({
    id: 1,
    aluno: mockAluno,
    evento: mockEvento,
    quantidade_projetos: quantidade,
    status: StatusRelatorio.DISTRIBUIDO,
    projetosAtribuidos: projetosAtribuidos.map(p => ({
      id: p.id,
      projeto: p,
      visualizado: false,
      data_atribuicao: new Date(),
    })),
  });

  beforeEach(async () => {
    relatorioAlunoRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    alunoRelatorioProjetosRepository = {
      delete: jest.fn(),
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
          useValue: {},
        },
        {
          provide: getRepositoryToken(Projeto),
          useValue: {},
        },
        {
          provide: getRepositoryToken(AlunoRelatorioProjetos),
          useValue: alunoRelatorioProjetosRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<RelatorioAlunoService>(RelatorioAlunoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve remover projetos e mudar status para PENDENTE se total < quantidade', async () => {
    const relatorioInicial = criarMockRelatorio(3, [mockProjetos[0], mockProjetos[1], mockProjetos[2]]);
    const relatorioAposRemocao = criarMockRelatorio(3, [mockProjetos[0]]);
    relatorioAposRemocao.status = StatusRelatorio.PENDENTE;

    relatorioAlunoRepository.findOne
      .mockResolvedValueOnce(relatorioInicial)
      .mockResolvedValueOnce(relatorioAposRemocao);

    alunoRelatorioProjetosRepository.delete.mockResolvedValue({ affected: 2 });
    relatorioAlunoRepository.save.mockResolvedValue(relatorioAposRemocao);

    const result = await service.removerProjetosManualmente(1, [2, 3]);

    expect(result.data.total_atribuidos).toBe(1);
    expect(result.data.status).toBe(StatusRelatorio.PENDENTE);
    expect(alunoRelatorioProjetosRepository.delete).toHaveBeenCalledWith(
      expect.arrayContaining([expect.any(Number), expect.any(Number)])
    );
  });

  it('deve remover projetos e manter status DISTRIBUIDO se total >= quantidade', async () => {
    const relatorioInicial = criarMockRelatorio(1, [mockProjetos[0], mockProjetos[1]]);
    const relatorioAposRemocao = criarMockRelatorio(1, [mockProjetos[0]]);
    relatorioAposRemocao.status = StatusRelatorio.DISTRIBUIDO;

    relatorioAlunoRepository.findOne
      .mockResolvedValueOnce(relatorioInicial)
      .mockResolvedValueOnce(relatorioAposRemocao);

    alunoRelatorioProjetosRepository.delete.mockResolvedValue({ affected: 1 });
    relatorioAlunoRepository.save.mockResolvedValue(relatorioAposRemocao);

    const result = await service.removerProjetosManualmente(1, [2]);

    expect(result.data.total_atribuidos).toBe(1);
    expect(result.data.status).toBe(StatusRelatorio.DISTRIBUIDO);
    expect(alunoRelatorioProjetosRepository.delete).toHaveBeenCalledWith([expect.any(Number)]);
  });

  it('deve lançar NotFoundException se relatório não existir', async () => {
    relatorioAlunoRepository.findOne.mockResolvedValue(null);

    await expect(service.removerProjetosManualmente(999, [1])).rejects.toThrow(NotFoundException);
  });

  it('deve lançar BadRequestException se tentar remover projeto não atribuído', async () => {
    const relatorio = criarMockRelatorio(3, [mockProjetos[0]]);
    relatorioAlunoRepository.findOne.mockResolvedValue(relatorio); // sem "Once"

    await expect(service.removerProjetosManualmente(1, [2])).rejects.toThrow(BadRequestException);
    await expect(service.removerProjetosManualmente(1, [2])).rejects.toThrow(
      'não estão atribuídos a este aluno'
    );
    expect(alunoRelatorioProjetosRepository.delete).not.toHaveBeenCalled();
  });
});