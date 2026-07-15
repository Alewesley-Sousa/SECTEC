import { validate } from 'class-validator';
import { AtribuirProjetosDto } from '../../dto/atribuir-projetos.dto';

describe('AtribuirProjetosDto', () => {
  let dto: AtribuirProjetosDto;

  beforeEach(() => {
    dto = new AtribuirProjetosDto();
  });

  it('should be defined', () => {
    expect(dto).toBeDefined();
  });

  it('should validate a valid DTO with one project', async () => {
    dto.projetosIds = [1];
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate a valid DTO with multiple projects', async () => {
    dto.projetosIds = [1, 2, 3];
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail if projetosIds is undefined', async () => {
    dto.projetosIds = undefined as any;
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('projetosIds');
    expect(errors[0].constraints).toHaveProperty('isDefined');
  });

  it('should fail if projetosIds is not an array', async () => {
    dto.projetosIds = 'not an array' as any;
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('projetosIds');
    expect(errors[0].constraints).toHaveProperty('isArray');
  });

  it('should fail if projetosIds is an empty array', async () => {
    dto.projetosIds = [];
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('projetosIds');
    // Pode ser isNotEmpty ou arrayMinSize
  });

  it('should fail if any item is not an integer', async () => {
    dto.projetosIds = [1, '2' as any, 3];
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('projetosIds');
    expect(errors[0].constraints).toHaveProperty('isInt');
  });
});