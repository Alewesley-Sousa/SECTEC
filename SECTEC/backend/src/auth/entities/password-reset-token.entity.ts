import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity'; // Ajuste o caminho se necessário

@Entity('password_reset_tokens')
export class PasswordResetToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  usuario_id: number;

  @Column()
  @Index()
  token: string;

  @Column()
  expires_at: Date;

  @Column({ type: 'tinyint', default: 0 })
  used: number;

  @CreateDateColumn()
  created_at: Date;

  // Relacionamento para facilitar buscas futuras
  @ManyToOne(() => User)
  @JoinColumn({ name: 'usuario_id' })
  usuario: User;
}
