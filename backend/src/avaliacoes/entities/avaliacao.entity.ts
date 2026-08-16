import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Projeto } from '../../projetos/entities/projeto.entity';

@Entity('avaliacoes')
export class Avaliacao {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User)
  avaliador!: User;

  @ManyToOne(() => Projeto)
  projeto!: Projeto;

  @Column({ type: 'decimal', precision: 3, scale: 1 })
  nota_final!: number;
}