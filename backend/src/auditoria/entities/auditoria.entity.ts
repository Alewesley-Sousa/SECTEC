import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Projeto } from '../../projetos/entities/projeto.entity';
import { User } from '../../users/entities/user.entity';

@Entity('logs_auditoria')
export class Auditoria {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'usuario_id' })
  usuario!: User;

  @ManyToOne(() => Projeto, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'projeto_id' })
  projeto!: Projeto | null;

  @Column({ type: 'varchar', length: 100 })
  acao!: string;

  @Column({ type: 'text', nullable: true })
  detalhe!: string | null;

  @CreateDateColumn({ name: 'feito_em' })
  feitoEm!: Date;
}
