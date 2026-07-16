// src/services/coordenacao/relatorios.ts
import { apiRequest } from '../../../lib/api';

// Tipos específicos (se não estiverem em types.ts)
export type AlunoRelatorioItem = {
    id: number;
    aluno: {
        id: number;
        nome: string;
        email: string;
        turma: string;
    };
    status: string; // 'pendente' | 'distribuido' | 'finalizado'
    quantidade_projetos: number;
    projetos_atribuidos: Array<{
        id: number;
        titulo: string;
        area: string;
        visualizado: boolean;
        data_atribuicao: string;
    }>;
    data_ativacao: string;
    data_envio: string | null;
    created_at: string;
};

type ListarAlunosResponse = {
    data: AlunoRelatorioItem[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
};

/**
 * Lista alunos da modalidade relatório com filtros e paginação
 */
export async function listarAlunosRelatorio(params: {
    status?: string;
    nome?: string;
    page?: number;
    limit?: number;
}): Promise<ListarAlunosResponse> {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.nome) query.append('nome', params.nome);
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));
    const url = `/relatorio-aluno/coordenador/alunos-relatorio${query.toString() ? '?' + query.toString() : ''}`;
    return apiRequest<ListarAlunosResponse>(url);
}

/**
 * Atualiza a quantidade de projetos de um aluno
 */
export async function atualizarQuantidadeProjetos(relatorioId: number, quantidade: number) {
    return apiRequest(`/relatorio-aluno/coordenador/alunos-relatorio/${relatorioId}`, {
        method: 'PUT',
        body: { quantidade_projetos: quantidade },
    });
}

export type DistribuirProjetosResponse = {
    mensagem: string;
    total_alunos?: number;
    total_projetos_atribuidos?: number;
    alunos_nao_atendidos?: Array<{
        aluno_id: number;
        aluno_nome: string;
        quantidade_necessaria: number;
        quantidade_recebida: number;
        faltam: number;
    }>;
    alunos_processados?: any[];
};

export async function distribuirProjetos(): Promise<DistribuirProjetosResponse> {
    return apiRequest<DistribuirProjetosResponse>(
        '/relatorio-aluno/coordenador/alunos-relatorio/distribuir',
        { method: 'POST' }
    );
}

export type AtribuirProjetosResponse = {
  mensagem: string;
  data: {
    id: number;
    aluno: { id: number; nome: string; email: string; turma: string };
    quantidade_projetos: number;
    total_atribuidos: number;
    status: string;
    projetos: Array<{
      id: number;
      titulo: string;
      area: string;
      visualizado: boolean;
      data_atribuicao: string;
    }>;
  };
};

export async function atribuirProjetosManualmente(
  relatorioId: number,
  projetosIds: number[]
): Promise<AtribuirProjetosResponse> {
  return apiRequest<AtribuirProjetosResponse>(
    `/relatorio-aluno/coordenador/${relatorioId}/projetos`,
    { method: 'POST', body: { projetosIds } }
  );
}


export type RemoverProjetosResponse = {
  mensagem: string;
  data: {
    id: number;
    aluno: { id: number; nome: string; email: string; turma: string };
    quantidade_projetos: number;
    total_atribuidos: number;
    status: string;
    projetos: Array<{
      id: number;
      titulo: string;
      area: string;
      visualizado: boolean;
      data_atribuicao: string;
    }>;
  };
};

export async function removerProjetosManualmente(
    relatorioId: number,
    projetosIds: number[]
): Promise<RemoverProjetosResponse> {
    return apiRequest<RemoverProjetosResponse>(
    `/relatorio-aluno/coordenador/${relatorioId}/projetos`,
    { method: 'DELETE', body: { projetosIds } }
);
}




export type AtualizarQuantidadeEmLoteResponse = {
    mensagem: string;
    quantidade_definida: number;
    alunos_atualizados: Array<{
        id: number;
        aluno: { id: number; nome: string; email: string; turma: string };
        quantidade_projetos: number;
        total_atribuidos: number;
        status: string;
    }>;
};

export async function atualizarQuantidadeEmLote(
    quantidade: number,
    geral: boolean,
    ids?: number[]
): Promise<AtualizarQuantidadeEmLoteResponse> {
    return apiRequest<AtualizarQuantidadeEmLoteResponse>(
        '/relatorio-aluno/coordenador/alunos-relatorio/quantidade',
        { method: 'PUT', body: { quantidade_projetos: quantidade, geral, ids } }
    );
}



export type ProjetoDisponivel = {
  id: number;
  titulo: string;
  descricao?: string;
  tema?: { id: number; nome: string } | null;
  alunoAutor?: {
    id: number;
    nome: string;
    turma: string;
  } | null;
};

export async function obterProjetosDisponiveis(
  relatorioId: number,
  search?: string
): Promise<ProjetoDisponivel[]> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  const url = `/relatorio-aluno/coordenador/${relatorioId}/projetos-disponiveis${params.toString() ? '?' + params.toString() : ''}`;
  return apiRequest<ProjetoDisponivel[]>(url);
}

// src/services/coordenacao/relatorios.ts

