import { useEffect, useMemo, useState } from 'react';
import { Loader2, FileDown, Search, Star, BarChart3, CalendarDays, Eye, X } from 'lucide-react';
import { MainLayout } from '../../../../componentes/SideBarUniversal';
import { Pagination } from '../../../../componentes/PaginationUniversal';
import { apiRequest, API_BASE_URL, ApiError } from '../../../../lib/api';
import type { UserRole } from '../../../../helpes/InteligenciaSideBar';

type MediaProjeto = {
  id: number;
  titulo: string;
  orientador: string;
  mediaFinal: number;
  quantidadeAvaliacoes: number;
};

type Evento = {
  id: number;
  titulo: string;
  vigente?: boolean;
};

type DetalheAvaliacao = {
  avaliador: {
    id: number;
    nome: string;
    email: string;
  };
  nota: number;
  criterios: Array<{
    criterio: string;
    nota: number;
  }>;
  data: string;
};

export default function GerenciarNotaProjetos() {
  const userRole = (localStorage.getItem('role') as UserRole) || 'coordenador';
  const [projetos, setProjetos] = useState<MediaProjeto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(5);

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [eventoSelecionado, setEventoSelecionado] = useState<number | ''>('');

  // ✅ Estados para modal de detalhes
  const [projetoDetalhes, setProjetoDetalhes] = useState<MediaProjeto | null>(null);
  const [avaliacoesDetalhes, setAvaliacoesDetalhes] = useState<DetalheAvaliacao[]>([]);
  const [carregandoDetalhes, setCarregandoDetalhes] = useState(false);

  const fetchMedias = async () => {
    setCarregando(true);
    setErro(null);

    try {
      const params = new URLSearchParams();
      if (eventoSelecionado !== '') {
        params.set('eventoId', String(eventoSelecionado));
      }

      const data = await apiRequest<MediaProjeto[] | { projetos: MediaProjeto[] }>(
        `/avaliacao/projetos/medias?${params.toString()}`
      );

      const lista = Array.isArray(data) ? data : (data as any).projetos ?? [];

      setProjetos(
        lista.map((item: any) => ({
          id: item.id ?? item.projeto_id ?? 0,
          titulo: item.projeto_titulo ?? item.titulo ?? '',
          orientador: item.orientador ?? '',
          mediaFinal: Number(item.mediaFinal ?? 0),
          quantidadeAvaliacoes: Number(item.quantidadeAvaliacoes ?? 0),
        }))
      );
    } catch (err) {
      setErro(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível carregar as médias dos projetos.'
      );
      setProjetos([]);
    } finally {
      setCarregando(false);
    }
  };

  // ✅ Buscar detalhes das avaliações de um projeto
  const abrirDetalhes = async (projeto: MediaProjeto) => {
    setProjetoDetalhes(projeto);
    setCarregandoDetalhes(true);
    setAvaliacoesDetalhes([]);

    try {
      const data = await apiRequest<{ avaliacoes: DetalheAvaliacao[] }>(
        `/avaliacao/projetos/${projeto.id}/detalhes`
      );
      setAvaliacoesDetalhes(data.avaliacoes ?? []);
    } catch (err) {
      setAvaliacoesDetalhes([]);
      console.error('Erro ao carregar detalhes das avaliações:', err);
    } finally {
      setCarregandoDetalhes(false);
    }
  };

  useEffect(() => {
    async function carregarEventos() {
      try {
        const [vigente, lista] = await Promise.all([
          apiRequest<Evento>('/evento/atual/vigente'),
          apiRequest<Evento[]>('/evento'),
        ]);

        const eventosFormatados = lista.map((ev) => ({
          ...ev,
          titulo: ev.titulo || (ev as any).nome || 'Evento sem título',
        }));

        setEventos(eventosFormatados);

        if (vigente?.id) {
          setEventoSelecionado(Number(vigente.id));
        } else if (eventosFormatados.length > 0) {
          setEventoSelecionado(Number(eventosFormatados[0].id));
        }
      } catch (err) {
        console.error('Erro ao carregar eventos:', err);
      }
    }

    void carregarEventos();
  }, []);

  useEffect(() => {
    if (eventoSelecionado !== '') {
      void fetchMedias();
    }
  }, [eventoSelecionado]);

  const filtrados = useMemo(() => {
    if (!search.trim()) return projetos;

    const termo = search.trim().toLowerCase();
    return projetos.filter(
      (p) =>
        p.titulo.toLowerCase().includes(termo) ||
        p.orientador.toLowerCase().includes(termo)
    );
  }, [projetos, search]);

  useEffect(() => {
    setPage(1);
  }, [search, eventoSelecionado]);

  const total = filtrados.length;
  const totalPaginas = Math.max(1, Math.ceil(total / limit));
  const inicio = (page - 1) * limit;
  const projetosPaginados = filtrados.slice(inicio, inicio + limit);

  const mediaGeral = useMemo(() => {
    if (projetos.length === 0) return 0;
    const soma = projetos.reduce((acc, p) => acc + p.mediaFinal, 0);
    return Number((soma / projetos.length).toFixed(2));
  }, [projetos]);

  const totalAvaliacoes = useMemo(
    () => projetos.reduce((acc, p) => acc + p.quantidadeAvaliacoes, 0),
    [projetos]
  );

  const exportarCsv = async () => {
    const token = localStorage.getItem('token');

    try {
      const params = new URLSearchParams();
      if (eventoSelecionado !== '') {
        params.set('eventoId', String(eventoSelecionado));
      }

      const response = await fetch(
        `${API_BASE_URL}/avaliacao/projetos/medias/export?${params.toString()}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao exportar CSV.');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'medias-projetos.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Falha ao exportar CSV.');
    }
  };

  return (
    <MainLayout userRole={userRole}>
      <div className="mx-auto max-w-7xl px-4 py-6">
        <header className="mb-6 flex flex-col gap-1">
          <h1 className="text-2xl font-black text-slate-900">Gerenciar Nota Projetos</h1>
          <p className="text-sm font-medium text-slate-500">
            Visualize as médias consolidadas de cada projeto e exporte o relatório.
          </p>
        </header>

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ResumoCard icone={<BarChart3 size={20} />} cor="emerald" label="Projetos listados" valor={projetos.length} />
          <ResumoCard icone={<Star size={20} />} cor="emerald" label="Média geral" valor={mediaGeral} formato="decimal" />
          <ResumoCard icone={<BarChart3 size={20} />} cor="orange" label="Total de avaliações" valor={totalAvaliacoes} />
        </section>

        <section className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <Search size={16} className="text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Pesquisar por projeto ou orientador"
                  className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 sm:min-w-[200px]">
                <CalendarDays size={16} className="text-slate-400" />
                <select
                  value={eventoSelecionado}
                  onChange={(e) => setEventoSelecionado(Number(e.target.value))}
                  className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none"
                >
                  <option value="" disabled>Selecione um evento</option>
                  {eventos.map((ev) => (
                    <option key={ev.id} value={ev.id}>{ev.titulo}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={exportarCsv}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-black text-white transition hover:bg-emerald-800"
            >
              <FileDown size={16} />
              Exportar CSV
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gradient-to-r from-emerald-50 to-slate-50 text-xs font-black uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-4 py-3">Projeto</th>
                  <th className="px-4 py-3">Orientador</th>
                  <th className="px-4 py-3">Média final</th>
                  <th className="px-4 py-3">Avaliações</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {carregando ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                      <Loader2 className="mx-auto mb-2 animate-spin" size={20} />
                      Carregando médias...
                    </td>
                  </tr>
                ) : erro ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center font-semibold text-red-600">
                      {erro}
                    </td>
                  </tr>
                ) : projetosPaginados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                      Nenhum projeto encontrado.
                    </td>
                  </tr>
                ) : (
                  projetosPaginados.map((projeto) => (
                    <tr key={projeto.id} className="transition hover:bg-emerald-50/40">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">{projeto.titulo}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{projeto.orientador}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-700">
                          <Star size={12} />
                          {projeto.mediaFinal.toFixed(2).replace('.', ',')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                          {projeto.quantidadeAvaliacoes}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => abrirDetalhes(projeto)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-700 transition hover:bg-slate-100"
                        >
                          <Eye size={14} />
                          Ver detalhes
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {!carregando && total > limit && (
          <Pagination
            page={page}
            totalPages={totalPaginas}
            onPageChange={setPage}
            total={total}
            limit={limit}
            showInfo
          />
        )}
      </div>

      {/* Modal de detalhes das avaliações */}
      {projetoDetalhes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-[#0b4d2c] px-6 py-5 text-white">
              <div>
                <h3 className="text-lg font-bold">{projetoDetalhes.titulo}</h3>
                <p className="text-xs text-white/70 mt-1">
                  Média final: {projetoDetalhes.mediaFinal.toFixed(2).replace('.', ',')} ·
                  {projetoDetalhes.quantidadeAvaliacoes} avaliação(ões)
                </p>
              </div>
              <button
                onClick={() => setProjetoDetalhes(null)}
                className="rounded-full bg-white/10 p-2 hover:bg-white/20 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50">
              {carregandoDetalhes ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-sectec-700" />
                </div>
              ) : avaliacoesDetalhes.length === 0 ? (
                <p className="text-center text-sm text-slate-500 py-10">
                  Nenhuma avaliação encontrada para este projeto.
                </p>
              ) : (
                <div className="space-y-4">
                  {avaliacoesDetalhes.map((avaliacao, index) => (
                    <div key={index} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-black text-slate-900">{avaliacao.avaliador.nome}</p>
                          <p className="text-xs text-slate-500">{avaliacao.avaliador.email}</p>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-700">
                          <Star size={12} />
                          {avaliacao.nota.toFixed(2).replace('.', ',')}
                        </span>
                      </div>

                      {avaliacao.criterios.length > 0 && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {avaliacao.criterios.map((criterio) => (
                            <div key={criterio.criterio} className="rounded-lg bg-slate-50 px-3 py-2 text-xs">
                              <span className="text-slate-500 capitalize">{criterio.criterio}:</span>{' '}
                              <span className="font-bold text-slate-700">
                                {Number(criterio.nota).toFixed(1).replace('.', ',')}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
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

function ResumoCard({
  icone,
  cor,
  label,
  valor,
  formato = 'inteiro',
}: {
  icone: React.ReactNode;
  cor: 'emerald' | 'orange';
  label: string;
  valor: number;
  formato?: 'inteiro' | 'decimal';
}) {
  const cores = {
    emerald: 'bg-emerald-100 text-emerald-700',
    orange: 'bg-orange-100 text-orange-600',
  } as const;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${cores[cor]}`}>
        {icone}
      </span>
      <div>
        <span className="block text-xs font-bold uppercase tracking-wide text-slate-400">
          {label}
        </span>
        <h2 className="text-xl font-black text-slate-900">
          {formato === 'decimal' ? valor.toFixed(2).replace('.', ',') : valor}
        </h2>
      </div>
    </div>
  );
}