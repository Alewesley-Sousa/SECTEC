// hooks/useQuantidadeIndividual.ts
import { useState } from 'react';
import Swal from 'sweetalert2';
import { atualizarQuantidadeProjetos } from '../relatorios';
import { formatarMensagemErroQuantidade } from '../utils/formatarMensagemErro';

export function useQuantidadeIndividual(onSuccess: () => void) {
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [novoValor, setNovoValor] = useState<number | null>(null);

  const salvar = async (id: number) => {
    if (novoValor === null || novoValor < 0) {
      Swal.fire('Atenção', 'Digite um número válido.', 'warning');
      return;
    }
    try {
      await atualizarQuantidadeProjetos(id, novoValor);
      await onSuccess();
      setEditandoId(null);
      setNovoValor(null);
      Swal.fire('Sucesso', 'Quantidade atualizada!', 'success');
    } catch (error: any) {
      let mensagem = error?.response?.data?.message || error?.message || 'Não foi possível atualizar.';
      const conteudoHtml = mensagem.includes('Não é possível reduzir')
        ? formatarMensagemErroQuantidade(mensagem)
        : `<div style="font-size:14px; color:#475569; line-height:1.5;">${mensagem}</div>`;
      Swal.fire({
        title: 'Ação não permitida',
        html: conteudoHtml,
        icon: 'error',
        confirmButtonColor: '#0f766e',
      });
    }
  };

  return {
    editandoId, novoValor, setEditandoId, setNovoValor,
    salvar,
  };
}