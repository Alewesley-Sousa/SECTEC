import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, FlaskConical, Users, ChevronRight, X, Search, UserPlus, UserMinus, ChevronDown, Upload, Video, FileText, CheckCircle, Lock, TriangleAlert, Calendar } from "lucide-react";
import { MainLayout } from "../componentes/SideBarUniversal";
import Swal from "sweetalert2";
import { apiRequest, type UsuarioApi } from "../lib/api";

type FaseAtual = 1 | 2 | 3 | 4;
type StatusProjeto = "Rascunho" | "Aguardando Aprovação" | "Aceito" | "Recusado" | "Em Desenvolvimento" | "Submetido" | "Avaliado";
type Membro = { id: string; nome: string; sala: string };
type Orientador = { id: string; nome: string; disciplina: string };
type Projeto = {
  id: string; titulo: string; descricao: string; eixo: string;
  membros: Membro[]; orientadorId: string; status: StatusProjeto; linkYoutube?: string;
};

const FASE_ATUAL: FaseAtual = 1;
const FASE_LABELS: Record<FaseAtual, string> = { 1: "Inscrição", 2: "Desenvolvimento", 3: "Submissão", 4: "Avaliação" };
const STATUS_STYLE: Record<StatusProjeto, string> = {
  "Rascunho": "bg-slate-100 text-slate-600",
  "Aguardando Aprovação": "bg-yellow-100 text-yellow-700",
  "Aceito": "bg-sectec-100 text-sectec-700",
  "Recusado": "bg-red-100 text-red-700",
  "Em Desenvolvimento": "bg-blue-100 text-blue-700",
  "Submetido": "bg-purple-100 text-purple-700",
  "Avaliado": "bg-orange-100 text-orange-700",
};
const EIXOS = [
  "Tecnologia e Inovação", "Sustentabilidade Ambiental", "Saúde e Qualidade de Vida",
  "Sociedade e Cultura", "Energia e Recursos Naturais", "Educação e Comunicação",
];
const FASES_FEIRA = [
  { fase: 1 as FaseAtual, label: "Inscrição", data: "01/05 – 15/05", descricao: "Cadastro do projeto e da equipe" },
  { fase: 2 as FaseAtual, label: "Desenvolvimento", data: "16/05 – 30/06", descricao: "Desenvolvimento e orientação" },
  { fase: 3 as FaseAtual, label: "Submissão", data: "01/07 – 10/07", descricao: "Envio do relatório e vídeo" },
  { fase: 4 as FaseAtual, label: "Avaliação", data: "15/07 – 20/07", descricao: "Banca examinadora" },
];
const STATUS_TOOLTIP: Record<StatusProjeto, string> = {
  "Rascunho": "Projeto salvo, mas ainda não enviado para análise.",
  "Aguardando Aprovação": "Enviado! Seu orientador irá analisar e aprovar ou recusar.",
  "Aceito": "Orientador aprovou! Você já pode iniciar o desenvolvimento.",
  "Recusado": "O orientador recusou o projeto. Entre em contato para saber o motivo.",
  "Em Desenvolvimento": "Projeto em andamento. Continue com sua pesquisa!",
  "Submetido": "Relatório e vídeo enviados. Aguarde a avaliação da banca.",
  "Avaliado": "A banca examinadora já avaliou seu projeto.",
};
const SUBMISSAO_TOOLTIP = "Fase 3: envio do relatório final em PDF e link do vídeo no YouTube.";

function getUsuarioLogado(): Membro {
  const nome = localStorage.getItem('nome') ?? 'Aluno';
  const id = localStorage.getItem('userId') ?? 'me';
  return { id, nome, sala: '' };
}
const ALUNO_LOGADO = getUsuarioLogado();

function Tooltip({ children, text }: { children: React.ReactNode; text: string }) {
  return (
    <div className="relative group inline-flex">
      {children}
      <div className="absolute bottom-full left-0 mb-2 z-50 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none w-52">
        <div className="bg-slate-800 text-white text-xs rounded-xl px-3 py-2 text-center leading-relaxed shadow-lg">
          {text}
          <div className="absolute top-full left-4 border-4 border-transparent border-t-slate-800" />
        </div>
      </div>
    </div>
  );
}

