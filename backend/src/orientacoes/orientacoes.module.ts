import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjetoOrientador } from './entities/projeto-orientador.entity';
import { OrientacoesService } from './orientacoes.service';
import { OrientacoesController } from './orientacoes.controller';

// Importações corretas de todas as entidades tocadas pelo Service
import { Projeto } from '../projetos/entities/projeto.entity'; 
import { ProjetoAluno } from '../projetos/entities/projeto-aluno.entity';
import { User } from '../users/entities/user.entity'; // 🚀 IMPORTANTE: Adicionado para o userRepository funcionar

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProjetoOrientador, 
      Projeto, 
      ProjetoAluno,
      User // 🚀 IMPORTANTE: Injetando o repositório de usuários no escopo deste módulo
    ]),
  ],
  providers: [OrientacoesService],
  controllers: [OrientacoesController],
  exports: [OrientacoesService],
})
export class OrientacoesModule {}
