import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Printer,
  Loader2,
  CheckSquare,
  Square,
  FileStack,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { MainLayout } from '../../../componentes/SideBarUniversal';
import { apiRequest, ApiError } from '../../../lib/api';
import { Pagination } from '../../../componentes/PaginationUniversal'; // ajuste o caminho se necessário
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
  eixo_tematico?: string; // opcional, pode ser útil
  evento?: string;
};

type ApiProjetoLike = Partial<Projeto> & { ID?: number; title?: string };

type ProjetosPaginadosResponse = {
  projetos: ApiProjetoLike[];
  total: number;
  page: number;
  limit: number;
};

type GerarPdfResponse = {
  mensagem: string;
  arquivo: string;
  total_projetos_gerados: number;
  projetos_ignorados?: Array<{ id: number; motivo: string }>;
};

type Modo = 'individual' | 'filtro';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const normalizeProjeto = (p: ApiProjetoLike | null | undefined): Projeto => ({
  id: p?.id ?? p?.ID ?? 0,
  titulo: p?.titulo ?? p?.title ?? 'Projeto sem título',
  turma: p?.turma ?? 'Sem turma',
  orientador: p?.orientador ?? 'Sem orientador',
  qrcode: Boolean(p?.qrcode),
  eixo_tematico: (p as any)?.eixo_tematico,
  evento: (p as any)?.evento,
});

function abrirEImprimirPdf(arquivo: string) {
  let blobUrl = arquivo;

  const pareceBase64 = !arquivo.startsWith('http') && !arquivo.startsWith('blob:');
  if (pareceBase64) {
    const byteCharacters = atob(arquivo.replace(/^data:application\/pdf;base64,/, ''));
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const blob = new Blob([new Uint8Array(byteNumbers)], { type: 'application/pdf' });
    blobUrl = URL.createObjectURL(blob);
  }

  const janela = window.open(blobUrl, '_blank');
  janela?.addEventListener('load', () => janela.print());
}

// ---------------------------------------------------------------------------
// Constantes das turmas disponíveis e suas cores
// ---------------------------------------------------------------------------

const TURMAS = [
  { value: 'Informática', label: 'Informática', cor: 'blue' },
  { value: 'Contabilidade', label: 'Contabilidade', cor: 'pink' },
  { value: 'Enfermagem', label: 'Enfermagem', cor: 'green' },
] as const;

const hoverBg: Record<string, string> = {
  blue: 'hover:bg-blue-50',
  pink: 'hover:bg-pink-50',
  green: 'hover:bg-green-50',
};

const activeBg: Record<string, string> = {
  blue: 'bg-blue-100 border-blue-300 text-blue-800',
  pink: 'bg-pink-100 border-pink-300 text-pink-800',
  green: 'bg-green-100 border-green-300 text-green-800',
};

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

const ANOS = ['1', '2', '3'] as const;

