import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Avaliacao } from './avaliacao.entity';

@Entity('avaliacao_criterios')
export class AvaliacaoCriterio {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Avaliacao)
  avaliacao!: Avaliacao;

  @Column({
    type: 'enum',
    enum: ['apresentacao', 'metodologia', 'conteudo', 'resultado'],
  })
  criterio!: string;

  @Column({ type: 'decimal', precision: 3, scale: 1 })
  nota!: number;
}