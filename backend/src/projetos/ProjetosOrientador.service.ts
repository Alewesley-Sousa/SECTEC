import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { AuditoriaService } from 'src/auditoria/auditoria.service';
import { TemaEvento } from 'src/evento/entities/tema-evento.entity';
import { User, UserRole } from 'src/users/entities/user.entity';
import { Projeto } from './entities/projeto.entity';
import { ProjetoOrientador } from './entities/projeto-orientador.entity';

@Injectable()
export class ProjetosOrientadorService {
    constructor(
        @InjectRepository(Projeto)
        private readonly projetoRepository: Repository<Projeto>,

        @InjectRepository(ProjetoOrientador)
        private readonly projetoOrientadorRepository: Repository<ProjetoOrientador>,

        @InjectRepository(TemaEvento)
        private readonly temaEventoRepository: Repository<TemaEvento>,

        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        private readonly dataSource: DataSource,
        private readonly auditoriaService: AuditoriaService,
    ) { }

    // --------------------------------------------------
    // MÉTODOS PÚBLICOS (serão chamados pelo ProjetosService ou Controller)
    // --------------------------------------------------

    /**
     * Processa o envio em lote de convites de orientação para múltiplos professores.
     */
    async enviarMultiplasSolicitacoes(userId: number, orientadoresIds: number[]) {
        const resultados: {
            orientadorId: number;
            status: string;
            motivo?: string;
            solicitacaoId?: number;
        }[] = [];

        const projeto = await this.getUltimoProjetoDoAluno(userId);

        for (const orientadorId of orientadoresIds) {
            try {
                const professorValido = await this.verificarSeEProfessor(orientadorId);

                if (!professorValido) {
                    resultados.push({
                        orientadorId,
                        status: 'pulado',
                        motivo: 'Usuário não é um orientador válido.',
                    });
                    continue;
                }

                const solicitacao = await this.enviarSolicitacaoIndividual(
                    projeto,
                    userId,
                    orientadorId,
                );
                resultados.push({
                    orientadorId,
                    status: 'sucesso',
                    solicitacaoId: solicitacao.id,
                });
            } catch (error) {
                resultados.push({
                    orientadorId,
                    status: 'erro',
                    motivo:
                        error instanceof Error
                            ? error.message
                            : 'Erro interno ao processar este ID.',
                });
            }
        }

        return { projetoId: projeto.id, resumo: resultados };
    }

