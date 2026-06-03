import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { User, UserTurma, UserRole } from './entities/user.entity';
import { Evento, EventoStatus } from 'src/evento/entities/evento.entity';
import { ComissaoEvento } from 'src/evento/entities/comissao-evento.entity';
import { HashingProvider } from '../common/providers/hashing.provider';
import { parse } from 'csv-parse/sync';
import { CreateUserDto } from './dto/create-user.dto';

interface ICsvRow {
  nome: string;
  email: string;
  senha?: string;
  turma?: string;
  ano?: string;
  [key: string]: any;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,

    @InjectRepository(Evento)
    private eventoRepository: Repository<Evento>,

    @InjectRepository(ComissaoEvento)
    private comissaoRepository: Repository<ComissaoEvento>,

    private hashingProvider: HashingProvider,
  ) { }

  async onApplicationBootstrap() {
    await this.executarSmartCheckAnoAlunos('startup');
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    timeZone: 'America/Fortaleza',
  })
  async executarSmartCheckAnoAlunosDiario() {
    await this.executarSmartCheckAnoAlunos('cron');
  }

  async executarSmartCheckAnoAlunos(origem = 'manual') {
    const anoAtual = new Date().getFullYear();
    const alunos = await this.usersRepository.find({
      where: { role_cargo: UserRole.ALUNO },
      select: ['id', 'ano', 'ativo', 'criado_em', 'ano_progressao_processado'],
    });
    const alunosParaSalvar: User[] = [];
    let incrementados = 0;
    let desativados = 0;

    for (const aluno of alunos) {
      const anoProcessado = aluno.ano_progressao_processado ?? aluno.criado_em?.getFullYear() ?? anoAtual;
      let mudou = false;

      if (aluno.ativo && anoAtual > anoProcessado) {
        const anosPassados = anoAtual - anoProcessado;
        aluno.ano = Math.min(aluno.ano + anosPassados, 4);
        aluno.ano_progressao_processado = anoAtual;
        incrementados += 1;
        mudou = true;
      } else if (aluno.ano_progressao_processado === null) {
        aluno.ano_progressao_processado = anoAtual;
        mudou = true;
      }

      if (aluno.ativo && aluno.ano >= 4) {
        aluno.ativo = false;
        aluno.ano = 4;
        aluno.ano_progressao_processado = anoAtual;
        desativados += 1;
        mudou = true;
      }

      if (mudou) alunosParaSalvar.push(aluno);
    }

    if (alunosParaSalvar.length > 0) {
      await this.usersRepository.save(alunosParaSalvar);
    }

    this.logger.log(
      `Smart check de anos (${origem}): ${incrementados} aluno(s) progredido(s), ${desativados} aluno(s) desativado(s).`,
    );

    return {
      anoAtual,
      incrementados,
      desativados,
      atualizados: alunosParaSalvar.length,
    };
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.senha')
      .where('user.email_institucional = :email', { email })
      .andWhere('user.ativo = :ativo', { ativo: true })
      .getOne();
  }

  async findAllAlunos() {
    return this.usersRepository.find({
      where: { role_cargo: UserRole.ALUNO, ativo: true },
      select: ['id', 'nome', 'email_institucional', 'turma', 'ano'],
    });
  }

  async findAllComissao() {
    return this.usersRepository.find({
      where: { role_cargo: UserRole.COMISSAO, ativo: true },
      select: ['id', 'nome', 'email_institucional', 'turma', 'ano'],
    });
  }

  async findAllOrientadores() {
    return this.usersRepository.find({
      where: { role_cargo: UserRole.ORIENTADOR, ativo: true },
      select: ['id', 'nome', 'email_institucional'],
      relations: ['temasSelecionados'],
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

    // 1. Coleta e normaliza todos os e-mails vindos do arquivo CSV
    const emailsNoCsv = registros
      .map((reg) => {
        const emailBruto = reg.email || reg['email gsuite'] || reg['email_gsuite'] || reg['e-mail'];
        return emailBruto ? String(emailBruto).trim().toLowerCase() : null;
      })
      .filter(Boolean) as string[];

    // 2. Busca no banco quais desses e-mails já estão cadastrados
    const usuariosExistentes = await this.usersRepository.find({
      where: { email_institucional: In(emailsNoCsv) },
      select: ['email_institucional'],
    });

    // Criamos um Set para uma busca instantânea de alta performance O(1)
    const emailsExistentesSet = new Set(
      usuariosExistentes.map((u) => u.email_institucional.toLowerCase()),
    );

    // 3. Filtra os registros removendo quem já existe no banco
    const registrosFiltrados = registros.filter((reg) => {
      const emailBruto = reg.email || reg['email gsuite'] || reg['email_gsuite'] || reg['e-mail'];
      if (!emailBruto) return false;
      return !emailsExistentesSet.has(String(emailBruto).trim().toLowerCase());
    });

    const totalIgnorados = registros.length - registrosFiltrados.length;

    // Se após filtrar, todos os e-mails já existirem, encerra sem dar erro
    if (registrosFiltrados.length === 0) {
      return {
        filename: file.originalname,
        totalCadastrados: 0,
        totalIgnorados: totalIgnorados,
        tipo: tipo,
        mensagem: 'Todos os e-mails do CSV já constavam no sistema.',
      };
    }

    const mapaTurmas: Record<string, UserTurma> = {
      INFO: UserTurma.INFORMATICA,
      CONT: UserTurma.CONTABILIDADE,
      ENF: UserTurma.ENFERMAGEM,
    };

    // 4. Mapeia e gera o hash de senha APENAS para os novos registros filtrados
    const dadosFormatados = await Promise.all(
      registrosFiltrados.map(async (reg, index) => {
        const emailBruto = reg.email || reg['email gsuite'] || reg['email_gsuite'] || reg['e-mail'];
        const nomeBruto = reg.nome;

        if (!nomeBruto || !emailBruto) {
          throw new BadRequestException(
            `Erro na linha ${index + 2}: Colunas Nome e Email são obrigatórias (Verificado: ${nomeBruto}, ${emailBruto}).`,
          );
        }

        const primeiroNome = String(nomeBruto).trim();
        const primeiroEmail = String(emailBruto).trim();
        const primeiraTurma = (reg.turma || '').trim();
        const primeiroAnoStr = (reg.ano || '').trim();

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
          const primeiraSenha = reg.senha || '';
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
          ano: Math.min(anoFinal, 4),
          role_cargo: roleFinal,
          ativo: roleFinal !== UserRole.ALUNO || anoFinal < 4,
          ano_progressao_processado: new Date().getFullYear(),
        };
      }),
    );

    try {
      // 5. Salva apenas os novos usuários
      await this.usersRepository.save(dadosFormatados);
      
      return {
        filename: file.originalname,
        totalCadastrados: dadosFormatados.length,
        totalIgnorados: totalIgnorados,
        tipo: tipo,
      };
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        throw new BadRequestException(
          'O arquivo enviado possui linhas com e-mails repetidos entre si.',
        );
      }
      throw new InternalServerErrorException('Erro ao salvar novos usuários no banco de dados.');
    }
  }


  async promoteToComissao(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado.`);
    }

    if (user.role_cargo !== UserRole.ALUNO) {
      throw new BadRequestException(
        'Apenas usuários com cargo de ALUNO podem ser movidos para a COMISSÃO.',
      );
    }

    const anoAtual = new Date().getFullYear();
    const inicioAno = `${anoAtual}-01-01`;
    const fimAno = `${anoAtual}-12-31`;

    const eventoAtual = await this.eventoRepository.findOne({
      where: {
        prazoInicial: Between(inicioAno as any, fimAno as any),
        status: EventoStatus.ATIVO,
      },
    });

    if (!eventoAtual) {
      throw new BadRequestException(
        `Não é possível promover o aluno pois não há nenhum evento ATIVO cadastrado para o ano de ${anoAtual}.`,
      );
    }

    user.role_cargo = UserRole.COMISSAO;
    const usuarioAtualizado = await this.usersRepository.save(user);

    const jaEstaNaComissao = await this.comissaoRepository.exists({
      where: {
        evento: { id: eventoAtual.id },
        user: { id: usuarioAtualizado.id },
      },
    });

    if (!jaEstaNaComissao) {
      const historico = this.comissaoRepository.create({
        evento: eventoAtual,
        user: usuarioAtualizado,
      });
      await this.comissaoRepository.save(historico);
    }
    return usuarioAtualizado;
  }

  async createIndividual(dto: CreateUserDto) {
    const { nome, email_institucional, role_cargo, senha, turma, ano } = dto;

    const emailExiste = await this.usersRepository.exists({
      where: { email_institucional: email_institucional.trim() }
    });

    if (emailExiste) {
      throw new BadRequestException(`O e-mail ${email_institucional} já está cadastrado.`);
    }

    let senhaFinal: string;
    let turmaFinal: UserTurma | null = null;
    let anoFinal: number = 0;

    if (role_cargo === UserRole.ALUNO) {
      senhaFinal = email_institucional.trim();
      anoFinal = ano ? Number(ano) : 1;
      turmaFinal = turma || UserTurma.INFORMATICA;
    } else {
      senhaFinal = senha || email_institucional.trim();
      turmaFinal = null;
      anoFinal = 0;
    }

    const senhaHasheada = await this.hashingProvider.hash(senhaFinal);

    const novoUsuario = this.usersRepository.create({
      nome: nome.trim(),
      email_institucional: email_institucional.trim(),
      senha: senhaHasheada,
      role_cargo,
      turma: turmaFinal,
      ano: Math.min(anoFinal, 4),
      ativo: role_cargo !== UserRole.ALUNO || anoFinal < 4,
      ano_progressao_processado: new Date().getFullYear(),
    });

    try {
      const salvo = await this.usersRepository.save(novoUsuario);
      
      // 🚀 Tratamento seguro do TypeScript para omitir a senha do retorno HTTP
      const { senha: _, ...usuarioSemSenha } = salvo;
      
      return usuarioSemSenha;
    } catch (error) {
      throw new InternalServerErrorException('Erro ao salvar o usuário individual no banco de dados.');
    }
  }

  async removeUser(id: number) {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado.`);
    }

    user.ativo = false;
    await this.usersRepository.save(user);

    return {
      message: 'Usuário excluído com sucesso.',
      id: user.id,
    };
  }
  
  
  
  
  
    async demoteFromComissao(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado.`);
    }

    // Regra de negócio: Só pode ser rebaixado quem for da COMISSÃO atualmente
    if (user.role_cargo !== UserRole.COMISSAO) {
      throw new BadRequestException(
        'Este usuário não faz parte do cargo de COMISSÃO.',
      );
    }

    // 1. Identifica o evento ativo do ano corrente (2026)
    const anoAtual = new Date().getFullYear();
    const inicioAno = `${anoAtual}-01-01`;
    const fimAno = `${anoAtual}-12-31`;

    const eventoAtual = await this.eventoRepository.findOne({
      where: {
        prazoInicial: Between(inicioAno as any, fimAno as any),
        status: EventoStatus.ATIVO,
      },
    });

    // 2. Remove o vínculo histórico se houver um evento ativo associado
    if (eventoAtual) {
      await this.comissaoRepository.delete({
        evento: { id: eventoAtual.id },
        user: { id: user.id },
      });
    }

    // 3. Atualiza o cargo de volta para ALUNO
    user.role_cargo = UserRole.ALUNO;
    return this.usersRepository.save(user);
  }






}
