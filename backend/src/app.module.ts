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

@Module({
  imports: [
    // 2. Adicione o ConfigModule como o PRIMEIRO item do imports
    ConfigModule.forRoot({
      isGlobal: true, // Torna o .env disponível em todo o projeto
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT ?? '3306', 10),
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      entities: [Projeto, Evento, Usuario],
      synchronize: true, 
    }),
    ProjetosModule,
    EventoModule,
    UsuariosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
