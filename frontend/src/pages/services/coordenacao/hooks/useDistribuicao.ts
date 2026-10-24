// hooks/useDistribuicao.ts
import { useState } from 'react';
import Swal from 'sweetalert2';
import { distribuirProjetos } from '../relatorios';

export function useDistribuicao(onSuccess: () => void) {
  const [distribuindo, setDistribuindo] = useState(false);

  const handleDistribuir = async () => {
    const confirm = await Swal.fire({
      title: 'Distribuir projetos?',
      text: 'Isso vai atribuir projetos automaticamente para todos os alunos pendentes.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sim, distribuir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#15803d', // 👈 Verde do SECTEC
      cancelButtonColor: '#64748b',  // 👈 Cinza para o cancelar
    });
    if (!confirm.isConfirmed) return;

    setDistribuindo(true);
    try {
      const resultado = await distribuirProjetos();
      await onSuccess();
      let mensagem = 'Distribuição concluída!';
      if (resultado.alunos_nao_atendidos?.length) {
        mensagem += ` Atenção: ${resultado.alunos_nao_atendidos.length} alunos não receberam todos os projetos.`;
      }
      Swal.fire({
        title: 'Sucesso',
        text: mensagem,
        icon: 'info',
        confirmButtonColor: '#15803d' // 👈 Verde também no alerta de sucesso
      });
    } catch {
      Swal.fire({
        title: 'Erro',
        text: 'Falha ao distribuir projetos.',
        icon: 'error',
        confirmButtonColor: '#15803d' // 👈 Verde também no alerta de erro
      });
    } finally {
      setDistribuindo(false);
    }
  };

  return { distribuindo, handleDistribuir };
}