// src/relatorio/entities/relatorio-aluno.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
  OneToMany,
} from 'typeorm';
import { AlunoRelatorioProjetos } from './aluno-relatorio-projetos.entity';
import { User } from '../../users/entities/user.entity';
import { Evento } from '../../evento/entities/evento.entity';

export enum StatusRelatorio {
  PENDENTE = 'pendente',
  DISTRIBUIDO = 'distribuido',
  ENVIADO = 'enviado',
  FINALIZADO = 'finalizado',
}

@Entity('relatorio_aluno')
@Unique(['aluno_id', 'evento_id']) // Unique composto: um aluno só pode ter um relatório por evento
export class RelatorioAluno {
    // CRIAÇÃO DAS COLUNAS DA TABELA relatorio_aluno
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'aluno_id', type: 'int' })
  @Index() // Índice para consultas rápidas por aluno
  aluno_id!: number;

  // Relacionamento com a entidade User (aluno)
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'aluno_id' })
  aluno!: User;

  @Column({ name: 'evento_id', type: 'int' })
  @Index() // Índice para consultas rápidas por evento
  evento_id!: number;

  // Relacionamento com a entidade Evento
  @ManyToOne(() => Evento, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'evento_id' })
  evento!: Evento;

  @Column({ name: 'quantidade_projetos', type: 'int', default: 0 })
  quantidade_projetos!: number;

  @Column({
    type: 'enum',
    enum: StatusRelatorio,
    default: StatusRelatorio.PENDENTE,
  })
  status!: StatusRelatorio;

  @Column({ name: 'data_ativacao', type: 'datetime', nullable: true })
  data_ativacao!: Date;

  @Column({ name: 'data_envio', type: 'datetime', nullable: true })
  data_envio!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  created_at!: Date;

  // Relacionamento com os projetos atribuídos 
  @OneToMany(() => AlunoRelatorioProjetos, (projeto) => projeto.relatorioAluno) 
  projetosAtribuidos!: AlunoRelatorioProjetos[]; 
}