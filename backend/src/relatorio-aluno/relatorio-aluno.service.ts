import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { RelatorioAluno, StatusRelatorio } from './entities/relatorio-aluno.entity';
import { Projeto } from '../projetos/entities/projeto.entity';
import { User } from '../users/entities/user.entity';
import { AlunoRelatorioProjetos } from './entities/aluno-relatorio-projetos.entity';
import { Evento } from '../evento/entities/evento.entity';
import { CreateRelatorioAlunoDto, UpdateRelatorioAlunoDto, ListarRelatorioAlunoDto } from './dto';

@Injectable()
export class RelatorioAlunoService {
    constructor(
        @InjectRepository(RelatorioAluno)
        private relatorioAlunoRepository: Repository<RelatorioAluno>,
        @InjectRepository(Evento)
        private eventoRepository: Repository<Evento>,
        @InjectRepository(Projeto) // ← ADICIONE
        private projetoRepository: Repository<Projeto>,
        @InjectRepository(AlunoRelatorioProjetos) // ← ADICIONE
        private alunoRelatorioProjetosRepository: Repository<AlunoRelatorioProjetos>,
    ) { }

    /**
     * Lista todos os alunos da modalidade relatório no evento atual
     * com seus respectivos status, quantidade de projetos e projetos já atribuídos.
     * 
     * @param filtros - Filtros para listagem (status, nome, page, limit)
     * @returns Lista paginada de alunos com seus relatórios e projetos atribuídos
     */
    async listarAlunosRelatorio(filtros: ListarRelatorioAlunoDto) {
        const { status, nome, page = 1, limit = 10 } = filtros;
        const anoAtual = new Date().getFullYear();

        // Buscar evento ativo do ano atual
        const eventoAtual = await this.eventoRepository
            .createQueryBuilder('evento')
            .where('evento.ativo = :ativo', { ativo: true })
            .andWhere('YEAR(evento.created_at) = :ano', { ano: anoAtual })
            .getOne();

        if (!eventoAtual) {
            throw new NotFoundException(`Nenhum evento ativo encontrado para o ano ${anoAtual}.`);
        }

        // Construir a query
        const query = this.relatorioAlunoRepository
            .createQueryBuilder('relatorio')
            .leftJoinAndSelect('relatorio.aluno', 'aluno')
            .leftJoinAndSelect('relatorio.projetosAtribuidos', 'projetosAtribuidos')
            .leftJoinAndSelect('projetosAtribuidos.projeto', 'projeto')
            .where('relatorio.evento_id = :eventoId', { eventoId: eventoAtual.id });

        // Aplicar filtros
        if (status) {
            query.andWhere('relatorio.status = :status', { status });
        }

        if (nome) {
            query.andWhere('aluno.nome LIKE :nome', { nome: `%${nome}%` });
        }

        // Paginação
        const [resultados, total] = await query
            .orderBy('relatorio.created_at', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        // Mapear resultados
        const data = resultados.map((relatorio) => ({
            id: relatorio.id,
            aluno: {
                id: relatorio.aluno.id,
                nome: relatorio.aluno.nome,
                email: relatorio.aluno.email_institucional,
                turma: relatorio.aluno.turma,
            },
            status: relatorio.status,
            quantidade_projetos: relatorio.quantidade_projetos,
            projetos_atribuidos: relatorio.projetosAtribuidos?.map((pa) => ({
                id: pa.projeto.id,
                titulo: pa.projeto.titulo,
                area: pa.projeto.tema,
                visualizado: pa.visualizado,
                data_atribuicao: pa.data_atribuicao,
            })) || [],
            data_ativacao: relatorio.data_ativacao,
            data_envio: relatorio.data_envio,
            created_at: relatorio.created_at,
        }));

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }


    /**
     * Atualiza os dados de um aluno na modalidade relatório.
     * 
     * @param id - ID do registro em relatorio_aluno
     * @param updateRelatorioAlunoDto - Dados para atualização
     * @returns Registro atualizado
     */
    async atualizarRelatorioAluno(
        id: number,
        updateRelatorioAlunoDto: UpdateRelatorioAlunoDto,
    ) {
        // 1. Buscar o registro
        const relatorio = await this.relatorioAlunoRepository.findOne({
            where: { id },
            relations: ['aluno', 'evento'],
        });

        if (!relatorio) {
            throw new NotFoundException(`Registro com ID ${id} não encontrado.`);
        }

        // 2. Atualizar apenas os campos enviados
        if (updateRelatorioAlunoDto.quantidade_projetos !== undefined) {
            relatorio.quantidade_projetos = updateRelatorioAlunoDto.quantidade_projetos;
        }

        if (updateRelatorioAlunoDto.status !== undefined) {
            relatorio.status = updateRelatorioAlunoDto.status;
        }

        // 3. Salvar
        const resultado = await this.relatorioAlunoRepository.save(relatorio);

        return {
            mensagem: 'Registro atualizado com sucesso!',
            data: {
                id: resultado.id,
                aluno: {
                    id: resultado.aluno.id,
                    nome: resultado.aluno.nome,
                    email: resultado.aluno.email_institucional,
                    turma: resultado.aluno.turma,
                },
                evento: {
                    id: resultado.evento.id,
                    nome: resultado.evento.titulo,
                },
                quantidade_projetos: resultado.quantidade_projetos,
                status: resultado.status,
                data_ativacao: resultado.data_ativacao,
                data_envio: resultado.data_envio,
                created_at: resultado.created_at,
            },
        };
    }


    /**
 * Dispara a distribuição automática de projetos para todos os alunos
 * que já têm quantidade_projetos > 0 e status = 'pendente'.
 * 
 * Distribuição cruzada: prioriza projetos de turmas diferentes,
 * com baixa probabilidade permite projetos da mesma turma.
 */
    async distribuirProjetos() {
        const anoAtual = new Date().getFullYear();

        // 1. Buscar evento ativo do ano atual
        const eventoAtual = await this.eventoRepository
            .createQueryBuilder('evento')
            .where('evento.ativo = :ativo', { ativo: true })
            .andWhere('YEAR(evento.created_at) = :ano', { ano: anoAtual })
            .getOne();

        if (!eventoAtual) {
            throw new NotFoundException(`Nenhum evento ativo encontrado para o ano ${anoAtual}.`);
        }

        // 2. Buscar alunos elegíveis
        const alunosElegiveis = await this.relatorioAlunoRepository.find({
            where: {
                evento_id: eventoAtual.id,
                status: StatusRelatorio.PENDENTE,
                quantidade_projetos: Not(0),
            },
            relations: ['aluno'],
        });

        if (alunosElegiveis.length === 0) {
            return {
                mensagem: 'Nenhum aluno elegível para distribuição.',
                total_alunos: 0,
                total_projetos_atribuidos: 0,
                alunos_processados: [],
            };
        }

        // 3. Buscar projetos disponíveis (aprovados e do evento atual)
        const projetosDisponiveis = await this.projetoRepository.find({
            where: {
                evento: { id: eventoAtual.id },
                // status: 'aprovado', // se tiver status de aprovação
            },
            relations: ['alunoAutor'],
        });

        if (projetosDisponiveis.length === 0) {
            throw new BadRequestException('Nenhum projeto disponível para distribuição.');
        }

        // 4. Para cada aluno, fazer a distribuição

        const resultados: {
            aluno_id: number;
            aluno_nome: string;
            turma_aluno?: string | null;
            status: string;
            projetos_atribuidos: any[];
            total_atribuido?: number;
            mensagem?: string;
        }[] = [];

        for (const alunoRelatorio of alunosElegiveis) {
            const { aluno, quantidade_projetos, id: alunoRelatorioId } = alunoRelatorio;

            // Buscar projetos já atribuídos a este aluno
            const projetosAtribuidos = await this.alunoRelatorioProjetosRepository.find({
                where: { aluno_relatorio_id: alunoRelatorioId },
                relations: ['projeto'],
            });

            const idsProjetosAtribuidos = projetosAtribuidos.map((p) => p.projeto_id);

            // Filtrar projetos já atribuídos
            const projetosDisponiveisParaAluno = projetosDisponiveis.filter(
                (p) => !idsProjetosAtribuidos.includes(p.id),
            );

            // Se não houver projetos suficientes, atribuir o que tiver
            const quantidadeParaAtribuir = Math.min(
                quantidade_projetos - projetosAtribuidos.length,
                projetosDisponiveisParaAluno.length,
            );

            if (quantidadeParaAtribuir <= 0) {
                resultados.push({
                    aluno_id: aluno.id,
                    aluno_nome: aluno.nome,
                    status: 'ja_atribuido',
                    projetos_atribuidos: projetosAtribuidos,
                    mensagem: 'Aluno já possui todos os projetos atribuídos.',
                });
                continue;
            }

            // 5. Distribuição cruzada (priorizar turmas diferentes)
            const projetosSelecionados = this.selecionarProjetosDistribuicaoCruzada(
                projetosDisponiveisParaAluno,
                aluno,
                quantidadeParaAtribuir,
            );

            // 6. Salvar as atribuições
            const atribuicoes: {
                projeto_id: number;
                titulo: string;
                turma_autor: string | null;
            }[] = [];

            for (const projeto of projetosSelecionados) {
                const atribuicao = this.alunoRelatorioProjetosRepository.create({
                    aluno_relatorio_id: alunoRelatorioId,
                    projeto_id: projeto.id,
                    data_atribuicao: new Date(),
                    visualizado: false,
                });
                const saved = await this.alunoRelatorioProjetosRepository.save(atribuicao);
                atribuicoes.push({
                    projeto_id: projeto.id,
                    titulo: projeto.titulo,
                    turma_autor: projeto.alunoAutor.turma,
                });
            }

            // 7. Atualizar status do aluno para DISTRIBUIDO
            alunoRelatorio.status = StatusRelatorio.DISTRIBUIDO;
            await this.relatorioAlunoRepository.save(alunoRelatorio);

            resultados.push({
                aluno_id: aluno.id,
                aluno_nome: aluno.nome,
                turma_aluno: aluno.turma,
                status: 'distribuido',
                projetos_atribuidos: atribuicoes,
                total_atribuido: atribuicoes.length,
            });
        }

        return {
            mensagem: 'Distribuição concluída com sucesso!',
            total_alunos: alunosElegiveis.length,
            total_projetos_atribuidos: resultados.reduce(
                (acc, r) => acc + (r.total_atribuido || 0),
                0,
            ),
            alunos_processados: resultados,
        };
    }

    /**
     * Seleciona projetos para distribuição cruzada.
     * Prioriza projetos de turmas diferentes, mas permite baixa probabilidade
     * para projetos da mesma turma.
     * 
     * @param projetosDisponiveis - Lista de projetos disponíveis
     * @param aluno - Aluno que vai receber os projetos
     * @param quantidade - Quantidade de projetos a selecionar
     * @returns Lista de projetos selecionados
     */
    private selecionarProjetosDistribuicaoCruzada(
        projetosDisponiveis: Projeto[],
        aluno: User,
        quantidade: number,
    ): Projeto[] {
        // Separar projetos por turma
        const projetosOutrasTurmas = projetosDisponiveis.filter(
            (p) => p.alunoAutor.turma !== aluno.turma,
        );
        const projetosMesmaTurma = projetosDisponiveis.filter(
            (p) => p.alunoAutor.turma === aluno.turma,
        );

        const selecionados: Projeto[] = [];
        const totalNecessario = quantidade;

        // 1. Prioridade: projetos de outras turmas
        const shuffledOutras = this.shuffleArray(projetosOutrasTurmas);
        const pegarOutras = Math.min(shuffledOutras.length, totalNecessario);
        selecionados.push(...shuffledOutras.slice(0, pegarOutras));

        // 2. Se ainda precisar de mais projetos, pegar da mesma turma
        if (selecionados.length < totalNecessario && projetosMesmaTurma.length > 0) {
            const restante = totalNecessario - selecionados.length;

            // Probabilidade de pegar da mesma turma: 20% (ou seja, 1 em 5)
            // Para cada projeto restante, temos 20% de chance de pegar da mesma turma
            const shuffledMesma = this.shuffleArray(projetosMesmaTurma);

            for (const projeto of shuffledMesma) {
                if (selecionados.length >= totalNecessario) break;

                // 20% de chance de pegar da mesma turma
                const probabilidade = Math.random();
                if (probabilidade < 0.2) {
                    selecionados.push(projeto);
                }
            }
        }

        // 3. Se ainda faltar projetos, pegar da mesma turma (forçado)
        if (selecionados.length < totalNecessario && projetosMesmaTurma.length > 0) {
            const restante = totalNecessario - selecionados.length;
            const shuffledMesma = this.shuffleArray(projetosMesmaTurma);

            // Pega os que já não foram selecionados
            const idsSelecionados = new Set(selecionados.map((p) => p.id));
            const disponiveis = shuffledMesma.filter((p) => !idsSelecionados.has(p.id));

            const pegar = Math.min(disponiveis.length, restante);
            selecionados.push(...disponiveis.slice(0, pegar));
        }

        return selecionados;
    }

    /**
     * Embaralha um array (Fisher-Yates)
     */
    private shuffleArray<T>(array: T[]): T[] {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}