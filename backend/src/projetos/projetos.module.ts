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
import { User } from 'src/users/entities/user.entity';
import { ProjetosEquipeService } from './ProjetosEquipe.service';
import { ProjetosOrientadorService } from './ProjetosOrientador.service';
import { ProjetosConsultaService } from './ProjetosConsulta.service';
import { ProjetosPdfService } from './ProjetosPdf.service';
import { ProjetosValidacaoService } from './ProjetosValidacao.service';
import { ProjetoMaterial } from '../materiais/entities/projeto-material.entity';
import { PdfModule } from 'src/pdf/pdf.module';
import { ProjectFile } from 'src/pdf/entities/project-file.entity'; // ✅ import

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Projeto,
      ProjetoAluno,
      ProjetoOrientador,
      TemaEvento,
      Evento,
      AuditoriaModule,
      User,
      ProjetoMaterial,
      ProjectFile, // ✅ adicionado
    ]),
    AuditoriaModule,
    PdfModule,
  ],
  controllers: [ProjetosController],
  providers: [
    ProjetosService,
    ProjetosEquipeService,
    ProjetosOrientadorService,
    ProjetosConsultaService,
    ProjetosPdfService,
    ProjetosValidacaoService,
  ],
  exports: [ProjetosService],
})
export class ProjetosModule {}  