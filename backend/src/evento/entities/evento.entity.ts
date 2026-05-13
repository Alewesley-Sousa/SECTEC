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
import { Projeto } from 'src/projetos/entities/projeto.entity'; // Usando padrão src/
import { TemaEvento } from 'src/evento/entities/tema-evento.entity';
import { User } from 'src/users/entities/user.entity'; // 👈 Nome correto da classe é 'User'

@Entity('eventos')
export class Evento {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  titulo!: string;

  @Column({ type: 'text', nullable: true })
  descricao?: string;

  @Column({ name: 'coordenador_id', nullable: true })
  coordenadorId?: number;

  @Column({ name: 'prazo_inicial', type: 'datetime' })
  prazoInicial!: Date;

  @Column({ name: 'prazo_final', type: 'datetime' })
  prazoFinal!: Date;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm!: Date;

  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm!: Date;

  // --- Relacionamentos ---

  // Agora usando a classe 'User' que você definiu
  @ManyToOne(() => User) 
  @JoinColumn({ name: 'coordenador_id' })
  coordenador!: User;

  @OneToMany(() => Projeto, (projeto) => projeto.evento)
  projetos!: Projeto[];

  @OneToMany(() => TemaEvento, (tema) => tema.evento)
  temas!: TemaEvento[];
}
