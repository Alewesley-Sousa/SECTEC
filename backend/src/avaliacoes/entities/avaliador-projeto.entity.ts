import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Projeto } from '../../projetos/entities/projeto.entity';

@Entity('avaliador_projetos')
export class AvaliadorProjeto {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User)
  avaliador!: User;

  @ManyToOne(() => Projeto)
  projeto!: Projeto;

  @Column({
    type: 'enum',
    enum: ['pendente', 'avaliado'],
    default: 'pendente',
  })
  status!: string;
}