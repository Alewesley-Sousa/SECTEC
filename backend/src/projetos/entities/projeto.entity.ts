// projeto.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Evento } from '../../evento/entities/evento.entity';
import { User } from '../../users/entities/user.entity'; // 👈 Corrigido: era Usuario

@Entity('projetos')
@Unique(['alunoAutor', 'evento']) 
export class Projeto {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Evento)
  @JoinColumn({ name: 'evento_id' })
  evento!: Evento;

  @ManyToOne(() => User) // 👈 Corrigido: era Usuario
  @JoinColumn({ name: 'aluno_autor_id' })
  alunoAutor!: User;

  @Column({ type: 'varchar', length: 255 })
  titulo!: string;

  @Column({ type: 'text' }) 
  descricao!: string;

  // Se você for usar a tabela de temas orientadores, o campo seria assim:
  @Column({ name: 'tema_id' })
  temaId!: number;
}
