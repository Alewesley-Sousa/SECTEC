import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { parse } from 'csv-parse/sync';
import { User, UserTurma, UserRole } from './entities/user.entity';
import { Evento, EventoStatus } from 'src/evento/entities/evento.entity';
import { ComissaoEvento } from 'src/evento/entities/comissao-evento.entity';
import { HashingProvider } from '../common/providers/hashing.provider';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  private readonly mapaTurmas: Record<string, UserTurma> = {
    INFO: UserTurma.INFORMATICA,
    CONT: UserTurma.CONTABILIDADE,
    ENF: UserTurma.ENFERMAGEM,
  };

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Evento)
    private eventoRepository: Repository<Evento>,
    @InjectRepository(ComissaoEvento)
    private comissaoRepository: Repository<ComissaoEvento>,
    private hashingProvider: HashingProvider,
  ) { }

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

    async findAllAvaliadores() {
    return this.usersRepository.find({
      where: { role_cargo: UserRole.AVALIADOR, ativo: true },
      select: ['id', 'nome', 'email_institucional'],
      relations: ['temasSelecionados'],
    });
  }

  // ==================== MÉTODOS PRIVADOS AUXILIARES ====================


  
  /**
   * Centraliza a definição de senha, turma e ano conforme o perfil do usuário.
   */
  public resolverCredenciais(dto: {
    email: string;
    role: UserRole;
    senha?: string;
    turma?: string;
    ano?: string | number;
  }): {
    senhaFinal: string;
    turmaFinal: UserTurma | null;
    anoFinal: number;
    roleFinal: UserRole;
  } {
    const email = dto.email.trim();
    const role = dto.role;
    let senhaFinal: string;
    let turmaFinal: UserTurma | null = null;
    let anoFinal = 0;

    if (role === UserRole.ALUNO) {
      senhaFinal = dto.senha && dto.senha.trim() ? dto.senha.trim() : email;
      anoFinal = dto.ano ? Number(dto.ano) : 1;
      const chave = (dto.turma || '').toUpperCase();
      turmaFinal = this.mapaTurmas[chave] || UserTurma.INFORMATICA;
    } else {
      senhaFinal = dto.senha && dto.senha.trim() ? dto.senha.trim() : email;
      turmaFinal = null;
      anoFinal = 0;
    }

    return {
      senhaFinal,
      turmaFinal,
      anoFinal,
      roleFinal: role,
    };
  }

  /**
   * Busca o evento com status ATIVO que ocorre no ano corrente.
   */
  private async buscarEventoAtivoDoAno(): Promise<Evento | null> {
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const inicio = new Date(anoAtual, 0, 1);
    const fim = new Date(anoAtual, 11, 31, 23, 59, 59);

    return this.eventoRepository.findOne({
      where: {
        prazoInicial: Between(inicio, fim),
        status: EventoStatus.ATIVO,
      },
    });
  }

  // ==================== MÉTODOS PÚBLICOS PRINCIPAIS ====================

  /**
   * Promove um aluno a membro da COMISSÃO e o vincula ao evento ativo do ano.
   */
  async promoteToComissao(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`Usuário com ID ${id} não encontrado.`);

    if (user.role_cargo !== UserRole.ALUNO) {
      throw new BadRequestException(
        'Apenas usuários com cargo de ALUNO podem ser promovidos.',
      );
    }

    const eventoAtual = await this.buscarEventoAtivoDoAno();
    if (!eventoAtual) {
      throw new BadRequestException(
        `Não é possível promover o aluno pois não há evento ATIVO no ano de ${new Date().getFullYear()}.`,
      );
    }

    user.role_cargo = UserRole.COMISSAO;
    const usuarioAtualizado = await this.usersRepository.save(user);

    const jaEstaNaComissao = await this.comissaoRepository.exists({
      where: { evento: { id: eventoAtual.id }, user: { id: usuarioAtualizado.id } },
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

  /**
   * Remove um usuário da COMISSÃO (volta a ALUNO) e desfaz o vínculo com o evento ativo.
   */
  async demoteFromComissao(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`Usuário com ID ${id} não encontrado.`);

    if (user.role_cargo !== UserRole.COMISSAO) {
      throw new BadRequestException('Este usuário não faz parte da COMISSÃO.');
    }

    const eventoAtual = await this.buscarEventoAtivoDoAno();

    if (eventoAtual) {
      await this.comissaoRepository.delete({
        evento: { id: eventoAtual.id },
        user: { id: user.id },
      });
    }

    user.role_cargo = UserRole.ALUNO;
    return this.usersRepository.save(user);
  }

  /**
   * Cria um único usuário manualmente (sem CSV).
   */
  async createIndividual(dto: CreateUserDto) {
    const email = dto.email_institucional.trim();
    const emailExiste = await this.usersRepository.exists({
      where: { email_institucional: email },
    });
    if (emailExiste) {
      throw new BadRequestException(`O e-mail ${email} já está cadastrado.`);
    }

    const credenciais = this.resolverCredenciais({
      email,
      role: dto.role_cargo,
      senha: dto.senha,
      turma: dto.turma,
      ano: dto.ano,
    });

    const senhaHasheada = await this.hashingProvider.hash(credenciais.senhaFinal);

    const novoUsuario = this.usersRepository.create({
      nome: dto.nome.trim(),
      email_institucional: email,
      senha: senhaHasheada,
      role_cargo: credenciais.roleFinal,
      turma: credenciais.turmaFinal,
      ano: Math.min(credenciais.anoFinal, 4),
      ativo: credenciais.roleFinal !== UserRole.ALUNO || credenciais.anoFinal < 4,
      ano_progressao_processado: new Date().getFullYear(),
    });

    try {
      const salvo = await this.usersRepository.save(novoUsuario);
      const { senha: _, ...usuarioSemSenha } = salvo;
      return usuarioSemSenha;
    } catch (error: unknown) {
      const err = error as any;
      this.logger.error('Erro ao salvar usuário individual', err.stack);
      throw new InternalServerErrorException(
        'Erro ao salvar usuário individual.',
      );
    }
  }

  /**
   * Desativa um usuário (soft delete), definindo ativo = false.
   */
  async deactivateUser(id: number) {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado.`);
    }

    user.ativo = false;
    await this.usersRepository.save(user);

    return {
      message: 'Usuário desativado com sucesso.',
      id: user.id,
    };
  }
}