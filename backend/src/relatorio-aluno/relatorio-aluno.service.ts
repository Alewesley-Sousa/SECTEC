// relatorio-aluno.service.ts
import { Injectable, NotFoundException, BadRequestException, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, EntityManager } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { RelatorioAluno, StatusRelatorio } from './entities/relatorio-aluno.entity';
import { Projeto } from '../projetos/entities/projeto.entity';
import { User } from '../users/entities/user.entity';
import { AlunoRelatorioProjetos } from './entities/aluno-relatorio-projetos.entity';
import { Evento, EventoStatus } from '../evento/entities/evento.entity';
import { RelatorioMaterial, TipoRelatorioMaterial, StatusRelatorioMaterial } from './entities/relatorio-material.entity';
import { UpdateRelatorioAlunoDto, ListarRelatorioAlunoDto } from './dto';
import { ConflictException, ForbiddenException } from '@nestjs/common';
import { PdfService } from '../pdf/pdf.service';
import { GoogleDriveService } from '../pdf/google-drive.service';

// Tipos auxiliares para evitar any
interface AlunoProcessadoResult {
    aluno_id: number;
    aluno_nome: string;
    turma_aluno?: string | null;
    status: string;
    projetos_atribuidos: Projeto[];
    total_atribuido: number;
    total_necessario: number;
    mensagem: string;
}

interface AlunoNaoAtendido {
    aluno_id: number;
    aluno_nome: string;
    quantidade_necessaria: number;
    quantidade_recebida: number;
    faltam: number;
}

export interface DistribuicaoResultado {
    mensagem: string;
    total_alunos: number;
    total_projetos_atribuidos: number;
    alunos_nao_atendidos: AlunoNaoAtendido[];
    alunos_processados: AlunoProcessadoResult[];
}

@Injectable()
export class RelatorioAlunoService implements OnModuleInit {
    private readonly logger = new Logger(RelatorioAlunoService.name);

    constructor(
        @InjectRepository(RelatorioAluno)
        private readonly relatorioAlunoRepository: Repository<RelatorioAluno>,
        @InjectRepository(RelatorioMaterial)
        private readonly relatorioMaterialRepository: Repository<RelatorioMaterial>,
        @InjectRepository(Evento)
        private readonly eventoRepository: Repository<Evento>,
        @InjectRepository(Projeto)
        private readonly projetoRepository: Repository<Projeto>,
        @InjectRepository(AlunoRelatorioProjetos)
        private readonly alunoRelatorioProjetosRepository: Repository<AlunoRelatorioProjetos>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly googleDriveService: GoogleDriveService,
    ) { }

    // ============================================================
    //                 MÉTODOS PRIVADOS AUXILIARES
    // ============================================================


    /** Mapeia uma lista de materiais para um formato de resposta padronizado */
    private mapearMateriais(materiais: RelatorioMaterial[]) {
        return (materiais || []).map(m => ({
            id: m.id,
            tipo: m.tipo,
            conteudo: m.conteudo,
            status: m.status,
            criadoEm: m.criadoEm,
        }));
    }

    /** Obtém o evento ativo do ano atual */
    private async obterEventoAtivo(): Promise<Evento> {
        const anoAtual = new Date().getFullYear();
        const evento = await this.eventoRepository
            .createQueryBuilder('evento')
            .where('evento.status = :status', { status: EventoStatus.ATIVO })
            .andWhere('YEAR(evento.criadoEm) = :ano', { ano: anoAtual })
            .getOne();

        if (!evento) {
            throw new NotFoundException(`Nenhum evento ativo encontrado para o ano ${anoAtual}.`);
        }
        return evento;
    }

    /** Valida se o ID é um número positivo */
    private validarId(id: number): void {
        if (!id || !Number.isFinite(id) || id <= 0) {
            throw new BadRequestException('ID inválido.');
        }
    }

    /** Busca um relatório com suas relações básicas */
    private async buscarRelatorioComRelacoes(id: number, relacoes: string[] = []): Promise<RelatorioAluno> {
        const relatorio = await this.relatorioAlunoRepository.findOne({
            where: { id },
            relations: ['aluno', 'evento', ...relacoes],
        });
        if (!relatorio) {
            throw new NotFoundException(`Registro com ID ${id} não encontrado.`);
        }
        return relatorio;
    }

    /** Mapeia um relatório para o formato de resposta simplificado */
    private mapearRespostaRelatorio(relatorio: RelatorioAluno) {
        return {
            id: relatorio.id,
            aluno: {
                id: relatorio.aluno.id,
                nome: relatorio.aluno.nome,
                email: relatorio.aluno.email_institucional,
                turma: relatorio.aluno.turma,
            },
            evento: {
                id: relatorio.evento.id,
                nome: relatorio.evento.titulo,
            },
            quantidade_projetos: relatorio.quantidade_projetos,
            total_atribuidos: relatorio.projetosAtribuidos?.length || 0,
            status: relatorio.status,
            data_ativacao: relatorio.data_ativacao,
            data_envio: relatorio.data_envio,
            created_at: relatorio.created_at,
        };
    }

    /** Valida se a nova quantidade não é menor que os projetos já atribuídos */
    private validarQuantidadeProjetos(novaQuantidade: number, totalAtribuidos: number) {
        if (novaQuantidade < totalAtribuidos) {
            const diferenca = totalAtribuidos - novaQuantidade;
            throw new BadRequestException(
                `Não é possível reduzir a quantidade para ${novaQuantidade} porque o aluno já possui ${totalAtribuidos} projeto(s) atribuído(s). ` +
                `Para prosseguir, remova ${diferenca} projeto(s) antes de atualizar.`
            );
        }
    }

