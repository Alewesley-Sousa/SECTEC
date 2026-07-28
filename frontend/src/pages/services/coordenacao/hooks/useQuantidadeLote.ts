import { useState } from 'react';
import Swal from 'sweetalert2';
import { atualizarQuantidadeEmLote } from '../relatorios';

interface AlunoComExcesso {
    id: number;
    nome: string;
    totalAtribuidos: number;
    faltam: number;
}

export function useQuantidadeLote(onSuccess: () => void) {
    const [modalAberto, setModalAberto] = useState(false);
    const [quantidade, setQuantidade] = useState<number>(1);
    const [aplicarParaTodos, setAplicarParaTodos] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [alunosComExcesso, setAlunosComExcesso] = useState<AlunoComExcesso[]>([]);
    const [concordouReducao, setConcordouReducao] = useState(false);

    const abrir = () => {
        setAlunosComExcesso([]);
        setConcordouReducao(false);
        setModalAberto(true);
    };
    const fechar = () => setModalAberto(false);

    const salvar = async (force = false) => {
        if (quantidade < 0) {
            Swal.fire('Atenção', 'Digite um número válido.', 'warning');
            return;
        }
        if (!aplicarParaTodos) {
            Swal.fire('Atenção', 'A seleção individual ainda não está implementada.', 'warning');
            return;
        }

        setSalvando(true);
        try {
            const resultado = await atualizarQuantidadeEmLote(
                quantidade,
                true,
                undefined,
                force ? true : undefined
            );
            Swal.fire('Sucesso', resultado.mensagem, 'success');
            fechar();
            onSuccess();
        } catch (error: any) {
            // Acessa diretamente a resposta da API (Axios: error.response.data)
            // Se sua biblioteca for fetch wrapper, substitua por error.data
            const responseData = error?.data || error?.response?.data;
            if (
                responseData &&
                responseData.error === 'ALUNOS_COM_EXCESSO' &&
                Array.isArray(responseData.alunos)
            ) {
                // Ativa o alerta com checkbox no modal
                setAlunosComExcesso(responseData.alunos);
                setConcordouReducao(false);
            } else {
                // Erro genérico (mostra Swal)
                const mensagem =
                    responseData?.message ||
                    error?.data?.message ||
                    error?.message ||
                    'Não foi possível atualizar a quantidade.';
                Swal.fire('Erro', typeof mensagem === 'string' ? mensagem : 'Erro desconhecido.', 'error');
            }
        } finally {
            setSalvando(false);
        }
    };

    return {
        modalAberto, quantidade, setQuantidade,
        aplicarParaTodos, setAplicarParaTodos, salvando,
        abrir, fechar, salvar,
        alunosComExcesso, concordouReducao, setConcordouReducao,
    };
}