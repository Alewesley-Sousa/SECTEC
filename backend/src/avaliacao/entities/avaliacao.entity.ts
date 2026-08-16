import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('avaliacoes')
export class Avaliacao {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'avaliador_id' })
  avaliadorId!: number;

  @Column({ name: 'projeto_id' })
  projetoId!: number;

  @Column({ type: 'decimal', precision: 4, scale: 2 })
  nota!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}