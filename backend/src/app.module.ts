// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProjetosModule } from './projetos/projetos.module';
import { EventoModule } from './evento/evento.module';
import { UsersModule } from './users/users.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PdfModule } from './pdf/pdf.module';
import { OrientacoesModule } from './orientacoes/orientacoes.module';
import { MateriaisModule } from './materiais/materiais.module';

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
      synchronize: true,
    }),
    ScheduleModule.forRoot(),

    // ── CONFIGURAÇÃO PARA SERVIR O REACT ──
    ServeStaticModule.forRoot({
      rootPath: '/app/frontend/dist',
      exclude: ['/api'],
    }),

    CommonModule,
    UsersModule,
    AuthModule,
    DashboardModule,
    ProjetosModule,
    EventoModule,
    PdfModule,

    // ── MÓDULOS DO ORIENTADOR ──
    OrientacoesModule,
    MateriaisModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
