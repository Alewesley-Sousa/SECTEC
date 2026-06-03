import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { Evento } from './evento.entity'; // ajuste o caminho se necessário
import { User } from 'src/users/entities/user.entity';

@Entity('comissao_eventos')
@Unique(['evento', 'user']) // Impede duplicar o mesmo aluno na comissão do mesmo evento
export class ComissaoEvento {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Evento, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'evento_id' })
  evento!: Evento;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm!: Date;
}
