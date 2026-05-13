import { useState, useRef, useEffect } from "react";
import {
  FileText, Lock, Clock, Upload,
  ChevronRight, Info, Calendar, ShieldCheck, RefreshCw,
  BookOpen, Pencil, Send, TriangleAlert
} from "lucide-react";
import { MainLayout } from "../componentes/SideBarUniversal";
import Swal from "sweetalert2";

// ─── Configuração global ────────────────────────────────────────────────────
const CONFIG_RELATORIO = {
  dataInicio: new Date("2026-08-01T00:00:00"),
  dataFim: new Date("2026-08-15T23:59:59"),
  tituloEvento: "SECTEC 2026",
};

type StatusRelatorio = "Rascunho" | "Submetido" | "Avaliado";

type Relatorio = {
  id: string;
  titulo: string;
  descricao: string;
  arquivoPdf?: string;
  status: StatusRelatorio;
  nota?: number;
  feedback?: string;
  criadoEm: string;
  atualizadoEm: string;
};

type PermissaoAluno = {
  permitido: boolean;
  possuiProjetoFeira: boolean;
  relatorio?: Relatorio;
};

// ─── Helpers ────────────────────────────────────────────────────────────────
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function isJanelaAberta(): boolean {
  const agora = new Date();
  return agora >= CONFIG_RELATORIO.dataInicio && agora <= CONFIG_RELATORIO.dataFim;
}

