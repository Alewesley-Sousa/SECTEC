import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { parse } from 'csv-parse/sync';
import { User, UserRole } from './entities/user.entity';
import { HashingProvider } from '../common/providers/hashing.provider';
import { UsersService } from './users.service';

interface ICsvRow {
  nome: string;
  email: string;
  senha?: string;
  turma?: string;
  ano?: string;
  [key: string]: any;
}

@Injectable()
export class UsersImportService {
  private readonly logger = new Logger(UsersImportService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private usersService: UsersService,
    private hashingProvider: HashingProvider,
  ) {}

  /**
   * Processa arquivo CSV para cadastro em lote de usuários.
   */
  async processarCsv(file: Express.Multer.File, tipo: UserRole) {
    if (!file || !file.buffer) {
      throw new BadRequestException('Arquivo não enviado ou corrompido.');
    }

    const csvString = file.buffer.toString('utf-8');
    let registros: ICsvRow[];

    try {
      registros = parse(csvString, {
        columns: (header: string[]) => header.map((h) => h.toLowerCase().trim()),
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

    const { novos: registrosFiltrados, ignorados: totalIgnorados } =
      await this.filtrarNovosRegistros(registros);

    if (registrosFiltrados.length === 0) {
      return {
        filename: file.originalname,
        totalCadastrados: 0,
        totalIgnorados,
        tipo,
        mensagem: 'Todos os e-mails do CSV já constavam no sistema.',
      };
    }

    const dadosFormatados = await Promise.all(
      registrosFiltrados.map((reg) => this.montarDadosUsuario(reg, tipo)),
    );

    try {
      await this.usersRepository.save(dadosFormatados);
      return {
        filename: file.originalname,
        totalCadastrados: dadosFormatados.length,
        totalIgnorados,
        tipo,
      };
    } catch (error: unknown) {
      const err = error as any;
      this.logger.error('Erro ao salvar usuários do CSV', err.stack);
      if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
        throw new BadRequestException(
          'O arquivo enviado possui linhas com e-mails repetidos entre si.',
        );
      }
      throw new InternalServerErrorException(
        'Erro ao salvar novos usuários no banco de dados.',
      );
    }
  }

  // ==================== MÉTODOS PRIVADOS AUXILIARES ====================

  private extrairEmailsDoCsv(registros: ICsvRow[]): string[] {
    return registros
      .map((reg) => {
        const emailBruto =
          reg.email ||
          reg['email gsuite'] ||
          reg['email_gsuite'] ||
          reg['e-mail'];
        return emailBruto ? String(emailBruto).trim().toLowerCase() : null;
      })
      .filter(Boolean) as string[];
  }

  private async filtrarNovosRegistros(
    registros: ICsvRow[],
  ): Promise<{ novos: ICsvRow[]; ignorados: number }> {
    const emailsNoCsv = this.extrairEmailsDoCsv(registros);

    const usuariosExistentes = await this.usersRepository.find({
      where: { email_institucional: In(emailsNoCsv) },
      select: ['email_institucional'],
    });

    const emailsExistentesSet = new Set(
      usuariosExistentes.map((u) => u.email_institucional.toLowerCase()),
    );

    const novos = registros.filter((reg) => {
      const emailBruto =
        reg.email || reg['email gsuite'] || reg['email_gsuite'] || reg['e-mail'];
      if (!emailBruto) return false;
      return !emailsExistentesSet.has(String(emailBruto).trim().toLowerCase());
    });

    return { novos, ignorados: registros.length - novos.length };
  }

  private async montarDadosUsuario(
    reg: ICsvRow,
    tipo: UserRole,
  ): Promise<Partial<User>> {
    const nomeBruto = reg.nome;
    const emailBruto =
      reg.email || reg['email gsuite'] || reg['email_gsuite'] || reg['e-mail'];

    if (!nomeBruto || !emailBruto) {
      throw new BadRequestException(
        `Linha inválida: Nome e Email são obrigatórios. (Nome: ${nomeBruto}, Email: ${emailBruto})`,
      );
    }

    // Utiliza o método público do UsersService para centralizar a lógica
    const credenciais = this.usersService.resolverCredenciais({
      email: String(emailBruto),
      role: tipo,
      senha: reg.senha,
      turma: reg.turma,
      ano: reg.ano,
    });

    const senhaHasheada = await this.hashingProvider.hash(credenciais.senhaFinal);

    return {
      nome: String(nomeBruto).trim(),
      email_institucional: String(emailBruto).trim(),
      senha: senhaHasheada,
      turma: credenciais.turmaFinal,
      ano: Math.min(credenciais.anoFinal, 4),
      role_cargo: credenciais.roleFinal,
      ativo: credenciais.roleFinal !== UserRole.ALUNO || credenciais.anoFinal < 4,
      ano_progressao_processado: new Date().getFullYear(),
    };
  }
}