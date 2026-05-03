// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProjetosModule } from './projetos/projetos.module';
import { EventoModule } from './evento/evento.module';
import { UsersModule } from './users/users.module'; // APENAS UMA VEZ
import { Projeto } from './projetos/entities/projeto.entity';
import { Evento } from './evento/entities/evento.entity';
import { User } from './users/entities/user.entity'; // CORRIGIDO: Era Users
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: 3306,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: false,
    }),
    CommonModule,
    UsersModule, // REMOVA A DUPLICATA DAQUI TAMBÉM NO ARRAY
    AuthModule,
    DashboardModule,
    ProjetosModule,
    EventoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
