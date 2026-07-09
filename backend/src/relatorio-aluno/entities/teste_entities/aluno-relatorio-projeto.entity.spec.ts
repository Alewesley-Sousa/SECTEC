// src/relatorio/entities/aluno-relatorio-projeto.entity.spec.ts
import { AlunoRelatorioProjetos } from '../aluno-relatorio-projetos.entity';

describe('AlunoRelatorioProjetos Entity', () => {
  it('should create a valid entity', () => {
    const atribuicao = new AlunoRelatorioProjetos();
    atribuicao.aluno_relatorio_id = 1;
    atribuicao.projeto_id = 1;
    atribuicao.data_atribuicao = new Date();
    atribuicao.visualizado = false;

    expect(atribuicao).toBeDefined();
    expect(atribuicao.aluno_relatorio_id).toBe(1);
    expect(atribuicao.projeto_id).toBe(1);
    expect(atribuicao.visualizado).toBe(false);
    expect(atribuicao.data_atribuicao).toBeInstanceOf(Date);
  });

  it('should have default value for visualizado', () => {
    const atribuicao = new AlunoRelatorioProjetos();
    expect(atribuicao.visualizado).toBe(false);
  });

  it('should have all required fields', () => {
    const atribuicao = new AlunoRelatorioProjetos();
    expect(atribuicao).toHaveProperty('id');
    expect(atribuicao).toHaveProperty('aluno_relatorio_id');
    expect(atribuicao).toHaveProperty('projeto_id');
    expect(atribuicao).toHaveProperty('visualizado');
    expect(atribuicao).toHaveProperty('data_atribuicao');
    expect(atribuicao).toHaveProperty('created_at');
  });
});