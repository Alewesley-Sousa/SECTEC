import { useEffect, useState } from "react";
import { Users, Search, Settings2, X, CheckCircle2, Loader2, Trash2, PlusCircle, FileWarning } from "lucide-react";
import Swal from "sweetalert2";
import { MainLayout } from "../../../../componentes/SideBarUniversal";
import { Pagination } from "../../../../componentes/PaginationUniversal";
import { API_BASE_URL } from "../../../../lib/api";

interface Avaliador {
  id: number;
  nome: string;
  email: string;
  qtd_projetos: number;
  faltam: number;
  limite_total: number;
}

interface Projeto {
  id: number;
  titulo: string;
}

export default function GerenciarAvaliadores() {
  const [avaliadores, setAvaliadores] = useState<Avaliador[]>([]);
  const [busca, setBusca] = useState("");
  const [fetching, setFetching] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);

  // ✅ Estados de paginação
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [modalAberto, setModalAberto] = useState(false);
  const [avaliadorSelecionado, setAvaliadorSelecionado] = useState<Avaliador | null>(null);

  const [projetosAtuais, setProjetosAtuais] = useState<Projeto[]>([]);
  const [projetosDisponiveis, setProjetosDisponiveis] = useState<Projeto[]>([]);

  const [projetosParaAdicionar, setProjetosParaAdicionar] = useState<number[]>([]);
  const [projetosParaRemover, setProjetosParaRemover] = useState<number[]>([]);

  const [buscaAtuais, setBuscaAtuais] = useState("");
  const [buscaDisponiveis, setBuscaDisponiveis] = useState("");

  // ✅ Estados do relatório de projetos sem avaliadores
  const [modalSemAvaliadoresAberto, setModalSemAvaliadoresAberto] = useState(false);
  const [projetosSemAvaliadores, setProjetosSemAvaliadores] = useState<Projeto[]>([]);
  const [carregandoSemAvaliadores, setCarregandoSemAvaliadores] = useState(false);

  const carregarAvaliadores = async () => {
    setFetching(true);
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_BASE_URL}/avaliadores?busca=${busca}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setAvaliadores(data);
      }
    } catch (err) {
      console.error("Erro ao carregar avaliadores:", err);
    } finally {
      setFetching(false);
    }
  };

  const carregarProjetosSemAvaliadores = async () => {
    setCarregandoSemAvaliadores(true);
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_BASE_URL}/avaliadores/projetos-sem-avaliadores`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setProjetosSemAvaliadores(data);
      }
    } catch (err) {
      console.error("Erro ao carregar projetos sem avaliadores:", err);
    } finally {
      setCarregandoSemAvaliadores(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPage(1);
      carregarAvaliadores();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [busca]);

  const abrirModal = async (avaliador: Avaliador) => {
    setAvaliadorSelecionado(avaliador);
    setProjetosParaAdicionar([]);
    setProjetosParaRemover([]);
    setBuscaAtuais("");
    setBuscaDisponiveis("");
    setModalAberto(true);

    const token = localStorage.getItem("token");

    try {
      const [resAtuais, resDisponiveis] = await Promise.all([
        fetch(`${API_BASE_URL}/avaliadores/${avaliador.id}/projetos`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/avaliadores/${avaliador.id}/projetos-disponiveis`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (resAtuais.ok) setProjetosAtuais(await resAtuais.json());
      if (resDisponiveis.ok) setProjetosDisponiveis(await resDisponiveis.json());
    } catch (error) {
      Swal.fire({ icon: "error", title: "Erro", text: "Erro ao carregar dados dos projetos.", confirmButtonColor: "#15803d" });
    }
  };

  const fecharModal = () => {
    setModalAberto(false);
    setAvaliadorSelecionado(null);
    carregarAvaliadores();
  };

  const handleDesignar = async () => {
    if (!avaliadorSelecionado || projetosParaAdicionar.length === 0) {
      return Swal.fire({ icon: "warning", title: "Atenção", text: "Selecione pelo menos um projeto para designar.", confirmButtonColor: "#15803d" });
    }

    setLoadingAction(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE_URL}/avaliadores/${avaliadorSelecionado.id}/projetos`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ projetos_ids: projetosParaAdicionar }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao designar projetos.");
      }

      Swal.fire({ icon: "success", title: "Sucesso!", text: "Projetos designados.", confirmButtonColor: "#15803d" });
      fecharModal();
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "Erro", text: err.message, confirmButtonColor: "#15803d" });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleRemover = async (removerTodos = false) => {
    if (!avaliadorSelecionado || (!removerTodos && projetosParaRemover.length === 0)) {
      return Swal.fire({ icon: "warning", title: "Atenção", text: "Selecione projetos para remover.", confirmButtonColor: "#15803d" });
    }

    const confirmResult = await Swal.fire({
      title: "Tem certeza?",
      text: removerTodos ? "Isso removerá TODOS os projetos deste avaliador!" : "Os projetos selecionados serão removidos.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#b91c1c",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Sim, remover",
      cancelButtonText: "Cancelar"
    });

    if (!confirmResult.isConfirmed) return;

    setLoadingAction(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE_URL}/avaliadores/${avaliadorSelecionado.id}/projetos`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          remover_todos: removerTodos,
          projetos_ids: removerTodos ? [] : projetosParaRemover
        }),
      });

      if (!response.ok) throw new Error("Erro ao remover projetos.");

      Swal.fire({ icon: "success", title: "Removido!", text: "Projetos removidos com sucesso.", confirmButtonColor: "#15803d" });
      fecharModal();
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "Erro", text: err.message, confirmButtonColor: "#15803d" });
    } finally {
      setLoadingAction(false);
    }
  };

  const toggleCheck = (id: number, state: number[], setState: React.Dispatch<React.SetStateAction<number[]>>) => {
    if (state.includes(id)) {
      setState(state.filter((item) => item !== id));
    } else {
      setState([...state, id]);
    }
  };

  // ✅ Paginação
  const totalAvaliadores = avaliadores.length;
  const totalPaginas = Math.max(1, Math.ceil(totalAvaliadores / limit));
  const inicio = (page - 1) * limit;
  const avaliadoresPaginados = avaliadores.slice(inicio, inicio + limit);

  // ✅ Filtros do modal
  const projetosAtuaisFiltrados = projetosAtuais.filter((p) =>
    p.titulo.toLowerCase().includes(buscaAtuais.toLowerCase())
  );
  const projetosDisponiveisFiltrados = projetosDisponiveis.filter((p) =>
    p.titulo.toLowerCase().includes(buscaDisponiveis.toLowerCase())
  );

  return (
    <MainLayout userRole="coordenador">
      <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-[#0b4d2c] px-6 py-6 text-white">
              <div className="flex items-center gap-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 shadow-inner">
                  <Users size={32} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-white/50">Módulo Avaliador</p>
                  <h1 className="text-2xl font-black">Gerenciamento de Cotas</h1>
                </div>
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <CheckCircle2 className="text-sectec-700 mt-1" size={18} />
                <p className="text-xs text-slate-600">
                  Gerencie manualmente os projetos atribuídos a cada avaliador. Acompanhe a cota limite definida pelas configurações do sistema e evite sobrecargas.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-xl font-extrabold text-slate-900">Avaliadores Cadastrados</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalSemAvaliadoresAberto(true);
                    carregarProjetosSemAvaliadores();
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-black text-orange-700 transition hover:bg-orange-100"
                >
                  <FileWarning size={16} />
                  Projetos sem avaliadores
                </button>
                <div className="relative w-full sm:w-72">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar nome ou e-mail..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 outline-none focus:ring-2 focus:ring-sectec-500 text-sm transition-all"
                  />
                </div>
              </div>
            </div>

            {fetching ? (
              <div className="flex py-12 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-sectec-700" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4">Nome do Avaliador</th>
                        <th className="px-6 py-4">Projetos Atuais</th>
                        <th className="px-6 py-4">Status da Cota</th>
                        <th className="px-6 py-4 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {avaliadoresPaginados.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                            Nenhum avaliador encontrado.
                          </td>
                        </tr>
                      ) : (
                        avaliadoresPaginados.map((av) => (
                          <tr key={av.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-semibold text-slate-900">{av.nome}</p>
                              <p className="text-xs text-slate-500">{av.email}</p>
                            </td>
                            <td className="px-6 py-4 font-medium">
                              {av.qtd_projetos} <span className="text-slate-400 font-normal">/ {av.limite_total}</span>
                            </td>
                            <td className="px-6 py-4">
                              {av.faltam === 0 ? (
                                <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">Cota Cheia</span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">Faltam {av.faltam}</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => abrirModal(av)}
                                className="inline-flex items-center gap-2 rounded-lg bg-sectec-50 px-3 py-2 text-sm font-semibold text-sectec-700 hover:bg-sectec-100 transition-colors"
                              >
                                <Settings2 size={16} />
                                Gerenciar
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Paginação universal */}
                {!fetching && totalAvaliadores > limit && (
                  <Pagination
                    page={page}
                    totalPages={totalPaginas}
                    onPageChange={setPage}
                    total={totalAvaliadores}
                    limit={limit}
                    showInfo
                  />
                )}
              </>
            )}
          </section>
        </div>
      </main>

      {/* Modal de gerenciamento de cota */}
      {modalAberto && avaliadorSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-[#0b4d2c] px-6 py-5 text-white">
              <div>
                <h3 className="text-lg font-bold">Cota: {avaliadorSelecionado.nome}</h3>
                <p className="text-xs text-white/70 mt-1">Capacidade: {avaliadorSelecionado.qtd_projetos} de {avaliadorSelecionado.limite_total} projetos.</p>
              </div>
              <button onClick={fecharModal} className="rounded-full bg-white/10 p-2 hover:bg-white/20 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Coluna Esquerda: Remover Projetos */}
                <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-2 text-red-600">
                    <Trash2 size={20} />
                    <h4 className="font-extrabold text-slate-900">Projetos Atuais</h4>
                  </div>

                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      placeholder="Pesquisar projetos atuais..."
                      value={buscaAtuais}
                      onChange={(e) => setBuscaAtuais(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 outline-none focus:ring-2 focus:ring-red-300 text-sm transition-all"
                    />
                  </div>

                  <div className="flex-1 space-y-2 overflow-y-auto max-h-60 pr-2 custom-scrollbar">
                    {projetosAtuaisFiltrados.length === 0 ? (
                      <p className="text-sm text-slate-500 py-4 text-center">Nenhum projeto designado.</p>
                    ) : (
                      projetosAtuaisFiltrados.map((p) => (
                        <label key={p.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-100 p-3 hover:bg-slate-50">
                          <input
                            type="checkbox"
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                            checked={projetosParaRemover.includes(p.id)}
                            onChange={() => toggleCheck(p.id, projetosParaRemover, setProjetosParaRemover)}
                          />
                          <span className="text-sm font-medium text-slate-700">{p.titulo}</span>
                        </label>
                      ))
                    )}
                  </div>

                  <div className="mt-6 flex flex-col gap-2 border-t border-slate-100 pt-4">
                    <button
                      disabled={loadingAction || projetosAtuais.length === 0}
                      onClick={() => handleRemover(false)}
                      className="w-full rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
                    >
                      Remover Selecionados
                    </button>
                    <button
                      disabled={loadingAction || projetosAtuais.length === 0}
                      onClick={() => handleRemover(true)}
                      className="w-full rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      Esvaziar Cota (Remover Todos)
                    </button>
                  </div>
                </div>

                {/* Coluna Direita: Adicionar Projetos */}
                <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-2 text-sectec-700">
                    <PlusCircle size={20} />
                    <h4 className="font-extrabold text-slate-900">Projetos Disponíveis</h4>
                  </div>

                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      placeholder="Pesquisar projetos disponíveis..."
                      value={buscaDisponiveis}
                      onChange={(e) => setBuscaDisponiveis(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 outline-none focus:ring-2 focus:ring-sectec-300 text-sm transition-all"
                    />
                  </div>

                  <div className="flex-1 space-y-2 overflow-y-auto max-h-60 pr-2 custom-scrollbar">
                    {projetosDisponiveisFiltrados.length === 0 ? (
                      <p className="text-sm text-slate-500 py-4 text-center">Nenhum projeto disponível.</p>
                    ) : (
                      projetosDisponiveisFiltrados.map((p) => (
                        <label key={p.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-100 p-3 hover:bg-slate-50">
                          <input
                            type="checkbox"
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-sectec-600 focus:ring-sectec-500"
                            checked={projetosParaAdicionar.includes(p.id)}
                            onChange={() => toggleCheck(p.id, projetosParaAdicionar, setProjetosParaAdicionar)}
                          />
                          <span className="text-sm font-medium text-slate-700">{p.titulo}</span>
                        </label>
                      ))
                    )}
                  </div>

                  <div className="mt-6 border-t border-slate-100 pt-4">
                    <button
                      disabled={loadingAction || projetosDisponiveis.length === 0}
                      onClick={handleDesignar}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-sectec-700 py-3 text-sm font-bold text-white hover:bg-sectec-800 disabled:opacity-50"
                    >
                      {loadingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle size={18} />}
                      Designar Selecionados
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de projetos sem avaliadores */}
      {modalSemAvaliadoresAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="flex max-h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-[#0b4d2c] px-6 py-5 text-white">
              <div>
                <h3 className="text-lg font-bold">Projetos sem avaliadores</h3>
                <p className="text-xs text-white/70 mt-1">
                  Projetos aprovados do evento atual que ainda não possuem avaliador designado.
                </p>
              </div>
              <button
                onClick={() => setModalSemAvaliadoresAberto(false)}
                className="rounded-full bg-white/10 p-2 hover:bg-white/20 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50">
              {carregandoSemAvaliadores ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-sectec-700" />
                </div>
              ) : projetosSemAvaliadores.length === 0 ? (
                <p className="text-center text-sm text-slate-500 py-10">
                  Nenhum projeto sem avaliador no momento.
                </p>
              ) : (
                <div className="space-y-2">
                  {projetosSemAvaliadores.map((projeto) => (
                    <div
                      key={projeto.id}
                      className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                    >
                      <p className="font-semibold text-slate-800">
                        #{projeto.id} — {projeto.titulo}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}