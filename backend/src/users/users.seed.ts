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
    const emailAluno = 'aluno@sectec.com';

    // 1. Procura o usuário existente pelo email
    const existe = await this.usuarioRepository.findOne({ 
      where: { email_institucional: emailAluno } 
    });

    // 2. Se existir, apaga o registro antigo (limpeza para garantir o hash novo)
    if (existe) {
      console.log(`🧹 Removendo registro antigo de: ${emailAluno}`);
      await this.usuarioRepository.remove(existe);
    }

    // 3. Gera o salt e o hash da senha
    // Usar bcrypt garante que a senha não fique legível no banco de dados
    const salt = await bcrypt.genSalt(10);
    const senhaHashed = await bcrypt.hash('Senha123@', salt);

    // 4. Cria o novo registro com a senha protegida
    const aluno = this.usuarioRepository.create({
      nome: 'Aluno Teste SECTEC',
      email_institucional: emailAluno,
      senha: senhaHashed,
      role_cargo: UserRole.ALUNO,
      ativo: true,
    });

    await this.usuarioRepository.save(aluno);
    
    console.log('---------------------------------------');
    console.log('✅ Seed de Usuário atualizada com Hash!');
    console.log('📧 Email:', emailAluno);
    console.log('🔑 Senha: Senha123@');
    console.log('---------------------------------------');
  }
}
