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

    // Definimos os usuários em um array para evitar repetição de código
    const seedUsers = [
      {
        nome: 'Aluno Teste SECTEC',
        email: 'aluno@sectec.com',
        role: UserRole.ALUNO,
      },
      {
        nome: 'Orientador Teste SECTEC',
        email: 'orientador@sectec.com',
        role: UserRole.ORIENTADOR,
      },
      {
        nome: 'Coordenador Teste SECTEC',
        email: 'coordenador@sectec.com',
        role: UserRole.COORDENACAO, // 👈 Ajustado para COORDENACAO (conforme seu erro anterior)
      },
    ];

    for (const u of seedUsers) {
      // 1. Verifica se o usuário já existe
      const existe = await this.usuarioRepository.findOne({ 
        where: { email_institucional: u.email } 
      });

      // 2. Se existir, remove para atualizar com o novo hash
      if (existe) {
        console.log(`🧹 Atualizando registro: ${u.email}`);
        await this.usuarioRepository.remove(existe);
      }

      // 3. Cria e salva o novo usuário
      const novoUsuario = this.usuarioRepository.create({
        nome: u.nome,
        email_institucional: u.email,
        senha: senhaHashed,
        role_cargo: u.role,
        ativo: true,
      });

      await this.usuarioRepository.save(novoUsuario);
    }
    
    console.log('---------------------------------------');
    console.log('✅ Seeds finalizadas com sucesso!');
    console.log('🔑 Senha padrão: Senha123@');
    console.log('---------------------------------------');
  }
}
