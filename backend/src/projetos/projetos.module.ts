import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // Importe o TypeOrmModule
import { ProjetosService } from './projetos.service';
import { ProjetosController } from './projetos.controller';
import { Projeto } from './entities/projeto.entity'; // Importe a entidade
import { ProjetoAluno } from './entities/projeto-aluno.entity'; // Importe a entidade
import { ProjetoOrientador } from './entities/projeto-orientador.entity';
import { TemaEvento } from 'src/evento/entities/tema-evento.entity';
import { Evento } from 'src/evento/entities/evento.entity';
import { AuditoriaModule } from 'src/auditoria/auditoria.module';

@Module({
  imports: [
    // Isso permite que o @InjectRepository(Projeto) funcione no Service
    TypeOrmModule.forFeature([Projeto, ProjetoAluno, ProjetoOrientador, TemaEvento, Evento]),
    AuditoriaModule,
  ],
  controllers: [ProjetosController],
  providers: [ProjetosService],
  exports: [ProjetosService], // Opcional: exporte se outros módulos precisarem dele
})
export class ProjetosModule {}
