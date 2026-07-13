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
                alunos_nao_atendidos: [],
                alunos_processados: [],
            };
        }

        // 3. Buscar projetos do mesmo evento
        const projetosDisponiveis = await this.projetoRepository.find({
            where: {
                evento: { id: eventoAtual.id },
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
            total_necessario?: number;
            mensagem?: string;
        }[] = [];

        const alunosNaoAtendidos: {
            aluno_id: number;
            aluno_nome: string;
            quantidade_necessaria: number;
            quantidade_recebida: number;
            faltam: number;
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

            // Calcular quantos projetos ainda faltam
            const projetosFaltando = quantidade_projetos - projetosAtribuidos.length;
            const quantidadeParaAtribuir = Math.min(
                projetosFaltando,
                projetosDisponiveisParaAluno.length,
            );

            // Se não houver projetos para atribuir
            if (quantidadeParaAtribuir <= 0) {
                const recebeuTodos = projetosAtribuidos.length >= quantidade_projetos;

                if (!recebeuTodos) {
                    alunosNaoAtendidos.push({
                        aluno_id: aluno.id,
                        aluno_nome: aluno.nome,
                        quantidade_necessaria: quantidade_projetos,
                        quantidade_recebida: projetosAtribuidos.length,
                        faltam: quantidade_projetos - projetosAtribuidos.length,
                    });
                }

                resultados.push({
                    aluno_id: aluno.id,
                    aluno_nome: aluno.nome,
                    status: recebeuTodos ? 'ja_atribuido' : 'pendente',
                    projetos_atribuidos: projetosAtribuidos,
                    total_atribuido: projetosAtribuidos.length,
                    total_necessario: quantidade_projetos,
                    mensagem: recebeuTodos
                        ? 'Aluno já possui todos os projetos atribuídos.'
                        : `Aluno recebeu apenas ${projetosAtribuidos.length} de ${quantidade_projetos} projetos. Faltam ${quantidade_projetos - projetosAtribuidos.length} projetos.`,
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

            // 7. Verificar se o aluno recebeu todos os projetos necessários
            const totalAposAtribuicao = projetosAtribuidos.length + atribuicoes.length;
            const recebeuTodos = totalAposAtribuicao >= quantidade_projetos;

            // 8. Atualizar status do aluno
            alunoRelatorio.status = recebeuTodos
                ? StatusRelatorio.DISTRIBUIDO
                : StatusRelatorio.PENDENTE;

            await this.relatorioAlunoRepository.save(alunoRelatorio);

            // 9. Se não recebeu todos, adicionar à lista de não atendidos
            if (!recebeuTodos) {
                alunosNaoAtendidos.push({
                    aluno_id: aluno.id,
                    aluno_nome: aluno.nome,
                    quantidade_necessaria: quantidade_projetos,
                    quantidade_recebida: totalAposAtribuicao,
                    faltam: quantidade_projetos - totalAposAtribuicao,
                });
            }

            const todosProjetos = [...projetosAtribuidos, ...atribuicoes];

            resultados.push({
                aluno_id: aluno.id,
                aluno_nome: aluno.nome,
                turma_aluno: aluno.turma,
                status: recebeuTodos ? 'distribuido' : 'pendente',
                projetos_atribuidos: todosProjetos,
                total_atribuido: totalAposAtribuicao,
                total_necessario: quantidade_projetos,
                mensagem: recebeuTodos
                    ? 'Todos os projetos atribuídos com sucesso!'
                    : `Aluno recebeu apenas ${totalAposAtribuicao} de ${quantidade_projetos} projetos. Faltam ${quantidade_projetos - totalAposAtribuicao} projetos.`,
            });
        }

        // 10. Montar resposta
        const totalAtribuidos = resultados.reduce(
            (acc, r) => acc + (r.total_atribuido || 0),
            0,
        );

        if (alunosNaoAtendidos.length > 0) {
            return {
                mensagem: 'Distribuição concluída com alertas! Alguns alunos não receberam todos os projetos necessários.',
                total_alunos: alunosElegiveis.length,
                total_projetos_atribuidos: totalAtribuidos,
                alunos_nao_atendidos: alunosNaoAtendidos,
                alunos_processados: resultados,
            };
        }

        return {
            mensagem: 'Distribuição concluída com sucesso! Todos os alunos receberam a quantidade necessária de projetos.',
            total_alunos: alunosElegiveis.length,
            total_projetos_atribuidos: totalAtribuidos,
            alunos_nao_atendidos: [],
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


    /**
 * Retorna a lista de projetos atribuídos ao aluno logado
 * com informações básicas (título, área, autores, etc.).
 * 
 * @param alunoId - ID do aluno logado
 * @returns Lista de projetos atribuídos ao aluno
 */
    async meusProjetos(alunoId: number) {
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

        // 2. Buscar o relatório do aluno no evento atual
        const relatorioAluno = await this.relatorioAlunoRepository.findOne({
            where: {
                aluno_id: alunoId,
                evento_id: eventoAtual.id,
            },
            relations: ['aluno'],
        });

        if (!relatorioAluno) {
            throw new NotFoundException('Aluno não encontrado na modalidade relatório.');
        }

        // 3. Buscar os projetos atribuídos a este aluno
        const projetosAtribuidos = await this.alunoRelatorioProjetosRepository.find({
            where: { aluno_relatorio_id: relatorioAluno.id },
            relations: ['projeto', 'projeto.alunoAutor', 'projeto.projetoAlunos', 'projeto.projetoAlunos.aluno'],
        });

        // 4. Mapear resultados
        const data = projetosAtribuidos.map((pa) => ({
            id: pa.projeto.id,
            titulo: pa.projeto.titulo,
            descricao: pa.projeto.descricao,
            area: pa.projeto.tema?.nome || 'Área não definida',
            autores: [
                {
                    id: pa.projeto.alunoAutor.id,
                    nome: pa.projeto.alunoAutor.nome,
                    turma: pa.projeto.alunoAutor.turma,
                    tipo: 'autor_principal',
                },
                ...(pa.projeto.projetoAlunos?.map((paAluno) => ({
                    id: paAluno.aluno.id,
                    nome: paAluno.aluno.nome,
                    turma: paAluno.aluno.turma,
                    tipo: 'coautor',
                })) || []),
            ],
            visualizado: pa.visualizado,
            data_atribuicao: pa.data_atribuicao,
        }));

        return {
            aluno: {
                id: relatorioAluno.aluno.id,
                nome: relatorioAluno.aluno.nome,
                turma: relatorioAluno.aluno.turma,
            },
            status: relatorioAluno.status,
            quantidade_projetos: relatorioAluno.quantidade_projetos,
            total_atribuidos: data.length,
            projetos: data,
        };
    }


    // src/relatorio/relatorio-aluno.service.ts

    /**
     * Retorna o status atual do aluno na modalidade relatório.
     * 
     * @param alunoId - ID do aluno logado
     * @returns Status, quantidade de projetos e quantidade visualizada
     */
    async meuStatus(alunoId: number) {
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

        // 2. Buscar o relatório do aluno no evento atual
        const relatorioAluno = await this.relatorioAlunoRepository.findOne({
            where: {
                aluno_id: alunoId,
                evento_id: eventoAtual.id,
            },
            relations: ['aluno'],
        });

        if (!relatorioAluno) {
            throw new NotFoundException('Aluno não encontrado na modalidade relatório.');
        }

        // 3. Buscar os projetos atribuídos (para contar visualizados)
        const projetosAtribuidos = await this.alunoRelatorioProjetosRepository.find({
            where: { aluno_relatorio_id: relatorioAluno.id },
        });

        const totalVisualizados = projetosAtribuidos.filter((p) => p.visualizado).length;

        return {
            status: relatorioAluno.status,
            quantidade_projetos: relatorioAluno.quantidade_projetos,
            total_atribuidos: projetosAtribuidos.length,
            total_visualizados: totalVisualizados,
            data_ativacao: relatorioAluno.data_ativacao,
            data_envio: relatorioAluno.data_envio,
        };
    }
}