// modulos/eventos/entities/tema-evento.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable, JoinColumn } from 'typeorm';
// ... restante dos imports

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
  
  // tema-evento.entity.ts
@ManyToMany(() => User, (user) => user.temasSelecionados)
@JoinTable({
  name: 'tema_orientadores', // Nome da tabela pivot que será criada
  joinColumn: { name: 'tema_id', referencedColumnName: 'id' },
  inverseJoinColumn: { name: 'orientador_id', referencedColumnName: 'id' }
})
orientadores: User[];

}
