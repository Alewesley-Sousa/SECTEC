import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity'; 
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersSeed {
  constructor(
    @InjectRepository(User)
    private readonly usuarioRepository: Repository<User>,
  ) {}

  async run() {
    const salt = await bcrypt.genSalt(10);
    const senhaHashed = await bcrypt.hash('Senha123@', salt);
    
    console.log('---------------------------------------');
    console.log('✅ Seeds finalizadas com sucesso!');
    console.log('🔑 Senha padrão: Senha123@');
    console.log('---------------------------------------');
  }
}