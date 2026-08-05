import { Controller, Post, Body } from '@nestjs/common';
import { AvaliacaoService } from './avaliacao.service';
import { CreateAvaliacaoDto } from './dto/avaliacao.dto';

@Controller('avaliacao')
export class AvaliacaoController {
  constructor(private readonly avaliacaoService: AvaliacaoService) {}

  @Post()
  submeter(@Body() dto: CreateAvaliacaoDto) {
    return this.avaliacaoService.submeterAvaliacao(dto); // <-- Nome correto do método aqui
  }
}