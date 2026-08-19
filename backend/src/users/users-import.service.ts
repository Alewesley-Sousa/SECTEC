import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { parse } from 'csv-parse/sync';
import { HashingProvider } from '../common/providers/hashing.provider';
import { UsersService } from './users.service';
import { OrientadorArea } from './entities/orientador-area.entity';
import { User, UserRole, UserTurma } from './entities/user.entity';

interface ICsvRow {
  nome: string;
  email: string;
  senha?: string;
  turma?: string;
  ano?: string;
  area?: string;
  areas?: string;
  [key: string]: any;
}

@Injectable()
export class UsersImportService {
  private readonly logger = new Logger(UsersImportService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(OrientadorArea)
    private orientadorAreaRepository: Repository<OrientadorArea>,
    private usersService: UsersService,
    private hashingProvider: HashingProvider,
  ) { }

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
      // 1. Salva os usuários no banco e obtém as instâncias com os IDs gerados
      const usuariosSalvos = await this.usersRepository.save(dadosFormatados);

      // 2. Itera sobre os registros para salvar as áreas caso sejam orientadores
      for (let i = 0; i < registrosFiltrados.length; i++) {
        const reg = registrosFiltrados[i];
        const usuarioSalvo = usuariosSalvos[i];

        const areasBrutas = reg.area || reg.areas;
        if (usuarioSalvo && usuarioSalvo.role_cargo === 'orientador' && areasBrutas) {
          const listaAreas = String(areasBrutas).split(',');

          for (const areaTexto of listaAreas) {
            const areaNormalizada = normalizeArea(areaTexto);
            if (areaNormalizada) {
              await this.orientadorAreaRepository.save({
                userId: usuarioSalvo.id,
                area: areaNormalizada,
              });
            }
          }
        }
      }

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

  /**
   * Recebe um CSV com as colunas TURMA, ANO, Nome e Email GSuite.
   * Para cada linha, localiza o aluno pelo e-mail e atualiza a turma (e ano, se presente).
   */
  async consertarTurmasAlunos(file: Express.Multer.File) {
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
        delimiter: [',', ';', '\t'],
        skip_records_with_error: true,
        relax_column_count: true,
      });
    } catch (e) {
      throw new BadRequestException('Erro ao formatar CSV. Verifique o cabeçalho.');
    }

    let atualizados = 0;
    let naoEncontrados = 0;
    const erros: string[] = [];

    for (const reg of registros) {
      const emailBruto =
        reg.email ||
        reg['email gsuite'] ||
        reg['email_gsuite'] ||
        reg['e-mail'];

      if (!emailBruto) {
        erros.push('Linha sem e-mail: ' + JSON.stringify(reg));
        continue;
      }

      const email = String(emailBruto).trim().toLowerCase();
      const turmaCsv = reg.turma ? String(reg.turma).trim() : undefined;
      const ano = reg.ano ? Number(reg.ano) : undefined;

      if (!turmaCsv) {
        erros.push(`E-mail ${email}: turma não informada.`);
        continue;
      }

      const turmaEnum = this.mapCsvTurma(turmaCsv);
      if (!turmaEnum) {
        erros.push(`E-mail ${email}: turma inválida (${turmaCsv}).`);
        continue;
      }

      const usuario = await this.usersRepository.findOne({
        where: { email_institucional: email },
      });

      if (!usuario) {
        naoEncontrados++;
        erros.push(`Usuário com e-mail ${email} não encontrado.`);
        continue;
      }

      usuario.turma = turmaEnum;
      if (ano && !Number.isNaN(ano)) {
        usuario.ano = ano;
      }

      try {
        await this.usersRepository.save(usuario);
        atualizados++;
      } catch (err: any) {
        erros.push(`Erro ao salvar ${email}: ${err.message}`);
      }
    }

    return {
      filename: file.originalname,
      totalProcessados: registros.length,
      totalAtualizados: atualizados,
      totalNaoEncontrados: naoEncontrados,
      erros,
    };
  }

  // ==================== MÉTODOS PRIVADOS AUXILIARES ====================

  private mapCsvTurma(turmaCsv: string): UserTurma | undefined {
    const turmaNormalizada = turmaCsv.trim().toUpperCase();
    switch (turmaNormalizada) {
      case 'INFO':
        return UserTurma.INFORMATICA;
      case 'ENF':
        return UserTurma.ENFERMAGEM;
      case 'CONT':
        return UserTurma.CONTABILIDADE;
      default:
        return undefined;
    }
  }

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

function normalizeArea(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}