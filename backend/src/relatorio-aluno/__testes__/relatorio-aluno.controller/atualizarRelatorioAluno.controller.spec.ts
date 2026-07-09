// src/relatorio/__tests__/relatorio-aluno.controller/atualizarRelatorioAluno.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { RelatorioAlunoController } from '../../relatorio-aluno.controller';
import { RelatorioAlunoService } from '../../relatorio-aluno.service';
import { StatusRelatorio } from '../../entities/relatorio-aluno.entity';
import { UpdateRelatorioAlunoDto } from '../../dto';

describe('RelatorioAlunoController - atualizarRelatorioAluno', () => {
  let controller: RelatorioAlunoController;
  let service: RelatorioAlunoService;

  const mockRelatorioAlunoService = {
    atualizarRelatorioAluno: jest.fn().mockResolvedValue({
      mensagem: 'Registro atualizado com sucesso!',
      data: {
        id: 1,
        aluno: { id: 1, nome: 'João Silva', email: 'joao@aluno.ce.gov.br', turma: '3° A' },
        evento: { id: 1, nome: 'Semana Científica 2026' },
        quantidade_projetos: 5,
        status: StatusRelatorio.DISTRIBUIDO,
        data_ativacao: new Date(),
        data_envio: null,
        created_at: new Date(),
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

  it('should update quantidade_projetos', async () => {
    const dto: UpdateRelatorioAlunoDto = { quantidade_projetos: 5 };
    const id = '1';

    const result = await controller.atualizarRelatorioAluno(id, dto);

    expect(result.mensagem).toBe('Registro atualizado com sucesso!');
    expect(result.data.quantidade_projetos).toBe(5);
    expect(service.atualizarRelatorioAluno).toHaveBeenCalledWith(+id, dto);
  });

  it('should update status', async () => {
    const dto: UpdateRelatorioAlunoDto = { status: StatusRelatorio.DISTRIBUIDO };
    const id = '1';

    await controller.atualizarRelatorioAluno(id, dto);

    expect(service.atualizarRelatorioAluno).toHaveBeenCalledWith(+id, dto);
  });

  it('should update both quantidade_projetos and status', async () => {
    const dto: UpdateRelatorioAlunoDto = {
      quantidade_projetos: 5,
      status: StatusRelatorio.ENVIADO,
    };
    const id = '1';

    await controller.atualizarRelatorioAluno(id, dto);

    expect(service.atualizarRelatorioAluno).toHaveBeenCalledWith(+id, dto);
  });

  it('should convert id string to number', async () => {
    const dto: UpdateRelatorioAlunoDto = { quantidade_projetos: 5 };
    const id = '1';

    await controller.atualizarRelatorioAluno(id, dto);

    expect(service.atualizarRelatorioAluno).toHaveBeenCalledWith(1, dto);
  });
});