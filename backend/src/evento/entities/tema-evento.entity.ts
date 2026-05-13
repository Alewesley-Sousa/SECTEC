// modulos/eventos/entities/tema-evento.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Evento } from './evento.entity';
import { User } from '../../users/entities/user.entity';

@Entity('tema_eventos')
export class TemaEvento {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome: string;

  // Muitos temas para um Evento
  @ManyToOne(() => Evento, (evento) => evento.temas) // 👈 Referência ao campo 'temas'
  @JoinColumn({ name: 'evento_id' })
  evento: Evento;

  // Muitos temas para um Professor (User)
  @ManyToOne(() => User, (user) => user.temasCriados) // 👈 Referência ao campo 'temasCriados'
  @JoinColumn({ name: 'professor_id' })
  professor: User;
}
