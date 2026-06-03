import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { OrientacoesService } from './orientacoes.service';
import { ResponderOrientacaoDto } from './dto/responder-orientacao.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, UserRole } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ApiOperation, ApiResponse, ApiTags, ApiBody, ApiBearerAuth } from
'@nestjs/swagger';

@Controller('orientacoes')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('token-jwt')
@Roles(UserRole.ORIENTADOR)
export class OrientacoesController {
  constructor(private readonly orientacoesService: OrientacoesService) {}

  @Get('pendentes')
  findPendentes(@GetUser('userId') userId: number) {
    return this.orientacoesService.findMinhasPendentes(userId);
  }

  @Get()
  findMinhas(@GetUser('userId') userId: number) {
    return this.orientacoesService.findMinhasOrientacoes(userId);
  }

  @Patch(':id/responder')
  responder(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('userId') userId: number,
    @Body() dto: ResponderOrientacaoDto,
  ) {
    return this.orientacoesService.responder(id, userId, dto);
  }
  
  @Get('disponiveis')
  @Roles(UserRole.ALUNO) // Garante que apenas alunos usem essa listagem
  listarParaAluno(
    @GetUser('userId') alunoId: number,
  ) {
    return this.orientacoesService.listarDisponiveisParaAluno(alunoId);
  }

}
