import { ForbiddenException } from '@nestjs/common';
import { ProjetosService } from './projetos.service';

describe('ProjetosService owner authorization', () => {
  it('blocks a student who is not the project owner from editing it', async () => {
    const service = new ProjetosService(
      {} as any, // materiais
      {} as any, // projetos
      {} as any, // integrantes
      {} as any, // orientadores
      {} as any, // áreas
      {} as any, // eventos
      {} as any, // usuários
      {} as any, // data source
      {} as any, // auditoria
      {} as any, // equipe
      {} as any, // validações
    );
    jest.spyOn(service, 'findOne').mockResolvedValue({
      id: 12,
      alunoAutor: { id: 7 },
    } as any);

    await expect(
      service.update(12, { titulo: 'Tentativa de edição' }, 8, 'aluno'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows the owner to update the project editable fields', async () => {
    const projeto = {
      id: 12,
      titulo: 'Título anterior',
      descricao: 'Descrição anterior',
      areaId: 4,
      eventoId: 3,
      evento: { id: 3 },
      alunoAutor: { id: 7 },
    };
    const queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      manager: { save: jest.fn() },
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
    };
    const projectRepository = { merge: jest.fn() };
    const dataSource = { createQueryRunner: jest.fn(() => queryRunner) };
    const audit = { registrar: jest.fn() };
    const service = new ProjetosService(
      {} as any,
      projectRepository as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      dataSource as any,
      audit as any,
      {} as any,
      {} as any,
    );
    jest.spyOn(service, 'findOne').mockResolvedValue(projeto as any);

    await service.update(12, { titulo: 'Novo título' }, 7, 'aluno');

    expect(projectRepository.merge).toHaveBeenCalledWith(projeto, expect.objectContaining({
      titulo: 'Novo título',
      descricao: 'Descrição anterior',
      areaId: 4,
      evento: { id: 3 },
    }));
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
  });
});
