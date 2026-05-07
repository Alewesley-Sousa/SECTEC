import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('alunos')
  getAlunos() {
    return this.usersService.findAllAlunos();
  }

  @Get('orientadores')
  getOrientadores() {
    return this.usersService.findAllOrientadores();
  }
}