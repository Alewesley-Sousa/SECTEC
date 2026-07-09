// src/relatorio-aluno/__testes__/relatorio-aluno.service/atualizarRelatorioAluno.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { RelatorioAlunoService } from '../../relatorio-aluno.service';
import { RelatorioAluno, StatusRelatorio } from '../../entities/relatorio-aluno.entity';
import { Evento } from '../../../evento/entities/evento.entity';
import { UpdateRelatorioAlunoDto } from '../../dto';

describe('RelatorioAlunoService - atualizarRelatorioAluno', () => {
  let service: RelatorioAlunoService;
  let relatorioAlunoRepository: jest.Mocked<any>;

  const mockEvento = {
    id: 1,
    titulo: 'Semana Científica 2026',
  };

  const mockAluno = {
    id: 1,
    nome: 'João Silva',
    email_institucional: 'joao@aluno.ce.gov.br',
    turma: '3° A',
  };

  const criarMockRelatorioAluno = () => ({
    id: 1,
    aluno: { ...mockAluno },
    evento: { ...mockEvento },
    quantidade_projetos: 3,
    status: StatusRelatorio.PENDENTE,
    data_ativacao: new Date(),
    data_envio: null,
    created_at: new Date(),
  });

  beforeEach(async () => {
    relatorioAlunoRepository = {
      findOne: jest.fn(),
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
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<RelatorioAlunoService>(RelatorioAlunoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should update quantidade_projetos successfully', async () => {
    const dto: UpdateRelatorioAlunoDto = { quantidade_projetos: 5 };
    const id = 1;
    const mockRelatorio = criarMockRelatorioAluno();

    relatorioAlunoRepository.findOne.mockResolvedValue(mockRelatorio);
    relatorioAlunoRepository.save.mockResolvedValue({
      ...mockRelatorio,
      quantidade_projetos: 5,
    });

    const result = await service.atualizarRelatorioAluno(id, dto);

    expect(result.mensagem).toBe('Registro atualizado com sucesso!');
    expect(result.data.quantidade_projetos).toBe(5);
    expect(relatorioAlunoRepository.findOne).toHaveBeenCalledWith({
      where: { id },
      relations: ['aluno', 'evento'],
    });
    expect(relatorioAlunoRepository.save).toHaveBeenCalled();
  });

  it('should update status successfully', async () => {
    const dto: UpdateRelatorioAlunoDto = { status: StatusRelatorio.DISTRIBUIDO };
    const id = 1;
    const mockRelatorio = criarMockRelatorioAluno();

    relatorioAlunoRepository.findOne.mockResolvedValue(mockRelatorio);
    relatorioAlunoRepository.save.mockResolvedValue({
      ...mockRelatorio,
      status: StatusRelatorio.DISTRIBUIDO,
    });

    const result = await service.atualizarRelatorioAluno(id, dto);

    expect(result.data.status).toBe(StatusRelatorio.DISTRIBUIDO);
    expect(relatorioAlunoRepository.save).toHaveBeenCalled();
  });

  it('should update both quantidade_projetos and status', async () => {
    const dto: UpdateRelatorioAlunoDto = {
      quantidade_projetos: 5,
      status: StatusRelatorio.ENVIADO,
    };
    const id = 1;
    const mockRelatorio = criarMockRelatorioAluno();

    relatorioAlunoRepository.findOne.mockResolvedValue(mockRelatorio);
    relatorioAlunoRepository.save.mockResolvedValue({
      ...mockRelatorio,
      quantidade_projetos: 5,
      status: StatusRelatorio.ENVIADO,
    });

    const result = await service.atualizarRelatorioAluno(id, dto);

    expect(result.data.quantidade_projetos).toBe(5);
    expect(result.data.status).toBe(StatusRelatorio.ENVIADO);
    expect(relatorioAlunoRepository.save).toHaveBeenCalled();
  });

  it('should not update any field if dto has no data', async () => {
    const dto: UpdateRelatorioAlunoDto = {};
    const id = 1;
    const mockRelatorio = criarMockRelatorioAluno();

    relatorioAlunoRepository.findOne.mockResolvedValue(mockRelatorio);
    relatorioAlunoRepository.save.mockResolvedValue(mockRelatorio);

    const result = await service.atualizarRelatorioAluno(id, dto);

    expect(result.data.quantidade_projetos).toBe(3);
    expect(result.data.status).toBe(StatusRelatorio.PENDENTE);
    expect(relatorioAlunoRepository.save).toHaveBeenCalled();
  });

  it('should throw NotFoundException if relatorio not found', async () => {
    const dto: UpdateRelatorioAlunoDto = { quantidade_projetos: 5 };
    const id = 999;

    relatorioAlunoRepository.findOne.mockResolvedValue(null);

    await expect(service.atualizarRelatorioAluno(id, dto)).rejects.toThrow(
      NotFoundException,
    );
    expect(relatorioAlunoRepository.save).not.toHaveBeenCalled();
  });
});