import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RelatorioAluno, StatusRelatorio } from './entities/relatorio-aluno.entity';
import { Evento } from '../evento/entities/evento.entity';
import { CreateRelatorioAlunoDto, UpdateRelatorioAlunoDto, ListarRelatorioAlunoDto } from './dto';

@Injectable()
export class RelatorioAlunoService {
    constructor(
        @InjectRepository(RelatorioAluno)
        private relatorioAlunoRepository: Repository<RelatorioAluno>,
        @InjectRepository(Evento)
        private eventoRepository: Repository<Evento>,
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
}