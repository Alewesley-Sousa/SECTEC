// dashboard.controller.ts
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard) // aplica nos 3 abaixo
export class DashboardController {

  @Get('aluno')
  @Roles(UserRole.ALUNO)
  getAlunoArea(@Request() req) {
    return { 
      tela: 'aluno',
      mensagem: 'Bem-vindo, aluno!',
      user: req.user 
    };
  }

  @Get('orientador')
  @Roles(UserRole.ORIENTADOR)
  getOrientadorArea(@Request() req) {
    return { 
      tela: 'orientador',
      mensagem: 'Bem-vindo, orientador!',
      user: req.user 
    };
  }

  @Get('coordenacao')
  @Roles(UserRole.COORDENACAO)
  getCoordenacaoArea(@Request() req) {
    return { 
      tela: 'coordenacao',
      mensagem: 'Bem-vindo, coordenação!',
      user: req.user 
    };
  }
}