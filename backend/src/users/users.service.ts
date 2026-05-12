import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { HashingProvider } from '../common/providers/hashing.provider';
import { UserRole } from './entities/user.entity'; // 👈 adiciona essa linha
import { Readable } from 'typeorm/platform/PlatformTools.js';
import csvParser from 'csv-parser';

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

async processCsv(buffer: Buffer) {
    const results: any[] = [];
    const stream = Readable.from(buffer);

    return new Promise((resolve, reject) => {
      stream
        .pipe(csvParser())
        .on('data', (data) => {
          // 'data' representa cada linha do CSV como um objeto:
          // Ex: { nome: 'Felipe', email_institucional: 'felipe@fatec.sp.gov.br', role_cargo: 'aluno' }
          results.push(data);
        })
        .on('end', async () => {
          try {
            // --- PARTE QUE INTERAGE COM O BANCO DE DADOS ---
            
            // O .save() do TypeORM é inteligente:
            // 1. Ele verifica se os campos batem com a entidade 'User'.
            // 2. Faz o INSERT de todos os objetos do array de uma vez.
            // 3. Se houver erro de duplicidade (email_institucional UNIQUE), ele lançará uma exceção.
            
            const usersCreated = await this.usersRepository.save(results);

            // --- RESULTADO PREVISTO (O que retorna para o Frontend) ---
            resolve({
              success: true,
              message: `${usersCreated.length} usuários foram importados com sucesso.`,
              data: usersCreated.map(u => ({
                id: u.id,
                nome: u.nome,
                email: u.email_institucional,
                cargo: u.role_cargo,
                status: 'cadastrado'
              }))
            });

          } catch (error) {
            // Tratamento de erro comum: Email duplicado
            if (error.code === '23505') {
              reject(new BadRequestException('Um ou mais e-mails já estão cadastrados no sistema.'));
            }
            reject(error);
          }
        })
        .on('error', (err) => reject(new BadRequestException('Erro ao processar arquivo CSV.')));
    });
  }
}