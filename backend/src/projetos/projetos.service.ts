import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm'; // Corrigido imports
import { Projeto } from './entities/projeto.entity';
import { CreateProjetoDto } from './dto/create-projeto.dto';
import { UpdateProjetoDto } from './dto/update-projeto.dto';

@Injectable()
export class ProjetosService {


  constructor(
    @InjectRepository(Projeto)
    private readonly projetoRepository: Repository<Projeto>,
    @InjectRepository(ProjetoAluno)
    private readonly projetoAlunoRepository: Repository<ProjetoAluno>,
    @InjectRepository(ProjetoOrientador)
    private readonly projetoOrientadorRepository: Repository<ProjetoOrientador>,
    @InjectRepository(TemaEvento)
    private readonly temaEventoRepository: Repository<TemaEvento>,
    private readonly dataSource: DataSource,
  ) { }

  /**
   * Método para o aluno criar um projeto com validações de participação
   */
  async create(dto: CreateProjetoDto, userId: number): Promise<Projeto> {
    // 1. Validação de Quantidade (3 a 6 integrantes)
    const totalAlunos = (dto.alunosIds?.length || 0);
    if (totalAlunos < 3 || totalAlunos > 6) {
      throw new BadRequestException(`O grupo deve ter entre 3 e 6 integrantes (enviado: ${totalAlunos}).`);
    }

    // 2. Validação: O autor já está em algum projeto NESTE evento?
    const autorOcupado = await this.projetoAlunoRepository.findOne({
      where: {
        aluno: { id: userId },
        projeto: { evento: { id: dto.evento } }
      }
    });

    if (autorOcupado) {
      throw new BadRequestException('Você já está participando de um projeto neste evento.');
    }

    // 3. Validação: Algum dos convidados já está em outro projeto neste evento?
    if (dto.alunosIds && dto.alunosIds.length > 0) {
      const convidadosOcupados = await this.projetoAlunoRepository.find({
        where: {
          aluno: In(dto.alunosIds),
          projeto: { evento: { id: dto.evento } }
        },
        relations: ['aluno']
      });

      if (convidadosOcupados.length > 0) {
        const nomes = convidadosOcupados.map(p => p.aluno.nome).join(', ');
        throw new BadRequestException(`Os seguintes alunos já estão em outros projetos: ${nomes}`);
      }
    }

    // 4. Início da Transação
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 5. Criação da Entidade Projeto
      const novoProjeto = queryRunner.manager.create(Projeto, {
        ...dto,
        evento: { id: dto.evento } as any,
        alunoAutor: { id: userId } as any,
      });
      const projetoSalvo = await queryRunner.manager.save(novoProjeto);

      // 6. Preparação dos vínculos (Autor + Convidados)
      const todosOsParticipantes = [...new Set([...(dto.alunosIds || []), userId])];

      const vinculos = todosOsParticipantes.map((alunoId) =>
        queryRunner.manager.create(ProjetoAluno, {
          projeto: { id: projetoSalvo.id },
          aluno: { id: alunoId },
        })
      );

      // 7. Salvando vínculos na tabela projeto_alunos
      await queryRunner.manager.save(vinculos);

      // 8. Finalizando transação
      await queryRunner.commitTransaction();

      // Retorna o projeto completo usando o findOne já existente
      return this.findOne(projetoSalvo.id);

    } catch (err) {
      // Em caso de erro, desfaz tudo que foi feito no banco
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      // Libera o query runner
      await queryRunner.release();
    }
  }


  /**
   * Busca projetos vinculados ao aluno logado (onde ele é o autor).
   */
  async findAllAlunos(userId: number): Promise<Projeto[]> {
    return await this.projetoRepository.find({
      where: { alunoAutor: { id: userId } },
      relations: {
        evento: true,
        alunoAutor: true,
        projetoAlunos: { aluno: true },
      },
      select: this.getProjetoSelectFields(),
    });
  }

  /**
   * Busca projetos onde o professor logado é o orientador (status 'aceito').
   */
  async findAllOrientador(userId: number): Promise<Projeto[]> {
    // Aqui buscamos na tabela projeto_orientador os projetos vinculados ao professor
    const projetosOrientados = await this.projetoOrientadorRepository.find({
      where: {
        orientador: { id: userId },
        status: 'aceito' // Só listamos o que ele de fato orienta
      },
      relations: {
        projeto: {
          evento: true,
          alunoAutor: true,
          projetoAlunos: { aluno: true },
        }
      }
    });

    // Mapeamos para retornar apenas o objeto do Projeto
    return projetosOrientados.map(solicitacao => solicitacao.projeto);
  }

  /**
   * Busca todos os eventos e seus respectivos projetos (Visão Geral da Coordenação).
   */
  async findAllCoordenador(): Promise<any[]> {
    // Injetar o eventoRepository para buscar a partir do evento
    // Isso já agrupa naturalmente os projetos dentro de cada evento no JSON
    return await this.dataSource.getRepository(Evento).find({
      relations: {
        projetos: {
          alunoAutor: true,
          projetoAlunos: { aluno: true }
        }
      },
      order: { id: 'DESC' }
    });
  }

  /**
   * Método privado para reutilizar a configuração de select e evitar repetição.
   */
  private getProjetoSelectFields() {
    return {
      id: true,
      titulo: true,
      descricao: true,
      temaId: true,
      alunoAutor: {
        id: true,
        nome: true,
        role_cargo: true,
      },
      projetoAlunos: {
        id: true,
        aluno: {
          id: true,
          nome: true,
        },
      },
    };
  }


  async findOne(id: number): Promise<Projeto> {
    const projeto = await this.projetoRepository.findOne({
      where: { id },
      relations: {
        evento: true,
        alunoAutor: true,
        projetoAlunos: {
          aluno: true,
        },
      },
      select: {
        id: true,
        titulo: true,
        descricao: true,
        temaId: true,
        alunoAutor: {
          id: true,
          nome: true,
        },
        projetoAlunos: {
          id: true,
          aluno: {
            id: true,
            nome: true,
          },
        },
      },
    });

    if (!projeto) {
      throw new NotFoundException(`Projeto #${id} não encontrado`);
    }
    return projeto;
  }


  /**
   * - Apenas dono ou coordenador editam.
   */
  async update(id: number, dto: UpdateProjetoDto, userId: number, role: string): Promise<Projeto> {
    const projeto = await this.findOne(id);

    // 1. Verificação de permissão básica (Dono ou Coordenador)
    if (role !== 'coordenador' && projeto.alunoAutor.id !== userId) {
      throw new ForbiddenException('Sem permissão para editar este projeto.');
    }

    // 2. Regra de Negócio: Apenas coordenador mexe nos alunos
    if (dto.alunosIds && role !== 'coordenador') {
      throw new ForbiddenException('Apenas coordenadores podem alterar os alunos de um projeto.');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 3. Atualiza os dados básicos do Projeto
      const dadosAtualizados = {
        ...dto,
        ...(dto.evento && { evento: { id: dto.evento } as any }),
        alunoAutor: { id: projeto.alunoAutor.id } as any,
      };

      this.projetoRepository.merge(projeto, dadosAtualizados);
      await queryRunner.manager.save(projeto);

      // 4. Se for coordenador e enviou novos alunos, atualiza a tabela de junção
      if (dto.alunosIds && role === 'coordenador') {
        // Remove todos os vínculos antigos
        await queryRunner.manager.delete(ProjetoAluno, { projeto: { id: projeto.id } });

        // Adiciona o autor + novos alunos (evitando duplicatas)
        const todosOsParticipantes = [...new Set([...dto.alunosIds, projeto.alunoAutor.id])];

        const novosVinculos = todosOsParticipantes.map((alunoId) =>
          queryRunner.manager.create(ProjetoAluno, {
            projeto: { id: projeto.id },
            aluno: { id: alunoId },
          })
        );

        await queryRunner.manager.save(novosVinculos);
      }

      await queryRunner.commitTransaction();
      return this.findOne(id);

    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }


  /**
   * - Apenas dono ou coordenador removem.
   */
  async remove(id: number, userId: number, role: string): Promise<void> {
    const projeto = await this.findOne(id);

    if (role !== 'coordenador' && projeto.alunoAutor.id !== userId) {
      throw new ForbiddenException('Sem permissão para remover este projeto.');
    }

    await this.projetoRepository.remove(projeto);
  }
}
