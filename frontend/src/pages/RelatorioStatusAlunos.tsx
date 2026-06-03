import { useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import {
  BarChart3,
  BookOpenCheck,
  Building2,
  Download,
  FileText,
  GraduationCap,
  Loader2,
  RefreshCw,
  Search,
  UsersRound,
} from "lucide-react";
import { MainLayout } from "../componentes/SideBarUniversal";
import { apiRequest } from "../lib/api";

type AlunoRelatorio = {
  id: number;
  nome: string;
  email: string;
  ano: number;
  turma: string | null;
};

type AlunosSemProjetoResponse = Record<string, AlunoRelatorio[]>;

type ComissaoPorEventoResponse = Record<
  string,
  {
    eventoId: number;
    alunos: AlunoRelatorio[];
  }
>;

type EixosPorEventoResponse = Record<
  string,
  {
    eventoId: number;
    eixos: {
      temaId: number;
      temaNome: string;
      totalProjetos: number;
      projetosPendentes: number;
      projetosAceitos: number;
    }[];
  }
>;

type ProjetosPorOrientadorResponse = {
  orientadorId: number;
  orientadorNome: string;
  email: string;
  totalProjetosAceitos: number;
  projetos: string[];
}[];

type ProjetosPorTurmaResponse = Record<
  string,
  {
    turma: string;
    ano: number;
    totalCriados: number;
    totalAprovados: number;
  }
>;

type ReportKey =
  | "visao-geral"
  | "alunos-sem-projeto"
  | "comissao-por-evento"
  | "eixos-tematicos"
  | "projetos-por-orientador"
  | "projetos-por-turma";

type ReportState<T> = {
  data: T | null;
  loading: boolean;
  error: string;
  technical: string;
  loaded: boolean;
};

type ExportData = {
  titulo: string;
  headers: string[];
  rows: (string | number | null | undefined)[][];
};

const realReports = {
  "alunos-sem-projeto": "/relatorio/alunos-sem-projeto",
  "comissao-por-evento": "/relatorio/comissao-por-evento",
  "eixos-tematicos": "/relatorio/eixos-tematicos",
  "projetos-por-orientador": "/relatorio/projetos-por-orientador",
  "projetos-por-turma": "/relatorio/projetos-por-turma",
} as const;

const tabs: { id: ReportKey; label: string; icon: ReactNode }[] = [
  { id: "visao-geral", label: "Visão geral", icon: <BarChart3 size={17} /> },
  { id: "alunos-sem-projeto", label: "Alunos sem projeto", icon: <GraduationCap size={17} /> },
  { id: "comissao-por-evento", label: "Comissão por evento", icon: <UsersRound size={17} /> },
  { id: "eixos-tematicos", label: "Eixos temáticos", icon: <BookOpenCheck size={17} /> },
  { id: "projetos-por-orientador", label: "Projetos por orientador", icon: <UsersRound size={17} /> },
  { id: "projetos-por-turma", label: "Projetos por turma", icon: <Building2 size={17} /> },
];

const emptyState = <T,>(): ReportState<T> => ({
  data: null,
  loading: false,
  error: "",
  technical: "",
  loaded: false,
});

function technicalMessage(error: unknown) {
  return error instanceof Error ? error.message : "Erro desconhecido";
}

function formatarGrupoTurma(chave: string, alunos: AlunoRelatorio[]) {
  const primeiro = alunos[0];

  if (primeiro?.turma && primeiro?.ano) {
    return `${primeiro.turma} ${primeiro.ano}º ano`;
  }

  return chave;
}

function nomeTurma(turma: string | null, ano: number) {
  return turma ? `${turma} ${ano}º ano` : `${ano}º ano`;
}

function somaAlunosSemProjeto(data: AlunosSemProjetoResponse | null) {
  return Object.values(data ?? {}).reduce((total, alunos) => total + alunos.length, 0);
}

function somaComissao(data: ComissaoPorEventoResponse | null) {
  return Object.values(data ?? {}).reduce((total, evento) => total + evento.alunos.length, 0);
}

function somaEixos(data: EixosPorEventoResponse | null) {
  return Object.values(data ?? {}).reduce(
    (acc, evento) => {
      evento.eixos.forEach((eixo) => {
        acc.eixos += 1;
        acc.projetos += eixo.totalProjetos;
        acc.pendentes += eixo.projetosPendentes;
        acc.aceitos += eixo.projetosAceitos;
      });
      return acc;
    },
    { eixos: 0, projetos: 0, pendentes: 0, aceitos: 0 },
  );
}

function somaTurmas(data: ProjetosPorTurmaResponse | null) {
  return Object.values(data ?? {}).reduce(
    (acc, turma) => {
      acc.criados += turma.totalCriados;
      acc.aprovados += turma.totalAprovados;
      return acc;
    },
    { criados: 0, aprovados: 0 },
  );
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>{children}</section>;
}

function Skeleton() {
  return (
    <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      {[1, 2, 3].map((item) => (
        <div key={item} className="h-12 animate-pulse rounded-2xl bg-slate-100" />
      ))}
    </div>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <Card className="text-center">
      <p className="text-sm font-black text-slate-800">{message}</p>
    </Card>
  );
}

function ErrorBox<T>({ state, onRetry }: { state: ReportState<T>; onRetry: () => void }) {
  return (
    <Card className="border-red-100 bg-red-50">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black text-red-800">Não foi possível carregar este relatório.</p>
          <p className="mt-1 text-xs font-semibold text-red-700">Erro técnico: {state.technical || state.error}</p>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-red-700 px-4 py-2 text-sm font-black text-white transition hover:bg-red-800"
        >
          <RefreshCw size={15} />
          Tentar novamente
        </button>
      </div>
    </Card>
  );
}

function MetricCard({ title, value, detail, error }: { title: string; value: string | number; detail: string; error?: string }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
    >
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{title}</p>
      <strong className="mt-3 block text-3xl font-black text-slate-950">{error ? "Erro" : value}</strong>
      <p className={`mt-2 text-sm font-semibold leading-5 ${error ? "text-red-600" : "text-slate-500"}`}>{error || detail}</p>
    </motion.article>
  );
}

