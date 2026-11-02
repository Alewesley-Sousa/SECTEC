import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

export default new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sectec_dev',
  entities: [],
  migrations: ['src/migrations/1789000000000-AddAreasAndLinkProjects.ts'],
  migrationsTableName: 'areas_migrations',
  synchronize: false,
});