function ImprimirQRCode() {
  const userRole = (localStorage.getItem('role') as UserRole) || 'coordenador';

  const [modo, setModo] = useState<Modo>('individual');
  const [search, setSearch] = useState('');
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set());
  const [carregando, setCarregando] = useState(true);

  // Paginação
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20); // valor padrão da API
  const totalPages = Math.ceil(total / limit) || 1;

  // -- Modo filtro (turma) ----------------------------------------------------
  const [ano, setAno] = useState('1');
  const [turmaTexto, setTurmaTexto] = useState('');

  const [gerando, setGerando] = useState(false);

  const buscarProjetos = useCallback(
    async (termo: string, pagina: number) => {
      setCarregando(true);
      try {
        const params = new URLSearchParams({
          page: String(pagina),
          limit: String(limit),
        });
        if (termo.trim()) params.set('search', termo.trim());

        const data = await apiRequest<ProjetosPaginadosResponse>(
          `/projetos/com-materiais-aprovados?${params.toString()}`
        );

        // data é { projetos, total, page, limit }
        const projetosNormalizados = (data.projetos ?? []).map(normalizeProjeto);
        setProjetos(projetosNormalizados);
        setTotal(data.total ?? 0);
        // A página retornada pela API pode ser usada (confiável)
        setPage(data.page ?? pagina);
      } catch {
        setProjetos([]);
        setTotal(0);
      } finally {
        setCarregando(false);
      }
    },
    [limit]
  );

  // Quando search muda, volta para a página 1 e busca
  useEffect(() => {
    setPage(1);
    void buscarProjetos(search, 1);
  }, [search, buscarProjetos]);

  // Quando page muda (exceto reset via search), busca a página solicitada
  useEffect(() => {
    if (page !== 1) {
      void buscarProjetos(search, page);
    }
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const todosSelecionados =
    projetos.length > 0 && selecionados.size === projetos.length;

  const toggleSelecionado = (id: number) => {
    setSelecionados((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(id)) proximo.delete(id);
      else proximo.add(id);
      return proximo;
    });
  };

  const toggleSelecionarTodosListados = () => {
    setSelecionados(() => {
      if (todosSelecionados) return new Set();
      return new Set(projetos.map((p) => p.id));
    });
  };

  const gerarPdf = async (body: Record<string, unknown>, descricaoAcao: string) => {
    setGerando(true);
    try {
      const resposta = await apiRequest<GerarPdfResponse>('/projetos/gerar-pdf', {
        method: 'POST',
        body,
      });

      abrirEImprimirPdf(resposta.arquivo);

      const ignorados = resposta.projetos_ignorados ?? [];
      await Swal.fire({
        title: 'PDF gerado!',
        icon: 'success',
        confirmButtonColor: '#047857',
        html: `
          <p>${resposta.total_projetos_gerados} projeto(s) incluído(s) — ${descricaoAcao}.</p>
          ${
            ignorados.length > 0
              ? `<p style="margin-top:8px;color:#b45309;font-size:13px;">
                  ${ignorados.length} projeto(s) ignorado(s): ${ignorados
                    .map((i) => `#${i.id} (${i.motivo})`)
                    .join(', ')}
                </p>`
              : ''
          }
        `,
      });
    } catch (err) {
      const mensagem = err instanceof ApiError ? err.message : 'Não foi possível gerar o PDF.';
      await Swal.fire({ title: 'Erro', text: mensagem, icon: 'error' });
    } finally {
      setGerando(false);
    }
  };

  const handleGerarIndividual = () => {
    if (selecionados.size === 0) {
      void Swal.fire({
        title: 'Selecione ao menos um projeto',
        icon: 'warning',
        confirmButtonColor: '#047857',
      });
      return;
    }
    void gerarPdf(
      { modo: 'individual', projetos: Array.from(selecionados) },
      `${selecionados.size} selecionado(s) manualmente`
    );
  };

  const handleGerarPorTurma = () => {
    if (!turmaTexto.trim()) {
      void Swal.fire({
        title: 'Selecione uma turma',
        icon: 'warning',
        confirmButtonColor: '#047857',
      });
      return;
    }
    const turma = `${ano} ${turmaTexto.trim()}`;
    void gerarPdf({ modo: 'filtro', turma }, `turma "${turma}"`);
  };

  const handleImprimirTodos = async () => {
    const confirmar = await Swal.fire({
      title: 'Imprimir todos os QR Codes?',
      text: 'Isso vai gerar um único PDF com todos os projetos aprovados do evento.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Gerar PDF',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#047857',
    });
    if (!confirmar.isConfirmed) return;

    setGerando(true);
    try {
      // Busca todos sem limite (limit bem alto)
      const data = await apiRequest<ProjetosPaginadosResponse>(
        '/projetos/com-materiais-aprovados?page=1&limit=1000'
      );
      const lista = data.projetos ?? [];
      const ids = lista.map((p) => p.id ?? (p as ApiProjetoLike).ID ?? 0).filter(Boolean);

      if (ids.length === 0) {
        await Swal.fire({
          title: 'Nenhum projeto encontrado',
          text: 'Não há projetos com material aprovado no momento.',
          icon: 'info',
        });
        return;
      }

      await gerarPdf({ modo: 'individual', projetos: ids }, `todos os ${ids.length} projetos`);
    } catch (err) {
      const mensagem = err instanceof ApiError ? err.message : 'Não foi possível buscar os projetos.';
      await Swal.fire({ title: 'Erro', text: mensagem, icon: 'error' });
    } finally {
      setGerando(false);
    }
  };

  const modoLabel = useMemo(
    () => ({
      individual: 'Seleção individual',
      filtro: 'Por turma',
    }),
    []
  );

  return (
    <MainLayout userRole={userRole}>
      <div className="mx-auto max-w-5xl px-4 py-6">
        {/* Cabeçalho */}
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Imprimir QR Codes</h1>
            <p className="text-sm font-medium text-slate-500">
              Gere o PDF de identificação com os QR Codes dos projetos aprovados.
            </p>
          </div>

          <button
            type="button"
            disabled={gerando}
            onClick={() => void handleImprimirTodos()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {gerando ? <Loader2 size={16} className="animate-spin" /> : <FileStack size={16} />}
            Imprimir todos
          </button>
        </header>

        {/* Toggle de modo */}
        <div className="mb-5 inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {(['individual', 'filtro'] as Modo[]).map((opcao) => (
            <button
              key={opcao}
              type="button"
              onClick={() => setModo(opcao)}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                modo === opcao
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {modoLabel[opcao]}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {modo === 'individual' ? (
            <motion.section
              key="individual"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <Search size={16} className="text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    placeholder="Pesquisar por título ou ID do projeto"
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
                  />
                </div>

                <button
                  type="button"
                  onClick={toggleSelecionarTodosListados}
                  disabled={projetos.length === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  {todosSelecionados ? <CheckSquare size={15} /> : <Square size={15} />}
                  {todosSelecionados ? 'Desmarcar listados' : 'Selecionar listados'}
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto rounded-xl border border-slate-100">
                {carregando ? (
                  <div className="flex items-center justify-center gap-2 py-10 text-slate-400">
                    <Loader2 size={18} className="animate-spin" />
                    Carregando projetos...
                  </div>
                ) : projetos.length === 0 ? (
                  <div className="py-10 text-center text-slate-400">Nenhum projeto encontrado.</div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {projetos.map((projeto) => {
                      const marcado = selecionados.has(projeto.id);
                      return (
                        <li key={projeto.id}>
                          <button
                            type="button"
                            onClick={() => toggleSelecionado(projeto.id)}
                            className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                              marcado ? 'bg-emerald-50' : 'hover:bg-slate-50'
                            }`}
                          >
                            {marcado ? (
                              <CheckSquare size={18} className="shrink-0 text-emerald-700" />
                            ) : (
                              <Square size={18} className="shrink-0 text-slate-300" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-bold text-slate-800">
                                #{projeto.id} — {projeto.titulo}
                              </p>
                              <p className="truncate text-xs text-slate-500">
                                {projeto.turma} · {projeto.orientador}
                              </p>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Paginação */}
              {projetos.length > 0 && (
                <div className="mt-4">
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={(newPage) => setPage(newPage)}
                    total={total}
                    limit={limit}
                    showInfo
                  />
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-500">
                  {selecionados.size} projeto(s) selecionado(s)
                </span>
                <button
                  type="button"
                  disabled={gerando}
                  onClick={handleGerarIndividual}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-black text-white transition hover:bg-emerald-800 disabled:opacity-60"
                >
                  {gerando ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
                  Gerar PDF selecionados
                </button>
              </div>
            </motion.section>
          ) : (
            // Modo filtro (turma) – sem alterações
            <motion.section
              key="filtro"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div>
                  <label className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-400">
                    Ano
                  </label>
                  <select
                    value={ano}
                    onChange={(e) => setAno(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 outline-none"
                  >
                    {ANOS.map((a) => (
                      <option key={a} value={a}>
                        {a}º ano
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex-1">
                  <label className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-400">
                    Turma
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TURMAS.map(({ value, label, cor }) => {
                      const selecionada = turmaTexto === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setTurmaTexto(value)}
                          className={`
                            rounded-xl border px-4 py-2 text-sm font-bold transition
                            ${
                              selecionada
                                ? `${activeBg[cor]} shadow-sm`
                                : `border-slate-200 bg-white text-slate-600 ${hoverBg[cor]} hover:border-slate-300`
                            }
                          `}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={gerando || !turmaTexto}
                  onClick={handleGerarPorTurma}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-black text-white transition hover:bg-emerald-800 disabled:opacity-60"
                >
                  {gerando ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
                  Gerar PDF da turma
                </button>
              </div>

              <p className="mt-4 text-xs font-medium text-slate-400">
                O PDF incluirá apenas os projetos aprovados da turma "{ano} {turmaTexto || '...'}".
              </p>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  );
}

export default ImprimirQRCode;