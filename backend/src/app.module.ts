import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DevelopersModule } from './developers/developers.module';
import { ProjetosModule } from './projetos/projetos.module';

@Module({
  imports: [DevelopersModule, ProjetosModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
