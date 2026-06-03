import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RelatorioService } from './relatorio.service';
import { RelatorioController } from './relatorio.controller';
import { User } from 'src/users/entities/user.entity';
import { Evento } from 'src/evento/entities/evento.entity';
import { ComissaoEvento } from 'src/evento/entities/comissao-evento.entity';
import { TemaEvento } from 'src/evento/entities/tema-evento.entity';
import { Projeto } from 'src/projetos/entities/projeto.entity';


@Module({
  imports: [
    TypeOrmModule.forFeature([User, Evento, ComissaoEvento, Projeto, TemaEvento]) // Injeta os repositórios necessários
  ],
  controllers: [RelatorioController],
  providers: [RelatorioService],
})
export class RelatorioModule {}
