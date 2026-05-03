// user.entity.ts
import { ProjetoAluno } from 'src/projetos/entities/projeto-aluno';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from 'typeorm';

export enum UserRole {
  ALUNO = 'aluno',
  ORIENTADOR = 'orientador',
  COORDENACAO = 'coordenador', // 👈 igual ao enum do banco
}

@Entity('usuarios') // 👈 nome da tabela no banco
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome: string;

  @Column({ unique: true })
  email_institucional: string;

  @Column({ type: 'enum', enum: UserRole })
  role_cargo: UserRole;

  @Column({ select: false })
  senha: string;        // 👈 campo é 'senha' no seu banco

  @Column({ default: true })
  ativo: boolean;

  @CreateDateColumn()
  criado_em: Date;

  // relacionamento de alunos com seus projetos
  @OneToMany(() => ProjetoAluno, (projetoAluno) => projetoAluno.aluno)
  projetosParticipados!: ProjetoAluno[];
}