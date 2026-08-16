// user.entity.ts
import { TemaEvento } from '../../evento/entities/tema-evento.entity';
import { ProjetoAluno } from '../../projetos/entities/projeto-aluno.entity';
import { ProjetoOrientador } from '../../projetos/entities/projeto-orientador.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany, ManyToMany } from 'typeorm';
// ... restante dos imports


export enum UserRole {
  ALUNO = 'aluno',
  ORIENTADOR = 'orientador',
  COORDENACAO = 'coordenador',
  COMISSAO = 'comissao',
   AVALIADOR = 'avaliador' // 👈 igual ao enum do banco
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

  // Mapeia a coluna física do banco para a propriedade email_institucional
  @Column({ name: 'email_institucional', unique: true })
  email_institucional!: string;

  // Get/Set de compatibilidade para códigos/DTOs que utilizam apenas .email
  get email(): string {
    return this.email_institucional;
  }
  set email(value: string) {
    this.email_institucional = value;
  }

  @Column({ type: 'enum', enum: UserRole })
  role_cargo!: UserRole;

  @Column({ select: false })
  senha!: string;        // 👈 campo é 'senha' no seu banco

  @Column({ default: true })
  ativo!: boolean;

  @Column({ default: 1})
  ano!: number;

  @Column({ type: 'int', nullable: true })
  ano_progressao_processado!: number | null;

  @Column({type: 'enum', enum: UserTurma, nullable: true})
  turma!: UserTurma | null;
  
  @CreateDateColumn()
  criado_em!: Date;

  // relacionamento de alunos com seus projetos
  @OneToMany(() => ProjetoAluno, (projetoAluno) => projetoAluno.aluno)
  projetosParticipados!: ProjetoAluno[];

  // Relacionamento para Orientadores: Ver convites/orientações vinculadas a ele
  @OneToMany(() => ProjetoOrientador, (projetoOrientador) => projetoOrientador.orientador)
  solicitacoesOrientacao!: ProjetoOrientador[];
  
  // user.entity.ts
@ManyToMany(() => TemaEvento, (tema) => tema.orientadores)
temasSelecionados!: TemaEvento[];

}
