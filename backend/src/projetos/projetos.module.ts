import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Service e Controller do Módulo
import { ProjetosService } from './projetos.service';
import { ProjetosController } from './projetos.controller';

// Entidades Locais (Escopo de Projetos)
import { Projeto } from './entities/projeto.entity';
import { ProjetoAluno } from './entities/projeto-aluno.entity';
import { ProjetoOrientador } from './entities/projeto-orientador.entity';

// Entidades Externas (Relacionamentos com outros módulos)
import { TemaEvento } from 'src/evento/entities/tema-evento.entity';
import { Evento } from 'src/evento/entities/evento.entity';
import { AuditoriaModule } from 'src/auditoria/auditoria.module';

/**
 * Módulo responsável pela gestão de projetos científicos e acadêmicos.
 * * Este módulo integra as relações entre alunos, orientadores e os eventos
 * aos quais os projetos estão vinculados, utilizando o TypeORM para persistência.
 */
@Module({
  imports: [
    /**
     * Registra as entidades no escopo deste módulo.
     * Isso habilita a injeção de repositórios (via @InjectRepository) 
     * dentro do ProjetosService.
     */
    TypeOrmModule.forFeature([
      Projeto,
      ProjetoAluno,
      ProjetoOrientador,
      TemaEvento,
      Evento,
      AuditoriaModule,
    ]),
    AuditoriaModule,
  ],
  controllers: [ProjetosController],
  providers: [ProjetosService],
  /**
   * Exportamos o ProjetosService para que outros módulos (como o Módulo de Eventos)
   * possam consultar dados de projetos se necessário.
   */
  exports: [ProjetosService],
})
export class ProjetosModule {}
