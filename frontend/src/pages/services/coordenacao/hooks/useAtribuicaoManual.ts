// hooks/useAtribuicaoManual.ts
import { useState } from 'react';
import Swal from 'sweetalert2';
import {
  obterProjetosDisponiveis,
  atribuirProjetosManualmente,
  type AlunoRelatorioItem,
  type ProjetoDisponivel,
} from '../relatorios';

export function useAtribuicaoManual(onSuccess: () => void) {
  const [modalAberto, setModalAberto] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState<AlunoRelatorioItem | null>(null);
  const [projetosDisponiveis, setProjetosDisponiveis] = useState<ProjetoDisponivel[]>([]);
  const [projetosSelecionados, setProjetosSelecionados] = useState<number[]>([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [atribuindo, setAtribuindo] = useState(false);

  const abrir = async (aluno: AlunoRelatorioItem) => {
    setAlunoSelecionado(aluno);
    setModalAberto(true);
    setProjetosSelecionados([]);
    setBusca('');
    setCarregando(true);
    try {
      const dados = await obterProjetosDisponiveis(aluno.id);
      setProjetosDisponiveis(dados);
    } catch {
      Swal.fire('Erro', 'Não foi possível carregar projetos disponíveis.', 'error');
    } finally {
      setCarregando(false);
    }
  };

  const buscar = async (termo?: string) => {
    if (!alunoSelecionado) return;
    setCarregando(true);
    try {
      const dados = await obterProjetosDisponiveis(alunoSelecionado.id, termo);
      setProjetosDisponiveis(dados);
    } catch {
      Swal.fire('Erro', 'Não foi possível carregar projetos disponíveis.', 'error');
    } finally {
      setCarregando(false);
    }
  };

  const atribuir = async () => {
    if (!alunoSelecionado || projetosSelecionados.length === 0) {
      Swal.fire('Atenção', 'Selecione pelo menos um projeto.', 'warning');
      return;
    }
    setAtribuindo(true);
    try {
      await atribuirProjetosManualmente(alunoSelecionado.id, projetosSelecionados);
      Swal.fire('Sucesso', 'Projetos atribuídos com sucesso!', 'success');
      setModalAberto(false);
      onSuccess();
    } catch {
      Swal.fire('Erro', 'Falha ao atribuir projetos.', 'error');
    } finally {
      setAtribuindo(false);
    }
  };

  return {
    modalAberto, alunoSelecionado, projetosDisponiveis, projetosSelecionados,
    busca, setBusca, carregando, atribuindo,
    abrir, buscar, atribuir, fechar: () => setModalAberto(false),
    toggleProjeto: (id: number) =>
      setProjetosSelecionados((prev) =>
        prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
      ),
  };
}