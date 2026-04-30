// usuario.entity.ts
import { Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Projeto } from '../../projetos/entities/projeto.entity';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToMany(() => Projeto, (projeto) => projeto.alunoAutor)
  projetos!: Projeto[];
}