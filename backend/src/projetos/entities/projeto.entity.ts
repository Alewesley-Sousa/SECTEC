// projeto.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique, OneToMany, CreateDateColumn } from 'typeorm';
import { Evento } from '../../evento/entities/evento.entity';
import { User } from '../../users/entities/user.entity'; // 👈 Corrigido: era Usuario
import { ProjetoAluno } from './projeto-aluno.entity';
import { ProjetoOrientador } from './projeto-orientador.entity';

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

  @OneToMany(() => ProjetoAluno, (projetoAluno) => projetoAluno.projeto)
  projetoAlunos!: ProjetoAluno[];

  @OneToMany(() => ProjetoOrientador, (projetoOrientador) => projetoOrientador.projeto)
  orientadores!: ProjetoOrientador[];

  @CreateDateColumn({ name: 'criado_em' })
      criadoEm!: Date;
}
