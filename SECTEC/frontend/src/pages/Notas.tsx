import { useState, useEffect } from "react";
import { MainLayout } from "../componentes/SideBarUniversal";
import {
  Star,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Info,
  FileText,
  Users,
  Microscope,
  Presentation,
  BarChart3,
  Loader2,
  AlertCircle,
} from "lucide-react";

// ─── Tipos ─────────────────────────────────────────────────────────────────
type Criterio = {
  id: string;
  label: string;
  peso: number;
  nota: number | null;
};

type Avaliador = {
  id: string;
  nome: string;
  disciplina: string;
  peso: number;
  criterios: Criterio[];
};

type Projeto = {
  titulo: string;
  eixo: string;
};

type StatusNota = "Pendente" | "Parcial" | "Finalizado";

// ─── Helpers ────────────────────────────────────────────────────────────────
function calcularMediaAvaliador(criterios: Criterio[]): number | null {
  const comNota = criterios.filter((c) => c.nota !== null);
  if (comNota.length === 0) return null;
  const total = comNota.reduce((acc, c) => acc + (c.nota! * c.peso) / 100, 0);
  // normaliza pelo peso avaliado
  const pesoTotal = comNota.reduce((acc, c) => acc + c.peso, 0);
  return (total / pesoTotal) * 100;
}

function calcularMediaFinal(avaliadores: Avaliador[]): number | null {
  const comNota = avaliadores.filter(
    (a) => calcularMediaAvaliador(a.criterios) !== null
  );
  if (comNota.length === 0) return null;

  const pesoTotalUsado = comNota.reduce((acc, a) => acc + a.peso, 0);
  const soma = comNota.reduce((acc, a) => {
    const media = calcularMediaAvaliador(a.criterios)!;
    return acc + (media * a.peso) / pesoTotalUsado;
  }, 0);

  return soma;
}

function getStatusAvaliador(criterios: Criterio[]): StatusNota {
  const comNota = criterios.filter((c) => c.nota !== null).length;
  if (comNota === 0) return "Pendente";
  if (comNota < criterios.length) return "Parcial";
  return "Finalizado";
}

function corNota(nota: number | null): string {
  if (nota === null) return "text-slate-400";
  if (nota >= 9) return "text-emerald-600";
  if (nota >= 7) return "text-blue-600";
  if (nota >= 5) return "text-amber-600";
  return "text-red-600";
}

function bgNota(nota: number | null): string {
  if (nota === null) return "bg-slate-100";
  if (nota >= 9) return "bg-emerald-50 border-emerald-200";
  if (nota >= 7) return "bg-blue-50 border-blue-200";
  if (nota >= 5) return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
}

function barColor(nota: number): string {
  if (nota >= 9) return "bg-emerald-500";
  if (nota >= 7) return "bg-blue-500";
  if (nota >= 5) return "bg-amber-500";
  return "bg-red-500";
}

function statusBadge(status: StatusNota) {
  const map: Record<StatusNota, string> = {
    Pendente: "bg-slate-100 text-slate-500",
    Parcial: "bg-amber-100 text-amber-700",
    Finalizado: "bg-emerald-100 text-emerald-700",
  };
  return map[status];
}

function criterioIcon(label: string) {
  if (label.toLowerCase().includes("relev")) return <Star size={12} />;
  if (label.toLowerCase().includes("metod")) return <Microscope size={12} />;
  if (label.toLowerCase().includes("relat")) return <FileText size={12} />;
  if (label.toLowerCase().includes("apres")) return <Presentation size={12} />;
  return <BarChart3 size={12} />;
}

