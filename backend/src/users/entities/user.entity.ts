// user.entity.ts
import { TemaEvento } from 'src/evento/entities/tema-evento.entity';
import { ProjetoAluno } from 'src/projetos/entities/projeto-aluno.entity';
import { ProjetoOrientador } from 'src/projetos/entities/projeto-orientador.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from 'typeorm';

export enum UserRole {
  ALUNO = 'aluno',
  ORIENTADOR = 'orientador',
  COORDENACAO = 'coordenador',
  COMISSAO = 'comissao', // 👈 igual ao enum do banco
}
export enum UserTurma {
  INFORMATICA = 'informatica',
  ENFERMAGEM = 'enfermagem',
  CONTABILIDADE = 'contabilidade',
}

@Entity('usuarios') // 👈 nome da tabela no banco
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nome!: string;

  @Column({ unique: true })
  email_institucional!: string;

  @Column({ type: 'enum', enum: UserRole })
  role_cargo!: UserRole;

  @Column({ select: false })
  senha!: string;        // 👈 campo é 'senha' no seu banco

  @Column({ default: true })
  ativo!: boolean;

  @Column({ default: 1})
  ano!: number;

  @Column({type: 'enum', enum: UserTurma, nullable: true})
  turma!: UserTurma | null;
  
  @CreateDateColumn()
  criado_em!: Date;

  // relacionamento de alunos com seus projetos
  @OneToMany(() => ProjetoAluno, (projetoAluno) => projetoAluno.aluno)
  projetosParticipados!: ProjetoAluno[];

  // relacionamento de professores com temas de evento criados
  @OneToMany(() => TemaEvento, (temaEvento) => temaEvento.professor)
  temasCriados!: TemaEvento[];

  // Relacionamento para Orientadores: Ver convites/orientações vinculadas a ele
  @OneToMany(() => ProjetoOrientador, (projetoOrientador) => projetoOrientador.orientador)
  solicitacoesOrientacao!: ProjetoOrientador[];
}