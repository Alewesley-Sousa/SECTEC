import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  QrCode,
  Eye,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Clock,
  X,
  Printer,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { MainLayout } from '../../../componentes/SideBarUniversal';
import { apiRequest, ApiError } from '../../../lib/api';
import type { UserRole } from '../../../helpes/InteligenciaSideBar';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

type Projeto = {
  id: number;
  titulo: string;
  turma: string;
  orientador: string;
  qrcode: boolean;
  eixo_tematico: string;
  evento: string;
  integrantes?: string[];
};

type ApiProjetoLike = Partial<Projeto> & {
  ID?: number;
  title?: string;
  turma_nome?: string;
  professor?: string;
  qrCode?: boolean;
  eixo?: string;
  evento_id?: string;
};

type Evento = {
  id: number | string;
  nome: string;
  vigente?: boolean;
};

type Filtros = {
  search: string;
  evento: string;
  eixo_tematico: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const normalizeProjeto = (p: ApiProjetoLike | null | undefined): Projeto => ({
  id: p?.id ?? p?.ID ?? 0,
  titulo: p?.titulo ?? p?.title ?? 'Projeto sem título',
  turma: p?.turma ?? p?.turma_nome ?? 'Sem turma',
  orientador: p?.orientador ?? p?.professor ?? 'Sem orientador',
  qrcode: Boolean(p?.qrcode ?? p?.qrCode),
  eixo_tematico: p?.eixo_tematico ?? p?.eixo ?? '',
  evento: p?.evento ?? p?.evento_id ?? '',
  integrantes: (p as any)?.integrantes ?? [],
});

// A página pública com o ID do projeto ainda será construída (junto do time
// que está cuidando da página pública). Por enquanto o QR aponta para essa
// rota — ajuste aqui assim que a rota pública existir.
const buildPublicProjectUrl = (id: number) => `${window.location.origin}/publico/projeto/${id}`;

const buildQrDataUrl = (id: number) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    buildPublicProjectUrl(id)
  )}`;

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

function GerarQRCode() {
  const userRole = (localStorage.getItem('role') as UserRole) || 'coordenador';
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [eixos, setEixos] = useState<string[]>([]);

  const [filtros, setFiltros] = useState<Filtros>({ search: '', evento: '', eixo_tematico: '' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [gerandoId, setGerandoId] = useState<number | null>(null);
  const [selecionado, setSelecionado] = useState<Projeto | null>(null);

  // -- Carrega evento vigente + lista de eventos (para o filtro) -----------
  useEffect(() => {
    (async () => {
      try {
        const vigente = await apiRequest<Evento>('/evento/atual/vigente');
        setFiltros((atual) => ({ ...atual, evento: String(vigente?.id ?? '') }));
      } catch {
        // Sem evento vigente configurado — segue sem pré-selecionar.
      }

      try {
        const lista = await apiRequest<Evento[]>('/evento');
        setEventos(Array.isArray(lista) ? lista : []);
      } catch {
        setEventos([]);
      }
    })();
  }, []);

  // -- Carrega eixos temáticos disponíveis para o evento selecionado -------
  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams();
        if (filtros.evento && !isNaN(Number(filtros.evento))) {
          params.set('evento', filtros.evento);
        }
        const query = params.toString() ? `?${params.toString()}` : '';
        const lista = await apiRequest<string[]>(`/relatorio/eixos-tematicos${query}`);
        setEixos(Array.isArray(lista) ? lista : []);
      } catch {
        setEixos([]);
      }
    })();
  }, [filtros.evento]);

  // -- Carrega projetos com material aprovado -------------------------------
  const fetchProjetos = useCallback(async () => {
    setCarregando(true);
    setErro(null);

    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filtros.search.trim()) params.set('search', filtros.search.trim());
    if (filtros.evento) params.set('evento', filtros.evento);
    if (filtros.eixo_tematico) params.set('eixo_tematico', filtros.eixo_tematico);

    try {
      const data = await apiRequest<Projeto[] | { projetos: Projeto[]; total?: number }>(
        `/projetos/com-materiais-aprovados?${params.toString()}`
      );

      const lista = Array.isArray(data) ? data : data.projetos ?? [];
      const totalCount = Array.isArray(data) ? lista.length : data.total ?? lista.length;

      setProjetos(lista.map(normalizeProjeto));
      setTotal(totalCount);
    } catch (err) {
      const mensagem =
        err instanceof ApiError ? err.message : 'Não foi possível carregar os projetos.';
      setErro(mensagem);
      setProjetos([]);
    } finally {
      setCarregando(false);
    }
  }, [page, filtros]);

  useEffect(() => {
    void fetchProjetos();
  }, [fetchProjetos]);

  const totalPaginas = Math.max(1, Math.ceil(total / limit));
  const totalGerados = useMemo(() => projetos.filter((p) => p.qrcode).length, [projetos]);
  const pendentes = projetos.length - totalGerados;

  const handleFiltroChange = (campo: keyof Filtros, valor: string) => {
    setPage(1);
    setFiltros((atual) => ({ ...atual, [campo]: valor }));
  };

  const handleGerarQrCode = async (projeto: Projeto) => {
    const confirmar = await Swal.fire({
      title: 'Gerar QR Code?',
      text: `O QR Code do projeto "${projeto.titulo}" será gerado.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Gerar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#047857',
    });

    if (!confirmar.isConfirmed) return;

    setGerandoId(projeto.id);
    try {
      // TODO(back): endpoint ainda não implementado — POST /projetos/:id/gerar-qrcode
      await apiRequest(`/projetos/${projeto.id}/gerar-qrcode`, { method: 'POST' });

      setProjetos((atual) =>
        atual.map((p) => (p.id === projeto.id ? { ...p, qrcode: true } : p))
      );
      setSelecionado((atual) => (atual?.id === projeto.id ? { ...atual, qrcode: true } : atual));

      await Swal.fire({
        title: 'QR Code gerado!',
        icon: 'success',
        confirmButtonColor: '#047857',
      });
    } catch (err) {
      const mensagem =
        err instanceof ApiError ? err.message : 'Não foi possível gerar o QR Code.';
      await Swal.fire({ title: 'Erro', text: mensagem, icon: 'error' });
    } finally {
      setGerandoId(null);
    }
  };

  return (
    <MainLayout userRole={userRole}>
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Cabeçalho */}
        <header className="mb-6 flex flex-col gap-1">
          <h1 className="text-2xl font-black text-slate-900">Gerar QR Code para Projetos</h1>
          <p className="text-sm font-medium text-slate-500">
            Visualize os projetos com material aprovado e gere a identificação por QR Code.
          </p>
        </header>

        {/* Cards de resumo */}
        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ResumoCard
            icone={<QrCode size={20} />}
            cor="emerald"
            label="Projetos listados"
            valor={projetos.length}
          />
          <ResumoCard
            icone={<CheckCircle2 size={20} />}
            cor="emerald"
            label="QR Codes gerados"
            valor={totalGerados}
          />
          <ResumoCard icone={<Clock size={20} />} cor="orange" label="Pendentes" valor={pendentes} />
        </section>

        {/* Filtros */}
        <section className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              value={filtros.search}
              placeholder="Pesquisar por título ou orientador"
              onChange={(e) => handleFiltroChange('search', e.target.value)}
              className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>

          <select
            value={filtros.evento}
            onChange={(e) => handleFiltroChange('evento', e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 outline-none"
          >
            {eventos.length === 0 && <option value="">Evento atual</option>}
            {eventos.map((ev) => (
              <option key={ev.id} value={String(ev.id)}>
                {ev.nome}
              </option>
            ))}
          </select>

          <select
            value={filtros.eixo_tematico}
            onChange={(e) => handleFiltroChange('eixo_tematico', e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 outline-none"
          >
            <option value="">Todos os eixos</option>
            {eixos.map((eixo) => (
              <option key={eixo} value={eixo}>
                {eixo}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => void fetchProjetos()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-black text-white transition hover:bg-emerald-800"
          >
            <RefreshCw size={15} />
            Atualizar
          </button>
        </section>

        {/* Tabela */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Título</th>
                <th className="px-4 py-3">Turma</th>
                <th className="px-4 py-3">Orientador</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {carregando ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    <Loader2 className="mx-auto mb-2 animate-spin" size={20} />
                    Carregando projetos...
                  </td>
                </tr>
              ) : erro ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center font-semibold text-red-600">
                    {erro}
                  </td>
                </tr>
              ) : projetos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    Nenhum projeto encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                projetos.map((projeto) => (
                  <tr key={projeto.id} className="transition hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-500">#{projeto.id}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{projeto.titulo}</td>
                    <td className="px-4 py-3 text-slate-600">{projeto.turma}</td>
                    <td className="px-4 py-3 text-slate-600">{projeto.orientador}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black ${projeto.qrcode
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-600'
                          }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${projeto.qrcode ? 'bg-emerald-600' : 'bg-red-500'
                            }`}
                        />
                        {projeto.qrcode ? 'Gerado' : 'Não gerado'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {projeto.qrcode ? (
                        <button
                          type="button"
                          onClick={() => setSelecionado(projeto)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-700 transition hover:bg-slate-100"
                        >
                          <Eye size={14} />
                          Visualizar
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={gerandoId === projeto.id}
                          onClick={() => void handleGerarQrCode(projeto)}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-black text-white transition hover:bg-emerald-800 disabled:opacity-60"
                        >
                          {gerandoId === projeto.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <QrCode size={14} />
                          )}
                          Gerar QR
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        {/* Paginação simples */}
        {!carregando && total > limit && (
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-bold text-slate-600 disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="text-sm font-semibold text-slate-500">
              Página {page} de {totalPaginas}
            </span>
            <button
              type="button"
              disabled={page >= totalPaginas}
              onClick={() => setPage((p) => Math.min(totalPaginas, p + 1))}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-bold text-slate-600 disabled:opacity-40"
            >
              Próxima
            </button>
          </div>
        )}
      </div>

      {/* Modal de visualização / impressão */}
      <AnimatePresence>
        {selecionado && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
            onClick={() => setSelecionado(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setSelecionado(null)}
                aria-label="Fechar"
                className="absolute right-4 top-4 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>

              <div className="flex justify-center py-2">
                <img
                  src={buildQrDataUrl(selecionado.id)}
                  alt={`QR Code do projeto ${selecionado.titulo}`}
                  className="h-52 w-52 rounded-xl border border-slate-100"
                />
              </div>

              <div className="mt-4 space-y-1 text-center">
                <h3 className="text-base font-black text-slate-900">{selecionado.titulo}</h3>
                <p className="text-sm font-semibold text-slate-500">#{selecionado.id}</p>
                <p className="text-sm text-slate-600">{selecionado.orientador}</p>
                <p className="text-sm text-slate-600">{selecionado.turma}</p>
              </div>

              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                >
                  <Printer size={15} />
                  Imprimir
                </button>
                <button
                  type="button"
                  disabled={gerandoId === selecionado.id}
                  onClick={() => void handleGerarQrCode(selecionado)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-black text-white transition hover:bg-emerald-800 disabled:opacity-60"
                >
                  <RefreshCw size={15} />
                  Gerar novamente
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MainLayout>
  );
}

function ResumoCard({
  icone,
  cor,
  label,
  valor,
}: {
  icone: React.ReactNode;
  cor: 'emerald' | 'orange';
  label: string;
  valor: number;
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
        <h2 className="text-xl font-black text-slate-900">{valor}</h2>
      </div>
    </div>
  );
}

export default GerarQRCode;
