// src/relatorio/dto/relatorio-material.dto.spec.ts
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateRelatorioMaterialDto } from '../create-relatorio-material.dto';
import { UpdateRelatorioMaterialDto } from '../update-relatorio-material.dto';
import { AvaliarRelatorioMaterialDto } from '../avaliar-relatorio-material.dto';
import { TipoRelatorioMaterial, StatusRelatorioMaterial } from '../../entities/relatorio-material.entity';

describe('RelatorioMaterial DTOs', () => {
  // ============================================
  // TESTES PARA CreateRelatorioMaterialDto
  // ============================================
  describe('CreateRelatorioMaterialDto', () => {
    it('should validate a valid PDF DTO', async () => {
      const dto = plainToClass(CreateRelatorioMaterialDto, {
        aluno_relatorio_id: 1,
        tipo: TipoRelatorioMaterial.PDF,
        conteudo: 'caminho/do/arquivo.pdf',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate a valid LINK DTO', async () => {
      const dto = plainToClass(CreateRelatorioMaterialDto, {
        aluno_relatorio_id: 1,
        tipo: TipoRelatorioMaterial.LINK,
        conteudo: 'https://youtube.com/watch?v=123',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail if aluno_relatorio_id is missing', async () => {
      const dto = plainToClass(CreateRelatorioMaterialDto, {
        tipo: TipoRelatorioMaterial.PDF,
        conteudo: 'arquivo.pdf',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail if tipo is invalid', async () => {
      const dto = plainToClass(CreateRelatorioMaterialDto, {
        aluno_relatorio_id: 1,
        tipo: 'invalid' as any,
        conteudo: 'arquivo.pdf',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail if conteudo is empty', async () => {
      const dto = plainToClass(CreateRelatorioMaterialDto, {
        aluno_relatorio_id: 1,
        tipo: TipoRelatorioMaterial.PDF,
        conteudo: '',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  // ============================================
  // TESTES PARA UpdateRelatorioMaterialDto
  // ============================================
  describe('UpdateRelatorioMaterialDto', () => {
    it('should validate a valid DTO', async () => {
      const dto = plainToClass(UpdateRelatorioMaterialDto, {
        tipo: TipoRelatorioMaterial.PDF,
        status: StatusRelatorioMaterial.ENVIADO,
        conteudo: 'novo/caminho.pdf',
        opiniao: 'Material atualizado',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should allow partial updates', async () => {
      const dto = plainToClass(UpdateRelatorioMaterialDto, {
        status: StatusRelatorioMaterial.DEVOLVIDO,
        opiniao: 'Ajustes necessários',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should allow empty DTO (all optional)', async () => {
      const dto = plainToClass(UpdateRelatorioMaterialDto, {});

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail if tipo is invalid', async () => {
      const dto = plainToClass(UpdateRelatorioMaterialDto, {
        tipo: 'invalid' as any,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail if status is invalid', async () => {
      const dto = plainToClass(UpdateRelatorioMaterialDto, {
        status: 'invalid' as any,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  // ============================================
  // TESTES PARA AvaliarRelatorioMaterialDto
  // ============================================
  describe('AvaliarRelatorioMaterialDto', () => {
    it('should validate a valid DTO', async () => {
      const dto = plainToClass(AvaliarRelatorioMaterialDto, {
        status: StatusRelatorioMaterial.ENVIADO,
        opiniao: 'Relatório aprovado!',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should allow null opiniao', async () => {
      const dto = plainToClass(AvaliarRelatorioMaterialDto, {
        status: StatusRelatorioMaterial.ENVIADO,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail if status is missing', async () => {
      const dto = plainToClass(AvaliarRelatorioMaterialDto, {
        opiniao: 'Relatório aprovado!',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail if status is invalid', async () => {
      const dto = plainToClass(AvaliarRelatorioMaterialDto, {
        status: 'invalid' as any,
        opiniao: 'teste',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});