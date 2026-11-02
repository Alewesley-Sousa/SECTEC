import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Evento } from '../../evento/entities/evento.entity';
import { Area } from '../../areas/entities/area.entity';
import { ProjetoOrientador } from './projeto-orientador.entity';
import { ProjetoMaterial } from '../../materiais/entities/projeto-material.entity';
import { ProjectFile } from '../../pdf/entities/project-file.entity';
import { AvaliadorProjeto } from '../../avaliacao/entities/avaliador-projeto.entity';
import { ProjetoAluno } from './projeto-aluno.entity';
import { Avaliacao } from '../../avaliacao/entities/avaliacao.entity';

/**
 * Tipo do registro em `projetos`.
 * - PROJETO: projeto científico normal (pode ser avaliado).
 * - OFICINA: oficina do 3º ano (não entra em avaliações, médias nem rankings).
 */
export enum TipoProjeto {
  PROJETO = 'projeto',
  OFICINA = 'oficina',
}

@Entity('projetos')
@Index(['alunoAutorId', 'eventoId'], { unique: true })
export class Projeto {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'evento_id' })
  eventoId!: number;

  @Column({ name: 'aluno_autor_id' })
  alunoAutorId!: number;

  @Column({ name: 'area_id' })
  areaId!: number;

  @Column()
  titulo!: string;

  @Column({ name: 'qrcode_gerado', type: 'boolean', default: false })
  qrcodeGerado!: boolean;

  @Column({ type: 'text' })
  descricao!: string;

  @Column({ name: 'qr_code', nullable: true, unique: true })
  qrCode?: string;

  @Column({ type: 'varchar', length: 20, default: 'APROVADO' })
  status!: string;

  @Column({ type: 'enum', enum: TipoProjeto, default: TipoProjeto.PROJETO })
  tipo!: TipoProjeto;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm!: Date;

  // --------------------------------------------------
  // RELAÇÕES
  // --------------------------------------------------

  @ManyToOne(() => User)
  @JoinColumn({ name: 'aluno_autor_id' })
  alunoAutor!: User;

  @ManyToOne(() => Evento, (evento) => evento.projetos)
  @JoinColumn({ name: 'evento_id' })
  evento!: Evento;

  @ManyToOne(() => Area, (area) => area.projetos, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'area_id' })
  area!: Area;

  @OneToMany(() => ProjetoOrientador, (po) => po.projeto)
  orientadores!: ProjetoOrientador[];

  @OneToMany(() => ProjetoMaterial, (m) => m.projeto)
  materiais!: ProjetoMaterial[];

  @OneToMany(() => ProjectFile, (pf) => pf.projeto)
  files!: ProjectFile[];

  @OneToMany(() => AvaliadorProjeto, (ap) => ap.projeto)
  avaliadorProjetos!: AvaliadorProjeto[];

  @OneToMany(() => ProjetoAluno, (pa) => pa.projeto)
  projetoAlunos!: ProjetoAluno[];

  @OneToMany(() => Avaliacao, (avaliacao) => avaliacao.projeto)
  avaliacoes!: Avaliacao[];
}