    async gerenciarOrientador(
        projetoId: number,
        orientadorId: number,
        userId: number,
        role: string,
    ): Promise<Projeto> {
        if (role !== UserRole.COORDENACAO) {
            throw new ForbiddenException(
                'Apenas coordenadores podem gerenciar o orientador do projeto.',
            );
        }

        await this.ensureProjetoExiste(projetoId);
        await this.ensureUserIsActiveOrientador(orientadorId);

        const vinculosAtivos = await this.projetoOrientadorRepository.find({
            where: {
                projeto: { id: projetoId },
                status: In(['pendente', 'aceito']),
            },
            relations: ['orientador'],
        });

        if (vinculosAtivos.some((v) => v.orientador.id === orientadorId)) {
            throw new BadRequestException('Este orientador já está vinculado ao projeto.');
        }

        const vinculoExistente = await this.projetoOrientadorRepository.findOne({
            where: { projeto: { id: projetoId }, orientador: { id: orientadorId } },
        });

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const agora = new Date();

            for (const vinculo of vinculosAtivos) {
                vinculo.status = 'recusado';
                vinculo.respondidoEm = agora;
                await queryRunner.manager.save(ProjetoOrientador, vinculo);
            }

            if (vinculoExistente) {
                vinculoExistente.status = 'aceito';
                vinculoExistente.respondidoEm = agora;
                await queryRunner.manager.save(ProjetoOrientador, vinculoExistente);
            } else {
                const novoVinculo = queryRunner.manager.create(ProjetoOrientador, {
                    projeto: { id: projetoId },
                    orientador: { id: orientadorId },
                    status: 'aceito',
                    respondidoEm: agora,
                });
                await queryRunner.manager.save(ProjetoOrientador, novoVinculo);
            }

            await queryRunner.commitTransaction();

            await this.auditoriaService.registrar(
                userId,
                vinculosAtivos.length > 0
                    ? 'PROJETO_ORIENTADOR_TROCADO'
                    : 'PROJETO_ORIENTADOR_ADICIONADO',
                `Orientador #${orientadorId} vinculado como aceito ao projeto #${projetoId} por coordenador #${userId}.`,
                projetoId,
            );

            const projeto = await this.projetoRepository.findOne({ where: { id: projetoId } });
            if (!projeto) {
                throw new NotFoundException(`Projeto #${projetoId} não encontrado após a operação.`);
            }
            return projeto;
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    async removerOrientador(
        projetoId: number,
        userId: number,
        role: string,
    ): Promise<Projeto> {
        if (role !== UserRole.COORDENACAO) {
            throw new ForbiddenException(
                'Apenas coordenadores podem remover o orientador do projeto.',
            );
        }

        await this.ensureProjetoExiste(projetoId);

        const vinculosAtivos = await this.projetoOrientadorRepository.find({
            where: {
                projeto: { id: projetoId },
                status: In(['pendente', 'aceito']),
            },
            relations: ['orientador'],
        });

        if (vinculosAtivos.length === 0) {
            throw new NotFoundException(
                'Este projeto não possui orientador ativo para remover.',
            );
        }

        const agora = new Date();
        for (const vinculo of vinculosAtivos) {
            vinculo.status = 'recusado';
            vinculo.respondidoEm = agora;
        }
        await this.projetoOrientadorRepository.save(vinculosAtivos);

        await this.auditoriaService.registrar(
            userId,
            'PROJETO_ORIENTADOR_REMOVIDO',
            `Orientador(es) [${vinculosAtivos.map((v) => v.orientador.id).join(', ')}] removido(s) logicamente do projeto #${projetoId} por coordenador #${userId}.`,
            projetoId,
        );

        const projeto = await this.projetoRepository.findOne({ where: { id: projetoId } });
        if (!projeto) {
            throw new NotFoundException(`Projeto #${projetoId} não encontrado após a operação.`);
        }
        return projeto;
    }

    /**
     * Busca o orientador que aceitou a solicitação para um projeto específico.
     */
    async getOrientadorAceitoByProjetoId(
        projetoId: number,
    ): Promise<ProjetoOrientador | null> {
        const vinculo = await this.projetoOrientadorRepository.findOne({
            where: {
                projeto: { id: projetoId },
                status: 'aceito',
            },
            relations: ['orientador'],
            select: {
                id: true,
                status: true,
                respondidoEm: true,
                orientador: {
                    id: true,
                    nome: true,
                    email_institucional: true,
                },
            },
        });

        if (!vinculo) {
            throw new NotFoundException(
                `Nenhum orientador aceitou o projeto #${projetoId} ainda.`,
            );
        }

        return vinculo;
    }

    // --------------------------------------------------
    // MÉTODOS PRIVADOS DE VALIDAÇÃO E SUPORTE
    // --------------------------------------------------

    /**
     * Envia uma solicitação individual para um orientador, após validar tema e duplicidade.
     */
    private async enviarSolicitacaoIndividual(
        projeto: Projeto,
        userId: number,
        orientadorId: number,
    ): Promise<ProjetoOrientador> {
        await this.validarTemaNoEvento(projeto.temaId, projeto.evento.id);
        await this.validarOrientadorSelecionouTema(projeto.temaId, orientadorId);
        await this.validarSolicitacaoDuplicada(projeto.id, orientadorId);

        const novaSolicitacao = this.projetoOrientadorRepository.create({
            projeto: { id: projeto.id },
            orientador: { id: orientadorId },
            status: 'pendente',
        });

        const solicitacao = await this.projetoOrientadorRepository.save(novaSolicitacao);

        await this.auditoriaService.registrar(
            userId,
            'ORIENTADOR_SOLICITADO',
            `Solicitação enviada ao orientador #${orientadorId} para o projeto #${projeto.id}.`,
            projeto.id,
        );

        return solicitacao;
    }

    private async validarTemaNoEvento(temaId: number, eventoId: number) {
        const existe = await this.temaEventoRepository.exists({
            where: { id: temaId, evento: { id: eventoId } },
        });

        if (!existe) {
            throw new BadRequestException(
                'O tema do projeto não está disponível para este evento.',
            );
        }
    }

    private async validarOrientadorSelecionouTema(
        temaId: number,
        orientadorId: number,
    ) {
        const orientadorEscolheuTema = await this.temaEventoRepository
            .createQueryBuilder('tema')
            .innerJoin(
                'tema.orientadores',
                'orientador',
                'orientador.id = :orientadorId',
                { orientadorId },
            )
            .where('tema.id = :temaId', { temaId })
            .getExists();

        if (!orientadorEscolheuTema) {
            throw new BadRequestException(
                'Este orientador não selecionou o eixo temático do projeto.',
            );
        }
    }

    private async validarSolicitacaoDuplicada(
        projetoId: number,
        orientadorId: number,
    ) {
        const solicitacao = await this.projetoOrientadorRepository.findOne({
            where: {
                projeto: { id: projetoId },
                orientador: { id: orientadorId },
            },
        });

        if (!solicitacao) return;

        const mensagensErro: Record<string, string> = {
            pendente: 'Já existe uma solicitação pendente para este orientador.',
            aceito: 'Este orientador já aceitou orientar este projeto.',
            recusado:
                'Este orientador já recusou este projeto. Escolha um novo orientador.',
        };

        const erro = mensagensErro[solicitacao.status];
        if (erro) throw new BadRequestException(erro);
    }

    private async ensureUserIsActiveOrientador(orientadorId: number) {
        const orientador = await this.userRepository.findOne({
            where: {
                id: orientadorId,
                role_cargo: UserRole.ORIENTADOR,
                ativo: true,
            },
            select: ['id'],
        });

        if (!orientador) {
            throw new BadRequestException('Orientador inválido ou inativo.');
        }
    }

    private async verificarSeEProfessor(id: number): Promise<boolean> {
        const user = await this.userRepository.findOne({
            where: { id, role_cargo: UserRole.ORIENTADOR },
        });
        return !!user;
    }

    private async getUltimoProjetoDoAluno(userId: number): Promise<Projeto> {
        const projeto = await this.projetoRepository.findOne({
            where: { alunoAutor: { id: userId } },
            order: { criadoEm: 'DESC' },
            relations: ['evento', 'tema'],
        });

        if (!projeto) {
            throw new NotFoundException(
                'Você ainda não possui nenhum projeto cadastrado.',
            );
        }

        return projeto;
    }

    private async ensureProjetoExiste(projetoId: number): Promise<void> {
        const existe = await this.projetoRepository.exists({
            where: { id: projetoId },
        });
        if (!existe) {
            throw new NotFoundException(`Projeto #${projetoId} não encontrado.`);
        }
    }
}