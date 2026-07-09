// src/relatorio/dto/relatorio-aluno.dto.spec.ts
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateRelatorioAlunoDto } from '../create-relatorio-aluno.dto';
import { UpdateRelatorioAlunoDto } from '../update-relatorio-aluno.dto';
import { StatusRelatorio } from '../../entities/relatorio-aluno.entity';

describe('RelatorioAluno DTOs', () => {
  // ============================================
  // TESTES PARA CreateRelatorioAlunoDto
  // ============================================
  describe('CreateRelatorioAlunoDto', () => {
    it('should validate a valid DTO', async () => {
      const dto = plainToClass(CreateRelatorioAlunoDto, {
        aluno_id: 1,
        evento_id: 1,
        quantidade_projetos: 3,
        status: StatusRelatorio.PENDENTE,
        data_ativacao: new Date(),
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail if aluno_id is missing', async () => {
      const dto = plainToClass(CreateRelatorioAlunoDto, {
        evento_id: 1,
        quantidade_projetos: 3,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('aluno_id');
    });

    it('should fail if aluno_id is not a number', async () => {
      const dto = plainToClass(CreateRelatorioAlunoDto, {
        aluno_id: 'invalid',
        evento_id: 1,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should have default status PENDENTE', () => {
      const dto = new CreateRelatorioAlunoDto();
      expect(dto.status).toBe(StatusRelatorio.PENDENTE); // Não definido na classe, só no banco
    });
  });

  // ============================================
  // TESTES PARA UpdateRelatorioAlunoDto
  // ============================================
  describe('UpdateRelatorioAlunoDto', () => {
    it('should validate a valid DTO', async () => {
      const dto = plainToClass(UpdateRelatorioAlunoDto, {
        quantidade_projetos: 5,
        status: StatusRelatorio.DISTRIBUIDO,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should allow partial updates', async () => {
      const dto = plainToClass(UpdateRelatorioAlunoDto, {
        quantidade_projetos: 5,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail if quantidade_projetos is negative', async () => {
      const dto = plainToClass(UpdateRelatorioAlunoDto, {
        quantidade_projetos: -1,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});