import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjetoMaterial } from './entities/projeto-material.entity';
import { ProjetoOrientador } from '../orientacoes/entities/projeto-orientador.entity';
import { MateriaisService } from './materiais.service';
import { MateriaisController } from './materiais.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProjetoMaterial, ProjetoOrientador])],
  providers: [MateriaisService],
  controllers: [MateriaisController],
})
export class MateriaisModule {}
