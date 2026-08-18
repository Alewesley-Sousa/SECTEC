import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Projeto } from '../../projetos/entities/projeto.entity';

@Entity('avaliacoes')
export class Avaliacao {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'avaliador_id' })
  avaliadorId!: number;

  @ManyToOne(() => Projeto, (projeto) => projeto.avaliacoes)
  @JoinColumn({ name: 'projeto_id' })
  projeto!: Projeto;

  @Column({ type: 'decimal', precision: 4, scale: 2 })
  nota!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}