@Injectable()
export class UsersSeed {
  constructor(
    @InjectRepository(User)
    private readonly usuarioRepository: Repository<User>,
  ) {}

  async run() {
    const emailAluno = 'aluno@sectec.com';

    // 1. Procura o usuário existente
    const existe = await this.usuarioRepository.findOne({ 
      where: { email_institucional: emailAluno } 
    });

    // 2. Se existir, apaga o registro antigo (que está sem hash)
    if (existe) {
      console.log(`🧹 Removendo registro antigo de: ${emailAluno}`);
      await this.usuarioRepository.remove(existe);
    }

    // 3. Gera o hash real da senha
    const salt = await bcrypt.genSalt(10);
    // Note que alterei para 'Senha123@' para bater com o seu console.log final
    const senhaHashed = await bcrypt.hash('Senha123@', salt);

    // 4. Cria o novo registro (agora com hash seguro)
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
    console.log('🔑 Senha: Senha123@ (Salva como hash no banco)');
    console.log('---------------------------------------');
  }
}
