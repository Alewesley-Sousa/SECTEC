import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
//  COMO DEVE FICAR (Import Relativo)
import { Projeto } from '../../projetos/entities/projeto.entity';

import { TemaEvento } from './tema-evento.entity';
import { User } from '../../users/entities/user.entity';
import { ComissaoEvento } from './comissao-evento.entity';



export enum EventoStatus {
  ATIVO = 'ativo',
  INATIVO = 'inativo',
}


   
// Value Object ajustado para apenas DATA
export class Periodo {
  @Column({ type: 'datetime', nullable: true }) // Mudança para 'date'
  inicio?: Date;

  @Column({ type: 'datetime', nullable: true }) // Mudança para 'date'
  fim?: Date;
}

@Entity('eventos')
export class Evento {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  titulo!: string;

  @Column({ type: 'text', nullable: true })
  descricao?: string;

  // --- Prazos de Ciclo de Vida ---
  @Column(() => Periodo)
  inscricao!: Periodo;

  @Column(() => Periodo)
  submissao!: Periodo;

  @Column(() => Periodo)
  avaliacao!: Periodo;

  // --- Configurações Gerais ---
@Column({ name: 'coordenador_id', nullable: true })
coordenadorId?: number;

@Column({ name: 'prazo_inicial', type: 'datetime', nullable: true }) // Adicione o nullable aqui
prazoInicial!: Date;

@Column({ name: 'prazo_final', type: 'datetime', nullable: true }) // Adicione o nullable aqui
prazoFinal!: Date;

  @Column({
    type: 'enum',
    enum: EventoStatus,
    default: EventoStatus.ATIVO,
  })
  status!: EventoStatus;

  // Mantemos datetime para auditoria (saber o segundo exato da criação)
  @CreateDateColumn({ name: 'criado_em' })
  criadoEm!: Date;

  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm!: Date;

  // --- Relacionamentos ---
  @ManyToOne(() => User) 
  @JoinColumn({ name: 'coordenador_id' })
  coordenador!: User;

  @OneToMany(() => Projeto, (projeto) => projeto.evento)
  projetos!: Projeto[];

  @OneToMany(() => TemaEvento, (tema) => tema.evento)
  temas!: TemaEvento[];
  
   @OneToMany(() => ComissaoEvento, (comissao) => comissao.evento)
  comissaoAlunos!: ComissaoEvento[];
}
