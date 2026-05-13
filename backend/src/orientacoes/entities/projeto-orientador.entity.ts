import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { Projeto } from '../../projetos/entities/projeto.entity';
import { User } from '../../users/entities/user.entity';

export enum StatusOrientacao {
  PENDENTE  = 'pendente',
  ACEITO    = 'aceito',
  RECUSADO  = 'recusado',
}

@Entity('projeto_orientador')
export class ProjetoOrientador {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Projeto, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projeto_id' })
  projeto!: Projeto;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'orientador_id' })
  orientador!: User;

  @Column({
    type: 'enum',
    enum: StatusOrientacao,
    default: StatusOrientacao.PENDENTE,
  })
  status!: StatusOrientacao;

  @Column({ name: 'respondido_em', type: 'datetime', nullable: true })
  respondidoEm!: Date;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm!: Date;
}
