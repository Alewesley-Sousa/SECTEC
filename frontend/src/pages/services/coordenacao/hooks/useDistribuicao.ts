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
      Swal.fire('Sucesso', mensagem, 'info');
    } catch {
      Swal.fire('Erro', 'Falha ao distribuir projetos.', 'error');
    } finally {
      setDistribuindo(false);
    }
  };

  return { distribuindo, handleDistribuir };
}