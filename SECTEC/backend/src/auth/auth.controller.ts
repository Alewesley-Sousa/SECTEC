import {
  Controller,
  Post,
  UseGuards,
  Request,
  Body,
  Patch,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from '@nestjs/swagger'; // <-- Novos imports
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto'; // <-- Importa o DTO de Login

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: 'Realiza a autenticação e retorna o Token JWT' })
  @ApiBody({ type: LoginDto }) // Força o Swagger a gerar o corpo de login
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    await this.authService.forgotPassword(email);

    return {
      message: 'Email de redefinição enviado com sucesso',
    };
  }

  @Post('reset-password')
  async resetPassword(
    @Body('token') token: string,
    @Body('newPassword') newPassword: string,
  ) {
    await this.authService.resetPassword(token, newPassword);

    return {
      message: 'Senha redefinida com sucesso',
    };
  }

 @UseGuards(JwtAuthGuard)
@Patch('change-password')
async changePassword(
  @Request() req,
  @Body() body: ChangePasswordDto,
) {
  return this.authService.changePassword(
    req.user.userId,
    body.oldPassword,
    body.newPassword,
  );
}
}