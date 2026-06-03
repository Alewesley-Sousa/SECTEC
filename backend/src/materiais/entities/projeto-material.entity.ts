import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Projeto } from '../../projetos/entities/projeto.entity';

export enum TipoMaterial {
  PDF  = 'pdf',
  LINK = 'link',
  RELATORIO = 'pdf_relatorio'
}

export enum StatusMaterial {
  EM_ANALISE = 'em_analise',
  APROVADO   = 'aprovado',
  RECUSADO   = 'recusado',
}

@Entity('projeto_materiais')
export class ProjetoMaterial {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Projeto, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projeto_id' })
  projeto!: Projeto;

  @Column({ type: 'enum', enum: TipoMaterial })
  tipo!: TipoMaterial;

  @Column({
    type: 'enum',
    enum: StatusMaterial,
    default: StatusMaterial.EM_ANALISE,
  })
  status!: StatusMaterial;

  @Column({ type: 'text' })
  conteudo!: string;

  @Column({ type: 'text' })
  opiniao!: string;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm!: Date;
}
