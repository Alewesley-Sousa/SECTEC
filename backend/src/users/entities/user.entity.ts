import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  OneToMany, 
  ManyToMany 
} from 'typeorm';

import { TemaEvento } from '../../evento/entities/tema-evento.entity';
import { ProjetoOrientador } from '../../projetos/entities/projeto-orientador.entity';
import { OrientadorArea } from './orientador-area.entity';

export enum UserRole {
  ALUNO = 'aluno',
  ORIENTADOR = 'orientador',
  COORDENACAO = 'coordenador',
  COMISSAO = 'comissao',
  AVALIADOR = 'avaliador',
  ORIENTADOR_AREAS = 'orientador_areas'
}

export enum UserTurma {
  INFORMATICA = 'informatica',
  ENFERMAGEM = 'enfermagem',
  CONTABILIDADE = 'contabilidade',
}

export enum UserArea{
  INFORMATICA = 'informatica',
  ENFERMAGEM = 'enfermagem',
  CONTABILIDADE = 'contabilidade',
  HUMANAS = 'humanas',
  EXATAS = 'exatas',
  NATUREZAS = 'naturezas',
  LINGUAGENS = 'linguagens'
}

@Entity('usuarios')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nome!: string;

  // Mapeia a coluna física do banco para a propriedade email_institucional
  @Column({ name: 'email_institucional', unique: true })
  email_institucional!: string;

  @Column({ select: false })
  senha!: string;

  @Column({ type: 'enum', enum: UserRole })
  role_cargo!: UserRole;

  @Column({ type: 'enum', enum: UserTurma, nullable: true })
  turma?: UserTurma;

  @Column({ type: 'int', default: 1, nullable: true })
  ano?: number;

  @Column({ type: 'int', nullable: true, name: 'ano_progressao_processado' })
  ano_progressao_processado?: number | null;

  @Column({ default: true })
  ativo!: boolean;

  @Column({
    type: 'enum',
    enum: UserArea,
    nullable: true,
    default: null,
  })
  area: UserArea | null;

  @CreateDateColumn({ name: 'criado_em' })
  criado_em!: Date;

  // -------------------------------------------------------------
  // RELACIONAMENTOS
  // -------------------------------------------------------------

  @OneToMany('ProjetoAluno', 'aluno')
  projetosParticipados!: any[];

  @OneToMany(() => ProjetoOrientador, (projetoOrientador) => projetoOrientador.orientador)
  solicitacoesOrientacao!: ProjetoOrientador[];

  @ManyToMany(() => TemaEvento, (tema) => tema.orientadores)
  temasSelecionados!: TemaEvento[];

  @OneToMany(() => OrientadorArea, (orientadorArea) => orientadorArea.user)
  areas: OrientadorArea[];
}