import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Projeto } from '../../projetos/entities/projeto.entity';

@Entity('areas')
export class Area {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, length: 120 })
  nome!: string;

  @Column({ type: 'text', nullable: true })
  descricao!: string | null;

  @OneToMany(() => Projeto, (projeto) => projeto.area)
  projetos!: Projeto[];
}
