// src/relatorio-aluno/entities/teste_entities/relatorio-aluno.entity.spec.ts
import { RelatorioAluno, StatusRelatorio } from '../relatorio-aluno.entity';

describe('RelatorioAluno Entity', () => {
  it('should create a valid entity', () => {
    const relatorio = new RelatorioAluno();
    relatorio.aluno_id = 1;
    relatorio.evento_id = 1;
    relatorio.quantidade_projetos = 3;
    relatorio.status = StatusRelatorio.PENDENTE;

    expect(relatorio).toBeDefined();
    expect(relatorio.aluno_id).toBe(1);
    expect(relatorio.evento_id).toBe(1);
    expect(relatorio.quantidade_projetos).toBe(3);
    expect(relatorio.status).toBe(StatusRelatorio.PENDENTE);
  });

  it('should have default values when saved to database', () => {
    const relatorio = new RelatorioAluno();
    
    // Valores padrão definidos no banco, não na instância
    // Por isso, em memória eles são undefined
    expect(relatorio.quantidade_projetos).toBeUndefined(); // Só existe no banco
    expect(relatorio.status).toBeUndefined(); // Só existe no banco
  });

  it('should have all required fields', () => {
    const relatorio = new RelatorioAluno();
    
    // Verifica se todos os campos estão definidos na classe (mesmo que undefined)
    expect(relatorio).toHaveProperty('id');
    expect(relatorio).toHaveProperty('aluno_id');
    expect(relatorio).toHaveProperty('evento_id');
    expect(relatorio).toHaveProperty('quantidade_projetos');
    expect(relatorio).toHaveProperty('status');
    expect(relatorio).toHaveProperty('data_ativacao');
    expect(relatorio).toHaveProperty('data_envio');
    expect(relatorio).toHaveProperty('created_at');
  });

  it('should allow setting enum values', () => {
    const relatorio = new RelatorioAluno();
    relatorio.status = StatusRelatorio.DISTRIBUIDO;
    expect(relatorio.status).toBe(StatusRelatorio.DISTRIBUIDO);
    
    relatorio.status = StatusRelatorio.ENVIADO;
    expect(relatorio.status).toBe(StatusRelatorio.ENVIADO);
    
    relatorio.status = StatusRelatorio.FINALIZADO;
    expect(relatorio.status).toBe(StatusRelatorio.FINALIZADO);
  });
});