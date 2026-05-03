import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity'; // Certifique-se que o caminho está correto
import * as bcrypt from 'bcrypt'; // 👈 Use bcryptjs para não dar erro no Termux

@Injectable()
export class UsersSeed {
  constructor(
    @InjectRepository(User)
    private readonly usuarioRepository: Repository<User>,
  ) {}

  async run() {
    // 1. Verifica se o aluno já existe para não duplicar dados no seu banco
    const emailAluno = 'aluno@sectec.com';
    const existe = await this.usuarioRepository.findOne({ 
      where: { email_institucional: emailAluno } 
    });

    if (existe) {
      console.log('⚠️ Seed pulada: Aluno já cadastrado.');
      return;
    }

    // 2. Criptografa a senha (importante: 'senha' bate com @Column na sua entidade)
    const salt = await bcrypt.genSalt(10);
    // const senhaHashed = await bcrypt.hash('Senha123@', salt);
    const senhaHashed = 'Senha123';

    // 3. Cria apenas a conta do aluno conforme solicitado
    const aluno = this.usuarioRepository.create({
      nome: 'Aluno Teste SECTEC',
      email_institucional: emailAluno,
      senha: senhaHashed,
      role_cargo: UserRole.ALUNO, // 👈 Usando o seu Enum
      ativo: true,
    });

    await this.usuarioRepository.save(aluno);
    
    console.log('---------------------------------------');
    console.log('✅ Seed de Usuário finalizada com sucesso!');
    console.log('📧 Email: aluno@sectec.com');
    console.log('🔑 Senha: Senha123@');
    console.log('---------------------------------------');
  }
}
