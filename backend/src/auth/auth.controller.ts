import { Controller, Post, UseGuards, Request, Body } from '@nestjs/common';
import { ApiBody, ApiTags, ApiOperation } from '@nestjs/swagger'; // 👈 Importe o ApiBody
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { LoginDto } from './dto/login.dto'; // 👈 Importe seu DTO

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: 'Realiza o login e retorna o token JWT' })
  @ApiBody({ type: LoginDto }) // 👈 Isso faz os campos aparecerem no Swagger
  async login(@Request() req, @Body() body: LoginDto) { 
    // O @Body() body aqui serve apenas para o Swagger e validação, 
    // o LocalAuthGuard continua pegando os dados do req.body internamente.
    return this.authService.login(req.user);
  }
}