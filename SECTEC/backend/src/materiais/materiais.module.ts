import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MateriaisService } from './materiais.service';
import { MateriaisController } from './materiais.controller';
import { ProjetoMaterial } from './entities/projeto-material.entity';

// 1. Importe a entidade Projeto
import { Projeto } from '../projetos/entities/projeto.entity';

// 2. Importe o módulo ou o serviço do PDF (ajuste o caminho se necessário)
import { PdfModule } from '../pdf/pdf.module'; 

@Module({
  imports: [
    // Adicionamos as entidades que o MateriaisService usa agora
    TypeOrmModule.forFeature([ProjetoMaterial, Projeto]),
    
    // Importamos o módulo do PDF para o Nest resolver o [class PdfService]
    PdfModule, 
  ],
  providers: [MateriaisService],
  controllers: [MateriaisController],
})
export class MateriaisModule {}
