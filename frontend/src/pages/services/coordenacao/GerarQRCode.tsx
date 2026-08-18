import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pagination } from '../../../componentes/PaginationUniversal';
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
  titulo: string;          // ✅ igual à resposta da API
  vigente?: boolean;
  temas?: { id: number; nome: string }[];
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
  const limit = 6;

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [gerandoId, setGerandoId] = useState<number | null>(null);
  const [selecionado, setSelecionado] = useState<Projeto | null>(null);
  const [gerandoTodos, setGerandoTodos] = useState(false);
  const [progresso, setProgresso] = useState({ atual: 0, total: 0 });

  // -- Carrega eventos e eixos temáticos conforme o evento selecionado ------
  useEffect(() => {
    (async () => {
      // 1. Busca o evento vigente (já pré‑seleciona no filtro)
      let vigenteId = '';
      try {
        const vigente = await apiRequest<Evento>('/evento/atual/vigente');
        if (vigente?.id) {
          vigenteId = String(vigente.id);
          // Adiciona o vigente à lista, se ainda não estiver
          setEventos((prev) => {
            const existe = prev.some((ev) => String(ev.id) === vigenteId);
            return existe ? prev : [vigente, ...prev];
          });
        }
      } catch {
        // sem vigente
      }

      // 2. Busca todos os eventos
      try {
        const lista = await apiRequest<Evento[]>('/evento');
        const listaNormalizada = (Array.isArray(lista) ? lista : []).map((ev) => ({
          ...ev,
          titulo: ev.titulo || (ev as any).nome || 'Evento sem título',
        }));
        setEventos(listaNormalizada);
      } catch {
        // mantém o que já tem (pelo menos o vigente)
      }

      // 3. Define o filtro de evento como o vigente (se existir)
      if (vigenteId) {
        setFiltros((atual) => ({ ...atual, evento: vigenteId }));
      }
    })();
  }, []);

  // -- Atualiza os eixos temáticos de acordo com o evento selecionado --------
  useEffect(() => {
    if (!filtros.evento) {
      setEixos([]);
      return;
    }

    // Procura o evento na lista já carregada
    const eventoSelecionado = eventos.find((ev) => String(ev.id) === filtros.evento);
    if (eventoSelecionado?.temas && eventoSelecionado.temas.length > 0) {
      // Usa os temas já disponíveis
      setEixos(eventoSelecionado.temas.map((t) => t.nome));
    } else {
      // Busca detalhes do evento (caso a lista não inclua temas)
      (async () => {
        try {
          const detalhe = await apiRequest<Evento>(`/evento/${filtros.evento}`);
          if (detalhe?.temas) {
            setEixos(detalhe.temas.map((t) => t.nome));
            // Atualiza também o cache local no array de eventos
            setEventos((prev) =>
              prev.map((ev) =>
                String(ev.id) === filtros.evento ? { ...ev, temas: detalhe.temas } : ev
              )
            );
          } else {
            setEixos([]);
          }
        } catch {
          setEixos([]);
        }
      })();
    }
  }, [filtros.evento, eventos]);

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
        `/projetos/todos?${params.toString()}`
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

  /**
   * Tenta gerar o QR Code de um projeto específico e retorna true/false.
   * Atualiza o estado local do projeto se bem-sucedido.
   */
  const gerarQrCodeProjeto = async (projeto: Projeto): Promise<boolean> => {
    try {
      // TODO(back): endpoint ainda não implementado — POST /projetos/:id/gerar-qrcode
      await apiRequest(`/projetos/${projeto.id}/gerar-qrcode`, { method: 'POST' });

      setProjetos((atual) =>
        atual.map((p) => (p.id === projeto.id ? { ...p, qrcode: true } : p))
      );
      return true;
    } catch {
      return false;
    }
  };

  /**
   * Gera QR Code individual (com confirmação Swal).
   */
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
    const sucesso = await gerarQrCodeProjeto(projeto);
    setGerandoId(null);

    if (sucesso) {
      setSelecionado((atual) => (atual?.id === projeto.id ? { ...atual, qrcode: true } : atual));
      await Swal.fire({
        title: 'QR Code gerado!',
        icon: 'success',
        confirmButtonColor: '#047857',
      });
    } else {
      await Swal.fire({
        title: 'Erro',
        text: 'Não foi possível gerar o QR Code.',
        icon: 'error',
      });
    }
  };

  const handleGerarTodos = async () => {
    const pendentes = projetos.filter((p) => !p.qrcode);
    if (pendentes.length === 0) {
      await Swal.fire({
        title: 'Nada pendente',
        text: 'Todos os projetos já possuem QR Code gerado.',
        icon: 'info',
        confirmButtonColor: '#047857',
      });
      return;
    }

    const confirmar = await Swal.fire({
      title: 'Gerar todos os QR Codes?',
      text: `Serão processados ${pendentes.length} projeto(s) pendente(s).`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Iniciar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#047857',
    });

    if (!confirmar.isConfirmed) return;

    setGerandoTodos(true);
    setProgresso({ atual: 0, total: pendentes.length });

    let sucessos = 0;
    let falhas = 0;

    for (const projeto of pendentes) {
      const ok = await gerarQrCodeProjeto(projeto);
      if (ok) sucessos++;
      else falhas++;
      setProgresso((prev) => ({ ...prev, atual: prev.atual + 1 }));
    }

    setGerandoTodos(false);

    await Swal.fire({
      title: 'Processo concluído',
      html: `
      <div class="text-sm text-left space-y-1">
        <p><strong>${sucessos}</strong> QR Code(s) gerado(s) com sucesso.</p>
        ${falhas > 0 ? `<p class="text-red-600"><strong>${falhas}</strong> falha(s).</p>` : ''}
      </div>
    `,
      icon: falhas === 0 ? 'success' : 'warning',
      confirmButtonColor: '#047857',
    });
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
              placeholder="Pesquisar por título"
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
                {ev.titulo}
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

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void fetchProjetos()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-black text-white transition hover:bg-emerald-800"
            >
              <RefreshCw size={15} />
              Atualizar
            </button>

            <button
              type="button"
              disabled={gerandoTodos || carregando || pendentes === 0}
              onClick={() => void handleGerarTodos()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-black text-white transition hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {gerandoTodos ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  {progresso.atual}/{progresso.total}
                </>
              ) : (
                <>
                  <QrCode size={15} />
                  Gerar Todos
                </>
              )}
            </button>
          </div>
        </section>

        {gerandoTodos && (
          <div className="mt-3 rounded-2xl border border-indigo-100 bg-indigo-50 p-3">
            <div className="flex items-center justify-between text-sm font-bold text-indigo-900 mb-2">
              <span>Gerando QR Codes...</span>
              <span>{progresso.atual} de {progresso.total}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-indigo-100">
              <div
                className="h-2 rounded-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${(progresso.atual / progresso.total) * 100}%` }}
              />
            </div>
          </div>
        )}

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
