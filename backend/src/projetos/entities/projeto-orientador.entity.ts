import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    Column,
    CreateDateColumn
} from 'typeorm';
import { Projeto } from './projeto.entity';
import { User } from '../../users/entities/user.entity';

@Entity('projeto_orientador')
export class ProjetoOrientador {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Projeto, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'projeto_id' })
    projeto!: Projeto;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'orientador_id' })
    orientador!: User;

    @Column({
        type: 'enum',
        enum: ['pendente', 'aceito', 'recusado'],
        default: 'pendente',
    })
    status!: 'pendente' | 'aceito' | 'recusado';

    @Column({ name: 'respondido_em', type: 'datetime', nullable: true })
    respondidoEm!: Date;

    @CreateDateColumn({ name: 'criado_em' })
    criadoEm!: Date;
}
