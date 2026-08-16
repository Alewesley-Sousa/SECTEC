import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config(); // Carrega as variáveis do arquivo .env

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '', // Agora lerá a senha do .env
  database: process.env.DB_NAME || 'sectec_dev',
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/migrations/*.js'],
  synchronize: false,
});

export default AppDataSource;