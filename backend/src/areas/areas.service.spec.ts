import { ConflictException, NotFoundException } from '@nestjs/common';
import { AreasService } from './areas.service';

describe('AreasService', () => {
  let service: AreasService;
  let repository: {
    find: jest.Mock;
    findOne: jest.Mock;
    exists: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(() => {
    repository = {
      find: jest.fn(),
      findOne: jest.fn(),
      exists: jest.fn(),
      create: jest.fn((data) => data),
      save: jest.fn(async (data) => ({ id: 1, ...data })),
      remove: jest.fn(),
    };
    service = new AreasService(repository as any);
  });

  it('lists areas alphabetically', async () => {
    repository.find.mockResolvedValue([]);
    await service.findAll();
    expect(repository.find).toHaveBeenCalledWith({ order: { nome: 'ASC' } });
  });

  it('creates an area with trimmed values', async () => {
    repository.exists.mockResolvedValue(false);
    await expect(service.create({ nome: '  Exatas ', descricao: ' descrição ' })).resolves.toEqual({
      id: 1,
      nome: 'Exatas',
      descricao: 'descrição',
    });
  });

  it('updates the area name and description', async () => {
    repository.findOne.mockResolvedValue({ id: 1, nome: 'Exatas', descricao: null });
    repository.exists.mockResolvedValue(false);
    await expect(service.update(1, { nome: 'Ciências', descricao: 'Exatas e natureza' })).resolves.toEqual({
      id: 1,
      nome: 'Ciências',
      descricao: 'Exatas e natureza',
    });
  });

  it('rejects duplicate area names', async () => {
    repository.exists.mockResolvedValue(true);
    await expect(service.create({ nome: 'Exatas' })).rejects.toBeInstanceOf(ConflictException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('rejects deleting an area used by projects', async () => {
    repository.findOne.mockResolvedValue({ id: 1, nome: 'Exatas', projetos: [{ id: 5 }] });
    await expect(service.remove(1)).rejects.toBeInstanceOf(ConflictException);
    expect(repository.remove).not.toHaveBeenCalled();
  });

  it('returns 404 for a missing area', async () => {
    repository.findOne.mockResolvedValue(null);
    await expect(service.findOne(99)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deletes an area with no linked projects', async () => {
    repository.findOne.mockResolvedValue({ id: 1, nome: 'Exatas', projetos: [] });
    repository.remove.mockResolvedValue(undefined);
    await expect(service.remove(1)).resolves.toEqual({ message: 'Área "Exatas" removida com sucesso.' });
    expect(repository.remove).toHaveBeenCalled();
  });
});
