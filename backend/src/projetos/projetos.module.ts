import { Module } from '@nestjs/common';
import { ProjetosService } from './projetos.service';
import { ProjetosController } from './projetos.controller';

@Module({
  controllers: [ProjetosController],
  providers: [ProjetosService],
})
export class ProjetosModule {}
