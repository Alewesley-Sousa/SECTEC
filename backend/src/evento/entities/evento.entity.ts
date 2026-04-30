// evento.entity.ts
import { Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Projeto } from '../../projetos/entities/projeto.entity';

@Entity('eventos')
export class Evento {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToMany(() => Projeto, (projeto) => projeto.evento)
  projetos!: Projeto[];
}