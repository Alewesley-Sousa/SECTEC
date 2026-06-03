// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { UsersSeed } from './users.seed';

// 🚀 IMPORTANTE: Importe as entidades que o UsersService exige no construtor
import { Evento } from '../evento/entities/evento.entity'; 
import { ComissaoEvento } from '../evento/entities/comissao-evento.entity'; 

@Module({
  imports: [
    // ── ADICIONE AS ENTIDADES NO ARRAY DO FORFEATURE ──
    TypeOrmModule.forFeature([
      User, 
      Evento, 
      ComissaoEvento
    ]),
  ],
  controllers: [UsersController],
  providers: [
    UsersService, 
    UsersSeed,
  ],
  exports: [
    UsersService, 
    UsersSeed,
  ],
})
export class UsersModule {}
