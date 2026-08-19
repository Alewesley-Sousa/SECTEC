import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity'; // Certifique-se de que o caminho para o User está correto

@Entity('orientador_areas')
export class OrientadorArea {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User, (user) => user.areas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 100 })
  area: string; // Ex: 'informatica', 'humanas', 'exatas', etc.
}