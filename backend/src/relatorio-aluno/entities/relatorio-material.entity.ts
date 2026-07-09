// src/relatorio/entities/relatorio-material.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { RelatorioAluno } from './relatorio-aluno.entity';

export enum TipoRelatorioMaterial {
  PDF = 'pdf',
  LINK = 'link',
}

export enum StatusRelatorioMaterial {
  ENVIADO = 'enviado',
  DEVOLVIDO = 'devolvido',
}

/**
 * Tabela: relatorio_materiais
 * 
 * Armazena os materiais enviados pelo aluno na modalidade relatório.
 * Permite múltiplos registros por aluno (um PDF e um LINK).
 * 
 * Restrições:
 * - UNIQUE(aluno_relatorio_id, tipo): cada tipo de material só pode ser enviado uma vez
 * 
 * Status:
 * - ENVIADO: Aluno enviou o material
 * - DEVOLVIDO: Coordenação devolveu para ajustes
 */
@Entity('relatorio_materiais')
@Unique(['aluno_relatorio_id', 'tipo'])
export class RelatorioMaterial {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'aluno_relatorio_id', type: 'int' })
  aluno_relatorio_id!: number;

  @ManyToOne(() => RelatorioAluno, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'aluno_relatorio_id' })
  relatorioAluno!: RelatorioAluno;

  @Column({ type: 'enum', enum: TipoRelatorioMaterial })
  tipo!: TipoRelatorioMaterial;

  @Column({
    type: 'enum',
    enum: StatusRelatorioMaterial,
    default: StatusRelatorioMaterial.ENVIADO,
  })
  status!: StatusRelatorioMaterial;

  @Column({ type: 'text' })
  conteudo!: string;

  @Column({ type: 'text', nullable: true })
  opiniao!: string;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm!: Date;
}