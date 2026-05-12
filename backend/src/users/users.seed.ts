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
    const emailOrientador = 'orientador@sectec.com';
    const emailCoordenador = 'coordenador@sectec.com';

    // 1. Procura o usuário existente pelo email
    const existe = await this.usuarioRepository.findOne({ 
      where: { email_institucional: emailAluno } 
    });
    const existeOri = await this.usuarioRepository.findOne({ 
      where: { email_institucional: emailOrientador } 
    });
    const existeCoo = await this.usuarioRepository.findOne({ 
      where: { email_institucional: emailCoordenador } 
    });

    // 2. Se existir, apaga o registro antigo (limpeza para garantir o hash novo)
    if (existe) {
      console.log(`🧹 Removendo registro antigo de: ${emailAluno},
      ${emailCoordenador}, ${emailOrientador}`);
      await this.usuarioRepository.remove(existe);
      await this.usuarioRepository.remove(existeOri);
      await this.usuarioRepository.remove(existeCoo);
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
    
    const aluno = this.usuarioRepository.create({
      nome: 'Orientador Teste SECTEC',
      email_institucional: emailOrientador,
      senha: senhaHashed,
      role_cargo: UserRole.ORIENTADOR,
      ativo: true,
    });
    const aluno = this.usuarioRepository.create({
      nome: 'Coordenador Teste SECTEC',
      email_institucional: emailCoordenador,
      senha: senhaHashed,
      role_cargo: UserRole.COORDENADOR,
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
