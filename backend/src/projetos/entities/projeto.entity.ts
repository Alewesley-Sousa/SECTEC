import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Evento } from '../../evento/entities/evento.entity';
import { TemaEvento } from '../../evento/entities/tema-evento.entity';
import { User } from '../../users/entities/user.entity';
import { ProjetoAluno } from './projeto-aluno.entity';
import { ProjetoOrientador } from './projeto-orientador.entity';
import { ProjectFile } from '../../pdf/entities/project-file.entity'; // ajuste o caminho aqui
import { ProjetoMaterial } from '../../materiais/entities/projeto-material.entity';

@Entity('projetos')
@Unique(['alunoAutor', 'evento'])
export class Projeto {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Evento, (evento) => evento.projetos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'evento_id' })
  evento!: Evento;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'aluno_autor_id' })
  alunoAutor!: User;

  @Column({ type: 'varchar', length: 255 })
  titulo!: string;

  @Column({ type: 'text' })
  descricao!: string;

  @Column({ name: 'tema_id' })
  temaId!: number;

  @ManyToOne(() => TemaEvento, { nullable: true, eager: false })
  @JoinColumn({ name: 'tema_id', referencedColumnName: 'id' })
  tema!: TemaEvento;

  @OneToMany(() => ProjetoAluno, (projetoAluno) => projetoAluno.projeto)
  projetoAlunos!: ProjetoAluno[];

  @OneToMany(() => ProjetoOrientador, (projetoOrientador) => projetoOrientador.projeto)
  orientadores!: ProjetoOrientador[];

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm!: Date;
  
  
    // 3. Adicionamos a relação inversa para o Projeto ter acesso à lista de PDFs dele
  @OneToMany(() => ProjectFile, (projectFile) => projectFile.projeto)
  arquivos!: ProjectFile[];

  @OneToMany(() => ProjetoMaterial, (material) => material.projeto)
  materiais!: ProjetoMaterial[];
}
