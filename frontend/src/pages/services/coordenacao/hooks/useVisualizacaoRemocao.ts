import { useState } from 'react';
import Swal from 'sweetalert2';
import { removerProjetosManualmente, type AlunoRelatorioItem } from '../relatorios';

export function useVisualizacaoRemocao() {
  const [modalAberto, setModalAberto] = useState(false);
  const [aluno, setAluno] = useState<AlunoRelatorioItem | null>(null);
  const [removendoId, setRemovendoId] = useState<number | null>(null);
  const [selecionados, setSelecionados] = useState<number[]>([]);

  const abrir = (item: AlunoRelatorioItem) => {
    setAluno(item);
    setSelecionados([]);
    setModalAberto(true);
  };

  const toggleSelecionado = (id: number) => {
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const selecionarTodos = () => {
    if (!aluno) return;
    const todosIds = aluno.projetos_atribuidos.map((p) => p.id);
    setSelecionados(todosIds.length === selecionados.length ? [] : todosIds);
  };

  const removerProjeto = async (projetoId: number, onSuccess: () => void) => {
    if (!aluno) return;
    const confirm = await Swal.fire({
      title: 'Remover projeto?',
      text: `Deseja remover este projeto do aluno ${aluno.aluno.nome}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, remover',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    });
    if (!confirm.isConfirmed) return;

    setRemovendoId(projetoId);
    try {
      await removerProjetosManualmente(aluno.id, [projetoId]);
      setAluno((prev) =>
        prev
          ? { ...prev, projetos_atribuidos: prev.projetos_atribuidos.filter((p) => p.id !== projetoId) }
          : null
      );
      setSelecionados((prev) => prev.filter((id) => id !== projetoId));
      Swal.fire('Sucesso', 'Projeto removido!', 'success');
      onSuccess();
    } catch {
      Swal.fire('Erro', 'Não foi possível remover o projeto.', 'error');
    } finally {
      setRemovendoId(null);
    }
  };

  const removerSelecionados = async (onSuccess: () => void) => {
    if (!aluno || selecionados.length === 0) return;
    const confirm = await Swal.fire({
      title: 'Remover projetos selecionados?',
      html: `Deseja remover <strong>${selecionados.length} projeto(s)</strong> do aluno ${aluno.aluno.nome}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, remover',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    });
    if (!confirm.isConfirmed) return;

    try {
      await removerProjetosManualmente(aluno.id, selecionados);
      setAluno((prev) =>
        prev
          ? {
              ...prev,
              projetos_atribuidos: prev.projetos_atribuidos.filter((p) => !selecionados.includes(p.id)),
            }
          : null
      );
      setSelecionados([]);
      Swal.fire('Sucesso', 'Projetos removidos!', 'success');
      onSuccess();
    } catch {
      Swal.fire('Erro', 'Não foi possível remover os projetos.', 'error');
    }
  };

  const removerTodos = async (onSuccess: () => void) => {
    if (!aluno || aluno.projetos_atribuidos.length === 0) return;
    const confirm = await Swal.fire({
      title: 'Remover TODOS os projetos?',
      text: `Isso removerá todos os ${aluno.projetos_atribuidos.length} projetos atribuídos a ${aluno.aluno.nome}. Essa ação não pode ser desfeita.`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Sim, remover tudo',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    });
    if (!confirm.isConfirmed) return;

    try {
      const todosIds = aluno.projetos_atribuidos.map((p) => p.id);
      await removerProjetosManualmente(aluno.id, todosIds);
      setAluno((prev) => (prev ? { ...prev, projetos_atribuidos: [] } : null));
      setSelecionados([]);
      Swal.fire('Sucesso', 'Todos os projetos foram removidos!', 'success');
      onSuccess();
    } catch {
      Swal.fire('Erro', 'Não foi possível remover os projetos.', 'error');
    }
  };

  return {
    modalAberto, aluno, removendoId, selecionados,
    abrir, fechar: () => setModalAberto(false),
    toggleSelecionado, selecionarTodos,
    removerProjeto, removerSelecionados, removerTodos,
  };
}