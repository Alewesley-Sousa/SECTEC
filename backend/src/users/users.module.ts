import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UsersSeed } from './users.seed';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService, UsersSeed],
  exports: [UsersService],
})
export class UsersModule {}