function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white opacity-0 shadow-lg transition group-hover:block group-hover:opacity-100">
        {label}
      </span>
    </span>
  );
}

function csvCell(value: string | number | null | undefined) {
  return `"${String(value ?? "-").replace(/"/g, '""')}"`;
}

function baixarArquivo(conteudo: BlobPart[], filename: string, type: string) {
  const blob = new Blob(conteudo, { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function linhasParaCsv(headers: string[], rows: (string | number | null | undefined)[][]) {
  return [headers, ...rows].map((row) => row.map(csvCell).join(";")).join("\n");
}

function escaparHtml(value: string | number | null | undefined) {
  return String(value ?? "-")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function abrirPdfImpressao(dados: ExportData) {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const documento = iframe.contentWindow?.document;
  if (!documento) {
    document.body.removeChild(iframe);
    return;
  }

  documento.open();
  const dataGeracao = new Date().toLocaleString("pt-BR");
  const linhasTabela = dados.rows.length
    ? dados.rows
        .map((row) => `<tr>${row.map((cell) => `<td>${escaparHtml(cell)}</td>`).join("")}</tr>`)
        .join("")
    : `<tr><td colspan="${dados.headers.length || 1}">Nenhum dado disponível para exportação.</td></tr>`;

  documento.write(`
    <html>
      <head>
        <title>${escaparHtml(dados.titulo)}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: Arial, sans-serif; margin: 0; padding: 32px; color: #0f172a; background: #fff; }
          header { border-bottom: 3px solid #047857; padding-bottom: 16px; margin-bottom: 22px; }
          .eyebrow { color: #047857; font-size: 11px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; margin: 0 0 8px; }
          h1 { font-size: 24px; margin: 0; }
          .meta { color: #64748b; font-size: 12px; font-weight: 700; margin-top: 8px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { background: #f1f5f9; color: #334155; font-size: 10px; letter-spacing: .12em; text-align: left; text-transform: uppercase; }
          th, td { border: 1px solid #e2e8f0; padding: 10px; vertical-align: top; }
          tr:nth-child(even) td { background: #f8fafc; }
          footer { margin-top: 22px; color: #94a3b8; font-size: 11px; font-weight: 700; }
        </style>
      </head>
      <body>
        <header>
          <p class="eyebrow">SECTEC · Coordenação</p>
          <h1>${escaparHtml(dados.titulo)}</h1>
          <p class="meta">Gerado em ${escaparHtml(dataGeracao)} · ${dados.rows.length} registro(s)</p>
        </header>
        <table>
          <thead>
            <tr>${dados.headers.map((header) => `<th>${escaparHtml(header)}</th>`).join("")}</tr>
          </thead>
          <tbody>${linhasTabela}</tbody>
        </table>
        <footer>Relatório gerado pelo painel da coordenação.</footer>
      </body>
    </html>
  `);
  documento.close();

  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  }, 250);
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 shadow-sm">
      <span>
        Página {page} de {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-xs font-black transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Anterior
        </button>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-xs font-black transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Próxima
        </button>
      </div>
    </div>
  );
}

function RelatorioStatusAlunos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const abaUrl = searchParams.get("aba") as ReportKey | null;
  const [abaAtiva, setAbaAtiva] = useState<ReportKey>(tabs.some((tab) => tab.id === abaUrl) ? abaUrl! : "visao-geral");
  const [busca, setBusca] = useState("");
  const [grupoAlunos, setGrupoAlunos] = useState("todos");
  const [eventoComissaoFiltro, setEventoComissaoFiltro] = useState("todos");
  const [turmaComissaoFiltro, setTurmaComissaoFiltro] = useState("todas");
  const [anoComissaoFiltro, setAnoComissaoFiltro] = useState("todos");
  const [eventoEixo, setEventoEixo] = useState("todos");
  const [turmaProjetoFiltro, setTurmaProjetoFiltro] = useState("todas");
  const [anoProjetoFiltro, setAnoProjetoFiltro] = useState("todos");
  const [paginaRelatorio, setPaginaRelatorio] = useState(1);

  const [alunosSemProjeto, setAlunosSemProjeto] = useState<ReportState<AlunosSemProjetoResponse>>(emptyState);
  const [comissaoPorEvento, setComissaoPorEvento] = useState<ReportState<ComissaoPorEventoResponse>>(emptyState);
  const [eixosTematicos, setEixosTematicos] = useState<ReportState<EixosPorEventoResponse>>(emptyState);
  const [projetosPorOrientador, setProjetosPorOrientador] = useState<ReportState<ProjetosPorOrientadorResponse>>(emptyState);
  const [projetosPorTurma, setProjetosPorTurma] = useState<ReportState<ProjetosPorTurmaResponse>>(emptyState);

  useEffect(() => {
    if (abaUrl && tabs.some((tab) => tab.id === abaUrl)) setAbaAtiva(abaUrl);
  }, [abaUrl]);

  useEffect(() => {
    setPaginaRelatorio(1);
  }, [abaAtiva, busca, grupoAlunos, eventoComissaoFiltro, turmaComissaoFiltro, anoComissaoFiltro, eventoEixo, turmaProjetoFiltro, anoProjetoFiltro]);

  async function carregar<T>(
    endpoint: string,
    setter: Dispatch<SetStateAction<ReportState<T>>>,
  ) {
    setter((atual) => ({ ...atual, loading: true, error: "", technical: "" }));

    try {
      const data = await apiRequest<T>(endpoint);
      setter({ data, loading: false, error: "", technical: "", loaded: true });
    } catch (error) {
      setter((atual) => ({
        ...atual,
        loading: false,
        error: "Não foi possível carregar este relatório.",
        technical: technicalMessage(error),
        loaded: true,
      }));
    }
  }

  function carregarTodos() {
    void carregar(realReports["alunos-sem-projeto"], setAlunosSemProjeto);
    void carregar(realReports["comissao-por-evento"], setComissaoPorEvento);
    void carregar(realReports["eixos-tematicos"], setEixosTematicos);
    void carregar(realReports["projetos-por-orientador"], setProjetosPorOrientador);
    void carregar(realReports["projetos-por-turma"], setProjetosPorTurma);
  }

  useEffect(() => {
    carregarTodos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function trocarAba(id: ReportKey) {
    setAbaAtiva(id);
    setSearchParams(id === "visao-geral" ? {} : { aba: id });
  }

  function atualizarAba() {
    if (abaAtiva === "visao-geral") return carregarTodos();
    if (abaAtiva === "alunos-sem-projeto") return void carregar(realReports[abaAtiva], setAlunosSemProjeto);
    if (abaAtiva === "comissao-por-evento") return void carregar(realReports[abaAtiva], setComissaoPorEvento);
    if (abaAtiva === "eixos-tematicos") return void carregar(realReports[abaAtiva], setEixosTematicos);
    if (abaAtiva === "projetos-por-orientador") return void carregar(realReports[abaAtiva], setProjetosPorOrientador);
    if (abaAtiva === "projetos-por-turma") return void carregar(realReports[abaAtiva], setProjetosPorTurma);
  }

  const loadingAtual =
    abaAtiva === "visao-geral"
      ? alunosSemProjeto.loading || comissaoPorEvento.loading || eixosTematicos.loading || projetosPorOrientador.loading || projetosPorTurma.loading
      : abaAtiva === "alunos-sem-projeto"
      ? alunosSemProjeto.loading
      : abaAtiva === "comissao-por-evento"
      ? comissaoPorEvento.loading
      : abaAtiva === "eixos-tematicos"
      ? eixosTematicos.loading
      : abaAtiva === "projetos-por-orientador"
      ? projetosPorOrientador.loading
      : abaAtiva === "projetos-por-turma"
      ? projetosPorTurma.loading
      : false;

  const alunosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return Object.entries(alunosSemProjeto.data ?? {})
      .filter(([grupo]) => grupoAlunos === "todos" || grupo === grupoAlunos)
      .map(([grupo, alunos]) => [
        grupo,
        alunos.filter((aluno) => {
          const bateBusca = !termo || `${aluno.nome} ${aluno.email} ${aluno.turma ?? ""}`.toLowerCase().includes(termo);
          return bateBusca;
        }),
      ] as const)
      .filter(([, alunos]) => alunos.length > 0);
  }, [alunosSemProjeto.data, busca, grupoAlunos]);

  const comissaoFiltrada = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return Object.entries(comissaoPorEvento.data ?? {})
      .filter(([evento]) => eventoComissaoFiltro === "todos" || evento === eventoComissaoFiltro)
      .map(([evento, dados]) => [
        evento,
        {
          ...dados,
          alunos: dados.alunos.filter((aluno) => {
            const bateBusca = !termo || `${aluno.nome} ${aluno.email}`.toLowerCase().includes(termo);
            const bateTurma = turmaComissaoFiltro === "todas" || (aluno.turma ?? "").toLowerCase() === turmaComissaoFiltro.toLowerCase();
            const bateAno = anoComissaoFiltro === "todos" || String(aluno.ano) === anoComissaoFiltro;
            return bateBusca && bateTurma && bateAno;
          }),
        },
      ] as const)
      .filter(([, dados]) => dados.alunos.length > 0);
  }, [anoComissaoFiltro, busca, comissaoPorEvento.data, eventoComissaoFiltro, turmaComissaoFiltro]);

  const eixosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return Object.entries(eixosTematicos.data ?? {})
      .filter(([evento]) => eventoEixo === "todos" || evento === eventoEixo)
      .map(([evento, dados]) => [
        evento,
        {
          ...dados,
          eixos: dados.eixos.filter((eixo) => !termo || eixo.temaNome.toLowerCase().includes(termo)),
        },
      ] as const)
      .filter(([, dados]) => dados.eixos.length > 0);
  }, [busca, eixosTematicos.data, eventoEixo]);

  const orientadoresFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return [...(projetosPorOrientador.data ?? [])]
      .filter((orientador) => {
        if (!termo) return true;
        return `${orientador.orientadorNome} ${orientador.email} ${orientador.projetos.join(" ")}`.toLowerCase().includes(termo);
      })
      .sort((a, b) => b.totalProjetosAceitos - a.totalProjetosAceitos);
  }, [busca, projetosPorOrientador.data]);

  const turmasFiltradas = useMemo(() => {
    return Object.values(projetosPorTurma.data ?? {})
      .filter((turma) => turmaProjetoFiltro === "todas" || turma.turma === turmaProjetoFiltro)
      .filter((turma) => anoProjetoFiltro === "todos" || String(turma.ano) === anoProjetoFiltro)
      .sort((a, b) => a.ano - b.ano || a.turma.localeCompare(b.turma));
  }, [anoProjetoFiltro, projetosPorTurma.data, turmaProjetoFiltro]);

  const turmasComissao = useMemo(() => {
    return Array.from(new Set(Object.values(comissaoPorEvento.data ?? {}).flatMap((evento) => evento.alunos.map((aluno) => aluno.turma).filter(Boolean)))).sort() as string[];
  }, [comissaoPorEvento.data]);

  const anosComissao = useMemo(() => {
    return Array.from(new Set(Object.values(comissaoPorEvento.data ?? {}).flatMap((evento) => evento.alunos.map((aluno) => aluno.ano)))).sort((a, b) => a - b);
  }, [comissaoPorEvento.data]);

  const turmasProjetos = useMemo(() => {
    return Array.from(new Set(Object.values(projetosPorTurma.data ?? {}).map((turma) => turma.turma))).sort();
  }, [projetosPorTurma.data]);

  const anosProjetos = useMemo(() => {
    return Array.from(new Set(Object.values(projetosPorTurma.data ?? {}).map((turma) => turma.ano))).sort((a, b) => a - b);
  }, [projetosPorTurma.data]);

  const eixosResumo = somaEixos(eixosTematicos.data);
  const turmasResumo = somaTurmas(projetosPorTurma.data);
  const orientadoresResumo = (projetosPorOrientador.data ?? []).reduce(
    (total, orientador) => total + orientador.totalProjetosAceitos,
    0,
  );
  const itensPorPagina = 8;

  function paginar<T>(items: T[]) {
    const totalPages = Math.max(1, Math.ceil(items.length / itensPorPagina));
    const page = Math.min(paginaRelatorio, totalPages);
    const inicio = (page - 1) * itensPorPagina;
    return {
      page,
      totalPages,
      items: items.slice(inicio, inicio + itensPorPagina),
    };
  }

  function dadosExportacaoAtual() {
    if (abaAtiva === "alunos-sem-projeto") {
      const rows = alunosFiltrados.flatMap(([grupo, alunos]) =>
        alunos.map((aluno) => [formatarGrupoTurma(grupo, alunos), aluno.nome, aluno.email]),
      );
      return {
        titulo: "Alunos sem projeto",
        headers: ["Turma", "Nome", "Email"],
        rows,
      };
    }

    if (abaAtiva === "comissao-por-evento") {
      const rows = comissaoFiltrada.flatMap(([evento, dados]) =>
        dados.alunos.map((aluno) => [evento, aluno.nome, aluno.email, aluno.turma, aluno.ano]),
      );
      return {
        titulo: "Comissão por evento",
        headers: ["Evento", "Nome", "Email", "Turma", "Ano"],
        rows,
      };
    }

    if (abaAtiva === "eixos-tematicos") {
      const rows = eixosFiltrados.flatMap(([evento, dados]) =>
        dados.eixos.map((eixo) => [evento, eixo.temaNome, eixo.totalProjetos, eixo.projetosPendentes, eixo.projetosAceitos]),
      );
      return {
        titulo: "Eixos temáticos",
        headers: ["Evento", "Eixo", "Total", "Pendentes", "Aceitos"],
        rows,
      };
    }

    if (abaAtiva === "projetos-por-orientador") {
      const rows = orientadoresFiltrados.map((orientador) => [
        orientador.orientadorNome,
        orientador.email,
        orientador.totalProjetosAceitos,
        orientador.projetos.join(" | "),
      ]);
      return {
        titulo: "Projetos por orientador",
        headers: ["Orientador", "Email", "Projetos aceitos", "Projetos"],
        rows,
      };
    }

    if (abaAtiva === "projetos-por-turma") {
      const rows = turmasFiltradas.map((turma) => [turma.turma, turma.ano, turma.totalCriados, turma.totalAprovados]);
      return {
        titulo: "Projetos por turma",
        headers: ["Turma", "Ano", "Criados", "Aprovados"],
        rows,
      };
    }

    const linhas = [
      ["Alunos sem projeto", somaAlunosSemProjeto(alunosSemProjeto.data)],
      ["Eventos com comissão", Object.keys(comissaoPorEvento.data ?? {}).length],
      ["Eixos temáticos", eixosResumo.eixos],
      ["Projetos pendentes", eixosResumo.pendentes],
      ["Projetos aceitos", eixosResumo.aceitos],
      ["Orientadores com projetos", projetosPorOrientador.data?.length ?? 0],
      ["Projetos criados por turma", turmasResumo.criados],
      ["Projetos aprovados por turma", turmasResumo.aprovados],
    ];
    return {
      titulo: "Visão geral dos relatórios",
      headers: ["Indicador", "Valor"],
      rows: linhas,
    };
  }

  function exportarCsv() {
    const dados = dadosExportacaoAtual();
    baixarArquivo(["\ufeff", linhasParaCsv(dados.headers, dados.rows)], `${abaAtiva}.csv`, "text/csv;charset=utf-8");
  }

  function exportarPdf() {
    const dados = dadosExportacaoAtual();
    abrirPdfImpressao(dados);
  }

  function renderVisaoGeral() {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Alunos sem projeto"
          value={somaAlunosSemProjeto(alunosSemProjeto.data)}
          detail={`${Object.keys(alunosSemProjeto.data ?? {}).length} turma(s) afetada(s)`}
          error={alunosSemProjeto.error}
        />
        <MetricCard
          title="Comissão por evento"
          value={Object.keys(comissaoPorEvento.data ?? {}).length}
          detail={`${somaComissao(comissaoPorEvento.data)} membro(s) registrados`}
          error={comissaoPorEvento.error}
        />
        <MetricCard
          title="Eixos temáticos"
          value={eixosResumo.eixos}
          detail={`${eixosResumo.projetos} projetos · ${eixosResumo.pendentes} pendentes · ${eixosResumo.aceitos} aceitos`}
          error={eixosTematicos.error}
        />
        <MetricCard
          title="Projetos por orientador"
          value={projetosPorOrientador.data?.length ?? 0}
          detail={`${orientadoresResumo} projeto(s) aceitos`}
          error={projetosPorOrientador.error}
        />
        <MetricCard
          title="Projetos por turma"
          value={Object.keys(projetosPorTurma.data ?? {}).length}
          detail={`${turmasResumo.criados} criados · ${turmasResumo.aprovados} aprovados`}
          error={projetosPorTurma.error}
        />
      </div>
    );
  }

  function renderAlunosSemProjeto() {
    if (alunosSemProjeto.loading) return <Skeleton />;
    if (alunosSemProjeto.error) return <ErrorBox state={alunosSemProjeto} onRetry={() => carregar(realReports["alunos-sem-projeto"], setAlunosSemProjeto)} />;
    if (!somaAlunosSemProjeto(alunosSemProjeto.data)) return <Empty message="Nenhum aluno sem projeto encontrado." />;

    const alunosLista = alunosFiltrados.flatMap(([grupo, alunos]) =>
      alunos.map((aluno) => ({
        grupo,
        grupoLabel: formatarGrupoTurma(grupo, alunos),
        aluno,
      })),
    );
    const pagina = paginar(alunosLista);
    const gruposPaginados = pagina.items.reduce<Record<string, { label: string; alunos: AlunoRelatorio[] }>>((acc, item) => {
      acc[item.grupo] ??= { label: item.grupoLabel, alunos: [] };
      acc[item.grupo].alunos.push(item.aluno);
      return acc;
    }, {});

    return (
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[1fr_260px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar por nome ou email"
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-emerald-400"
            />
          </label>
          <select
            value={grupoAlunos}
            onChange={(event) => setGrupoAlunos(event.target.value)}
            className="cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-emerald-400"
          >
            <option value="todos">Todas as turmas</option>
            {Object.entries(alunosSemProjeto.data ?? {}).map(([grupo, alunos]) => (
              <option key={grupo} value={grupo}>
                {formatarGrupoTurma(grupo, alunos)}
              </option>
            ))}
          </select>
        </div>

        {alunosFiltrados.length === 0 ? <Empty message="Nenhum aluno sem projeto encontrado." /> : null}

        {Object.entries(gruposPaginados).map(([grupo, dados]) => (
          <Card key={grupo}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-black text-slate-950">{dados.label}</h2>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{dados.alunos.length} nesta página</span>
            </div>
            <div className="mt-4 grid gap-2">
              {dados.alunos.map((aluno) => (
                <div key={aluno.id} className="rounded-2xl border border-slate-100 p-3 transition hover:bg-emerald-50/40">
                  <div>
                    <p className="font-black text-slate-900">{aluno.nome}</p>
                    <p className="text-sm font-semibold text-slate-500">{aluno.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}

        <Pagination page={pagina.page} totalPages={pagina.totalPages} onPageChange={setPaginaRelatorio} />
      </div>
    );
  }

  function renderComissao() {
    if (comissaoPorEvento.loading) return <Skeleton />;
    if (comissaoPorEvento.error) return <ErrorBox state={comissaoPorEvento} onRetry={() => carregar(realReports["comissao-por-evento"], setComissaoPorEvento)} />;
    if (!somaComissao(comissaoPorEvento.data)) return <Empty message="Nenhum histórico de comissão encontrado." />;

    const pagina = paginar(comissaoFiltrada);

    return (
      <div className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_240px_190px_170px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar por nome ou email"
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-emerald-400"
            />
          </label>
          <select value={eventoComissaoFiltro} onChange={(event) => setEventoComissaoFiltro(event.target.value)} className="cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-emerald-400">
            <option value="todos">Todos os eventos</option>
            {Object.keys(comissaoPorEvento.data ?? {}).map((evento) => (
              <option key={evento} value={evento}>{evento}</option>
            ))}
          </select>
          <select value={turmaComissaoFiltro} onChange={(event) => setTurmaComissaoFiltro(event.target.value)} className="cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-emerald-400">
            <option value="todas">Todas as turmas</option>
            {turmasComissao.map((turma) => (
              <option key={turma} value={turma}>{turma}</option>
            ))}
          </select>
          <select value={anoComissaoFiltro} onChange={(event) => setAnoComissaoFiltro(event.target.value)} className="cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-emerald-400">
            <option value="todos">Todos os anos</option>
            {anosComissao.map((ano) => (
              <option key={ano} value={ano}>{ano}º ano</option>
            ))}
          </select>
        </div>

        {comissaoFiltrada.length === 0 ? <Empty message="Nenhum histórico de comissão encontrado." /> : null}

        <div className="grid gap-4 lg:grid-cols-2">
          {pagina.items.map(([evento, dados]) => (
            <Card key={evento}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Evento #{dados.eventoId}</p>
                  <h2 className="mt-2 text-lg font-black text-slate-950">{evento}</h2>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{dados.alunos.length} membro(s)</span>
              </div>
              <div className="mt-4 space-y-2">
                {dados.alunos.map((aluno) => (
                  <div key={aluno.id} className="rounded-2xl border border-slate-100 p-3 transition hover:bg-slate-50">
                    <p className="font-black text-slate-900">{aluno.nome}</p>
                    <p className="text-sm font-semibold text-slate-500">{aluno.email}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">{nomeTurma(aluno.turma, aluno.ano)}</p>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        <Pagination page={pagina.page} totalPages={pagina.totalPages} onPageChange={setPaginaRelatorio} />
      </div>
    );
  }

  function renderEixos() {
    if (eixosTematicos.loading) return <Skeleton />;
    if (eixosTematicos.error) return <ErrorBox state={eixosTematicos} onRetry={() => carregar(realReports["eixos-tematicos"], setEixosTematicos)} />;
    if (!eixosResumo.eixos) return <Empty message="Nenhum eixo temático encontrado." />;

    const pagina = paginar(eixosFiltrados);

    return (
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[1fr_260px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar eixo temático"
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-emerald-400"
            />
          </label>
          <select
            value={eventoEixo}
            onChange={(event) => setEventoEixo(event.target.value)}
            className="cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-emerald-400"
          >
            <option value="todos">Todos os eventos</option>
            {Object.keys(eixosTematicos.data ?? {}).map((evento) => (
              <option key={evento} value={evento}>
                {evento}
              </option>
            ))}
          </select>
        </div>

        {eixosFiltrados.length === 0 ? <Empty message="Nenhum eixo temático encontrado." /> : null}

        {pagina.items.map(([evento, dados]) => (
          <Card key={evento}>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Evento #{dados.eventoId}</p>
            <h2 className="mt-2 text-lg font-black text-slate-950">{evento}</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {dados.eixos.map((eixo) => (
                <div key={eixo.temaId} className="rounded-2xl border border-slate-100 p-4 transition hover:bg-slate-50">
                  <p className="font-black text-slate-900">{eixo.temaNome}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Total: {eixo.totalProjetos}</span>
                    <Tooltip label="Projetos aguardando orientação">
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">Pendentes: {eixo.projetosPendentes}</span>
                    </Tooltip>
                    <Tooltip label="Projetos com orientador aceito">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">Aceitos: {eixo.projetosAceitos}</span>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}

        <Pagination page={pagina.page} totalPages={pagina.totalPages} onPageChange={setPaginaRelatorio} />
      </div>
    );
  }

  function renderOrientadores() {
    if (projetosPorOrientador.loading) return <Skeleton />;
    if (projetosPorOrientador.error) return <ErrorBox state={projetosPorOrientador} onRetry={() => carregar(realReports["projetos-por-orientador"], setProjetosPorOrientador)} />;
    if (!projetosPorOrientador.data?.length) return <Empty message="Nenhum projeto por orientador encontrado." />;

    const pagina = paginar(orientadoresFiltrados);

    return (
      <div className="space-y-4">
        <label className="relative block max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar por orientador, email ou projeto"
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-emerald-400"
          />
        </label>

        {orientadoresFiltrados.length === 0 ? <Empty message="Nenhum projeto por orientador encontrado." /> : null}

        <div className="grid gap-4 lg:grid-cols-2">
          {pagina.items.map((orientador) => (
            <Card key={orientador.orientadorId}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-slate-950">{orientador.orientadorNome}</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{orientador.email}</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                  {orientador.totalProjetosAceitos} aceito(s)
                </span>
              </div>
              <div className="mt-4 space-y-2">
                {orientador.projetos.length ? (
                  orientador.projetos.map((projeto) => (
                    <p key={projeto} className="rounded-2xl border border-slate-100 px-3 py-2 text-sm font-bold text-slate-700">
                      {projeto}
                    </p>
                  ))
                ) : (
                  <p className="rounded-2xl bg-slate-50 px-3 py-2 text-sm font-bold text-slate-500">Nenhum projeto aceito.</p>
                )}
              </div>
            </Card>
          ))}
        </div>

        <Pagination page={pagina.page} totalPages={pagina.totalPages} onPageChange={setPaginaRelatorio} />
      </div>
    );
  }

  function renderTurmas() {
    if (projetosPorTurma.loading) return <Skeleton />;
    if (projetosPorTurma.error) return <ErrorBox state={projetosPorTurma} onRetry={() => carregar(realReports["projetos-por-turma"], setProjetosPorTurma)} />;

    if (!Object.keys(projetosPorTurma.data ?? {}).length) return <Empty message="Nenhum projeto por turma encontrado." />;

    const pagina = paginar(turmasFiltradas);

    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:max-w-xl">
          <select value={turmaProjetoFiltro} onChange={(event) => setTurmaProjetoFiltro(event.target.value)} className="cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-emerald-400">
            <option value="todas">Todas as turmas</option>
            {turmasProjetos.map((turma) => (
              <option key={turma} value={turma}>{turma}</option>
            ))}
          </select>
          <select value={anoProjetoFiltro} onChange={(event) => setAnoProjetoFiltro(event.target.value)} className="cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-emerald-400">
            <option value="todos">Todos os anos</option>
            {anosProjetos.map((ano) => (
              <option key={ano} value={ano}>{ano}º ano</option>
            ))}
          </select>
        </div>

        {turmasFiltradas.length === 0 ? <Empty message="Nenhum projeto por turma encontrado." /> : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pagina.items.map((turma) => {
            const progresso = turma.totalCriados ? Math.round((turma.totalAprovados / turma.totalCriados) * 100) : 0;

            return (
              <Card key={`${turma.turma}-${turma.ano}`}>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Turma</p>
                <h2 className="mt-2 text-lg font-black text-slate-950">{nomeTurma(turma.turma, turma.ano)}</h2>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs font-black text-slate-400">Criados</p>
                    <strong className="text-xl font-black text-slate-900">{turma.totalCriados}</strong>
                  </div>
                  <div className="rounded-2xl bg-emerald-50 p-3">
                    <p className="text-xs font-black text-emerald-600">Aprovados</p>
                    <strong className="text-xl font-black text-emerald-800">{turma.totalAprovados}</strong>
                  </div>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-emerald-600" style={{ width: `${progresso}%` }} />
                </div>
                <p className="mt-2 text-xs font-bold text-slate-500">{turma.totalAprovados} / {turma.totalCriados} aprovados</p>
              </Card>
            );
          })}
        </div>

        <Pagination page={pagina.page} totalPages={pagina.totalPages} onPageChange={setPaginaRelatorio} />
      </div>
    );
  }

  function renderConteudo() {
    if (abaAtiva === "visao-geral") return renderVisaoGeral();
    if (abaAtiva === "alunos-sem-projeto") return renderAlunosSemProjeto();
    if (abaAtiva === "comissao-por-evento") return renderComissao();
    if (abaAtiva === "eixos-tematicos") return renderEixos();
    if (abaAtiva === "projetos-por-orientador") return renderOrientadores();
    return renderTurmas();
  }

  return (
    <MainLayout userRole="coordenador">
      <main className="min-h-screen bg-slate-50 px-4 py-5 sm:px-7 sm:py-7">
        <div className="mx-auto w-full max-w-[1500px] space-y-5">
          <section className="rounded-[2rem] bg-gradient-to-br from-emerald-800 via-emerald-700 to-slate-950 p-6 text-white shadow-sm sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-white/75">
                  Relatórios reais
                </span>
                <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">Status da Coordenação</h1>
                <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-white/70 sm:text-base">
                  Dados operacionais vindos dos endpoints reais de relatório do backend.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={exportarPdf}
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-white/15 sm:w-auto"
                >
                  <FileText size={17} />
                  Exportar PDF
                </button>
                <button
                  type="button"
                  onClick={exportarCsv}
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-white/15 sm:w-auto"
                >
                  <Download size={17} />
                  Exportar CSV
                </button>
                <Tooltip label="Atualizar dados">
                  <button
                    type="button"
                    onClick={atualizarAba}
                    disabled={loadingAtual}
                    className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white px-5 py-3 text-sm font-black text-emerald-800 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                  >
                    {loadingAtual ? <Loader2 className="animate-spin" size={17} /> : <RefreshCw size={17} />}
                    {loadingAtual ? "Atualizando..." : "Atualizar"}
                  </button>
                </Tooltip>
              </div>
            </div>
          </section>

          <nav className="flex gap-2 overflow-x-auto rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => trocarAba(tab.id)}
                className={`inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition ${
                  abaAtiva === tab.id ? "bg-emerald-700 text-white shadow-sm" : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>

          {renderConteudo()}
        </div>
      </main>
    </MainLayout>
  );
}

export default RelatorioStatusAlunos;
