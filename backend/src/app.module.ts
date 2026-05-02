// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // 1. Importe o ConfigModule
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProjetosModule } from './projetos/projetos.module';
import { EventoModule } from './evento/evento.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { Projeto } from './projetos/entities/projeto.entity';
import { Evento } from './evento/entities/evento.entity';
import { Usuario } from './usuarios/entities/usuario.entity';
import { CommonModule } from './common/common.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module'; // ← IMPORTE AQUI

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mysql',            // 👈 era postgres, muda para mysql
      host: process.env.DB_HOST,
      port: 3306,               // 👈 porta do MySQL
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: false,       // 👈 false porque o banco já existe
    }),
    CommonModule,
    UsersModule,
    AuthModule,
    DashboardModule,
    ProjetosModule,
    EventoModule,
    UsuariosModule,
  ]
})
export class AppModule {}