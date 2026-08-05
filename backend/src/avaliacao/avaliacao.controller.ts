import { Body, Controller, Post } from '@nestjs/common';
import { AvaliacaoService } from './avaliacao.service';
import { AvaliacaoDto } from './dto/avaliacao.dto';

@Controller('avaliacao')
export class AvaliacaoController {
  constructor(private readonly avaliacaoService: AvaliacaoService) {}

  @Post()
  async criarAvaliacao(@Body() dto: AvaliacaoDto) {
    return await this.avaliacaoService.submeterAvaliacao(dto);
  }
}
