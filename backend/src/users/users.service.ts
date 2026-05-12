import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { HashingProvider } from '../common/providers/hashing.provider';
import { UserRole } from './entities/user.entity'; // 👈 adiciona essa linha
import { parse } from 'csv-parse/sync';
interface ICsvUser {
  Turma: string;
  ano: string;
  nome: string;
  email: string;
  senha: string;
  role: string;
}
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private hashingProvider: HashingProvider,
  ) { }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.senha')           // 👈 campo correto do seu banco
      .where('user.email_institucional = :email', { email })  // 👈 campo correto
      .getOne();
  }
  async findAllAlunos() {
    return this.usersRepository.find({
      where: { role_cargo: UserRole.ALUNO, ativo: true },
      select: ['id', 'nome', 'email_institucional'],
    });
  }

  async findAllOrientadores() {
    return this.usersRepository.find({
      where: { role_cargo: UserRole.ORIENTADOR, ativo: true },
      select: ['id', 'nome', 'email_institucional'],
    });
  }

processarCsv(file: Express.Multer.File) {
    const csvString = file.buffer.toString('utf-8');

    // 2. Informe ao parse que o retorno será um array de ICsvUser
    const registros = parse(csvString, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as ICsvUser[]; // <--- O "cast" aqui resolve o erro de 'desconhecido'

    // Agora o TS sabe exatamente o que existe dentro de 'reg'
    const dadosFormatados = registros.map((reg) => ({
      turma: reg.Turma,
      ano: Number(reg.ano),
      nome: reg.nome,
      email_institucional: reg.email,
      senha: reg.senha,
      role_cargo: reg.role,
    }));

    return {
      filename: file.originalname,
      total: dadosFormatados.length,
      data: dadosFormatados,
    };
  }
}