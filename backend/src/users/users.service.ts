// src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { HashingProvider } from '../common/providers/hashing.provider';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private hashingProvider: HashingProvider,
  ) {}

  async createUser(email: string, username: string, plainPassword: string): Promise<User> {
    const hashedPassword = await this.hashingProvider.hash(plainPassword);
    const newUser = this.usersRepository.create({
      email,
      username,
      password: hashedPassword,
    });
    return this.usersRepository.save(newUser);
  }

  async findOneByEmail(email: string): Promise<User | null> {
    // Usamos addSelect porque o campo password está com select: false
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password') // Busca a senha apenas aqui
      .where('user.email = :email', { email })
      .getOne();
  }
}