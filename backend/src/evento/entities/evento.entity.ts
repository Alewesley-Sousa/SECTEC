import { Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Projeto } from '../../projetos/entities/projeto.entity';
import { TemaEvento } from './tema-evento.entity'; // 👈 Importe o TemaEvento

@Entity('eventos')
export class Evento {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToMany(() => Projeto, (projeto) => projeto.evento)
  projetos!: Projeto[];

  // Um evento pode ter vários temas
  @OneToMany(() => TemaEvento, (tema) => tema.evento)
  temas!: TemaEvento[];
}
