import { Module } from '@nestjs/common';
import { AvaliacaoController } from './avaliacao.controller';
import { AvaliacaoService } from './avaliacao.service';

@Module({
  controllers: [AvaliacaoController],
  providers: [AvaliacaoService]
})
export class AvaliacaoModule {}