function FeiraTimeline({ faseAtual }: { faseAtual: FaseAtual }) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-5">
        <Calendar size={14} className="text-sectec-600" />
        <h3 className="min-w-0 break-words text-sm font-semibold text-slate-700">Cronograma da Feira</h3>
      </div>
      <div className="relative">
        <div className="absolute left-3.5 top-3 bottom-3 w-px bg-slate-200" />
        <div className="space-y-5">
          {FASES_FEIRA.map(({ fase, label, data, descricao }) => {
            const done = fase < faseAtual;
            const active = fase === faseAtual;
            const pending = fase > faseAtual;
            return (
              <div key={fase} className="flex gap-4 relative">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 text-xs font-bold border-2
                  ${done ? "bg-sectec-600 border-sectec-600 text-white" : active ? "bg-white border-sectec-600 text-sectec-700" : "bg-white border-slate-200 text-slate-400"}`}>
                  {done ? "✓" : fase}
                </div>
                <div className="min-w-0 pb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`break-words text-sm font-semibold ${active ? "text-sectec-700" : pending ? "text-slate-400" : "text-slate-700"}`}>{label}</p>
                    {active && <span className="text-[10px] font-semibold bg-sectec-100 text-sectec-700 px-2 py-0.5 rounded-full">Atual</span>}
                  </div>
                  <p className={`mt-0.5 break-words text-xs ${pending ? "text-slate-300" : "text-slate-400"}`}>{data}</p>
                  <p className={`mt-0.5 break-words text-xs ${pending ? "text-slate-300" : "text-slate-500"}`}>{descricao}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const [projeto, setProjeto] = useState<Projeto | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [aba, setAba] = useState<"painel" | "submissao">("painel");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [eixo, setEixo] = useState("");
  const [orientadorId, setOrientadorId] = useState("");
  const [membros, setMembros] = useState<Membro[]>([ALUNO_LOGADO]);
  const [buscaAluno, setBuscaAluno] = useState("");
  const [filtrSala, setFiltrSala] = useState("todas");
  const [linkYoutube, setLinkYoutube] = useState("");
  const [arquivoPdf, setArquivoPdf] = useState<File | null>(null);
  const inputPdfRef = useRef<HTMLInputElement>(null);
  const [criando, setCriando] = useState(false);

  // 👇 states para dados do banco
  const [alunosDisponiveis, setAlunosDisponiveis] = useState<Membro[]>([]);
  const [orientadoresDisponiveis, setOrientadoresDisponiveis] = useState<Orientador[]>([]);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [erroDados, setErroDados] = useState("");
  const avisoSenhaDispensadoKey = `passwordNoticeDismissed:${localStorage.getItem("userId") ?? "me"}`;
  const [avisoSenhaDispensado, setAvisoSenhaDispensado] = useState(
    () => localStorage.getItem(avisoSenhaDispensadoKey) === "true"
  );

  // 👇 busca do banco ao abrir a página
  useEffect(() => {
    let active = true;

    async function carregarDados() {
      setCarregandoDados(true);
      setErroDados("");

      try {
        const [alunos, orientadores] = await Promise.all([
          apiRequest<UsuarioApi[]>("/users/alunos"),
          apiRequest<UsuarioApi[]>("/users/orientadores"),
        ]);

        if (!active) return;

        setAlunosDisponiveis(
          alunos
            .filter((a) => String(a.id) !== localStorage.getItem('userId'))
            .map((a) => ({ id: String(a.id), nome: a.nome, sala: '' }))
        );
        setOrientadoresDisponiveis(
          orientadores.map((o) => ({
            id: String(o.id),
            nome: o.nome,
            disciplina: o.email_institucional ?? 'Orientador',
          }))
        );
      } catch (error) {
        if (!active) return;
        setErroDados(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar alunos e orientadores."
        );
      } finally {
        if (active) setCarregandoDados(false);
      }
    }

    carregarDados();

    return () => {
      active = false;
    };
  }, []);

  const MIN_MEMBROS = 6;
  const salas = ["todas", ...Array.from(new Set(alunosDisponiveis.map((a) => a.sala))).sort()];
  const alunosFiltrados = alunosDisponiveis.filter((a) => {
    const jaAdicionado = membros.some((m) => m.id === a.id);
    const bateNome = a.nome.toLowerCase().includes(buscaAluno.toLowerCase());
    const bateSala = filtrSala === "todas" || a.sala === filtrSala;
    return !jaAdicionado && bateNome && bateSala;
  });

  const orientador = orientadoresDisponiveis.find((o) => o.id === orientadorId);
  const projetoAceito = projeto?.status === "Aceito" || projeto?.status === "Em Desenvolvimento";
  const submissaoDesbloqueada = projetoAceito && FASE_ATUAL === 3 && projeto?.status !== "Submetido";
  const youtubeValido = linkYoutube === "" || /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}/.test(linkYoutube);
  const passwordChangedKey = `passwordChangedAt:${localStorage.getItem("userId") ?? "me"}`;
  const deveMostrarAvisoSenha = !localStorage.getItem(passwordChangedKey) && !avisoSenhaDispensado;

  function dispensarAvisoSenha() {
    localStorage.setItem(avisoSenhaDispensadoKey, "true");
    setAvisoSenhaDispensado(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setTitulo(""); setDescricao(""); setEixo(""); setOrientadorId("");
    setMembros([ALUNO_LOGADO]); setBuscaAluno(""); setFiltrSala("todas");
  }

  function handleCriarProjeto(e: React.FormEvent) {
    e.preventDefault();
    if (descricao.trim().length < 30) {
      Swal.fire({
        icon: "warning",
        title: "Descrição muito curta",
        text: "A descrição precisa ter pelo menos 30 caracteres para bater com a validação do backend.",
        confirmButtonColor: "#15803d",
      });
      return;
    }

    if (!orientadorId) {
      Swal.fire({
        icon: "warning",
        title: "Orientador obrigatório",
        text: "Selecione um orientador antes de cadastrar o projeto.",
        confirmButtonColor: "#15803d",
      });
      return;
    }

    if (membros.length < MIN_MEMBROS) {
      Swal.fire({
        html: `
          <div style="display:flex;flex-direction:column;align-items:center;gap:12px;padding:8px 0">
            <div style="width:52px;height:52px;border-radius:14px;background:#f0fdf4;border:2px solid #a7f3d0;display:flex;align-items:center;justify-content:center">
              <svg width="24" height="24" fill="none" stroke="#15803d" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              </svg>
            </div>
            <div>
              <p style="font-size:16px;font-weight:700;color:#0f172a;margin:0 0 6px">Equipe incompleta</p>
              <p style="font-size:13px;color:#64748b;margin:0">A equipe precisa ter no mínimo <strong style="color:#15803d">${MIN_MEMBROS} membros</strong>.<br/>Você adicionou <strong>${membros.length}</strong> até agora.</p>
            </div>
          </div>
        `,
        showConfirmButton: true,
        confirmButtonText: "Entendi",
        confirmButtonColor: "#15803d",
        background: "#ffffff",
        customClass: { popup: "rounded-2xl shadow-xl", confirmButton: "rounded-lg text-sm font-semibold px-6 py-2.5" },
        width: "min(380px, 90vw)",
        padding: "1.5rem",
      });
      return;
    }
    setCriando(true);
    setTimeout(() => {
      setProjeto({ id: "proj-001", titulo, descricao, eixo, membros, orientadorId, status: "Aguardando Aprovação" });
      setCriando(false);
      fecharModal();
    }, 1200);
  }

  function handleSubmeter(e: React.FormEvent) {
    e.preventDefault();
    if (!arquivoPdf || !linkYoutube) return;
    setProjeto((p) => p ? { ...p, status: "Submetido", linkYoutube } : p);
  }

  return (
    <MainLayout userRole="aluno">
      <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
        {erroDados && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
            {erroDados}
          </div>
        )}

        {deveMostrarAvisoSenha && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 sm:px-5">
            <Link
              to="/dashboard/aluno/configuracoes"
              className="min-w-0 flex-1 transition hover:text-amber-950"
            >
              <h2 className="text-sm font-bold text-amber-900 sm:text-base">
                Recomendação de segurança
              </h2>
              <p className="mt-0.5 text-xs text-amber-800 sm:text-sm">
                Por segurança, recomendamos alterar sua senha periodicamente.
                Escolha uma nova senha que não seja usada em outros sistemas.
              </p>
            </Link>
            <button
              type="button"
              onClick={dispensarAvisoSenha}
              className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-amber-700 transition hover:bg-amber-100 hover:text-amber-900"
              aria-label="Fechar aviso de segurança"
              title="Fechar aviso"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:mb-8 sm:flex-row">
          <div className="min-w-0">
            <p className="mb-1 break-words text-xs text-slate-500 sm:text-sm">
              Fase atual: <span className="font-semibold text-sectec-700">{FASE_ATUAL} — {FASE_LABELS[FASE_ATUAL]}</span>
            </p>
            <h1 className="break-words text-xl font-bold leading-tight text-slate-900 sm:text-2xl">
              Seja bem-vindo(a), {ALUNO_LOGADO.nome.split(" ")[0]}! 👋
            </h1>
            <p className="mt-1 break-words text-xs text-slate-500 sm:text-sm">
              {projeto ? "Acompanhe o andamento do seu projeto abaixo." : "Você ainda não possui um projeto."}
            </p>
          </div>
          {FASE_ATUAL === 1 && !projeto && (
            <button onClick={() => setModalAberto(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-sectec-700 px-3 py-2 text-xs font-semibold text-white shadow-md transition-all hover:bg-sectec-800 active:scale-[0.98] sm:w-auto sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm">
              <Plus size={14} /><span>Novo Projeto</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 min-w-0">
            {!projeto && (
              <div className="flex flex-col items-center justify-center py-14 sm:py-20 border-2 border-dashed border-slate-200 rounded-2xl bg-white text-center px-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-sectec-50 flex items-center justify-center mb-4">
                  <FlaskConical size={22} className="text-sectec-600" />
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-slate-700 mb-1">Nenhum projeto inscrito</h3>
                <p className="text-xs sm:text-sm text-slate-400 max-w-xs">
                  {FASE_ATUAL === 1 ? "Toque em \"Novo Projeto\" para se inscrever na feira." : "O período de inscrições encerrou."}
                </p>
              </div>
            )}

            {projeto && (
              <div className="space-y-4">
                <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
                  {(["painel", "submissao"] as const).map((a) => (
                    <button key={a} onClick={() => setAba(a)}
                      className={`px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium border-b-2 -mb-px transition-colors
                        ${aba === a ? "border-sectec-600 text-sectec-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
                      {a === "painel" ? "Painel do Projeto" : (
                        <Tooltip text={SUBMISSAO_TOOLTIP}><span>Submissão</span></Tooltip>
                      )}
                    </button>
                  ))}
                </div>

                {aba === "painel" && (
                  <div className="space-y-4">
                    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-sectec-50 border border-sectec-100 flex items-center justify-center shrink-0">
                          <FlaskConical size={18} className="text-sectec-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2 flex-wrap mb-1">
                            <h2 className="text-sm sm:text-base font-semibold text-slate-900 leading-tight break-words">{projeto.titulo}</h2>
                            <Tooltip text={STATUS_TOOLTIP[projeto.status]}>
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 cursor-help ${STATUS_STYLE[projeto.status]}`}>
                                {projeto.status}
                              </span>
                            </Tooltip>
                          </div>
                          <p className="text-xs text-slate-400 mb-1">{projeto.eixo}</p>
                          <p className="text-xs sm:text-sm text-slate-500 line-clamp-2">{projeto.descricao}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Users size={13} className="text-slate-400" />
                          <h3 className="text-sm font-semibold text-slate-700">Equipe</h3>
                          <span className="ml-auto text-xs text-slate-400">{projeto.membros.length} membros</span>
                        </div>
                        <div className="space-y-2">
                          {projeto.membros.map((m) => (
                            <div key={m.id} className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-sectec-100 text-sectec-700 text-xs font-semibold flex items-center justify-center shrink-0">{m.nome[0]}</div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-slate-700 truncate">{m.nome}</p>
                                <p className="text-[10px] text-slate-400">Sala {m.sala}</p>
                              </div>
                              {m.id === ALUNO_LOGADO.id && (
                                <span className="text-[9px] bg-sectec-100 text-sectec-700 font-semibold px-1.5 py-0.5 rounded-full shrink-0">líder</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4">
                        <h3 className="text-sm font-semibold text-slate-700 mb-3">Orientador</h3>
                        {orientador ? (
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-yellow-100 text-yellow-700 text-sm font-semibold flex items-center justify-center shrink-0">
                              {orientador.nome.split(" ").at(-1)?.[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-700 truncate">{orientador.nome}</p>
                              <p className="break-words text-xs text-slate-400">{orientador.disciplina}</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400">Nenhum orientador selecionado.</p>
                        )}
                        {FASE_ATUAL === 3 && projetoAceito && (
                          <button onClick={() => setAba("submissao")}
                            className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-sectec-700 bg-sectec-50 rounded-lg hover:bg-sectec-100 transition-colors">
                            Ir para Submissão <ChevronRight size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {aba === "submissao" && (
                  <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
                    {projeto.status === "Submetido" ? (
                      <div className="flex flex-col items-center py-10 text-center">
                        <div className="w-14 h-14 rounded-full bg-sectec-100 flex items-center justify-center mb-4">
                          <CheckCircle size={28} className="text-sectec-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">Projeto submetido!</h3>
                        <p className="text-sm text-slate-500">Aguarde a avaliação da banca examinadora.</p>
                      </div>
                    ) : (
                      <>
                        <h2 className="text-sm sm:text-base font-semibold text-slate-900 mb-1">Submissão do Projeto</h2>
                        <p className="text-xs sm:text-sm text-slate-500 mb-5">Envie o relatório final em PDF e o link do vídeo no YouTube.</p>
                        {FASE_ATUAL !== 3 && (
                          <div className="flex gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5">
                            <Lock size={15} className="text-slate-400 mt-0.5 shrink-0" />
                            <p className="text-xs sm:text-sm text-slate-500">
                              Disponível apenas na <strong>Fase 3 — Submissão</strong>. Fase atual: {FASE_ATUAL}.
                            </p>
                          </div>
                        )}
                        {FASE_ATUAL === 3 && !projetoAceito && (
                          <div className="flex gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-5">
                            <TriangleAlert size={15} className="text-yellow-500 mt-0.5 shrink-0" />
                            <p className="text-xs sm:text-sm text-yellow-700">
                              Seu projeto precisa estar <strong>Aceito</strong> para submeter. Status atual: <strong>{projeto.status}</strong>.
                            </p>
                          </div>
                        )}
                        <form onSubmit={handleSubmeter} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Relatório Final (PDF) *</label>
                            <input ref={inputPdfRef} type="file" accept=".pdf" disabled={!submissaoDesbloqueada} onChange={(e) => setArquivoPdf(e.target.files?.[0] ?? null)} className="hidden" />
                            <button type="button" disabled={!submissaoDesbloqueada} onClick={() => inputPdfRef.current?.click()}
                              className={`w-full border-2 border-dashed rounded-xl p-4 sm:p-5 flex flex-col items-center gap-2 transition-colors
                                ${submissaoDesbloqueada ? "border-slate-200 hover:border-sectec-400 hover:bg-sectec-50 cursor-pointer" : "border-slate-100 bg-slate-50 cursor-not-allowed opacity-60"}`}>
                              {arquivoPdf
                                ? <><FileText size={20} className="text-sectec-600" /><span className="text-xs sm:text-sm font-medium text-sectec-700 text-center break-all">{arquivoPdf.name}</span></>
                                : <><Upload size={20} className="text-slate-400" /><span className="text-xs sm:text-sm text-slate-500">{submissaoDesbloqueada ? "Toque para selecionar o PDF" : "Campo bloqueado"}</span></>
                              }
                            </button>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Link do YouTube *</label>
                            <div className="relative">
                              <Video size={14} className={`absolute left-3 top-3 ${submissaoDesbloqueada ? "text-red-500" : "text-slate-300"}`} />
                              <input type="url" inputMode="url" disabled={!submissaoDesbloqueada} value={linkYoutube}
                                onChange={(e) => setLinkYoutube(e.target.value)} placeholder="https://youtube.com/watch?v=..."
                                className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm transition
                                  ${!submissaoDesbloqueada ? "bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed"
                                  : !youtubeValido && linkYoutube ? "border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                                  : "border-slate-200 focus:outline-none focus:border-sectec-600 focus:ring-2 focus:ring-sectec-100"}`} />
                            </div>
                            {!youtubeValido && linkYoutube && <p className="text-xs text-red-500 mt-1">Link inválido.</p>}
                          </div>
                          <button type="submit" disabled={!submissaoDesbloqueada || !arquivoPdf || !linkYoutube || !youtubeValido}
                            className="w-full py-2.5 text-sm font-semibold text-white bg-sectec-700 rounded-lg hover:bg-sectec-800 transition disabled:opacity-50 disabled:cursor-not-allowed">
                            Enviar Projeto
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="min-w-0 space-y-4">
            <FeiraTimeline faseAtual={FASE_ATUAL} />
          </div>
        </div>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
          <div className="flex max-h-[95dvh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:max-h-[90vh] sm:max-w-2xl sm:rounded-2xl">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200">
              <div>
                <h2 className="break-words text-sm font-semibold text-slate-900 sm:text-base">Novo Projeto Científico</h2>
                <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">Preencha os dados para inscrever seu projeto na feira</p>
              </div>
              <button onClick={fecharModal} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 active:bg-slate-200 transition-colors">
                <X size={17} />
              </button>
            </div>

            <form id="form-projeto" onSubmit={handleCriarProjeto} className="min-w-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:space-y-5 sm:px-6 sm:py-5">
              <section>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Dados do projeto</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Título *</label>
                    <input required value={titulo} onChange={(e) => setTitulo(e.target.value)}
                      placeholder="Ex: Captação de energia solar em ambientes urbanos"
                      className="w-full min-w-0 rounded-lg border border-slate-200 px-3 py-2.5 text-sm transition focus:border-sectec-600 focus:outline-none focus:ring-2 focus:ring-sectec-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Descrição / Resumo *</label>
                    <textarea required rows={3} value={descricao} onChange={(e) => setDescricao(e.target.value)}
                      placeholder="Descreva o objetivo e a metodologia do projeto..."
                      className="w-full min-w-0 resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm transition focus:border-sectec-600 focus:outline-none focus:ring-2 focus:ring-sectec-100" />
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Eixo Temático *</label>
                    <select required value={eixo} onChange={(e) => setEixo(e.target.value)}
                      className="w-full min-w-0 appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 pr-9 text-sm transition focus:border-sectec-600 focus:outline-none focus:ring-2 focus:ring-sectec-100">
                      <option value="">Selecione um eixo</option>
                      {EIXOS.map((e) => <option key={e} value={e}>{e}</option>)}
                    </select>
                    <ChevronDown size={13} className="absolute right-3 bottom-3 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </section>

              <section>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Orientador</p>
                <div className="relative">
                  <select required value={orientadorId} onChange={(e) => setOrientadorId(e.target.value)}
                    className="w-full min-w-0 appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 pr-9 text-sm transition focus:border-sectec-600 focus:outline-none focus:ring-2 focus:ring-sectec-100">
                    <option value="">Selecione um orientador</option>
                    {orientadoresDisponiveis.map((o) => (
                      <option key={o.id} value={o.id}>{o.nome} — {o.disciplina}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                </div>
                {carregandoDados && <p className="text-xs text-slate-400 mt-1.5">Carregando orientadores...</p>}
                {orientador && <p className="text-xs text-sectec-600 mt-1.5 font-medium">✓ {orientador.nome} selecionado</p>}
              </section>

              <section>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Equipe</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${membros.length >= 7 ? "bg-red-100 text-red-600" : membros.length < MIN_MEMBROS ? "bg-yellow-100 text-yellow-700" : "bg-sectec-100 text-sectec-700"}`}>
                    {membros.length}/7 {membros.length < MIN_MEMBROS && `(mín. ${MIN_MEMBROS})`}
                  </span>
                </div>
                <div className="space-y-1.5 mb-3">
                  {membros.map((m) => (
                    <div key={m.id} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                      <div className="w-7 h-7 rounded-full bg-sectec-100 text-sectec-700 text-xs font-semibold flex items-center justify-center shrink-0">{m.nome[0]}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{m.nome}</p>
                        <p className="text-xs text-slate-400">Sala {m.sala}</p>
                      </div>
                      {m.id === ALUNO_LOGADO.id
                        ? <span className="text-[10px] font-semibold bg-sectec-100 text-sectec-700 px-2 py-0.5 rounded-full shrink-0">Líder</span>
                        : <button type="button" onClick={() => setMembros((prev) => prev.filter((x) => x.id !== m.id))} className="text-slate-400 hover:text-red-500 active:text-red-600 transition-colors p-1.5 shrink-0"><UserMinus size={14} /></button>
                      }
                    </div>
                  ))}
                </div>
                {membros.length < 7 && (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="flex gap-2 p-2 bg-slate-50 border-b border-slate-200">
                      <div className="flex items-center gap-1.5 flex-1 bg-white border border-slate-200 rounded-md px-2 py-1.5 min-w-0">
                        <Search size={11} className="text-slate-400 shrink-0" />
                        <input value={buscaAluno} onChange={(e) => setBuscaAluno(e.target.value)}
                          placeholder="Buscar aluno..." className="flex-1 text-xs outline-none bg-transparent min-w-0" />
                      </div>
                      <select value={filtrSala} onChange={(e) => setFiltrSala(e.target.value)}
                        className="max-w-[96px] shrink-0 rounded-md border border-slate-200 bg-white px-2 text-xs focus:outline-none">
                        {salas.map((s) => <option key={s} value={s}>{s === "todas" ? "Todas" : `Sala ${s}`}</option>)}
                      </select>
                    </div>
                    <div className="max-h-40 overflow-y-auto">
                      {alunosFiltrados.length === 0
                        ? <p className="text-center text-xs text-slate-400 py-4">{carregandoDados ? "Carregando alunos..." : "Nenhum aluno encontrado"}</p>
                        : alunosFiltrados.map((aluno) => (
                          <button key={aluno.id} type="button" onClick={() => setMembros((prev) => [...prev, aluno])}
                            className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 active:bg-slate-100 transition-colors border-b border-slate-100 last:border-0">
                            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 text-[10px] font-semibold flex items-center justify-center shrink-0">{aluno.nome[0]}</div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className="text-xs font-medium text-slate-700 truncate">{aluno.nome}</p>
                              <p className="text-[10px] text-slate-400">Sala {aluno.sala}</p>
                            </div>
                            <UserPlus size={13} className="text-sectec-600 shrink-0" />
                          </button>
                        ))
                      }
                    </div>
                  </div>
                )}
              </section>
            </form>

            <div className="flex flex-col-reverse gap-2 rounded-b-2xl border-t border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:justify-end sm:px-6 sm:py-4">
              <button type="button" onClick={fecharModal}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 active:bg-slate-200 sm:w-auto">
                Cancelar
              </button>
              <button type="submit" form="form-projeto" disabled={criando}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-sectec-700 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-sectec-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto sm:px-5">
                {criando && (
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                )}
                {criando ? "Cadastrando..." : "Criar projeto"}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

export default Dashboard;
