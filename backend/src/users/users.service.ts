import { BadRequestException, Injectable, InternalServerErrorException,
NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserTurma, UserRole } from './entities/user.entity';
import { HashingProvider } from '../common/providers/hashing.provider';
import { parse } from 'csv-parse/sync';

interface ICsvRow {
  nome: string;
  email: string;
  senha?: string;
  turma?: string;
  ano?: string;
  // Adicionamos um index signature para aceitar colunas com nomes compostos como "email gsuite"
  [key: string]: any;
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
      .addSelect('user.senha')
      .where('user.email_institucional = :email', { email })
      .getOne();
  }

  async findAllAlunos() {
    return this.usersRepository.find({
      where: { role_cargo: UserRole.ALUNO, ativo: true },
      select: ['id', 'nome', 'email_institucional', 'turma'],
    });
  }

  async findAllOrientadores() {
    return this.usersRepository.find({
      where: { role_cargo: UserRole.ORIENTADOR, ativo: true },
      select: ['id', 'nome', 'email_institucional'],
    });
  }

  async processarCsv(file: Express.Multer.File, tipo: UserRole) {
    if (!file || !file.buffer) {
      throw new BadRequestException('Arquivo não enviado ou corrompido.');
    }

    const csvString = file.buffer.toString('utf-8');
    let registros: ICsvRow[];

    try {
      registros = parse(csvString, {
        columns: (header: string[]) => header.map(h => h.toLowerCase().trim()),
        skip_empty_lines: true,
        trim: true,
        bom: true,
        delimiter: [',', ';'],
        skip_records_with_error: true,
        relax_column_count: true,
      });
    } catch (e) {
      throw new BadRequestException('Erro ao formatar CSV. Verifique o cabeçalho.');
    }

    const mapaTurmas: Record<string, UserTurma> = {
      'INFO': UserTurma.INFORMATICA,
      'CONT': UserTurma.CONTABILIDADE,
      'ENF': UserTurma.ENFERMAGEM,
    };

    const dadosFormatados = await Promise.all(
      registros.map(async (reg, index) => {
        // FLEXIBILIDADE: Busca o e-mail em várias colunas possíveis
        const emailBruto = reg.email || reg['email gsuite'] || reg['email_gsuite'] || reg['e-mail'];
        const nomeBruto = reg.nome;

        if (!nomeBruto || !emailBruto) {
          throw new BadRequestException(
            `Erro na linha ${index + 2}: Colunas Nome e Email são obrigatórias (Verificado: ${nomeBruto}, ${emailBruto}).`
          );
        }

        // --- EXTRAÇÃO DA PRIMEIRA PALAVRA ---
        const primeiroNome = String(nomeBruto).trim();
        const primeiroEmail = String(emailBruto).trim();
        const primeiraTurma = (reg.turma || "").trim();
        const primeiroAnoStr = (reg.ano || "").trim();

        let senhaFinal: string;
        let turmaFinal: UserTurma | null = null;
        let roleFinal: UserRole;
        let anoFinal: number = 0;

        if (tipo === UserRole.ALUNO) {
          senhaFinal = primeiroEmail;
          roleFinal = UserRole.ALUNO;
          anoFinal = primeiroAnoStr ? Number(primeiroAnoStr) : 1;
          
          const chaveBusca = primeiraTurma.toUpperCase();
          turmaFinal = mapaTurmas[chaveBusca] || UserTurma.INFORMATICA;
        } else {
          const primeiraSenha = (reg.senha || "");
          senhaFinal = primeiraSenha || primeiroEmail;
          roleFinal = UserRole.ORIENTADOR;
          turmaFinal = null;
          anoFinal = 0;
        }

        const senhaHasheada = await this.hashingProvider.hash(senhaFinal);

        return {
          nome: primeiroNome,
          email_institucional: primeiroEmail,
          senha: senhaHasheada,
          turma: turmaFinal,
          ano: anoFinal,
          role_cargo: roleFinal,
          ativo: true,
        };
      }),
    );

    try {
      await this.usersRepository.save(dadosFormatados);
      return {
        filename: file.originalname,
        total: dadosFormatados.length,
        tipo: tipo
      };
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        throw new BadRequestException('Um ou mais e-mails do CSV já estão cadastrados.');
      }
      throw new InternalServerErrorException('Erro ao salvar usuários no banco de dados.');
    }
  }
  
  async promoteToComissao(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado.`);
    }

    // Regra de negócio: Apenas quem é ALUNO pode virar COMISSÃO nesta rota
    if (user.role_cargo !== UserRole.ALUNO) {
      throw new BadRequestException('Apenas usuários com cargo de ALUNO podem ser movidos para a COMISSÃO.');
    }

    user.role_cargo = UserRole.COMISSAO;
    
    return this.usersRepository.save(user);
  }
}
