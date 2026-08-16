import 'dotenv/config';
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123',
  database: process.env.DB_NAME || 'sectec_dev',
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/migrations/*.js'],
});