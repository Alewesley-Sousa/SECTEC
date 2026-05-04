import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Projeto } from './projeto.entity';
import { User } from '../../users/entities/user.entity';

@Entity('projeto_alunos')
export class ProjetoAluno {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Projeto, (projeto) => projeto.projetoAlunos, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'projeto_id' })
    projeto!: Projeto;

    @ManyToOne(() => User, (user) => user.projetosParticipados, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'aluno_id' })
    aluno!: User;

    @CreateDateColumn({ name: 'criado_em' })
    criadoEm!: Date;
}
