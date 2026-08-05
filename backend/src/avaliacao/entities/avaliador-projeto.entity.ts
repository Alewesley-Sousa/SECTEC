import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Projeto } from '../../projetos/entities/projeto.entity';

@Entity('avaliador_projetos')
export class AvaliadorProjeto {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'avaliador_id' })
  avaliadorId!: number;

  @Column({ name: 'projeto_id' })
  projetoId!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'avaliador_id' })
  avaliador!: User;

  @ManyToOne(() => Projeto)
  @JoinColumn({ name: 'projeto_id' })
  projeto!: Projeto;
}