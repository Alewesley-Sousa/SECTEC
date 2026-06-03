import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET, // 👈 lê direto do .env, sem ConfigService
    });
  }

  async validate(payload: any) {
    return { 
      userId: payload.sub ?? payload.userId, 
      email: payload.email,
      role: payload.role ?? payload.role_cargo   // 👈 inclui o role
    };
  }
}
