// src/users/entities/user.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  username: string;

  @Column({ select: false }) // 🔒 NUNCA é retornado por padrão
  @Exclude() // 🔒 Segurança extra para serialização
  password: string;

  @CreateDateColumn()
  createdAt: Date;
}