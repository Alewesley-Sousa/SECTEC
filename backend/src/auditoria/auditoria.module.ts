import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditoriaController } from './auditoria.controller';
import { AuditoriaService } from './auditoria.service';
import { Auditoria } from './entities/auditoria.entity';
import { User } from '../users/entities/user.entity';
import { Projeto } from '../projetos/entities/projeto.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Auditoria, User, Projeto])],
  controllers: [AuditoriaController],
  providers: [AuditoriaService],
  exports: [AuditoriaService],
})
export class AuditoriaModule {}
