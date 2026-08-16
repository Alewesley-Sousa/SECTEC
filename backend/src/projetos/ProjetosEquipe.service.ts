import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { AuditoriaService } from 'src/auditoria/auditoria.service';
import { User, UserRole } from 'src/users/entities/user.entity';
import { Projeto } from './entities/projeto.entity';
import { ProjetoAluno } from './entities/projeto-aluno.entity';

@Injectable()
export class ProjetosEquipeService {
  constructor(
    @InjectRepository(Projeto)
    private readonly projetoRepository: Repository<Projeto>,

    @InjectRepository(ProjetoAluno)
    private readonly projetoAlunoRepository: Repository<ProjetoAluno>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly dataSource: DataSource,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  // --------------------------------------------------
  // MÉTODOS PÚBLICOS (utilizados pelo ProjetosService)
  // --------------------------------------------------

  /**
   * Adiciona integrantes a um projeto já existente.
   * Valida permissão, alunos ativos, tamanho do grupo e disponibilidade.
   */
  async addIntegrantes(
    projetoId: number,
    alunosIds: number[],
    userId: number,
    role: string,
  ): Promise<Projeto> {
    const projeto = await this.findProjetoParaEquipe(projetoId);
    this.validarPermissaoEdicaoProjeto(projeto, userId, role);

    const idsNovos = [...new Set(alunosIds.filter((id) => Number.isFinite(id)))]
      .filter((id) => id !== projeto.alunoAutor.id);

    if (idsNovos.length === 0) {
      throw new BadRequestException('Informe pelo menos um aluno integrante válido.');
    }

    await this.ensureUsersAreActiveStudents(idsNovos);

    const atuaisIds = this.getIntegrantesIds(projeto);
    const proximosIds = [...new Set([...atuaisIds, ...idsNovos])];

    this.validateGroupSize(proximosIds);
    await this.ensureAlunosAreAvailable(
      projeto.evento.id,
      [...proximosIds, projeto.alunoAutor.id],
      projeto.id,
    );

    const idsParaInserir = idsNovos.filter((id) => !atuaisIds.includes(id));

    if (idsParaInserir.length === 0) {
      throw new BadRequestException(
        'Todos os alunos informados já fazem parte deste projeto.',
      );
    }

    const vinculos = idsParaInserir.map((alunoId) =>
      this.projetoAlunoRepository.create({
        projeto: { id: projeto.id },
        aluno: { id: alunoId },
      }),
    );

    await this.projetoAlunoRepository.save(vinculos);

    await this.auditoriaService.registrar(
      userId,
      'PROJETO_INTEGRANTES_ADICIONADOS',
      `Integrantes [${idsParaInserir.join(', ')}] adicionados ao projeto #${projetoId} por usuário com cargo "${role}".`,
      projetoId,
    );

    return projeto; // O ProjetosService pode fazer um findOne completo se necessário
  }

  /**
   * Remove um integrante da equipe do projeto.
   * Não permite remover o autor.
   */
  async removeIntegrante(
    projetoId: number,
    alunoId: number,
    userId: number,
    role: string,
  ): Promise<Projeto> {
    const projeto = await this.findProjetoParaEquipe(projetoId);
    this.validarPermissaoEdicaoProjeto(projeto, userId, role);

    if (alunoId === projeto.alunoAutor.id) {
      throw new BadRequestException(
        'O aluno autor do projeto não pode ser removido como integrante.',
      );
    }

    const atuaisIds = this.getIntegrantesIds(projeto);

    if (!atuaisIds.includes(alunoId)) {
      throw new NotFoundException(
        'Este aluno não está cadastrado como integrante deste projeto.',
      );
    }

    const proximosIds = atuaisIds.filter((id) => id !== alunoId);
    this.validateGroupSize(proximosIds);

    await this.projetoAlunoRepository.delete({
      projeto: { id: projeto.id },
      aluno: { id: alunoId },
    });

    await this.auditoriaService.registrar(
      userId,
      'PROJETO_INTEGRANTE_REMOVIDO',
      `Integrante #${alunoId} removido do projeto #${projetoId} por usuário com cargo "${role}".`,
      projetoId,
    );

    return projeto;
  }

  /**
   * Transfere a autoria do projeto para um integrante da equipe.
   * Apenas coordenadores podem executar esta ação.
   */
  async transferirAutoria(
    projetoId: number,
    novoAutorId: number,
    manterAutorAtual: boolean,
    userId: number,
  ): Promise<Projeto> {
    const projeto = await this.findProjetoParaEquipe(projetoId);
    const autorAtualId = projeto.alunoAutor.id;

    if (novoAutorId === autorAtualId) {
      throw new BadRequestException(
        'O novo autor não pode ser o mesmo que o autor atual.',
      );
    }

    const integrantesIds = this.getIntegrantesIds(projeto);
    if (!integrantesIds.includes(novoAutorId)) {
      throw new BadRequestException(
        `O aluno #${novoAutorId} não é integrante deste projeto.`,
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Altera o autor
      await queryRunner.manager.update(Projeto, projetoId, {
        alunoAutor: { id: novoAutorId } as User,
      });

      if (manterAutorAtual) {
        // Adiciona o autor antigo como integrante, se ainda não estiver
        const jaEhIntegrante = await queryRunner.manager.findOne(ProjetoAluno, {
          where: { projeto: { id: projetoId }, aluno: { id: autorAtualId } },
        });
        if (!jaEhIntegrante) {
          const novoVinculo = queryRunner.manager.create(ProjetoAluno, {
            projeto: { id: projetoId } as Projeto,
            aluno: { id: autorAtualId } as User,
          });
          await queryRunner.manager.save(ProjetoAluno, novoVinculo);
        }
      } else {
        // Remove o autor antigo da equipe
        await queryRunner.manager.delete(ProjetoAluno, {
          projeto: { id: projetoId },
          aluno: { id: autorAtualId },
        });
      }

      // 2. Remove o novo autor da tabela de integrantes
      await queryRunner.manager.delete(ProjetoAluno, {
        projeto: { id: projetoId },
        aluno: { id: novoAutorId },
      });

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    const acao = manterAutorAtual
      ? `Autoria transferida do aluno #${autorAtualId} para #${novoAutorId}. Autor anterior mantido como integrante.`
      : `Autoria transferida do aluno #${autorAtualId} para #${novoAutorId}. Autor anterior removido da equipe.`;

    await this.auditoriaService.registrar(
      userId,
      'PROJETO_AUTORIA_TRANSFERIDA',
      acao,
      projetoId,
    );

    return projeto;
  }

  // --------------------------------------------------
  // MÉTODOS DE VALIDAÇÃO (agora centralizados)
  // --------------------------------------------------

  /**
   * Valida se o tamanho do grupo está entre 3 e 7 (autor + integrantes).
   */
  public validateGroupSize(alunosIds: number[] = []): void {
    const total = alunosIds.length + 1; // +1 para o autor
    if (total < 3 || total > 7) {
      throw new BadRequestException('O grupo deve ter entre 3 e 7 integrantes.');
    }
  }

  /**
   * Verifica se os alunos estão disponíveis (não vinculados a outro projeto no mesmo evento).
   */
  public async ensureAlunosAreAvailable(
    eventoId: number,
    todosIds: number[],
    projetoIdIgnorado?: number,
  ): Promise<void> {
    const idsUnicos = [...new Set(todosIds.filter((id) => Number.isFinite(id)))];
    if (idsUnicos.length === 0) return;

    const placeholders = idsUnicos.map(() => '?').join(', ');
    const filtroProjetoAutor = projetoIdIgnorado ? 'AND p.id != ?' : '';
    const filtroProjetoIntegrante = projetoIdIgnorado ? 'AND p.id != ?' : '';
    const params = projetoIdIgnorado
      ? [eventoId, ...idsUnicos, projetoIdIgnorado, eventoId, ...idsUnicos, projetoIdIgnorado]
      : [eventoId, ...idsUnicos, eventoId, ...idsUnicos];

    const ocupados = await this.dataSource.query(
      `
        SELECT DISTINCT u.nome
        FROM (
          SELECT p.aluno_autor_id AS aluno_id
          FROM projetos p
          WHERE p.evento_id = ?
            AND p.aluno_autor_id IN (${placeholders})
            ${filtroProjetoAutor}
          UNION
          SELECT pa.aluno_id AS aluno_id
          FROM projeto_alunos pa
          INNER JOIN projetos p ON p.id = pa.projeto_id
          WHERE p.evento_id = ?
            AND pa.aluno_id IN (${placeholders})
            ${filtroProjetoIntegrante}
        ) ocupados
        INNER JOIN usuarios u ON u.id = ocupados.aluno_id
      `,
      params,
    );

    if (ocupados.length > 0) {
      const nomes = ocupados.map((p: { nome: string }) => p.nome).join(', ');
      throw new BadRequestException(`Alunos já vinculados a este evento: ${nomes}`);
    }
  }

  /**
   * Garante que os IDs fornecidos pertencem a alunos ativos.
   */
  public async ensureUsersAreActiveStudents(alunosIds: number[]): Promise<void> {
    const idsUnicos = [...new Set(alunosIds.filter((id) => Number.isFinite(id)))];
    if (idsUnicos.length === 0) return;

    const alunos = await this.userRepository.find({
      where: { id: In(idsUnicos), role_cargo: UserRole.ALUNO, ativo: true },
      select: ['id'],
    });
    const encontrados = new Set(alunos.map((u) => u.id));
    const invalidos = idsUnicos.filter((id) => !encontrados.has(id));
    if (invalidos.length > 0) {
      throw new BadRequestException(`Alunos inválidos ou inativos: ${invalidos.join(', ')}`);
    }
  }

  // --------------------------------------------------
  // MÉTODOS AUXILIARES PRIVADOS
  // --------------------------------------------------

  private getIntegrantesIds(projeto: Projeto): number[] {
    return (projeto.projetoAlunos ?? [])
      .map((vinculo) => vinculo.aluno?.id)
      .filter((id): id is number => Number.isFinite(id));
  }

  private validarPermissaoEdicaoProjeto(
    projeto: Projeto,
    userId: number,
    role: string,
  ): void {
    if (role !== UserRole.COORDENACAO && projeto.alunoAutor.id !== userId) {
      throw new ForbiddenException('Sem permissão para editar este projeto.');
    }
  }

  /**
   * Busca o projeto com as relações mínimas necessárias para manipulação da equipe.
   */
  private async findProjetoParaEquipe(id: number): Promise<Projeto> {
    const projeto = await this.projetoRepository.findOne({
      where: { id },
      relations: {
        alunoAutor: true,
        projetoAlunos: { aluno: true },
        evento: true,
      },
    });

    if (!projeto) {
      throw new NotFoundException(`Projeto #${id} não encontrado.`);
    }
    return projeto;
  }
}