    /** Embaralha array (Fisher-Yates) */
    private embaralharArray<T>(array: T[]): T[] {
        const copia = [...array];
        for (let i = copia.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copia[i], copia[j]] = [copia[j], copia[i]];
        }
        return copia;
    }

    // ============================================================
    //                     ENDPOINTS PÚBLICOS
    // ============================================================

    async listarAlunosRelatorio(filtros: ListarRelatorioAlunoDto) {
        const { status, nome, page = 1, limit = 10 } = filtros;
        const eventoAtual = await this.obterEventoAtivo();

        const query = this.relatorioAlunoRepository
            .createQueryBuilder('relatorio')
            .leftJoinAndSelect('relatorio.aluno', 'aluno')
            .leftJoinAndSelect('relatorio.projetosAtribuidos', 'projetosAtribuidos')
            .leftJoinAndSelect('projetosAtribuidos.projeto', 'projeto')
            .where('relatorio.evento_id = :eventoId', { eventoId: eventoAtual.id });

        if (status) query.andWhere('relatorio.status = :status', { status });
        if (nome) query.andWhere('aluno.nome LIKE :nome', { nome: `%${nome}%` });

        const [resultados, total] = await query
            .orderBy('relatorio.created_at', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        const data = resultados.map((r) => ({
            id: r.id,
            aluno: {
                id: r.aluno.id,
                nome: r.aluno.nome,
                email: r.aluno.email_institucional,
                turma: r.aluno.turma,
            },
            status: r.status,
            quantidade_projetos: r.quantidade_projetos,
            projetos_atribuidos: r.projetosAtribuidos?.map((pa) => ({
                id: pa.projeto.id,
                titulo: pa.projeto.titulo,
                area: pa.projeto.tema,
                visualizado: pa.visualizado,
                data_atribuicao: pa.data_atribuicao,
            })) || [],
            data_ativacao: r.data_ativacao,
            data_envio: r.data_envio,
            created_at: r.created_at,
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

    async atualizarRelatorioAluno(id: number, dto: UpdateRelatorioAlunoDto) {
        this.validarId(id);
        const relatorio = await this.buscarRelatorioComRelacoes(id, ['projetosAtribuidos']);

        // 🔒 Validação: não permite alterar quantidade de projetos se já finalizado ou enviado
        if (relatorio.status === StatusRelatorio.FINALIZADO || relatorio.status === StatusRelatorio.ENVIADO) {
            throw new BadRequestException(
                'Não é permitido alterar a quantidade de projetos de um relatório finalizado ou já enviado.'
            );
        }

        if (dto.quantidade_projetos !== undefined) {
            const totalAtribuidos = relatorio.projetosAtribuidos?.length || 0;
            this.validarQuantidadeProjetos(dto.quantidade_projetos, totalAtribuidos);
            relatorio.quantidade_projetos = dto.quantidade_projetos;
            relatorio.status = totalAtribuidos >= dto.quantidade_projetos
                ? StatusRelatorio.DISTRIBUIDO
                : StatusRelatorio.PENDENTE;
        }

        if (dto.status !== undefined) {
            relatorio.status = dto.status;
        }

        const resultado = await this.relatorioAlunoRepository.save(relatorio);
        return {
            mensagem: 'Registro atualizado com sucesso!',
            data: this.mapearRespostaRelatorio(resultado),
        };
    }

    // DISTRIBUIÇÃO (COM TRANSAÇÃO)
    async distribuirProjetos(): Promise<DistribuicaoResultado> {
        const eventoAtual = await this.obterEventoAtivo();

        return await this.relatorioAlunoRepository.manager.transaction(async (manager) => {
            const alunosElegiveis = await this.obterAlunosElegiveis(eventoAtual.id);
            if (alunosElegiveis.length === 0) {
                return {
                    mensagem: 'Nenhum aluno elegível para distribuição.',
                    total_alunos: 0,
                    total_projetos_atribuidos: 0,
                    alunos_nao_atendidos: [],
                    alunos_processados: [],
                };
            }

            const projetosDisponiveis = await manager.getRepository(Projeto).find({
                where: { evento: { id: eventoAtual.id } },
                relations: ['alunoAutor'],
            });
            if (projetosDisponiveis.length === 0) {
                throw new BadRequestException('Nenhum projeto disponível para distribuição.');
            }

            return await this.processarDistribuicao(alunosElegiveis, projetosDisponiveis, manager);
        });
    }

    private async obterAlunosElegiveis(eventoId: number): Promise<RelatorioAluno[]> {
        return this.relatorioAlunoRepository.find({
            where: {
                evento_id: eventoId,
                status: StatusRelatorio.PENDENTE,
                quantidade_projetos: Not(0),
            },
            relations: ['aluno'],
        });
    }

    private async processarDistribuicao(
        alunosElegiveis: RelatorioAluno[],
        projetosDisponiveis: Projeto[],
        manager: EntityManager,
    ): Promise<DistribuicaoResultado> {
        const resultados: AlunoProcessadoResult[] = [];
        const naoAtendidos: AlunoNaoAtendido[] = [];

        // Pré-carrega todos os atribuídos (evita N+1)
        const todosAtribuidos = await manager.getRepository(AlunoRelatorioProjetos).find({
            where: { aluno_relatorio_id: In(alunosElegiveis.map(a => a.id)) },
            relations: ['projeto'],
        });
        const atribuidosPorAluno = new Map<number, AlunoRelatorioProjetos[]>();
        todosAtribuidos.forEach(pa => {
            const list = atribuidosPorAluno.get(pa.aluno_relatorio_id) || [];
            list.push(pa);
            atribuidosPorAluno.set(pa.aluno_relatorio_id, list);
        });

        for (const alunoRelatorio of alunosElegiveis) {
            const { aluno, quantidade_projetos, id: alunoRelatorioId } = alunoRelatorio;

            const projetosAtribuidos = atribuidosPorAluno.get(alunoRelatorioId) || [];
            const idsAtribuidos = projetosAtribuidos.map((p) => p.projeto_id);
            const disponiveisParaAluno = projetosDisponiveis.filter((p) => !idsAtribuidos.includes(p.id));

            const projetosFaltando = quantidade_projetos - projetosAtribuidos.length;
            const quantidadeParaAtribuir = Math.min(projetosFaltando, disponiveisParaAluno.length);

            if (quantidadeParaAtribuir <= 0) {
                const recebeuTodos = projetosAtribuidos.length >= quantidade_projetos;
                if (!recebeuTodos) {
                    naoAtendidos.push({
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
                    projetos_atribuidos: projetosAtribuidos.map(pa => pa.projeto),
                    total_atribuido: projetosAtribuidos.length,
                    total_necessario: quantidade_projetos,
                    mensagem: recebeuTodos
                        ? 'Aluno já possui todos os projetos atribuídos.'
                        : `Aluno recebeu apenas ${projetosAtribuidos.length} de ${quantidade_projetos} projetos. Faltam ${projetosFaltando} projetos.`,
                });
                continue;
            }

            const selecionados = this.selecionarProjetosDistribuicaoCruzada(disponiveisParaAluno, aluno, quantidadeParaAtribuir);
            const atribuicoes = await this.criarAtribuicoesBatch(alunoRelatorioId, selecionados, manager);

            const totalApos = projetosAtribuidos.length + atribuicoes.length;
            const recebeuTodos = totalApos >= quantidade_projetos;

            await this.atualizarStatusAluno(alunoRelatorio, recebeuTodos, manager);

            if (!recebeuTodos) {
                naoAtendidos.push({
                    aluno_id: aluno.id,
                    aluno_nome: aluno.nome,
                    quantidade_necessaria: quantidade_projetos,
                    quantidade_recebida: totalApos,
                    faltam: quantidade_projetos - totalApos,
                });
            }

            resultados.push({
                aluno_id: aluno.id,
                aluno_nome: aluno.nome,
                turma_aluno: aluno.turma,
                status: recebeuTodos ? 'distribuido' : 'pendente',
                projetos_atribuidos: [...projetosAtribuidos.map(pa => pa.projeto), ...selecionados],
                total_atribuido: totalApos,
                total_necessario: quantidade_projetos,
                mensagem: recebeuTodos
                    ? 'Todos os projetos atribuídos com sucesso!'
                    : `Aluno recebeu apenas ${totalApos} de ${quantidade_projetos} projetos. Faltam ${quantidade_projetos - totalApos} projetos.`,
            });
        }

        const totalAtribuidos = resultados.reduce((acc, r) => acc + r.total_atribuido, 0);

        return {
            mensagem: naoAtendidos.length > 0
                ? 'Distribuição concluída com alertas! Alguns alunos não receberam todos os projetos necessários.'
                : 'Distribuição concluída com sucesso! Todos os alunos receberam a quantidade necessária de projetos.',
            total_alunos: alunosElegiveis.length,
            total_projetos_atribuidos: totalAtribuidos,
            alunos_nao_atendidos: naoAtendidos,
            alunos_processados: resultados,
        };
    }

    private async criarAtribuicoesBatch(alunoRelatorioId: number, projetos: Projeto[], manager: EntityManager) {
        if (!alunoRelatorioId || !Number.isFinite(alunoRelatorioId)) {
            throw new BadRequestException('ID do relatório do aluno inválido para atribuição.');
        }

        const repo = manager.getRepository(AlunoRelatorioProjetos);
        const data = projetos.map(projeto => ({
            aluno_relatorio_id: alunoRelatorioId,
            projeto_id: projeto.id,
            data_atribuicao: new Date(),
            visualizado: false,
        }));

        await repo.insert(data); // insere em lote

        return projetos.map(projeto => ({
            projeto_id: projeto.id,
            titulo: projeto.titulo,
            turma_autor: projeto.alunoAutor?.turma ?? null,
        }));
    }

    private async atualizarStatusAluno(alunoRelatorio: RelatorioAluno, completo: boolean, manager: EntityManager) {
        const novoStatus = completo ? StatusRelatorio.DISTRIBUIDO : StatusRelatorio.PENDENTE;
        await manager.getRepository(RelatorioAluno).update(alunoRelatorio.id, { status: novoStatus });
        alunoRelatorio.status = novoStatus;
    }

    private selecionarProjetosDistribuicaoCruzada(
        projetos: Projeto[],
        aluno: User,
        quantidade: number,
    ): Projeto[] {
        const outrasTurmas = projetos.filter((p) => p.alunoAutor.turma !== aluno.turma);
        const mesmaTurma = projetos.filter((p) => p.alunoAutor.turma === aluno.turma);
        const selecionados: Projeto[] = [];

        const outrasEmbaralhadas = this.embaralharArray(outrasTurmas);
        selecionados.push(...outrasEmbaralhadas.slice(0, Math.min(outrasEmbaralhadas.length, quantidade)));

        if (selecionados.length < quantidade && mesmaTurma.length > 0) {
            const restante = quantidade - selecionados.length;
            const mesmasEmbaralhadas = this.embaralharArray(mesmaTurma);
            for (const projeto of mesmasEmbaralhadas) {
                if (selecionados.length >= quantidade) break;
                if (Math.random() < 0.2) selecionados.push(projeto);
            }
        }

        if (selecionados.length < quantidade && mesmaTurma.length > 0) {
            const restante = quantidade - selecionados.length;
            const ids = new Set(selecionados.map((p) => p.id));
            const disponiveis = this.embaralharArray(mesmaTurma).filter((p) => !ids.has(p.id));
            selecionados.push(...disponiveis.slice(0, restante));
        }

        return selecionados;
    }

    // ============================================================
    //           MÉTODOS PARA ALUNOS (CONSULTA)
    // ============================================================

    async meusProjetos(alunoId: number) {
        const eventoAtual = await this.obterEventoAtivo();
        const relatorio = await this.relatorioAlunoRepository.findOne({
            where: { aluno_id: alunoId, evento_id: eventoAtual.id },
            relations: ['aluno'],
        });
        if (!relatorio) throw new NotFoundException('Aluno não encontrado na modalidade relatório.');

        const projetosAtribuidos = await this.alunoRelatorioProjetosRepository.find({
            where: { aluno_relatorio_id: relatorio.id },
            relations: ['projeto', 'projeto.alunoAutor', 'projeto.projetoAlunos', 'projeto.projetoAlunos.aluno'],
        });

        const projetos = projetosAtribuidos.map((pa) => ({
            id: pa.projeto.id,
            titulo: pa.projeto.titulo,
            descricao: pa.projeto.descricao,
            area: pa.projeto.tema?.nome || 'Área não definida',
            autores: [
                { id: pa.projeto.alunoAutor.id, nome: pa.projeto.alunoAutor.nome, turma: pa.projeto.alunoAutor.turma, tipo: 'autor_principal' },
                ...(pa.projeto.projetoAlunos?.map((coautor) => ({
                    id: coautor.aluno.id,
                    nome: coautor.aluno.nome,
                    turma: coautor.aluno.turma,
                    tipo: 'coautor',
                })) || []),
            ],
            visualizado: pa.visualizado,
            data_atribuicao: pa.data_atribuicao,
        }));

        return {
            aluno: { id: relatorio.aluno.id, nome: relatorio.aluno.nome, turma: relatorio.aluno.turma },
            status: relatorio.status,
            quantidade_projetos: relatorio.quantidade_projetos,
            total_atribuidos: projetos.length,
            projetos,
        };
    }

    async meuStatus(alunoId: number) {
        const eventoAtual = await this.obterEventoAtivo();
        const relatorio = await this.relatorioAlunoRepository.findOne({
            where: { aluno_id: alunoId, evento_id: eventoAtual.id },
            relations: ['aluno'],
        });
        if (!relatorio) throw new NotFoundException('Aluno não encontrado na modalidade relatório.');

        const projetosAtribuidos = await this.alunoRelatorioProjetosRepository.find({
            where: { aluno_relatorio_id: relatorio.id },
        });

        return {
            status: relatorio.status,
            quantidade_projetos: relatorio.quantidade_projetos,
            total_atribuidos: projetosAtribuidos.length,
            total_visualizados: projetosAtribuidos.filter((p) => p.visualizado).length,
            data_ativacao: relatorio.data_ativacao,
            data_envio: relatorio.data_envio,
        };
    }

    // ============================================================
    //            TAREFA AGENDADA / VERIFICAÇÃO INICIAL
    // ============================================================

    @Cron('0 20 * * 0')
    async verificarAlunosSemProjetos() {
        this.logger.log('🚀 Iniciando verificação de alunos sem projetos...');
        try {
            const eventoAtual = await this.obterEventoAtivo();
            const prazoEncerrado = await this.isPrazoInscricaoEncerrado(eventoAtual);
            if (!prazoEncerrado) {
                return { mensagem: 'Prazo de inscrição ainda não foi encerrado.', total_alunos_processados: 0, alunos_inseridos: [] };
            }

            const alunosSemProjetos = await this.obterAlunosSemProjetos();
            if (alunosSemProjetos.length === 0) {
                this.logger.log('✅ Todos os alunos já possuem projetos.');
                return { mensagem: 'Todos os alunos já possuem projetos.', total_alunos_processados: 0, alunos_inseridos: [] };
            }

            const inseridos = await this.criarRegistrosRelatorio(alunosSemProjetos, eventoAtual.id);
            this.logger.log(`🎯 Finalizado! ${inseridos.length} alunos inseridos.`);
            return {
                mensagem: `Processamento concluído. ${inseridos.length} alunos foram inseridos.`,
                total_alunos_processados: alunosSemProjetos.length,
                alunos_inseridos: inseridos,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            this.logger.error(`❌ Erro ao processar: ${errorMessage}`);
            throw error;
        }
    }

    onModuleInit() {
        this.logger.log('🚀 Servidor iniciado. Executando verificação inicial...');
        this.verificarAlunosSemProjetos()
            .then(() => this.logger.log('✅ Verificação inicial concluída.'))
            .catch((error) => this.logger.error(`❌ Erro na verificação inicial: ${error.message}`));
    }

    private async isPrazoInscricaoEncerrado(evento: Evento): Promise<boolean> {
        const prazoFinal = new Date(evento.inscricao?.fim || evento.prazoFinal);
        return prazoFinal && prazoFinal <= new Date();
    }

    private async obterAlunosSemProjetos(): Promise<User[]> {
        const alunosComProjetos = await this.userRepository
            .createQueryBuilder('user')
            .innerJoin('projeto_alunos', 'pa', 'pa.aluno_id = user.id')
            .where('user.role_cargo = :role', { role: 'aluno' })
            .andWhere('user.ativo = :ativo', { ativo: true })
            .getMany();

        const idsComProjetos = alunosComProjetos.map((a) => a.id);
        return this.userRepository
            .createQueryBuilder('user')
            .where('user.role_cargo = :role', { role: 'aluno' })
            .andWhere('user.ativo = :ativo', { ativo: true })
            .andWhere('user.id NOT IN (:...ids)', { ids: idsComProjetos.length ? idsComProjetos : [0] })
            .getMany();
    }

    private async criarRegistrosRelatorio(alunos: User[], eventoId: number) {
        const inseridos: Array<{
            id: number;
            nome: string;
            email: string;
            turma: string | null;
            relatorio_id: number;
        }> = [];
        for (const aluno of alunos) {
            const existe = await this.relatorioAlunoRepository.findOne({ where: { aluno_id: aluno.id, evento_id: eventoId } });
            if (existe) continue;

            const novo = this.relatorioAlunoRepository.create({
                aluno_id: aluno.id,
                evento_id: eventoId,
                quantidade_projetos: 0,
                status: StatusRelatorio.PENDENTE,
                data_ativacao: new Date(),
            });
            await this.relatorioAlunoRepository.save(novo);
            inseridos.push({ id: aluno.id, nome: aluno.nome, email: aluno.email_institucional, turma: aluno.turma, relatorio_id: novo.id });
        }
        return inseridos;
    }

    // ============================================================
    //               ATRIBUIÇÃO MANUAL (COM TRANSAÇÃO)
    // ============================================================

    async atribuirProjetosManualmente(relatorioId: number, projetosIds: number[]) {
        return await this.relatorioAlunoRepository.manager.transaction(async (manager) => {
            try {
                this.logger.log(`📌 Iniciando atribuição manual: relatorioId=${relatorioId}, projetosIds=[${projetosIds}]`);

                this.validarId(relatorioId);

                const relatorio = await manager.getRepository(RelatorioAluno).findOne({
                    where: { id: relatorioId },
                    relations: ['aluno', 'evento', 'projetosAtribuidos', 'projetosAtribuidos.projeto'],
                });
                if (!relatorio) throw new NotFoundException(`Registro com ID ${relatorioId} não encontrado.`);

                this.logger.log(`✅ Relatório encontrado. ID do relatório: ${relatorio.id}, aluno: ${relatorio.aluno.nome}`);

                if (!relatorio.id || !Number.isFinite(relatorio.id)) {
                    throw new BadRequestException('Erro interno: relatório sem identificação.');
                }

                // 🔒 Validação: não permite atribuir projetos se já finalizado ou enviado
                if (relatorio.status === StatusRelatorio.FINALIZADO || relatorio.status === StatusRelatorio.ENVIADO) {
                    throw new BadRequestException(
                        'Não é permitido atribuir projetos a um relatório finalizado ou já enviado.'
                    );
                }

                this.validarEventoAtivo(relatorio.evento);

                const projetos = await manager.getRepository(Projeto).find({
                    where: { id: In(projetosIds) },
                    relations: ['evento', 'alunoAutor'],
                });

                this.validarProjetosEncontrados(projetos, projetosIds);
                this.validarProjetosDoEvento(projetos, relatorio.evento.id);
                this.validarProjetosDuplicados(relatorio.projetosAtribuidos, projetosIds);
                this.validarLimiteProjetos(
                    relatorio.projetosAtribuidos.length,
                    projetosIds.length,
                    relatorio.quantidade_projetos,
                );

                await this.criarAtribuicoesBatch(relatorio.id, projetos, manager);

                const totalAtribuidos = relatorio.projetosAtribuidos.length + projetosIds.length;
                await this.atualizarStatusAluno(relatorio, totalAtribuidos >= relatorio.quantidade_projetos, manager);

                const atualizado = await manager.getRepository(RelatorioAluno).findOne({
                    where: { id: relatorioId },
                    relations: ['aluno', 'evento', 'projetosAtribuidos', 'projetosAtribuidos.projeto'],
                });

                return {
                    mensagem: 'Projetos atribuídos com sucesso.',
                    data: this.mapearRespostaRelatorio(atualizado!),
                };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logger.error(`❌ Erro em atribuirProjetosManualmente: ${errorMessage}`);

                if (error instanceof BadRequestException || error instanceof NotFoundException) {
                    throw error;
                }
                throw new BadRequestException({
                    message: `Erro ao atribuir projetos: ${errorMessage}`,
                });
            }
        });
    }

    async removerProjetosManualmente(relatorioId: number, projetosIds: number[]) {
        this.validarId(relatorioId);
        const relatorio = await this.buscarRelatorioComRelacoes(relatorioId, ['projetosAtribuidos', 'projetosAtribuidos.projeto']);

        // 🔒 Validação: não permite remover projetos se já finalizado ou enviado
        if (relatorio.status === StatusRelatorio.FINALIZADO || relatorio.status === StatusRelatorio.ENVIADO) {
            throw new BadRequestException(
                'Não é permitido remover projetos de um relatório finalizado ou já enviado.'
            );
        }

        const idsAtribuidos = relatorio.projetosAtribuidos.map((pa) => pa.projeto.id);
        const idsInvalidos = projetosIds.filter((id) => !idsAtribuidos.includes(id));
        if (idsInvalidos.length) {
            throw new BadRequestException(`Os projetos com IDs [${idsInvalidos.join(', ')}] não estão atribuídos.`);
        }

        const idsParaRemover = relatorio.projetosAtribuidos
            .filter((pa) => projetosIds.includes(pa.projeto.id))
            .map((pa) => pa.id);
        await this.alunoRelatorioProjetosRepository.delete(idsParaRemover);

        const totalRestante = idsAtribuidos.length - idsParaRemover.length;
        await this.atualizarStatusAluno(relatorio, totalRestante >= relatorio.quantidade_projetos, this.relatorioAlunoRepository.manager);

        const atualizado = await this.buscarRelatorioComRelacoes(relatorioId, ['projetosAtribuidos.projeto']);
        return { mensagem: 'Projetos removidos com sucesso.', data: this.mapearRespostaRelatorio(atualizado) };
    }

    private validarEventoAtivo(evento: Evento) {
        if (evento.status !== EventoStatus.ATIVO) throw new BadRequestException('O evento não está ativo.');
        if (new Date(evento.criadoEm).getFullYear() !== new Date().getFullYear()) throw new BadRequestException('O evento não pertence ao ano atual.');
    }

    private validarProjetosEncontrados(projetos: Projeto[], ids: number[]) {
        if (projetos.length !== ids.length) throw new NotFoundException('Um ou mais projetos não foram encontrados.');
    }

    private validarProjetosDoEvento(projetos: Projeto[], eventoId: number) {
        const invalido = projetos.find((p) => p.evento.id !== eventoId);
        if (invalido) throw new BadRequestException(`O projeto "${invalido.titulo}" não pertence ao evento atual.`);
    }

    private validarProjetosDuplicados(atribuidos: AlunoRelatorioProjetos[], novosIds: number[]) {
        const idsExistentes = atribuidos.map((pa) => pa.projeto.id);
        const duplicados = novosIds.filter((id) => idsExistentes.includes(id));
        if (duplicados.length) throw new BadRequestException(`Os projetos [${duplicados.join(', ')}] já estão atribuídos.`);
    }

    private validarLimiteProjetos(atual: number, adicionar: number, maximo: number) {
        if (atual + adicionar > maximo) {
            throw new BadRequestException(`O aluno já possui ${atual} projetos (máximo ${maximo}). Não é possível atribuir ${adicionar} adicionais.`);
        }
    }

    // ============================================================
    //               ATUALIZAÇÃO EM LOTE (COM TRANSAÇÃO)
    // ============================================================

    async atualizarQuantidadeEmLote(
        quantidade: number,
        geral: boolean,
        ids?: number[],
        forcarReducao?: boolean,
    ) {
        this.logger.log(`📦 [LOTE] Iniciando - geral: ${geral}, quantidade: ${quantidade}, forcarReducao: ${forcarReducao}`);
        if (quantidade < 0 || !Number.isFinite(quantidade)) {
            throw new BadRequestException('Quantidade deve ser um número não negativo.');
        }

        const eventoAtual = await this.obterEventoAtivo();

        return await this.relatorioAlunoRepository.manager.transaction(async (manager) => {
            const relatorios = await this.obterRelatoriosParaLote(eventoAtual.id, geral, ids, manager);

            // 🔒 Validação: não permite alterar quantidade se algum relatório já está finalizado ou enviado
            for (const relatorio of relatorios) {
                if (relatorio.status === StatusRelatorio.FINALIZADO || relatorio.status === StatusRelatorio.ENVIADO) {
                    throw new BadRequestException(
                        `Não é permitido alterar a quantidade de projetos de um relatório finalizado ou já enviado (aluno ${relatorio.aluno.nome}).`
                    );
                }
            }

            const alunosComExcesso = this.identificarAlunosComExcesso(relatorios, quantidade);

            if (alunosComExcesso.length > 0) {
                if (!forcarReducao) {
                    throw new BadRequestException({
                        error: 'ALUNOS_COM_EXCESSO',
                        message: `Não é possível definir a quantidade para ${quantidade} porque ${alunosComExcesso.length} aluno(s) possuem mais projetos atribuídos.`,
                        alunos: alunosComExcesso,
                    });
                }

                await this.removerProjetosExcedentes(relatorios, quantidade, manager);
                const idsRelatorios = relatorios.map((r) => r.id);
                const relatoriosAtualizados = await this.obterRelatoriosParaLote(eventoAtual.id, false, idsRelatorios, manager);
                const resultados = await this.atualizarRelatoriosEmMassa(relatoriosAtualizados, quantidade, manager);
                return {
                    mensagem: `${resultados.length} aluno(s) atualizado(s) com sucesso. Os projetos excedentes foram removidos.`,
                    quantidade_definida: quantidade,
                    alunos_atualizados: resultados,
                };
            }

            const resultados = await this.atualizarRelatoriosEmMassa(relatorios, quantidade, manager);
            return {
                mensagem: `${resultados.length} aluno(s) atualizado(s) com sucesso.`,
                quantidade_definida: quantidade,
                alunos_atualizados: resultados,
            };
        });
    }

    private async obterRelatoriosParaLote(eventoId: number, geral: boolean, ids?: number[], manager?: EntityManager) {
        const repo = manager ? manager.getRepository(RelatorioAluno) : this.relatorioAlunoRepository;
        if (geral) {
            return repo.find({
                where: { evento_id: eventoId },
                relations: ['aluno', 'projetosAtribuidos'],
            });
        }

        if (!ids?.length) throw new BadRequestException('É necessário fornecer uma lista de IDs quando geral = false.');
        const idsValidos = ids.map(Number).filter((id) => Number.isFinite(id) && id > 0);
        if (idsValidos.length === 0) throw new BadRequestException('IDs inválidos.');
        if (idsValidos.length < ids.length) this.logger.warn(`${ids.length - idsValidos.length} IDs inválidos ignorados.`);

        const relatorios = await repo.find({
            where: { id: In(idsValidos), evento_id: eventoId },
            relations: ['aluno', 'projetosAtribuidos'],
        });

        const idsEncontrados = relatorios.map((r) => r.id);
        const idsFaltantes = idsValidos.filter((id) => !idsEncontrados.includes(id));
        if (idsFaltantes.length) throw new NotFoundException(`Relatórios não encontrados: ${idsFaltantes.join(', ')}`);

        return relatorios;
    }

    private validarRelatoriosComExcesso(relatorios: RelatorioAluno[], novaQuantidade: number) {
        const comExcesso = relatorios
            .filter((r) => (r.projetosAtribuidos?.length || 0) > novaQuantidade)
            .map((r) => ({
                id: r.id,
                nome: r.aluno.nome,
                totalAtribuidos: r.projetosAtribuidos?.length || 0,
                faltam: (r.projetosAtribuidos?.length || 0) - novaQuantidade,
            }));

        if (comExcesso.length > 0) {
            const descricao = comExcesso
                .map((a) => `${a.nome} (ID ${a.id}): possui ${a.totalAtribuidos} projeto(s), remova ${a.faltam}`)
                .join('; ');
            throw new BadRequestException(
                `Não é possível definir a quantidade para ${novaQuantidade}. Alunos com excesso: ${descricao}.`
            );
        }
    }

    private async atualizarRelatoriosEmMassa(relatorios: RelatorioAluno[], quantidade: number, manager?: EntityManager) {
        const repo = manager ? manager.getRepository(RelatorioAluno) : this.relatorioAlunoRepository;
        const resultados: Array<{
            id: number;
            aluno: { id: number; nome: string; email: string; turma: string | null };
            quantidade_projetos: number;
            total_atribuidos: number;
            status: StatusRelatorio;
        }> = [];
        for (const relatorio of relatorios) {
            const totalAtribuidos = relatorio.projetosAtribuidos?.length || 0;
            relatorio.quantidade_projetos = quantidade;
            relatorio.status = totalAtribuidos >= quantidade ? StatusRelatorio.DISTRIBUIDO : StatusRelatorio.PENDENTE;
            await repo.save(relatorio);
            resultados.push({
                id: relatorio.id,
                aluno: {
                    id: relatorio.aluno.id,
                    nome: relatorio.aluno.nome,
                    email: relatorio.aluno.email_institucional,
                    turma: relatorio.aluno.turma,
                },
                quantidade_projetos: quantidade,
                total_atribuidos: totalAtribuidos,
                status: relatorio.status,
            });
        }
        return resultados;
    }

    private identificarAlunosComExcesso(relatorios: RelatorioAluno[], novaQuantidade: number) {
        return relatorios
            .filter((r) => (r.projetosAtribuidos?.length || 0) > novaQuantidade)
            .map((r) => ({
                id: r.id,
                nome: r.aluno.nome,
                totalAtribuidos: r.projetosAtribuidos?.length || 0,
                faltam: (r.projetosAtribuidos?.length || 0) - novaQuantidade,
            }));
    }

    private async removerProjetosExcedentes(relatorios: RelatorioAluno[], novaQuantidade: number, manager?: EntityManager) {
        const repo = manager ? manager.getRepository(AlunoRelatorioProjetos) : this.alunoRelatorioProjetosRepository;
        for (const relatorio of relatorios) {
            const totalAtribuidos = relatorio.projetosAtribuidos?.length || 0;
            if (totalAtribuidos > novaQuantidade) {
                const ordenados = relatorio.projetosAtribuidos.sort(
                    (a, b) => a.data_atribuicao.getTime() - b.data_atribuicao.getTime(),
                );
                const idsParaRemover = ordenados
                    .slice(novaQuantidade)
                    .map((p) => p.id);
                await repo.delete(idsParaRemover);
                this.logger.log(
                    `🗑️ Removidos ${idsParaRemover.length} projetos excedentes do aluno ${relatorio.aluno.nome} (ID ${relatorio.id})`,
                );
            }
        }
    }

    // ============================================================
    //               PROJETOS DISPONÍVEIS
    // ============================================================

    async obterProjetosDisponiveis(relatorioId: number, search?: string) {
        const relatorio = await this.buscarRelatorioComRelacoes(relatorioId, ['projetosAtribuidos', 'projetosAtribuidos.projeto']);

        const idsAtribuidos = relatorio.projetosAtribuidos.map((pa) => pa.projeto.id);
        const query = this.projetoRepository
            .createQueryBuilder('projeto')
            .leftJoinAndSelect('projeto.alunoAutor', 'alunoAutor')
            .leftJoinAndSelect('projeto.tema', 'tema')
            .where('projeto.evento_id = :eventoId', { eventoId: relatorio.evento.id });

        if (idsAtribuidos.length) {
            query.andWhere('projeto.id NOT IN (:...ids)', { ids: idsAtribuidos });
        }

        if (search?.trim()) {
            const termo = `%${search.trim().toLowerCase()}%`;
            query.andWhere(
                '(LOWER(projeto.titulo) LIKE :termo OR LOWER(projeto.descricao) LIKE :termo OR LOWER(alunoAutor.nome) LIKE :termo)',
                { termo }
            );
        }

        return query.orderBy('projeto.titulo', 'ASC').getMany();
    }

    async enviarMaterialRelatorio(
        alunoId: number,
        tipo: TipoRelatorioMaterial,
        conteudo: string,
        file?: Express.Multer.File,
    ) {
        const evento = await this.obterEventoAtivo();
        const relatorio = await this.relatorioAlunoRepository.findOne({
            where: { aluno_id: alunoId, evento_id: evento.id },
            relations: ['aluno'],
        });
        if (!relatorio) throw new NotFoundException('Aluno não encontrado na modalidade relatório.');

        // Permite envio enquanto o status for 'distribuido' ou 'enviado'
        if (relatorio.status !== StatusRelatorio.DISTRIBUIDO && relatorio.status !== StatusRelatorio.ENVIADO) {
            throw new BadRequestException('Status atual não permite envio.');
        }

        const existente = await this.relatorioMaterialRepository.findOne({
            where: { aluno_relatorio_id: relatorio.id, tipo },
        });
        if (existente) throw new ConflictException(`Material do tipo '${tipo}' já enviado.`);

        let conteudoFinal = conteudo;
        if (tipo === TipoRelatorioMaterial.PDF && file) {
            // Novo método encapsula upload, permissão e nome do arquivo
            const uploadResult = await this.googleDriveService.uploadRelatorioPdf(
                file,
                relatorio.aluno.nome,
                alunoId,
            );
            conteudoFinal = uploadResult.previewLink;
        }

        const material = this.relatorioMaterialRepository.create({
            aluno_relatorio_id: relatorio.id,
            tipo,
            conteudo: conteudoFinal,
            status: StatusRelatorioMaterial.ENVIADO,
        });
        await this.relatorioMaterialRepository.save(material);

        // Se ambos os materiais (vídeo + PDF) já existirem, marca como enviado
        const totalMateriais = await this.relatorioMaterialRepository.count({
            where: { aluno_relatorio_id: relatorio.id },
        });

        if (totalMateriais >= 2) {
            await this.relatorioAlunoRepository.update(relatorio.id, {
                status: StatusRelatorio.ENVIADO,
                data_envio: new Date(),
            });
        } else if (relatorio.status !== StatusRelatorio.DISTRIBUIDO) {
            await this.relatorioAlunoRepository.update(relatorio.id, {
                status: StatusRelatorio.DISTRIBUIDO,
            });
        }

        return {
            mensagem: 'Material enviado com sucesso!',
            material: {
                id: material.id,
                tipo: material.tipo,
                conteudo: material.conteudo,
                criadoEm: material.criadoEm,
            },
        };
    }

    async cancelarMaterialRelatorio(materialId: number, alunoId: number) {
        const material = await this.relatorioMaterialRepository.findOne({
            where: { id: materialId },
            relations: ['relatorioAluno'],
        });
        if (!material) throw new NotFoundException('Material não encontrado.');
        if (material.relatorioAluno.aluno_id !== alunoId) {
            throw new ForbiddenException('Material não pertence ao aluno.');
        }

        if (material.relatorioAluno.status === StatusRelatorio.FINALIZADO) {
            throw new BadRequestException('Não é possível cancelar um material de um relatório já finalizado.');
        }


        const agora = new Date();
        const tempo = agora.getTime() - new Date(material.criadoEm).getTime();
        if (tempo > 24 * 60 * 60 * 1000) throw new BadRequestException('Prazo de 24h expirado.');

        if (material.tipo === TipoRelatorioMaterial.PDF) {
            try {
                const url = new URL(material.conteudo);
                const fileId = url.pathname.split('/')[3];
                if (fileId) {
                    await this.googleDriveService.deleteFile(fileId);
                }
            } catch (err) {
                this.logger.warn(`Não foi possível remover o arquivo do Drive: ${err.message}`);
            }
        }

        await this.relatorioMaterialRepository.remove(material);

        const totalRestante = await this.relatorioMaterialRepository.count({
            where: { aluno_relatorio_id: material.aluno_relatorio_id },
        });

        if (totalRestante < 2) {
            await this.relatorioAlunoRepository.update(material.aluno_relatorio_id, {
                status: StatusRelatorio.DISTRIBUIDO,
                data_envio: undefined,
            });
        }

        return { mensagem: 'Material cancelado.' };
    }

    async meusMateriais(alunoId: number) {
        const evento = await this.obterEventoAtivo();
        const relatorio = await this.relatorioAlunoRepository.findOne({
            where: { aluno_id: alunoId, evento_id: evento.id },
        });
        if (!relatorio) throw new NotFoundException('Aluno não encontrado na modalidade relatório.');

        const materiais = await this.relatorioMaterialRepository.find({
            where: { aluno_relatorio_id: relatorio.id },
        });

        const video = materiais.find(m => m.tipo === TipoRelatorioMaterial.LINK);
        const pdf = materiais.find(m => m.tipo === TipoRelatorioMaterial.PDF);

        return {
            video: video ? {
                materialId: video.id,
                status: video.status,
                opiniao: video.opiniao ?? null,
            } : null,
            pdf: pdf ? {
                materialId: pdf.id,
                status: pdf.status,
                opiniao: pdf.opiniao ?? null,
                projetoId: pdf.aluno_relatorio_id,
            } : null,
        };
    }

    async listarMateriaisCoordenador(filtros: {
        status?: StatusRelatorio;
        nome?: string;
        page: number;
        limit: number;
    }) {
        const { status, nome, page, limit } = filtros;
        const eventoAtual = await this.obterEventoAtivo();

        const query = this.relatorioAlunoRepository
            .createQueryBuilder('relatorio')
            .leftJoinAndSelect('relatorio.aluno', 'aluno')
            .leftJoinAndSelect('relatorio.materiais', 'materiais')
            .where('relatorio.evento_id = :eventoId', { eventoId: eventoAtual.id })
            .andWhere('materiais.id IS NOT NULL');

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
            relatorioId: relatorio.id,
            aluno: {
                id: relatorio.aluno.id,
                nome: relatorio.aluno.nome,
                turma: relatorio.aluno.turma,
            },
            statusRelatorio: relatorio.status,
            materiais: this.mapearMateriais(relatorio.materiais),
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

    private extrairGoogleDriveFileId(url: string): string | null {
        const match = url.match(/\/d\/([^/]+)/);
        return match ? match[1] : null;
    }

    async obterPdfMaterial(materialId: number): Promise<{ buffer: Buffer; nomeArquivo: string }> {
        const material = await this.relatorioMaterialRepository.findOne({
            where: { id: materialId, tipo: TipoRelatorioMaterial.PDF },
        });
        if (!material) {
            throw new NotFoundException('Material PDF não encontrado.');
        }

        const fileId = this.extrairGoogleDriveFileId(material.conteudo);
        if (!fileId) {
            throw new BadRequestException('Não foi possível identificar o arquivo no Google Drive.');
        }

        const buffer = await this.googleDriveService.downloadFile(fileId);
        const nomeArquivo = `relatorio_${material.aluno_relatorio_id}.pdf`;
        return { buffer, nomeArquivo };
    }

    async devolverMaterialCoordenador(materialId: number, opiniao: string) {
        const material = await this.relatorioMaterialRepository.findOne({ where: { id: materialId }, relations: ['relatorioAluno'], });
        if (!material) throw new NotFoundException('Material não encontrado.');
        if (material.status === StatusRelatorioMaterial.DEVOLVIDO) {
            throw new BadRequestException('Material já foi devolvido.');
        }

        if (material.relatorioAluno.status === StatusRelatorio.FINALIZADO) {
            throw new BadRequestException('Não é possível devolver um material de um relatório já finalizado.');
        }


        material.status = StatusRelatorioMaterial.DEVOLVIDO;
        material.opiniao = opiniao;
        await this.relatorioMaterialRepository.save(material);
        return { mensagem: 'Material devolvido com sucesso.', opiniao };
    }

    async finalizarAvaliacao(relatorioId: number): Promise<{ mensagem: string; data: any }> {
        const relatorio = await this.relatorioAlunoRepository.findOne({
            where: { id: relatorioId },
            relations: ['aluno', 'evento', 'materiais'],
        });

        if (!relatorio) {
            throw new NotFoundException('Relatório não encontrado.');
        }

        if (relatorio.status !== StatusRelatorio.ENVIADO && relatorio.status !== StatusRelatorio.DISTRIBUIDO) {
            throw new BadRequestException(
                `Não é possível finalizar um relatório com status "${relatorio.status}". Apenas relatórios com materiais enviados podem ser finalizados.`
            );
        }

        if (!relatorio.materiais || relatorio.materiais.length === 0) {
            throw new BadRequestException('O aluno ainda não enviou nenhum material.');
        }

        relatorio.status = StatusRelatorio.FINALIZADO;
        relatorio.data_envio = relatorio.data_envio || new Date();
        await this.relatorioAlunoRepository.save(relatorio);

        return {
            mensagem: 'Relatório finalizado com sucesso!',
            data: {
                id: relatorio.id,
                aluno: {
                    id: relatorio.aluno.id,
                    nome: relatorio.aluno.nome,
                    turma: relatorio.aluno.turma,
                },
                status: relatorio.status,
                data_envio: relatorio.data_envio,
            },
        };
    }
}