function formatarData(data: Date): string {
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── Status badge — padrão SECTEC ───────────────────────────────────────────
const STATUS_STYLE: Record<StatusRelatorio, string> = {
  Rascunho:  "bg-slate-100 text-slate-600",
  Submetido: "bg-yellow-100 text-yellow-700",
  Avaliado:  "bg-green-100 text-green-700",
};

const STATUS_DESC: Record<StatusRelatorio, string> = {
  Rascunho:  "Salvo como rascunho. Você ainda pode editar e submeter.",
  Submetido: "Relatório enviado. Aguardando avaliação da coordenação.",
  Avaliado:  "A coordenação já avaliou seu relatório.",
};

// ─── Banner: está em equipe ──────────────────────────────────────────────────
function BannerEmEquipe() {
  return (
    <div className="flex items-start gap-4 bg-amber-50 border border-amber-200 rounded-2xl p-5">
      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
        <TriangleAlert size={18} className="text-amber-600" />
      </div>
      <div>
        <p className="text-sm font-semibold text-amber-900">Você já participa de uma equipe</p>
        <p className="text-xs text-amber-700 mt-1 leading-relaxed">
          Alunos inscritos em projetos da feira científica não podem submeter relatórios individuais.
          Caso queira participar pelo relatório, saia da equipe primeiro no <strong>Painel</strong>.
        </p>
      </div>
    </div>
  );
}

// ─── Banner: sem permissão ───────────────────────────────────────────────────
function BannerSemPermissao() {
  return (
    <div className="flex items-start gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-5">
      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
        <Lock size={18} className="text-slate-500" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-700">Acesso não liberado</p>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          A modalidade de relatório individual ainda não foi liberada para você pela coordenação.
          Entre em contato com a coordenação para solicitar a habilitação.
        </p>
      </div>
    </div>
  );
}

// ─── Banner: fora do período ─────────────────────────────────────────────────
function BannerForaDoPeriodo() {
  const agora = new Date();
  const naoComecou = agora < CONFIG_RELATORIO.dataInicio;
  return (
    <div className="flex items-start gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-5">
      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
        <Clock size={18} className="text-slate-500" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-700">
          {naoComecou ? "Período ainda não iniciado" : "Período encerrado"}
        </p>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          {naoComecou
            ? `O período para submissão de relatórios começa em ${formatarData(CONFIG_RELATORIO.dataInicio)}.`
            : `O período para submissão de relatórios encerrou em ${formatarData(CONFIG_RELATORIO.dataFim)}.`}
        </p>
        <div className="flex items-center gap-3 mt-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Calendar size={11} />
            <span>Início: {formatarData(CONFIG_RELATORIO.dataInicio)}</span>
          </div>
          <span className="text-slate-300">·</span>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Calendar size={11} />
            <span>Fim: {formatarData(CONFIG_RELATORIO.dataFim)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Card: relatório submetido / avaliado ────────────────────────────────────
function CardRelatorioSubmetido({ relatorio }: { relatorio: Relatorio }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-sectec-50 border border-sectec-100 flex items-center justify-center shrink-0">
          <FileText size={18} className="text-sectec-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="text-sm font-semibold text-slate-900 leading-tight">{relatorio.titulo}</h2>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLE[relatorio.status]}`}>
              {relatorio.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 line-clamp-2">{relatorio.descricao}</p>
        </div>
      </div>

      <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500 flex items-start gap-2">
        <Info size={12} className="mt-0.5 shrink-0 text-slate-400" />
        {STATUS_DESC[relatorio.status]}
      </div>

      {relatorio.arquivoPdf && (
        <div className="flex items-center gap-2 bg-sectec-50 border border-sectec-100 rounded-xl px-3 py-2.5">
          <FileText size={13} className="text-sectec-600 shrink-0" />
          <span className="text-xs font-medium text-sectec-700 truncate flex-1">{relatorio.arquivoPdf}</span>
          <span className="text-[10px] text-sectec-500 shrink-0">PDF</span>
        </div>
      )}

      {relatorio.status === "Avaliado" && relatorio.nota !== undefined && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-sectec-50 border border-sectec-100 rounded-xl p-3 text-center">
            <p className="text-[10px] text-sectec-600 font-semibold uppercase tracking-wider mb-1">Nota</p>
            <p className="text-2xl font-black text-sectec-700">{relatorio.nota}</p>
          </div>
          {relatorio.feedback && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Feedback</p>
              <p className="text-xs text-slate-600 line-clamp-3">{relatorio.feedback}</p>
            </div>
          )}
        </div>
      )}

      <div className="pt-2 border-t border-slate-100">
        <p className="text-[11px] text-slate-400">
          Submetido em {formatarDataHora(relatorio.atualizadoEm)}
        </p>
      </div>
    </div>
  );
}

// ─── Formulário ──────────────────────────────────────────────────────────────
function FormRelatorio({
  relatorioExistente,
  onSalvo,
}: {
  relatorioExistente?: Relatorio;
  onSalvo: (r: Relatorio) => void;
}) {
  const [titulo, setTitulo] = useState(relatorioExistente?.titulo ?? "");
  const [descricao, setDescricao] = useState(relatorioExistente?.descricao ?? "");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [nomeArquivoExistente] = useState(relatorioExistente?.arquivoPdf);
  const [salvando, setSalvando] = useState(false);
  const [submetendo, setSubmetendo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const janelaAberta = isJanelaAberta();
  const podeEditar = janelaAberta
    && relatorioExistente?.status !== "Submetido"
    && relatorioExistente?.status !== "Avaliado";
  const podeSubmeter = podeEditar && titulo.trim() && descricao.trim() && (arquivo || nomeArquivoExistente);

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      const url = relatorioExistente
        ? `http://localhost:3000/relatorios/${relatorioExistente.id}`
        : "http://localhost:3000/relatorios";
      const method = relatorioExistente ? "PATCH" : "POST";
      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify({ titulo, descricao }),
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      onSalvo({ ...data, arquivoPdf: arquivo?.name ?? nomeArquivoExistente });
      Swal.fire({ icon: "success", title: "Rascunho salvo!", showConfirmButton: false, timer: 1200, timerProgressBar: true });
    } catch {
      Swal.fire({ icon: "error", title: "Erro ao salvar", text: "Tente novamente.", confirmButtonColor: "#15803d" });
    } finally {
      setSalvando(false);
    }
  }

  async function handleSubmeter() {
    if (!podeSubmeter) return;
    const result = await Swal.fire({
      title: "Submeter relatório?",
      html: `<p style="font-size:13px;color:#64748b">Após submeter, não será possível editar. Certifique-se que o PDF e o texto estão corretos.</p>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sim, submeter",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#15803d",
      cancelButtonColor: "#94a3b8",
    });
    if (!result.isConfirmed) return;
    setSubmetendo(true);
    try {
      const url = relatorioExistente
        ? `http://localhost:3000/relatorios/${relatorioExistente.id}/submeter`
        : "http://localhost:3000/relatorios/submeter";
      const response = await fetch(url, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ titulo, descricao }),
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      onSalvo({ ...data, status: "Submetido", arquivoPdf: arquivo?.name ?? nomeArquivoExistente });
      Swal.fire({ icon: "success", title: "Relatório submetido!", showConfirmButton: false, timer: 1400, timerProgressBar: true });
    } catch {
      Swal.fire({ icon: "error", title: "Erro ao submeter", confirmButtonColor: "#15803d" });
    } finally {
      setSubmetendo(false);
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
        <div className="w-9 h-9 rounded-xl bg-sectec-50 border border-sectec-100 flex items-center justify-center">
          <BookOpen size={16} className="text-sectec-600" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            {relatorioExistente ? "Editar Relatório" : "Novo Relatório"}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Prazo: {formatarData(CONFIG_RELATORIO.dataInicio)} – {formatarData(CONFIG_RELATORIO.dataFim)}
          </p>
        </div>
        {relatorioExistente && (
          <span className={`ml-auto text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[relatorioExistente.status]}`}>
            {relatorioExistente.status}
          </span>
        )}
      </div>

      <form onSubmit={handleSalvar} className="p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Título do Relatório *</label>
          <input
            required
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            disabled={!podeEditar}
            placeholder="Ex: Impacto do uso de smartphones na aprendizagem"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-sectec-600 focus:ring-2 focus:ring-sectec-100 transition disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Resumo / Introdução *</label>
          <textarea
            required
            rows={5}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            disabled={!podeEditar}
            placeholder="Descreva o objetivo, metodologia e conclusões principais do seu relatório..."
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-sectec-600 focus:ring-2 focus:ring-sectec-100 transition resize-none disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Documento PDF *</label>
          <input ref={inputRef} type="file" accept=".pdf" disabled={!podeEditar} onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} className="hidden" />
          <button
            type="button"
            disabled={!podeEditar}
            onClick={() => inputRef.current?.click()}
            className={`w-full border-2 border-dashed rounded-xl p-4 flex flex-col items-center gap-2 transition-colors text-center
              ${podeEditar
                ? "border-slate-200 hover:border-sectec-400 hover:bg-sectec-50 cursor-pointer"
                : "border-slate-100 bg-slate-50 cursor-not-allowed opacity-60"
              }`}
          >
            {arquivo ? (
              <>
                <FileText size={20} className="text-sectec-600" />
                <span className="text-xs font-medium text-sectec-700 break-all">{arquivo.name}</span>
                <span className="text-[10px] text-slate-400">Clique para trocar</span>
              </>
            ) : nomeArquivoExistente ? (
              <>
                <FileText size={20} className="text-sectec-500" />
                <span className="text-xs font-medium text-sectec-700 break-all">{nomeArquivoExistente}</span>
                {podeEditar && <span className="text-[10px] text-slate-400">Clique para substituir</span>}
              </>
            ) : (
              <>
                <Upload size={20} className="text-slate-400" />
                <span className="text-xs text-slate-500">
                  {podeEditar ? "Clique para selecionar o PDF" : "Nenhum arquivo"}
                </span>
              </>
            )}
          </button>
        </div>

        {!janelaAberta && (
          <div className="flex gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
            <Lock size={13} className="text-slate-400 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-500">O período de submissão está encerrado. Não é possível editar.</p>
          </div>
        )}

        {podeEditar && (
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={salvando || !titulo.trim() || !descricao.trim()}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {salvando ? (
                <><svg className="animate-spin h-4 w-4 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Salvando...</>
              ) : (
                <><Pencil size={13} />Salvar rascunho</>
              )}
            </button>
            <button
              type="button"
              disabled={submetendo || !podeSubmeter}
              onClick={handleSubmeter}
              className="flex items-center gap-2 flex-1 justify-center py-2.5 text-sm font-semibold text-white bg-sectec-700 rounded-lg hover:bg-sectec-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submetendo ? (
                <><svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Submetendo...</>
              ) : (
                <><Send size={13} />Submeter relatório</>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

// ─── Cronograma lateral ──────────────────────────────────────────────────────
function CronogramaRelatorio() {
  const agora = new Date();
  const naoComecou = agora < CONFIG_RELATORIO.dataInicio;
  const encerrado = agora > CONFIG_RELATORIO.dataFim;
  const emAndamento = !naoComecou && !encerrado;

  const etapas = [
    {
      label: "Abertura",
      data: formatarData(CONFIG_RELATORIO.dataInicio),
      done: !naoComecou,
      active: emAndamento && agora.toDateString() === CONFIG_RELATORIO.dataInicio.toDateString(),
    },
    {
      label: "Em andamento",
      data: "Até " + formatarData(CONFIG_RELATORIO.dataFim),
      done: encerrado,
      active: emAndamento,
    },
    {
      label: "Encerramento",
      data: formatarData(CONFIG_RELATORIO.dataFim),
      done: encerrado,
      active: false,
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-5">
        <Calendar size={14} className="text-sectec-600" />
        <h3 className="text-sm font-semibold text-slate-700">Período de Relatórios</h3>
      </div>

      <div className="relative">
        <div className="absolute left-3.5 top-3 bottom-3 w-px bg-slate-200" />
        <div className="space-y-5">
          {etapas.map((item, i) => (
            <div key={i} className="flex gap-4 relative">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 text-xs font-bold border-2
                ${item.done
                  ? "bg-sectec-600 border-sectec-600 text-white"
                  : item.active
                  ? "bg-white border-sectec-600 text-sectec-700"
                  : "bg-white border-slate-200 text-slate-400"
                }`}>
                {item.done ? "✓" : i + 1}
              </div>
              <div className="pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`text-sm font-semibold ${item.active ? "text-sectec-700" : item.done ? "text-slate-700" : "text-slate-400"}`}>
                    {item.label}
                  </p>
                  {item.active && (
                    <span className="text-[10px] font-semibold bg-sectec-100 text-sectec-700 px-2 py-0.5 rounded-full">Atual</span>
                  )}
                </div>
                <p className={`text-xs mt-0.5 ${item.active ? "text-slate-500" : item.done ? "text-slate-400" : "text-slate-300"}`}>
                  {item.data}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100">
        <div className="flex items-start gap-2">
          <ShieldCheck size={12} className="text-sectec-500 mt-0.5 shrink-0" />
          <p className="text-[11px] text-slate-500">
            Disponível apenas para alunos habilitados pela coordenação do {CONFIG_RELATORIO.tituloEvento}.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar: sobre a modalidade ─────────────────────────────────────────────
function SobreModalidade() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Sobre esta modalidade</h3>
      <ul className="space-y-2">
        {[
          "Apenas alunos habilitados pela coordenação podem submeter",
          "Não é possível participar da feira e do relatório simultaneamente",
          "O relatório deve ser enviado em PDF dentro do prazo",
          "Após submeter, não é possível editar",
          "A avaliação é feita pela coordenação",
        ].map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-slate-500">
            <ChevronRight size={12} className="text-sectec-500 mt-0.5 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function RelatoriosAluno() {
  const [carregando, setCarregando] = useState(true);
  const [permissao, setPermissao] = useState<PermissaoAluno | null>(null);
  const [relatorio, setRelatorio] = useState<Relatorio | undefined>(undefined);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` } as HeadersInit;

    Promise.all([
      fetch("http://localhost:3000/relatorios/permissao", { headers }).then((r) => r.json()),
      fetch("http://localhost:3000/relatorios/meu", { headers })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ])
      .then(([perm, rel]) => {
        setPermissao(perm as PermissaoAluno);
        if (rel) setRelatorio(rel as Relatorio);
      })
      .catch(() => {
        setPermissao({ permitido: true, possuiProjetoFeira: false });
      })
      .finally(() => setCarregando(false));
  }, []);

  const janelaAberta = isJanelaAberta();

  return (
    <MainLayout userRole="aluno">
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">

        {/* Cabeçalho */}
        <div className="mb-6">
          <p className="text-xs sm:text-sm text-slate-500 mb-1">
            Fase atual:{" "}
            <span className="font-semibold text-sectec-700">Relatório Individual</span>
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
            Relatório Individual
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Modalidade alternativa à feira científica — habilitada pela coordenação.
          </p>
        </div>

        {carregando ? (
          <div className="flex flex-col items-center justify-center py-20 border border-slate-200 rounded-2xl bg-white">
            <RefreshCw size={22} className="animate-spin text-sectec-600 mb-3" />
            <p className="text-sm font-medium text-slate-500">Verificando permissões...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

            {/* Coluna principal */}
            <div className="lg:col-span-2 space-y-4">

              {permissao?.possuiProjetoFeira && <BannerEmEquipe />}

              {!permissao?.possuiProjetoFeira && !permissao?.permitido && <BannerSemPermissao />}

              {!permissao?.possuiProjetoFeira && permissao?.permitido && !janelaAberta && (
                <>
                  <BannerForaDoPeriodo />
                  {relatorio && (relatorio.status === "Submetido" || relatorio.status === "Avaliado") && (
                    <CardRelatorioSubmetido relatorio={relatorio} />
                  )}
                </>
              )}

              {!permissao?.possuiProjetoFeira && permissao?.permitido && janelaAberta && (
                relatorio && (relatorio.status === "Submetido" || relatorio.status === "Avaliado")
                  ? <CardRelatorioSubmetido relatorio={relatorio} />
                  : <FormRelatorio relatorioExistente={relatorio} onSalvo={(r) => setRelatorio(r)} />
              )}

            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <CronogramaRelatorio />
              <SobreModalidade />
            </div>

          </div>
        )}
      </div>
    </MainLayout>
  );
}
