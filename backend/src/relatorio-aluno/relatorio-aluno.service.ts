// relatorio-aluno.service.ts
import { Injectable, NotFoundException, BadRequestException, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, IsNull } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { RelatorioAluno, StatusRelatorio } from './entities/relatorio-aluno.entity';
import { Projeto } from '../projetos/entities/projeto.entity';
import { User } from '../users/entities/user.entity';
import { AlunoRelatorioProjetos } from './entities/aluno-relatorio-projetos.entity';
import { Evento, EventoStatus } from '../evento/entities/evento.entity'; // ← importação adicionada
import { CreateRelatorioAlunoDto, UpdateRelatorioAlunoDto, ListarRelatorioAlunoDto } from './dto';

@Injectable()
export class RelatorioAlunoService implements OnModuleInit {
    private readonly logger = new Logger(RelatorioAlunoService.name);

    constructor(
        @InjectRepository(RelatorioAluno)
        private relatorioAlunoRepository: Repository<RelatorioAluno>,
        @InjectRepository(Evento)
        private eventoRepository: Repository<Evento>,
        @InjectRepository(Projeto)
        private projetoRepository: Repository<Projeto>,
        @InjectRepository(AlunoRelatorioProjetos)
        private alunoRelatorioProjetosRepository: Repository<AlunoRelatorioProjetos>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    /**
     * Lista todos os alunos da modalidade relatório no evento atual
     * com seus respectivos status, quantidade de projetos e projetos já atribuídos.
     */
    async listarAlunosRelatorio(filtros: ListarRelatorioAlunoDto) {
        const { status, nome, page = 1, limit = 10 } = filtros;
        const anoAtual = new Date().getFullYear();

        // Buscar evento ativo do ano atual - CORRIGIDO
        const eventoAtual = await this.eventoRepository
            .createQueryBuilder('evento')
            .where('evento.status = :status', { status: EventoStatus.ATIVO })
            .andWhere('YEAR(evento.criadoEm) = :ano', { ano: anoAtual })
            .getOne();

        if (!eventoAtual) {
            throw new NotFoundException(`Nenhum evento ativo encontrado para o ano ${anoAtual}.`);
        }

        const query = this.relatorioAlunoRepository
            .createQueryBuilder('relatorio')
            .leftJoinAndSelect('relatorio.aluno', 'aluno')
            .leftJoinAndSelect('relatorio.projetosAtribuidos', 'projetosAtribuidos')
            .leftJoinAndSelect('projetosAtribuidos.projeto', 'projeto')
            .where('relatorio.evento_id = :eventoId', { eventoId: eventoAtual.id });

        if (status) {
            query.andWhere('relatorio.status = :status', { status });
        }

        if (nome) {
            query.andWhere('aluno.nome LIKE :nome', { nome: `%${nome}%` });
        }

        const [resultados, total] = await query
            .orderBy('relatorio.created_at', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

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
     */
    async atualizarRelatorioAluno(
        id: number,
        updateRelatorioAlunoDto: UpdateRelatorioAlunoDto,
    ) {
        const relatorio = await this.relatorioAlunoRepository.findOne({
            where: { id },
            relations: ['aluno', 'evento'],
        });

        if (!relatorio) {
            throw new NotFoundException(`Registro com ID ${id} não encontrado.`);
        }

        if (updateRelatorioAlunoDto.quantidade_projetos !== undefined) {
            relatorio.quantidade_projetos = updateRelatorioAlunoDto.quantidade_projetos;
        }

        if (updateRelatorioAlunoDto.status !== undefined) {
            relatorio.status = updateRelatorioAlunoDto.status;
        }

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
     */
    async distribuirProjetos() {
        const anoAtual = new Date().getFullYear();

        // Buscar evento ativo do ano atual - CORRIGIDO
        const eventoAtual = await this.eventoRepository
            .createQueryBuilder('evento')
            .where('evento.status = :status', { status: EventoStatus.ATIVO })
            .andWhere('YEAR(evento.criadoEm) = :ano', { ano: anoAtual })
            .getOne();

        if (!eventoAtual) {
            throw new NotFoundException(`Nenhum evento ativo encontrado para o ano ${anoAtual}.`);
        }

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

        const projetosDisponiveis = await this.projetoRepository.find({
            where: {
                evento: { id: eventoAtual.id },
            },
            relations: ['alunoAutor'],
        });

        if (projetosDisponiveis.length === 0) {
            throw new BadRequestException('Nenhum projeto disponível para distribuição.');
        }

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

            const projetosAtribuidos = await this.alunoRelatorioProjetosRepository.find({
                where: { aluno_relatorio_id: alunoRelatorioId },
                relations: ['projeto'],
            });

            const idsProjetosAtribuidos = projetosAtribuidos.map((p) => p.projeto_id);

            const projetosDisponiveisParaAluno = projetosDisponiveis.filter(
                (p) => !idsProjetosAtribuidos.includes(p.id),
            );

            const projetosFaltando = quantidade_projetos - projetosAtribuidos.length;
            const quantidadeParaAtribuir = Math.min(
                projetosFaltando,
                projetosDisponiveisParaAluno.length,
            );

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

            const projetosSelecionados = this.selecionarProjetosDistribuicaoCruzada(
                projetosDisponiveisParaAluno,
                aluno,
                quantidadeParaAtribuir,
            );

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

            const totalAposAtribuicao = projetosAtribuidos.length + atribuicoes.length;
            const recebeuTodos = totalAposAtribuicao >= quantidade_projetos;

            alunoRelatorio.status = recebeuTodos
                ? StatusRelatorio.DISTRIBUIDO
                : StatusRelatorio.PENDENTE;

            await this.relatorioAlunoRepository.save(alunoRelatorio);

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

    private selecionarProjetosDistribuicaoCruzada(
        projetosDisponiveis: Projeto[],
        aluno: User,
        quantidade: number,
    ): Projeto[] {
        const projetosOutrasTurmas = projetosDisponiveis.filter(
            (p) => p.alunoAutor.turma !== aluno.turma,
        );
        const projetosMesmaTurma = projetosDisponiveis.filter(
            (p) => p.alunoAutor.turma === aluno.turma,
        );

        const selecionados: Projeto[] = [];
        const totalNecessario = quantidade;

        const shuffledOutras = this.shuffleArray(projetosOutrasTurmas);
        const pegarOutras = Math.min(shuffledOutras.length, totalNecessario);
        selecionados.push(...shuffledOutras.slice(0, pegarOutras));

        if (selecionados.length < totalNecessario && projetosMesmaTurma.length > 0) {
            const restante = totalNecessario - selecionados.length;
            const shuffledMesma = this.shuffleArray(projetosMesmaTurma);

            for (const projeto of shuffledMesma) {
                if (selecionados.length >= totalNecessario) break;
                const probabilidade = Math.random();
                if (probabilidade < 0.2) {
                    selecionados.push(projeto);
                }
            }
        }

        if (selecionados.length < totalNecessario && projetosMesmaTurma.length > 0) {
            const restante = totalNecessario - selecionados.length;
            const shuffledMesma = this.shuffleArray(projetosMesmaTurma);
            const idsSelecionados = new Set(selecionados.map((p) => p.id));
            const disponiveis = shuffledMesma.filter((p) => !idsSelecionados.has(p.id));
            const pegar = Math.min(disponiveis.length, restante);
            selecionados.push(...disponiveis.slice(0, pegar));
        }

        return selecionados;
    }

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
     */
    async meusProjetos(alunoId: number) {
        const anoAtual = new Date().getFullYear();

        // CORRIGIDO
        const eventoAtual = await this.eventoRepository
            .createQueryBuilder('evento')
            .where('evento.status = :status', { status: EventoStatus.ATIVO })
            .andWhere('YEAR(evento.criadoEm) = :ano', { ano: anoAtual })
            .getOne();

        if (!eventoAtual) {
            throw new NotFoundException(`Nenhum evento ativo encontrado para o ano ${anoAtual}.`);
        }

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

        const projetosAtribuidos = await this.alunoRelatorioProjetosRepository.find({
            where: { aluno_relatorio_id: relatorioAluno.id },
            relations: ['projeto', 'projeto.alunoAutor', 'projeto.projetoAlunos', 'projeto.projetoAlunos.aluno'],
        });

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

    /**
     * Retorna o status atual do aluno na modalidade relatório.
     */
    async meuStatus(alunoId: number) {
        const anoAtual = new Date().getFullYear();

        // CORRIGIDO
        const eventoAtual = await this.eventoRepository
            .createQueryBuilder('evento')
            .where('evento.status = :status', { status: EventoStatus.ATIVO })
            .andWhere('YEAR(evento.criadoEm) = :ano', { ano: anoAtual })
            .getOne();

        if (!eventoAtual) {
            throw new NotFoundException(`Nenhum evento ativo encontrado para o ano ${anoAtual}.`);
        }

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

    /**
* Tarefa agendada: Executa todo domingo às 20:00
* Verifica alunos que não possuem projetos e cria registros em relatorio_aluno
*/
    @Cron('0 20 * * 0') // Domingo às 20:00
    async verificarAlunosSemProjetos() {
        const logger = new Logger(RelatorioAlunoService.name);
        logger.log('🚀 Iniciando verificação de alunos sem projetos...');

        try {
            const anoAtual = new Date().getFullYear();

            // 1. Buscar evento ativo do ano atual
            const eventoAtual = await this.eventoRepository
                .createQueryBuilder('evento')
                .where('evento.status = :status', { status: EventoStatus.ATIVO })
                .andWhere('YEAR(evento.criadoEm) = :ano', { ano: anoAtual })
                .getOne();

            if (!eventoAtual) {
                logger.warn(`⚠️ Nenhum evento ativo encontrado para o ano ${anoAtual}.`);
                return {
                    mensagem: `Nenhum evento ativo encontrado para o ano ${anoAtual}.`,
                    total_alunos_processados: 0,
                    alunos_inseridos: [],
                };
            }

            // 2. Verificar se o prazo de inscrição já foi encerrado
            const dataAtual = new Date();
            const prazoFinal = new Date(eventoAtual.inscricao.fim || eventoAtual.prazoFinal);

            if (!prazoFinal || prazoFinal > dataAtual) {
                logger.log('📝 Prazo de inscrição ainda não foi encerrado. Nenhuma ação será tomada.');
                return {
                    mensagem: 'Prazo de inscrição ainda não foi encerrado.',
                    total_alunos_processados: 0,
                    alunos_inseridos: [],
                };
            }

            logger.log(`📅 Prazo de inscrição encerrado em ${prazoFinal.toLocaleString()}. Processando alunos...`);

            // 3. Buscar todos os alunos que NÃO estão em nenhum projeto
            const alunosComProjetos = await this.userRepository
                .createQueryBuilder('user')
                .innerJoin('projeto_alunos', 'pa', 'pa.aluno_id = user.id')
                .where('user.role_cargo = :role', { role: 'aluno' })
                .andWhere('user.ativo = :ativo', { ativo: true })
                .getMany();

            const idsAlunosComProjetos = alunosComProjetos.map(a => a.id);

            const alunosSemProjetos = await this.userRepository
                .createQueryBuilder('user')
                .where('user.role_cargo = :role', { role: 'aluno' })
                .andWhere('user.ativo = :ativo', { ativo: true })
                .andWhere('user.id NOT IN (:...ids)', {
                    ids: idsAlunosComProjetos.length > 0 ? idsAlunosComProjetos : [0]
                })
                .getMany();

            if (alunosSemProjetos.length === 0) {
                logger.log('✅ Todos os alunos já possuem projetos.');
                return {
                    mensagem: 'Todos os alunos já possuem projetos.',
                    total_alunos_processados: 0,
                    alunos_inseridos: [],
                };
            }

            logger.log(`👥 Encontrados ${alunosSemProjetos.length} alunos sem projetos.`);

            // 4. Criar registros em relatorio_aluno
            const alunosInseridos: {
                id: number;
                nome: string;
                email: string;
                turma: User['turma'];
                relatorio_id: number;
            }[] = [];

            for (const aluno of alunosSemProjetos) {
                const registroExistente = await this.relatorioAlunoRepository.findOne({
                    where: {
                        aluno_id: aluno.id,
                        evento_id: eventoAtual.id,
                    },
                });

                if (registroExistente) {
                    logger.debug(`⏭️ Aluno ${aluno.nome} (ID: ${aluno.id}) já possui registro.`);
                    continue;
                }

                const novoRegistro = this.relatorioAlunoRepository.create({
                    aluno_id: aluno.id,
                    evento_id: eventoAtual.id,
                    quantidade_projetos: 0,
                    status: StatusRelatorio.PENDENTE,
                    data_ativacao: new Date(),
                });

                await this.relatorioAlunoRepository.save(novoRegistro);

                alunosInseridos.push({
                    id: aluno.id,
                    nome: aluno.nome,
                    email: aluno.email_institucional,
                    turma: aluno.turma,
                    relatorio_id: novoRegistro.id,
                });

                logger.log(`✅ Registro criado para aluno ${aluno.nome} (ID: ${aluno.id})`);
            }

            logger.log(`🎯 Finalizado! ${alunosInseridos.length} alunos inseridos.`);

            return {
                mensagem: `Processamento concluído. ${alunosInseridos.length} alunos foram inseridos.`,
                total_alunos_processados: alunosSemProjetos.length,
                alunos_inseridos: alunosInseridos,
            };

        } catch (error) {
            logger.error(`❌ Erro ao processar: ${error.message}`);
            throw error;
        }
    }

    /**
 * Executa quando o servidor inicia
 */
    async onModuleInit() {
        this.logger.log('🚀 Servidor iniciado. Executando verificação inicial de alunos sem projetos...');
        try {
            await this.verificarAlunosSemProjetos();
            this.logger.log('✅ Verificação inicial concluída com sucesso.');
        } catch (error) {
            this.logger.error(`❌ Erro na verificação inicial: ${error.message}`);
        }
    }

    /**
     * Atribui projetos manualmente a um aluno
     * 
     * @param relatorioId - ID do registro em relatorio_aluno
     * @param projetosIds - Array de IDs dos projetos a atribuir
     * @returns Relatório atualizado com a lista de projetos atribuídos
     */
    // relatorio-aluno.service.ts (adicionar ao final da classe)

    /**
     * Atribui projetos manualmente a um aluno
     * 
     * @param relatorioId - ID do registro em relatorio_aluno
     * @param projetosIds - Array de IDs dos projetos a atribuir
     * @returns Relatório atualizado com a lista de projetos atribuídos
     */
    /**
     * Atribui projetos manualmente a um aluno
     * 
     * @param relatorioId - ID do registro em relatorio_aluno
     * @param projetosIds - Array de IDs dos projetos a atribuir
     * @returns Relatório atualizado com a lista de projetos atribuídos
     */
    async atribuirProjetosManualmente(relatorioId: number, projetosIds: number[]) {
        try {
            // 1. Buscar o relatório
            const relatorio = await this.relatorioAlunoRepository.findOne({
                where: { id: relatorioId },
                relations: ['aluno', 'evento', 'projetosAtribuidos', 'projetosAtribuidos.projeto'],
            });

            if (!relatorio) {
                throw new NotFoundException(`Relatório com ID ${relatorioId} não encontrado.`);
            }

            // 2. Validar evento
            const anoAtual = new Date().getFullYear();
            if (relatorio.evento.status !== EventoStatus.ATIVO) {
                throw new BadRequestException('O evento não está ativo.');
            }
            if (new Date(relatorio.evento.criadoEm).getFullYear() !== anoAtual) {
                throw new BadRequestException('O evento não pertence ao ano atual.');
            }

            // 3. Buscar projetos
            const projetos = await this.projetoRepository.find({
                where: { id: In(projetosIds) },
                relations: ['evento'],
            });

            if (projetos.length !== projetosIds.length) {
                throw new NotFoundException('Um ou mais projetos não foram encontrados.');
            }

            // 4. Verificar evento dos projetos
            const projetoInvalido = projetos.find((p) => p.evento.id !== relatorio.evento.id);
            if (projetoInvalido) {
                throw new BadRequestException(
                    `O projeto "${projetoInvalido.titulo}" não pertence ao evento atual do aluno.`
                );
            }

            // 5. Verificar duplicidade
            const idsProjetosAtribuidos = relatorio.projetosAtribuidos.map((pa) => pa.projeto.id);
            const projetosJaAtribuidos = projetosIds.filter((id) => idsProjetosAtribuidos.includes(id));
            if (projetosJaAtribuidos.length > 0) {
                throw new BadRequestException(
                    `Os projetos com IDs [${projetosJaAtribuidos.join(', ')}] já estão atribuídos a este aluno.`
                );
            }

            // 6. Verificar limite
            const totalAtribuidosAtual = relatorio.projetosAtribuidos.length;
            const quantidadeMaxima = relatorio.quantidade_projetos;
            if (totalAtribuidosAtual + projetosIds.length > quantidadeMaxima) {
                throw new BadRequestException(
                    `O aluno já possui ${totalAtribuidosAtual} projetos e pode ter no máximo ${quantidadeMaxima}. ` +
                    `Não é possível atribuir ${projetosIds.length} projetos adicionais.`
                );
            }

            // 7. Criar atribuições
            for (const projetoId of projetosIds) {
                const novaAtribuicao = this.alunoRelatorioProjetosRepository.create({
                    aluno_relatorio_id: relatorio.id,
                    projeto_id: projetoId,
                    data_atribuicao: new Date(),
                    visualizado: false,
                });
                await this.alunoRelatorioProjetosRepository.save(novaAtribuicao);
            }

            // 8. Atualizar status DIRETAMENTE (evita o problema do UPDATE com NULL)
            const totalAtribuidosNovo = totalAtribuidosAtual + projetosIds.length;
            const novoStatus = totalAtribuidosNovo >= quantidadeMaxima
                ? StatusRelatorio.DISTRIBUIDO
                : StatusRelatorio.PENDENTE;

            await this.relatorioAlunoRepository.update(
                { id: relatorioId },
                { status: novoStatus }
            );

            // 9. Buscar relatório atualizado
            const relatorioAtualizado = await this.relatorioAlunoRepository.findOne({
                where: { id: relatorioId },
                relations: ['aluno', 'evento', 'projetosAtribuidos', 'projetosAtribuidos.projeto'],
            });

            if (!relatorioAtualizado) {
                throw new NotFoundException(`Relatório com ID ${relatorioId} não encontrado após atualização.`);
            }

            // 10. Mapear resposta
            const data = {
                id: relatorioAtualizado.id,
                aluno: {
                    id: relatorioAtualizado.aluno.id,
                    nome: relatorioAtualizado.aluno.nome,
                    email: relatorioAtualizado.aluno.email_institucional,
                    turma: relatorioAtualizado.aluno.turma,
                },
                quantidade_projetos: relatorioAtualizado.quantidade_projetos,
                total_atribuidos: relatorioAtualizado.projetosAtribuidos.length,
                status: relatorioAtualizado.status,
                projetos: relatorioAtualizado.projetosAtribuidos.map((pa) => ({
                    id: pa.projeto.id,
                    titulo: pa.projeto.titulo,
                    area: pa.projeto.tema,
                    visualizado: pa.visualizado,
                    data_atribuicao: pa.data_atribuicao,
                })),
            };

            return {
                mensagem: 'Projetos atribuídos com sucesso.',
                data,
            };

        } catch (error) {
            console.error('❌ Erro em atribuirProjetosManualmente:', error);
            return {
                statusCode: 500,
                message: 'Desculpe, ocorreu um problema inesperado. Tente novamente mais tarde.',
                error: {
                    name: error.name,
                    message: error.message,
                    code: error.code,
                    sqlMessage: error.sqlMessage,
                }
            };
        }
    }

    // src/relatorio-aluno/relatorio-aluno.service.ts


    /**
     * Remove projetos manualmente de um aluno
     * 
     * @param relatorioId - ID do registro em relatorio_aluno
     * @param projetosIds - Array de IDs dos projetos a remover
     * @returns Relatório atualizado com a lista de projetos restantes
     */
    async removerProjetosManualmente(relatorioId: number, projetosIds: number[]) {
        // 1. Buscar o relatório do aluno com relações necessárias
        const relatorio = await this.relatorioAlunoRepository.findOne({
            where: { id: relatorioId },
            relations: ['aluno', 'evento', 'projetosAtribuidos', 'projetosAtribuidos.projeto'],
        });

        if (!relatorio) {
            throw new NotFoundException(`Relatório com ID ${relatorioId} não encontrado.`);
        }

        // 2. Verificar se todos os projetosIds existem nas atribuições do aluno
        const idsAtribuidos = relatorio.projetosAtribuidos.map(pa => pa.projeto.id);
        const idsNaoEncontrados = projetosIds.filter(id => !idsAtribuidos.includes(id));

        if (idsNaoEncontrados.length > 0) {
            throw new BadRequestException(
                `Os projetos com IDs [${idsNaoEncontrados.join(', ')}] não estão atribuídos a este aluno.`
            );
        }

        // 3. Remover os registros de aluno_relatorio_projetos usando delete com IDs
        const atribuicoesParaRemover = relatorio.projetosAtribuidos.filter(pa =>
            projetosIds.includes(pa.projeto.id)
        );
        const idsParaRemover = atribuicoesParaRemover.map(pa => pa.id);
        await this.alunoRelatorioProjetosRepository.delete(idsParaRemover);

        // 4. Recalcular total de projetos atribuídos
        const totalRestante = relatorio.projetosAtribuidos.length - atribuicoesParaRemover.length;

        // 5. Atualizar status do aluno
        relatorio.status = totalRestante >= relatorio.quantidade_projetos
            ? StatusRelatorio.DISTRIBUIDO
            : StatusRelatorio.PENDENTE;

        await this.relatorioAlunoRepository.save(relatorio);

        // 6. Buscar o relatório atualizado
        const relatorioAtualizado = await this.relatorioAlunoRepository.findOne({
            where: { id: relatorioId },
            relations: ['aluno', 'evento', 'projetosAtribuidos', 'projetosAtribuidos.projeto'],
        });

        if (!relatorioAtualizado) {
            throw new NotFoundException(`Relatório com ID ${relatorioId} não encontrado após atualização.`);
        }

        // 7. Mapear resposta
        const data = {
            id: relatorioAtualizado.id,
            aluno: {
                id: relatorioAtualizado.aluno.id,
                nome: relatorioAtualizado.aluno.nome,
                email: relatorioAtualizado.aluno.email_institucional,
                turma: relatorioAtualizado.aluno.turma,
            },
            quantidade_projetos: relatorioAtualizado.quantidade_projetos,
            total_atribuidos: relatorioAtualizado.projetosAtribuidos.length,
            status: relatorioAtualizado.status,
            projetos: relatorioAtualizado.projetosAtribuidos.map((pa) => ({
                id: pa.projeto.id,
                titulo: pa.projeto.titulo,
                area: pa.projeto.tema,
                visualizado: pa.visualizado,
                data_atribuicao: pa.data_atribuicao,
            })),
        };

        return {
            mensagem: 'Projetos removidos com sucesso.',
            data,
        };
    }



    // relatorio-aluno.service.ts

    /**
     * Atualiza a quantidade de projetos em lote para alunos da modalidade relatório
     * 
     * @param quantidade - Nova quantidade de projetos
     * @param geral - Se true, aplica para todos; se false, aplica apenas para os IDs
     * @param ids - Lista de IDs dos relatórios (se geral = false)
     * @returns Relatório da operação
     */
    async atualizarQuantidadeEmLote(
        quantidade: number,
        geral: boolean,
        ids?: number[],
    ) {
        // 1. Buscar evento ativo do ano atual
        const anoAtual = new Date().getFullYear();
        const eventoAtual = await this.eventoRepository
            .createQueryBuilder('evento')
            .where('evento.status = :status', { status: EventoStatus.ATIVO })
            .andWhere('YEAR(evento.criadoEm) = :ano', { ano: anoAtual })
            .getOne();

        if (!eventoAtual) {
            throw new NotFoundException(`Nenhum evento ativo encontrado para o ano ${anoAtual}.`);
        }

        let relatoriosParaAtualizar: RelatorioAluno[];

        if (geral) {
            // Buscar todos os relatórios do evento
            relatoriosParaAtualizar = await this.relatorioAlunoRepository.find({
                where: { evento_id: eventoAtual.id },
                relations: ['aluno', 'projetosAtribuidos'],
            });
        } else {
            // Buscar apenas os relatórios com os IDs fornecidos
            if (!ids || ids.length === 0) {
                throw new BadRequestException('É necessário fornecer uma lista de IDs quando geral = false.');
            }

            relatoriosParaAtualizar = await this.relatorioAlunoRepository.find({
                where: { id: In(ids), evento_id: eventoAtual.id },
                relations: ['aluno', 'projetosAtribuidos'],
            });

            // Verificar se todos os IDs existem
            const idsEncontrados = relatoriosParaAtualizar.map(r => r.id);
            const idsNaoEncontrados = ids.filter(id => !idsEncontrados.includes(id));
            if (idsNaoEncontrados.length > 0) {
                throw new NotFoundException(
                    `Relatórios com IDs [${idsNaoEncontrados.join(', ')}] não encontrados para o evento atual.`
                );
            }
        }

        // 2. Atualizar a quantidade de projetos para cada relatório
        const resultados: any[] = [];
        for (const relatorio of relatoriosParaAtualizar) {
            // Atualizar a quantidade
            relatorio.quantidade_projetos = quantidade;

            // Recalcular status baseado na nova quantidade
            const totalAtribuidos = relatorio.projetosAtribuidos?.length || 0;
            relatorio.status = totalAtribuidos >= quantidade
                ? StatusRelatorio.DISTRIBUIDO
                : StatusRelatorio.PENDENTE;

            await this.relatorioAlunoRepository.save(relatorio);

            resultados.push({
                id: relatorio.id,
                aluno: {
                    id: relatorio.aluno.id,
                    nome: relatorio.aluno.nome,
                    email: relatorio.aluno.email_institucional,
                    turma: relatorio.aluno.turma,
                },
                quantidade_projetos: relatorio.quantidade_projetos,
                total_atribuidos: totalAtribuidos,
                status: relatorio.status,
            });
        }

        return {
            mensagem: `${resultados.length} aluno(s) atualizado(s) com sucesso.`,
            quantidade_definida: quantidade,
            alunos_atualizados: resultados,
        };
    }
}