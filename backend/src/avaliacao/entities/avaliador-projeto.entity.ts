import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  JoinColumn, 
  CreateDateColumn 
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('avaliador_projetos')
export class AvaliadorProjeto {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'avaliador_id' })
  avaliadorId!: number;

  @Column({ name: 'projeto_id' })
  projetoId!: number;

  @Column({ type: 'varchar', length: 20, default: 'pendente' })
  status!: string;

  @CreateDateColumn({ name: 'data_atribuicao' })
  dataAtribuicao!: Date;

  // -------------------------------------------------------------
  // RELAÇÕES
  // -------------------------------------------------------------

  @ManyToOne(() => User)
  @JoinColumn({ name: 'avaliador_id' })
  avaliador!: User;

  // Usa string 'Projeto' no ManyToOne para eliminar o erro de importação circular
  @ManyToOne('Projeto', 'avaliadorProjetos', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projeto_id' })
  projeto!: any;
}