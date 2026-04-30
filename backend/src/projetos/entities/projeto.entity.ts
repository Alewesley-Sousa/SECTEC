// projeto.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Evento } from '../../evento/entities/evento.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';

@Entity('projetos')
export class Projeto {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Evento, (evento) => evento.projetos, { eager: true })
  @JoinColumn({ name: 'evento_id' })
  evento!: Evento;

  @ManyToOne(() => Usuario, (usuario) => usuario.projetos, { eager: true })
  @JoinColumn({ name: 'aluno_autor_id' })
  alunoAutor!: Usuario;

  @Column({ type: 'varchar', length: 255 })
  titulo!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  tema!: string;

  @Column({ type: 'text' }) // Mapeia para TEXT no MySQL
  descricao!: string;
  
  @Column({ type: 'varchar', length: 100, nullable: true })
  subTema!: string;
}