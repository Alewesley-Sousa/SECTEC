import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { HashingProvider } from '../common/providers/hashing.provider';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private hashingProvider: HashingProvider,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Email não encontrado');
    }

    const isPasswordValid = await this.hashingProvider.compare(pass, user.senha);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Senha inválida');
    }

    const { senha, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = { email: user.email_institucional, sub: user.id, role: user.role_cargo };

    return {
      access_token: this.jwtService.sign(payload),
      role: user.role_cargo,
      user: {
        id: user.id,
        email: user.email_institucional,
        nome: user.nome,
      },
    };
  }
} // 👈 esse fechava a classe, estava faltando