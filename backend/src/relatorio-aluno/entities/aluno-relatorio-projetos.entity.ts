// src/relatorio/entities/aluno-relatorio-projeto.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { RelatorioAluno } from './relatorio-aluno.entity';
import { Projeto } from '../../projetos/entities/projeto.entity';

/**
 * Tabela: aluno_relatorio_projetos
 * 
 * Controla quais projetos foram atribuídos a cada aluno em modalidade relatório.
 * 
 * Restrições:
 * - UNIQUE(aluno_relatorio_id, projeto_id): mesmo projeto não pode ser atribuído duas vezes ao mesmo aluno
 */
@Entity('aluno_relatorio_projetos')
@Unique(['aluno_relatorio_id', 'projeto_id'])
export class AlunoRelatorioProjetos {
  // ========== CHAVE PRIMÁRIA ==========
  
  @PrimaryGeneratedColumn()
  id!: number;

  // ========== CHAVES ESTRANGEIRAS ==========
  
  @Column({ name: 'aluno_relatorio_id', type: 'int' })
  @Index()
  aluno_relatorio_id!: number;

  @Column({ name: 'projeto_id', type: 'int' })
  @Index()
  projeto_id!: number;

  // ========== RELACIONAMENTOS ==========
  
  @ManyToOne(() => RelatorioAluno, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'aluno_relatorio_id' })
  relatorioAluno!: RelatorioAluno;

  @ManyToOne(() => Projeto, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projeto_id' })
  projeto!: Projeto;

  // ========== COLUNAS ==========
  
  @Column({ type: 'boolean', default: false })
  visualizado!: boolean;

  @Column({ name: 'data_atribuicao', type: 'datetime' })
  data_atribuicao!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  created_at!: Date;
}