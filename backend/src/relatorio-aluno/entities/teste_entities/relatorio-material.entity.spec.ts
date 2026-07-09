// src/relatorio/entities/relatorio-material.entity.spec.ts
import { RelatorioMaterial, TipoRelatorioMaterial, StatusRelatorioMaterial } from '../relatorio-material.entity';

describe('RelatorioMaterial Entity', () => {
  it('should create a valid PDF entity', () => {
    const material = new RelatorioMaterial();
    material.aluno_relatorio_id = 1;
    material.tipo = TipoRelatorioMaterial.PDF;
    material.conteudo = 'caminho/do/arquivo.pdf';

    expect(material).toBeDefined();
    expect(material.aluno_relatorio_id).toBe(1);
    expect(material.tipo).toBe(TipoRelatorioMaterial.PDF);
    expect(material.conteudo).toBe('caminho/do/arquivo.pdf');
  });

  it('should create a valid LINK entity', () => {
    const material = new RelatorioMaterial();
    material.aluno_relatorio_id = 1;
    material.tipo = TipoRelatorioMaterial.LINK;
    material.conteudo = 'https://youtube.com/watch?v=123';

    expect(material).toBeDefined();
    expect(material.aluno_relatorio_id).toBe(1);
    expect(material.tipo).toBe(TipoRelatorioMaterial.LINK);
    expect(material.conteudo).toBe('https://youtube.com/watch?v=123');
  });

  it('should have default status ENVIADO', () => {
    const material = new RelatorioMaterial();
    expect(material.status).toBe(StatusRelatorioMaterial.ENVIADO);
  });

  it('should allow status ENVIADO and DEVOLVIDO', () => {
    const material = new RelatorioMaterial();

    material.status = StatusRelatorioMaterial.ENVIADO;
    expect(material.status).toBe(StatusRelatorioMaterial.ENVIADO);

    material.status = StatusRelatorioMaterial.DEVOLVIDO;
    expect(material.status).toBe(StatusRelatorioMaterial.DEVOLVIDO);
  });

  it('should have all required fields', () => {
    const material = new RelatorioMaterial();
    expect(material).toHaveProperty('id');
    expect(material).toHaveProperty('aluno_relatorio_id');
    expect(material).toHaveProperty('tipo');
    expect(material).toHaveProperty('status');
    expect(material).toHaveProperty('conteudo');
    expect(material).toHaveProperty('opiniao');
    expect(material).toHaveProperty('criadoEm');
  });
});