import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // Importe o TypeOrmModule
import { ProjetosService } from './projetos.service';
import { ProjetosController } from './projetos.controller';
import { Projeto } from './entities/projeto.entity'; // Importe a entidade

@Module({
  imports: [
    // Isso permite que o @InjectRepository(Projeto) funcione no Service
    TypeOrmModule.forFeature([Projeto])
  ],
  controllers: [ProjetosController],
  providers: [ProjetosService],
  exports: [ProjetosService], // Opcional: exporte se outros módulos precisarem dele
})
export class ProjetosModule {}
