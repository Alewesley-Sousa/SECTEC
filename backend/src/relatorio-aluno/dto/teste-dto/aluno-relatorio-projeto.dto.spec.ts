// src/relatorio/dto/aluno-relatorio-projeto.dto.spec.ts
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import 'reflect-metadata';
import { CreateAlunoRelatorioProjetoDto } from '../create-aluno-relatorio-projeto.dto';
import { UpdateAlunoRelatorioProjetoDto } from '../update-aluno-relatorio-projeto.dto';
import { DistribuirRelatorioDto } from '../distribuir-relatorio.dto';

describe('AlunoRelatorioProjeto DTOs', () => {
  // ============================================
  // TESTES PARA CreateAlunoRelatorioProjetoDto
  // ============================================
  describe('CreateAlunoRelatorioProjetoDto', () => {
    it('should validate a valid DTO', async () => {
      const dto = plainToClass(CreateAlunoRelatorioProjetoDto, {
        aluno_relatorio_id: 1,
        projeto_id: 1,
        visualizado: false,
        data_atribuicao: new Date(),
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail if aluno_relatorio_id is missing', async () => {
      const dto = plainToClass(CreateAlunoRelatorioProjetoDto, {
        projeto_id: 1,
        visualizado: false,
        data_atribuicao: new Date(),
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail if projeto_id is missing', async () => {
      const dto = plainToClass(CreateAlunoRelatorioProjetoDto, {
        aluno_relatorio_id: 1,
        visualizado: false,
        data_atribuicao: new Date(),
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  // ============================================
  // TESTES PARA UpdateAlunoRelatorioProjetoDto
  // ============================================
  describe('UpdateAlunoRelatorioProjetoDto', () => {
    it('should validate a valid DTO', async () => {
      const dto = plainToClass(UpdateAlunoRelatorioProjetoDto, {
        visualizado: true,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should allow partial updates', async () => {
      const dto = plainToClass(UpdateAlunoRelatorioProjetoDto, {
        visualizado: true,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  // ============================================
  // TESTES PARA DistribuirRelatorioDto
  // ============================================
  describe('DistribuirRelatorioDto', () => {
    it('should validate a valid DTO with aluno_relatorio_id', async () => {
      const dto = plainToClass(DistribuirRelatorioDto, {
        aluno_relatorio_id: 1,
        projeto_ids: [1, 2, 3],
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate a valid DTO without aluno_relatorio_id', async () => {
      const dto = plainToClass(DistribuirRelatorioDto, {
        projeto_ids: [1, 2, 3],
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail if projeto_ids is empty array', async () => {
      const dto = plainToClass(DistribuirRelatorioDto, {
        projeto_ids: [],
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail if projeto_ids contains non-integers', async () => {
      const dto = plainToClass(DistribuirRelatorioDto, {
        projeto_ids: ['a', 'b'] as any,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});