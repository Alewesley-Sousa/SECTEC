import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjetoOrientador } from './entities/projeto-orientador.entity';
import { OrientacoesService } from './orientacoes.service';
import { OrientacoesController } from './orientacoes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProjetoOrientador])],
  providers: [OrientacoesService],
  controllers: [OrientacoesController],
  exports: [OrientacoesService],
})
export class OrientacoesModule {}