// ─── Barra de nota visual ───────────────────────────────────────────────────
function NotaBar({ nota, max = 10 }: { nota: number | null; max?: number }) {
  return (
    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
      {nota !== null && (
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor(nota)}`}
          style={{ width: `${(nota / max) * 100}%` }}
        />
      )}
    </div>
  );
}

// ─── Card de avaliador ──────────────────────────────────────────────────────
function CardAvaliador({ avaliador }: { avaliador: Avaliador }) {
  const [aberto, setAberto] = useState(false);
  const media = calcularMediaAvaliador(avaliador.criterios);
  const status = getStatusAvaliador(avaliador.criterios);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden transition-shadow hover:shadow-sm">
      {/* Cabeçalho */}
      <button
        onClick={() => setAberto((v) => !v)}
        className="w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        {/* Avatar */}
        <div className="w-10 h-10 rounded-xl bg-yellow-100 text-yellow-700 text-sm font-bold flex items-center justify-center shrink-0">
          {avaliador.nome.split(" ").at(-1)?.[0]}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-slate-800 truncate">
              {avaliador.nome}
            </p>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusBadge(status)}`}
            >
              {status}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{avaliador.disciplina}</p>
        </div>

        {/* Nota + peso */}
        <div className="text-right shrink-0 mr-2">
          {media !== null ? (
            <>
              <p className={`text-lg font-extrabold leading-none ${corNota(media)}`}>
                {media.toFixed(1)}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">peso {avaliador.peso}%</p>
            </>
          ) : (
            <p className="text-xs text-slate-400 font-medium">aguardando</p>
          )}
        </div>

        {/* Chevron */}
        <div className="text-slate-400 shrink-0">
          {aberto ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
      </button>

      {/* Critérios expandidos */}
      {aberto && (
        <div className="px-4 sm:px-5 pb-4 border-t border-slate-100 pt-3 space-y-3">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Critérios de avaliação
          </p>
          {avaliador.criterios.map((c) => (
            <div key={c.id} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-600 min-w-0">
                  <span className="text-slate-400 shrink-0">{criterioIcon(c.label)}</span>
                  <span className="truncate">{c.label}</span>
                  <span className="text-[10px] text-slate-400 shrink-0">({c.peso}%)</span>
                </div>
                <span
                  className={`text-xs font-bold shrink-0 px-2 py-0.5 rounded-lg border ${
                    c.nota !== null
                      ? `${corNota(c.nota)} ${bgNota(c.nota)}`
                      : "text-slate-400 bg-slate-50 border-slate-200"
                  }`}
                >
                  {c.nota !== null ? c.nota.toFixed(1) : "—"}
                </span>
              </div>
              <NotaBar nota={c.nota} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ───────────────────────────────────────────────────
function NotasAluno() {
  const [avaliadores, setAvaliadores] = useState<Avaliador[]>([]);
  const [projeto, setProjeto] = useState<Projeto | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const projetoId = localStorage.getItem("projetoId");
    const headers = { Authorization: `Bearer ${token}` } as HeadersInit;

    async function buscarDados() {
      try {
        setCarregando(true);
        setErro(null);

        const [resProjeto, resNotas] = await Promise.all([
          fetch(`https://sectec-ja.up.railway.app/api/projetos/${projetoId}`, { headers }),
          fetch(`https://sectec-ja.up.railway.app/api/projetos/${projetoId}/notas`, { headers }),
        ]);

        if (!resProjeto.ok || !resNotas.ok) {
          throw new Error("Erro ao buscar dados.");
        }

        const dadosProjeto = await resProjeto.json();
        const dadosNotas = await resNotas.json();

        setProjeto({
          titulo: dadosProjeto.titulo,
          eixo: dadosProjeto.eixo,
        });

        // Adapta o retorno da API para o tipo Avaliador
        // Esperado: array de avaliadores com id, nome, disciplina, peso, criterios[]
        setAvaliadores(
          dadosNotas.map((a: any) => ({
            id: String(a.id),
            nome: a.nome,
            disciplina: a.disciplina,
            peso: a.peso,
            criterios: a.criterios.map((c: any) => ({
              id: String(c.id),
              label: c.label,
              peso: c.peso,
              nota: c.nota ?? null,
            })),
          }))
        );
      } catch (e: any) {
        setErro("Não foi possível carregar as notas. Tente novamente.");
      } finally {
        setCarregando(false);
      }
    }

    if (projetoId) {
      buscarDados();
    } else {
      setCarregando(false);
    }
  }, []);

  const mediaFinal = calcularMediaFinal(avaliadores);
  const finalizados = avaliadores.filter(
    (a) => getStatusAvaliador(a.criterios) === "Finalizado"
  ).length;
  const aprovado = mediaFinal !== null ? mediaFinal >= 6 : null;

  // ── Estados de carregamento / erro / sem projeto ────────────────────────
  if (carregando) {
    return (
      <MainLayout userRole="aluno">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <Loader2 size={28} className="animate-spin" />
            <p className="text-sm font-medium">Carregando notas...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (erro) {
    return (
      <MainLayout userRole="aluno">
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="flex flex-col items-center gap-3 text-center max-w-xs">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
              <AlertCircle size={22} className="text-red-500" />
            </div>
            <p className="text-sm font-semibold text-slate-700">{erro}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-xs text-sectec-700 font-semibold underline underline-offset-2 hover:text-sectec-900"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!projeto) {
    return (
      <MainLayout userRole="aluno">
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="flex flex-col items-center gap-3 text-center max-w-xs">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
              <FileText size={22} className="text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-600">Nenhum projeto encontrado.</p>
            <p className="text-xs text-slate-400">Você precisa ter um projeto inscrito para visualizar as notas.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout userRole="aluno">
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">

        {/* Cabeçalho da página */}
        <div className="mb-6">
          <p className="text-xs sm:text-sm text-slate-500 mb-1">
            Fase atual:{" "}
            <span className="font-semibold text-sectec-700">4 — Avaliação</span>
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Notas do Projeto
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 truncate">
            {projeto.titulo}
          </p>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {/* Média final */}
          <div
            className={`col-span-2 sm:col-span-1 rounded-2xl border p-4 flex flex-col items-center justify-center text-center ${
              mediaFinal !== null ? bgNota(mediaFinal) : "bg-slate-50 border-slate-200"
            }`}
          >
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Média Final
            </p>
            <p
              className={`text-4xl font-black leading-none ${
                mediaFinal !== null ? corNota(mediaFinal) : "text-slate-400"
              }`}
            >
              {mediaFinal !== null ? mediaFinal.toFixed(1) : "—"}
            </p>
            {aprovado !== null && (
              <span
                className={`mt-2 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                  aprovado
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {aprovado ? "✓ Aprovado" : "✗ Reprovado"}
              </span>
            )}
          </div>

          {/* Avaliadores */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <Users size={16} className="text-sectec-600 mb-1.5" />
            <p className="text-2xl font-black text-slate-800">
              {finalizados}/{avaliadores.length}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
              Avaliadores
            </p>
          </div>

          {/* Melhor nota */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <TrendingUp size={16} className="text-emerald-500 mb-1.5" />
            <p className="text-2xl font-black text-emerald-600">
              {(() => {
                const notas = avaliadores
                  .map((a) => calcularMediaAvaliador(a.criterios))
                  .filter((n) => n !== null) as number[];
                return notas.length > 0
                  ? Math.max(...notas).toFixed(1)
                  : "—";
              })()}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
              Melhor nota
            </p>
          </div>
        </div>

        {/* Barra de progresso visual da média */}
        {mediaFinal !== null && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-600">
                Desempenho geral
              </p>
              <p className={`text-xs font-bold ${corNota(mediaFinal)}`}>
                {mediaFinal.toFixed(1)} / 10
              </p>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${barColor(mediaFinal)}`}
                style={{ width: `${(mediaFinal / 10) * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-slate-400">0</span>
              <span className="text-[10px] text-slate-400 font-medium">
                Mínimo: 6.0
              </span>
              <span className="text-[10px] text-slate-400">10</span>
            </div>
          </div>
        )}

        {/* Info sobre pesos */}
        <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-3.5 py-3 mb-5">
          <Info size={13} className="text-blue-500 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-700 leading-relaxed">
            A média final é calculada com base no{" "}
            <strong>peso de cada avaliador</strong>:{" "}
            {avaliadores.map((a, i) => (
              <span key={a.id}>
                {a.nome.split(" ").slice(0, 2).join(" ")} ({a.peso}%)
                {i < avaliadores.length - 1 ? ", " : "."}
              </span>
            ))}{" "}
            Avaliadores sem nota ainda não são contabilizados.
          </p>
        </div>

        {/* Lista de avaliadores */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Avaliadores
          </p>
          {avaliadores.map((a) => (
            <CardAvaliador key={a.id} avaliador={a} />
          ))}
        </div>

        {/* Legenda de notas */}
        <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-500 mb-3">
            Legenda de notas
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { range: "9 – 10", label: "Excelente", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
              { range: "7 – 8.9", label: "Bom", color: "text-blue-600 bg-blue-50 border-blue-200" },
              { range: "5 – 6.9", label: "Regular", color: "text-amber-600 bg-amber-50 border-amber-200" },
              { range: "0 – 4.9", label: "Insuficiente", color: "text-red-600 bg-red-50 border-red-200" },
            ].map((item) => (
              <div
                key={item.range}
                className={`rounded-xl border px-3 py-2 text-center ${item.color}`}
              >
                <p className="text-xs font-bold">{item.range}</p>
                <p className="text-[10px] font-medium opacity-75 mt-0.5">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default NotasAluno;