import 'reflect-metadata'; // Importante para o TypeORM
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { Projeto } from './src/projetos/entities/projeto.entity';
import { Evento } from './src/evento/entities/evento.entity';
import { User } from './src/users/entities/user.entity';
import { Auditoria } from './src/auditoria/entities/auditoria.entity';

// Carrega as variáveis do arquivo .env para o process.env
dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '3306', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME, // Agora não será mais undefined
  entities: [Projeto, Evento, User, Auditoria],
  migrations: ['src/migrations/*.ts'],
});
