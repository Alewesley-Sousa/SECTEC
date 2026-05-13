import { useEffect, useMemo, useRef, useState } from "react";
import {
  PiArrowUpRight,
  PiBellRinging,
  PiBookOpen,
  PiBuildings,
  PiCalendarBlank,
  PiCaretRight,
  PiChalkboardTeacher,
  PiCheckCircle,
  PiClockCounterClockwise,
  PiFilePdf,
  PiFunnel,
  PiGauge,
  PiGitBranch,
  PiGraduationCap,
  PiLockKey,
  PiMagnifyingGlass,
  PiNotebook,
  PiPlus,
  PiSealCheck,
  PiShieldCheck,
  PiSlidersHorizontal,
  PiStudent,
  PiTextAlignLeft,
  PiUserGear,
  PiUsersThree,
  PiWarningCircle,
  PiXCircle,
  PiUploadSimple,
  PiYoutubeLogo,
} from "react-icons/pi";
import { useLocation } from "react-router-dom";
import { MainLayout } from "../componentes/SideBarUniversal";
import Swal from "sweetalert2";
import { apiRequest, API_BASE_URL, type UsuarioApi } from "../lib/api";

type FaseEvento = "Inscrição" | "Aceitação" | "Submissão" | "Avaliação";
type StatusProjeto =
  | "Rascunho"
  | "Pendente de Orientação"
  | "Aceito"
  | "Em Desenvolvimento"
  | "Sob Revisão"
  | "Aprovado para Avaliação"
  | "Avaliado";
type Prioridade = "baixa" | "media" | "alta";
type PerfilUsuario = "Aluno" | "Orientador" | "Avaliador" | "Coordenador";

type ProjetoAdmin = {
  id: number;
  titulo: string;
  eixo: string;
  autor: string;
  turma: string;
  orientador: string;
  status: StatusProjeto;
  prioridade: Prioridade;
  atualizadoEm: string;
  materiais: {
    pdf: boolean;
    youtube: boolean;
    resumo: boolean;
  };
};

type UsuarioAdmin = {
  id: number;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  status: "Ativo" | "Pendente" | "Bloqueado";
};

type TurmaAdmin = {
  id: number;
  nome: string;
  curso: string;
  serie: "1º ano" | "2º ano" | "3º ano";
  turno: "Manhã" | "Tarde" | "Noite";
  alunos: number;
  projetos: number;
  orientadoresVinculados: number;
  status: "Ativa" | "Fechada";
};

type SolicitacaoOrientador = {
  id: number;
  projeto: string;
  orientador: string;
  aluno: string;
  eixo: string;
  status: "Aguardando resposta" | "Aceito" | "Recusado";
  prazo: string;
};

type LogAuditoria = {
  id: number;
  acao: string;
  usuario: string;
  detalhe: string;
  quando: string;
};

const faseAtual: FaseEvento = "Submissão";
const prazoEncerrado = false;

const projetosMock: ProjetoAdmin[] = [
  {
    id: 1,
    titulo: "Monitoramento Ambiental com IoT",
    eixo: "Tecnologia e Sustentabilidade",
    autor: "João Felipe",
    turma: "3º Informática",
    orientador: "Prof. Marcos Lima",
    status: "Sob Revisão",
    prioridade: "alta",
    atualizadoEm: "Hoje, 09:40",
    materiais: { pdf: true, youtube: true, resumo: true },
  },
  {
    id: 2,
    titulo: "Biblioteca Digital Escolar",
    eixo: "Gestão e Cultura Digital",
    autor: "Ana Beatriz",
    turma: "2º Informática",
    orientador: "Prof. Carla Nunes",
    status: "Em Desenvolvimento",
    prioridade: "media",
    atualizadoEm: "Ontem, 16:12",
    materiais: { pdf: true, youtube: false, resumo: true },
  },
  {
    id: 3,
    titulo: "Filtro Inteligente de Água",
    eixo: "Ciências Aplicadas",
    autor: "Lucas Pereira",
    turma: "3º Enfermagem",
    orientador: "Sem orientador",
    status: "Pendente de Orientação",
    prioridade: "alta",
    atualizadoEm: "Segunda, 11:03",
    materiais: { pdf: false, youtube: false, resumo: true },
  },
  {
    id: 4,
    titulo: "Sistema de Registro de Frequência",
    eixo: "Automação Escolar",
    autor: "Maria Eduarda",
    turma: "1º Informática",
    orientador: "Prof. Renato Alves",
    status: "Aprovado para Avaliação",
    prioridade: "baixa",
    atualizadoEm: "08/05/2026",
    materiais: { pdf: true, youtube: true, resumo: true },
  },
];

const usuariosMock: UsuarioAdmin[] = [
  { id: 1, nome: "Marcos Lima", email: "marcos@prof.ce.gov.br", perfil: "Orientador", status: "Ativo" },
  { id: 2, nome: "Ana Beatriz", email: "ana@aluno.ce.gov.br", perfil: "Aluno", status: "Ativo" },
  { id: 3, nome: "Rafaela Torres", email: "rafaela@prof.ce.gov.br", perfil: "Avaliador", status: "Pendente" },
];

const turmasMock: TurmaAdmin[] = [
  {
    id: 1,
    nome: "3º Info",
    curso: "Técnico em Informática",
    serie: "3º ano",
    turno: "Manhã",
    alunos: 34,
    projetos: 12,
    orientadoresVinculados: 4,
    status: "Ativa",
  },
  {
    id: 2,
    nome: "2º Info",
    curso: "Técnico em Informática",
    serie: "2º ano",
    turno: "Tarde",
    alunos: 29,
    projetos: 8,
    orientadoresVinculados: 3,
    status: "Ativa",
  },
  {
    id: 3,
    nome: "3º Enfermagem",
    curso: "Técnico em Enfermagem",
    serie: "3º ano",
    turno: "Manhã",
    alunos: 31,
    projetos: 9,
    orientadoresVinculados: 2,
    status: "Ativa",
  },
];

const solicitacoesMock: SolicitacaoOrientador[] = [
  {
    id: 1,
    projeto: "Filtro Inteligente de Água",
    orientador: "Prof. Diego Ramos",
    aluno: "Lucas Pereira",
    eixo: "Ciências Aplicadas",
    status: "Aguardando resposta",
    prazo: "vence em 2 dias",
  },
  {
    id: 2,
    projeto: "Monitoramento Ambiental com IoT",
    orientador: "Prof. Marcos Lima",
    aluno: "João Felipe",
    eixo: "Tecnologia e Sustentabilidade",
    status: "Aceito",
    prazo: "respondido hoje",
  },
];

const logsMock: LogAuditoria[] = [
  { id: 1, acao: "Prazo alterado", usuario: "Coordenação", detalhe: "Submissão prorrogada até 23:59", quando: "Hoje, 08:20" },
  { id: 2, acao: "Projeto desbloqueado", usuario: "Coordenação", detalhe: "Edição liberada para correção de PDF", quando: "Ontem, 15:44" },
  { id: 3, acao: "Orientador vinculado", usuario: "Sistema", detalhe: "Prof. Marcos aceitou orientação", quando: "08/05/2026" },
];

const fases: Array<{ nome: FaseEvento; periodo: string; descricao: string }> = [
  { nome: "Inscrição", periodo: "01/05 - 12/05", descricao: "cadastro dos grupos" },
  { nome: "Aceitação", periodo: "13/05 - 16/05", descricao: "resposta dos orientadores" },
  { nome: "Submissão", periodo: "17/05 - 24/05", descricao: "PDF, resumo e vídeo" },
  { nome: "Avaliação", periodo: "25/05 - 30/05", descricao: "bloqueio e banca" },
];

const statusStyle: Record<StatusProjeto, string> = {
  Rascunho: "bg-slate-100 text-slate-600 ring-slate-200",
  "Pendente de Orientação": "bg-amber-50 text-amber-700 ring-amber-200",
  Aceito: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "Em Desenvolvimento": "bg-sky-50 text-sky-700 ring-sky-200",
  "Sob Revisão": "bg-indigo-50 text-indigo-700 ring-indigo-200",
  "Aprovado para Avaliação": "bg-sectec-50 text-sectec-700 ring-sectec-200",
  Avaliado: "bg-slate-900 text-white ring-slate-900",
};

const prioridadeStyle: Record<Prioridade, string> = {
  baixa: "border-slate-200 text-slate-500",
  media: "border-amber-200 text-amber-700",
  alta: "border-red-200 text-red-700",
};

function handleAcaoIndisponivel(acao: string) {
  window.alert(`${acao} depende dos endpoints do backend. A interface já está pronta para ligar na API.`);
}

function PanelTitle({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-sectec-100 bg-sectec-50 text-sectec-700">
        {icon}
      </span>
      <div>
        <h2 className="text-base font-black text-slate-900">{title}</h2>
        {subtitle && <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}

function AdminChip({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black uppercase ring-1 ${className}`}>
      {children}
    </span>
  );
}

function AdminPageShell({ children }: { children: React.ReactNode }) {
  return (
    <MainLayout userRole="coordenador">
      <main className="min-h-screen bg-[#f4f9f6] px-4 py-5 sm:px-7 sm:py-7">
        <div className="mx-auto w-full max-w-[1500px] space-y-5">{children}</div>
      </main>
    </MainLayout>
  );
}

function TurmasCoordenacao() {
  return (
    <AdminPageShell>
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <PanelTitle icon={<PiBuildings size={20} />} title="Todas as turmas" subtitle="Distribuição por curso, série, turno, projetos e orientadores vinculados." />
          <button type="button" onClick={() => handleAcaoIndisponivel("Criar turma")} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-sectec-700 px-4 text-sm font-black text-white transition hover:bg-sectec-800">
            <PiPlus size={17} /> Nova turma
          </button>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <div className="hidden grid-cols-[1fr_0.8fr_0.6fr_0.6fr_0.6fr_44px] bg-slate-50 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400 lg:grid">
            <span>Turma</span><span>Curso</span><span>Turno</span><span>Alunos</span><span>Projetos</span><span />
          </div>
          <div className="divide-y divide-slate-100">
            {turmasMock.map((turma) => (
              <article key={turma.id} className="grid gap-3 px-4 py-4 lg:grid-cols-[1fr_0.8fr_0.6fr_0.6fr_0.6fr_44px] lg:items-center">
                <div>
                  <h3 className="font-black text-slate-900">{turma.nome}</h3>
                  <p className="text-xs font-semibold text-slate-400">{turma.serie} · {turma.status}</p>
                </div>
                <p className="text-sm font-semibold text-slate-600">{turma.curso}</p>
                <p className="text-sm font-black text-slate-700">{turma.turno}</p>
                <p className="text-sm font-black text-slate-700">{turma.alunos}</p>
                <p className="text-sm font-black text-sectec-700">{turma.projetos}</p>
                <button type="button" onClick={() => handleAcaoIndisponivel(`Gerenciar ${turma.nome}`)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-sectec-200 hover:bg-sectec-50 hover:text-sectec-700" aria-label={`Gerenciar ${turma.nome}`}>
                  <PiArrowUpRight size={18} />
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>
    </AdminPageShell>
  );
}

function FrequenciaCoordenacao() {
  return (
    <AdminPageShell>
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <PanelTitle icon={<PiBookOpen size={20} />} title="Frequência" subtitle="Acompanhamento operacional por turma e participação nos encontros de orientação." />
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {turmasMock.map((turma) => {
            const percentual = Math.min(98, Math.round((turma.projetos / Math.max(turma.alunos, 1)) * 260));
            return (
              <article key={turma.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black text-slate-900">{turma.nome}</h3>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{turma.curso} · {turma.turno}</p>
                  </div>
                  <AdminChip className="bg-sectec-50 text-sectec-700 ring-sectec-200">{percentual}%</AdminChip>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-sectec-600" style={{ width: `${percentual}%` }} />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <span className="rounded-xl bg-white px-2 py-2 text-xs font-black text-slate-700">{turma.alunos} alunos</span>
                  <span className="rounded-xl bg-white px-2 py-2 text-xs font-black text-slate-700">{turma.projetos} projetos</span>
                  <span className="rounded-xl bg-white px-2 py-2 text-xs font-black text-slate-700">{turma.orientadoresVinculados} orient.</span>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </AdminPageShell>
  );
}

function NotasCoordenacao() {
  return (
    <AdminPageShell>
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <PanelTitle icon={<PiNotebook size={20} />} title="Notas" subtitle="Visão da coordenação sobre situação de avaliação, materiais enviados e prioridades." />
        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <div className="hidden grid-cols-[1.2fr_0.75fr_0.7fr_0.5fr] bg-slate-50 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400 lg:grid">
            <span>Projeto</span><span>Status</span><span>Materiais</span><span>Prioridade</span>
          </div>
          <div className="divide-y divide-slate-100">
            {projetosMock.map((projeto) => (
              <article key={projeto.id} className="grid gap-4 px-4 py-4 lg:grid-cols-[1.2fr_0.75fr_0.7fr_0.5fr] lg:items-center">
                <div>
                  <h3 className="font-black text-slate-900">{projeto.titulo}</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{projeto.autor} · {projeto.turma}</p>
                  <p className="mt-1 text-xs text-slate-400">{projeto.orientador} · {projeto.atualizadoEm}</p>
                </div>
                <AdminChip className={statusStyle[projeto.status]}>{projeto.status}</AdminChip>
                <div className="flex gap-2 text-xl">
                  <span className={projeto.materiais.pdf ? "text-emerald-600" : "text-slate-300"} title="PDF"><PiFilePdf /></span>
                  <span className={projeto.materiais.youtube ? "text-emerald-600" : "text-slate-300"} title="Vídeo"><PiYoutubeLogo /></span>
                  <span className={projeto.materiais.resumo ? "text-emerald-600" : "text-slate-300"} title="Resumo"><PiTextAlignLeft /></span>
                </div>
                <AdminChip className={prioridadeStyle[projeto.prioridade]}>{projeto.prioridade}</AdminChip>
              </article>
            ))}
          </div>
        </div>
      </section>
    </AdminPageShell>
  );
}

type UsuarioCoordenacao = {
  id: string;
  nome: string;
  email: string;
  perfil: "Aluno" | "Orientador";
};

function UsuariosCoordenacao() {
  const [abaAtiva, setAbaAtiva] = useState<"alunos" | "orientadores">("alunos");
  const [busca, setBusca] = useState("");
  const [alunos, setAlunos] = useState<UsuarioCoordenacao[]>([]);
  const [orientadores, setOrientadores] = useState<UsuarioCoordenacao[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const inputAlunosRef = useRef<HTMLInputElement>(null);
  const inputOrientadoresRef = useRef<HTMLInputElement>(null);

  const totalAlunos = alunos.length;
  const totalOrientadores = orientadores.length;
  const totalGeral = totalAlunos + totalOrientadores;

  function normalizarUsuarios(lista: UsuarioApi[], perfil: "Aluno" | "Orientador") {
    return lista.map((usuario) => ({
      id: String(usuario.id),
      nome: usuario.nome,
      email: usuario.email_institucional ?? "",
      perfil,
    }));
  }

  async function carregarUsuarios() {
    setCarregando(true);
    setErro("");

    try {
      const [alunosResponse, orientadoresResponse] = await Promise.all([
        apiRequest<UsuarioApi[]>("/users/alunos"),
        apiRequest<UsuarioApi[]>("/users/orientadores"),
      ]);

      setAlunos(normalizarUsuarios(alunosResponse, "Aluno"));
      setOrientadores(normalizarUsuarios(orientadoresResponse, "Orientador"));
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Nao foi possivel carregar os usuarios.");
    } finally {
      setCarregando(false);
    }
  }

  async function lerMensagemErro(response: Response) {
    try {
      const data = await response.json();
      if (typeof data?.message === "string") return data.message;
      if (Array.isArray(data?.message)) return data.message.join(" ");
    } catch {
      // fallback para erros sem JSON
    }

    return "Nao foi possivel concluir a importacao.";
  }

  async function handleUploadCsv(tipo: "alunos" | "orientadores", file?: File) {
    if (!file) return;

    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const rota = tipo === "alunos" ? "/users/upload-csv/alunos" : "/users/upload-csv/professores";
      const response = await fetch(`${API_BASE_URL}${rota}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });

      if (!response.ok) {
        const message = await lerMensagemErro(response);
        throw new Error(message);
      }

      Swal.fire({
        icon: "success",
        title: "CSV importado com sucesso!",
        showConfirmButton: false,
        timer: 1400,
        timerProgressBar: true,
      });
      await carregarUsuarios();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Erro ao importar CSV",
        text: error instanceof Error ? error.message : "Tente novamente.",
        confirmButtonColor: "#15803d",
      });
    } finally {
      if (tipo === "alunos" && inputAlunosRef.current) inputAlunosRef.current.value = "";
      if (tipo === "orientadores" && inputOrientadoresRef.current) inputOrientadoresRef.current.value = "";
    }
  }

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      if (!ativo) return;
      await carregarUsuarios();
    }

    carregar();

    return () => {
      ativo = false;
    };
  }, []);

  const listaAtual = abaAtiva === "alunos" ? alunos : orientadores;
  const termo = busca.trim().toLowerCase();
  const listaFiltrada = listaAtual.filter((usuario) => {
    if (!termo) return true;
    return (
      usuario.nome.toLowerCase().includes(termo) ||
      usuario.email.toLowerCase().includes(termo)
    );
  });

  return (
    <AdminPageShell>
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <PanelTitle icon={<PiUsersThree size={20} />} title="Usuarios" subtitle="Cadastro via CSV e controle de alunos e orientadores ativos." />
          <div className="flex flex-wrap gap-2">
            <input
              ref={inputAlunosRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(event) => handleUploadCsv("alunos", event.target.files?.[0])}
            />
            <input
              ref={inputOrientadoresRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(event) => handleUploadCsv("orientadores", event.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => inputAlunosRef.current?.click()}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-sectec-200 bg-sectec-50 px-4 text-sm font-black text-sectec-700 transition hover:bg-sectec-100"
            >
              <PiUploadSimple size={18} /> Importar CSV (alunos)
            </button>
            <button
              type="button"
              onClick={() => inputOrientadoresRef.current?.click()}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-sectec-200 hover:bg-sectec-50 hover:text-sectec-700"
            >
              <PiUploadSimple size={18} /> Importar CSV (orientadores)
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Total de alunos", value: totalAlunos },
            { label: "Total de orientadores", value: totalOrientadores },
            { label: "Total geral", value: totalGeral },
          ].map((card) => (
            <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{card.label}</p>
              <strong className="mt-2 block text-2xl font-black text-slate-900">{card.value}</strong>
            </article>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
            {[
              { id: "alunos", label: "Alunos" },
              { id: "orientadores", label: "Orientadores" },
            ].map((aba) => {
              const ativa = abaAtiva === aba.id;
              return (
                <button
                  key={aba.id}
                  type="button"
                  onClick={() => setAbaAtiva(aba.id as "alunos" | "orientadores")}
                  className={`px-4 py-2 text-sm font-black transition ${
                    ativa
                      ? "rounded-xl bg-white text-sectec-700 shadow-sm"
                      : "text-slate-500"
                  }`}
                >
                  {aba.label}
                </button>
              );
            })}
          </div>
          <label className="relative block">
            <PiMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar por nome ou email"
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-sectec-500 focus:bg-white focus:ring-2 focus:ring-sectec-100 sm:w-72"
            />
          </label>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <div className="hidden grid-cols-[1fr_1fr_0.5fr_0.4fr] bg-slate-50 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400 lg:grid">
            <span>Nome</span>
            <span>Email institucional</span>
            <span>Perfil</span>
            <span>Status</span>
          </div>

          <div className="divide-y divide-slate-100">
            {carregando && (
              <div className="px-4 py-6 text-sm font-semibold text-slate-500">Carregando usuarios...</div>
            )}
            {!carregando && erro && (
              <div className="px-4 py-6 text-sm font-semibold text-red-600">{erro}</div>
            )}
            {!carregando && !erro && listaFiltrada.length === 0 && (
              <div className="px-4 py-6 text-sm font-semibold text-slate-500">Nenhum usuario encontrado.</div>
            )}
            {!carregando && !erro && listaFiltrada.map((usuario) => (
              <article key={usuario.id} className="grid gap-2 px-4 py-4 lg:grid-cols-[1fr_1fr_0.5fr_0.4fr] lg:items-center">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-900">{usuario.nome}</p>
                </div>
                <p className="truncate text-sm font-semibold text-slate-600">{usuario.email || "-"}</p>
                <p className="text-sm font-black text-slate-700">{usuario.perfil}</p>
                <AdminChip className="bg-emerald-50 text-emerald-700 ring-emerald-200">Ativo</AdminChip>
              </article>
            ))}
          </div>
        </div>
      </section>
    </AdminPageShell>
  );
}

function Administrador() {
  const { pathname } = useLocation();
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<StatusProjeto | "Todos">("Todos");

  const projetosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return projetosMock.filter((projeto) => {
      const bateBusca =
        !termo ||
        projeto.titulo.toLowerCase().includes(termo) ||
        projeto.autor.toLowerCase().includes(termo) ||
        projeto.orientador.toLowerCase().includes(termo) ||
        projeto.eixo.toLowerCase().includes(termo);

      return (statusFiltro === "Todos" || projeto.status === statusFiltro) && bateBusca;
    });
  }, [busca, statusFiltro]);

  const pendenciasAltas = projetosMock.filter((projeto) => projeto.prioridade === "alta").length;
  const materiaisCompletos = projetosMock.filter(
    (projeto) => projeto.materiais.pdf && projeto.materiais.youtube && projeto.materiais.resumo,
  ).length;

  if (pathname.endsWith("/turmas")) return <TurmasCoordenacao />;
  if (pathname.endsWith("/frequencia")) return <FrequenciaCoordenacao />;
  if (pathname.endsWith("/notas")) return <NotasCoordenacao />;
  if (pathname.endsWith("/usuarios")) return <UsuariosCoordenacao />;

  return (
    <MainLayout userRole="coordenador">
      <main className="min-h-screen bg-[#f4f9f6] px-4 py-5 sm:px-7 sm:py-7">
        <div className="mx-auto grid max-w-[1500px] gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.75fr)]">
          <section className="grid gap-5">
            <div className="grid min-h-[310px] overflow-hidden rounded-[28px] border border-sectec-900/10 bg-white shadow-sm lg:grid-cols-[1fr_310px]">
              <div className="relative bg-[#0b4d2c] p-6 text-white sm:p-8">
                <div className="absolute inset-y-0 right-0 w-1/3 bg-[linear-gradient(135deg,transparent_0_35%,rgba(255,255,255,.08)_35%_36%,transparent_36%_62%,rgba(255,255,255,.08)_62%_63%,transparent_63%)]" />
                <div className="relative flex h-full flex-col justify-between gap-8">
                  <div>
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-white/70">
                      <PiShieldCheck size={15} /> Coordenação SECTEC
                    </div>
                    <h1 className="max-w-2xl text-3xl font-black leading-tight tracking-tight sm:text-4xl">
                      Operação administrativa da feira
                    </h1>
                    <p className="mt-4 max-w-2xl text-sm leading-6 text-white/70">
                      Gestão de fases, orientação, turmas, permissões e auditoria em uma tela única, com foco em decisão rápida.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="border-l border-white/20 pl-4">
                      <p className="text-[11px] font-black uppercase tracking-widest text-white/45">Projetos</p>
                      <strong className="mt-1 block text-2xl font-black">{projetosMock.length}</strong>
                    </div>
                    <div className="border-l border-white/20 pl-4">
                      <p className="text-[11px] font-black uppercase tracking-widest text-white/45">Completos</p>
                      <strong className="mt-1 block text-2xl font-black">{materiaisCompletos}</strong>
                    </div>
                    <div className="border-l border-white/20 pl-4">
                      <p className="text-[11px] font-black uppercase tracking-widest text-white/45">Pendências</p>
                      <strong className="mt-1 block text-2xl font-black">{pendenciasAltas}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Fase atual</p>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sectec-50 text-sectec-700">
                    {prazoEncerrado ? <PiLockKey size={22} /> : <PiCalendarBlank size={22} />}
                  </span>
                </div>
                <strong className="mt-5 block text-3xl font-black text-slate-950">{faseAtual}</strong>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {prazoEncerrado ? "Campos bloqueados por prazo." : "Edição liberada com rastreio de auditoria."}
                </p>

                <div className="mt-6 space-y-3">
                  {fases.map((fase, index) => {
                    const ativa = fase.nome === faseAtual;
                    const concluida = fases.findIndex((item) => item.nome === faseAtual) > index;

                    return (
                      <div key={fase.nome} className="grid grid-cols-[28px_1fr] gap-3">
                        <div className="flex flex-col items-center">
                          <span
                            className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-black ${
                              ativa || concluida
                                ? "border-sectec-600 bg-sectec-600 text-white"
                                : "border-slate-200 bg-white text-slate-400"
                            }`}
                          >
                            {concluida ? <PiCheckCircle size={15} /> : index + 1}
                          </span>
                          {index < fases.length - 1 && <span className="mt-2 h-8 w-px bg-slate-200" />}
                        </div>
                        <div>
                          <p className={`text-sm font-black ${ativa ? "text-sectec-800" : "text-slate-700"}`}>{fase.nome}</p>
                          <p className="text-[11px] font-semibold text-slate-400">{fase.periodo} · {fase.descricao}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <section className="grid gap-5 lg:grid-cols-[0.78fr_1.22fr]">
              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <PanelTitle icon={<PiBuildings size={20} />} title="Turmas" subtitle="Distribuição por curso, série e orientação." />
                  <button
                    type="button"
                    onClick={() => handleAcaoIndisponivel("Criar turma")}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sectec-700 text-white transition hover:bg-sectec-800"
                    aria-label="Nova turma"
                  >
                    <PiPlus size={18} />
                  </button>
                </div>

                <div className="mt-5 divide-y divide-slate-100">
                  {turmasMock.map((turma) => (
                    <button
                      key={turma.id}
                      type="button"
                      onClick={() => handleAcaoIndisponivel(`Gerenciar ${turma.nome}`)}
                      className="grid w-full grid-cols-[1fr_auto] gap-3 py-4 text-left transition first:pt-0 last:pb-0 hover:bg-slate-50"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sectec-50 text-sectec-700">
                            <PiBookOpen size={17} />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-slate-900">{turma.nome}</p>
                            <p className="truncate text-xs font-medium text-slate-500">{turma.curso}</p>
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                          <span className="rounded-xl bg-slate-50 px-2 py-2 text-xs font-black text-slate-700">{turma.alunos} alunos</span>
                          <span className="rounded-xl bg-slate-50 px-2 py-2 text-xs font-black text-slate-700">{turma.projetos} proj.</span>
                          <span className="rounded-xl bg-slate-50 px-2 py-2 text-xs font-black text-slate-700">{turma.orientadoresVinculados} orient.</span>
                        </div>
                      </div>
                      <PiCaretRight className="mt-2 text-slate-300" size={18} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <PanelTitle icon={<PiGitBranch size={20} />} title="Projetos em trânsito" subtitle="Fila principal da coordenação, com busca e status." />
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <label className="relative block">
                      <PiMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                      <input
                        value={busca}
                        onChange={(event) => setBusca(event.target.value)}
                        placeholder="Buscar projeto, aluno ou eixo"
                        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-sectec-500 focus:bg-white focus:ring-2 focus:ring-sectec-100 sm:w-64"
                      />
                    </label>
                    <label className="relative block">
                      <PiFunnel className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                      <select
                        value={statusFiltro}
                        onChange={(event) => setStatusFiltro(event.target.value as StatusProjeto | "Todos")}
                        className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-8 text-sm font-black text-slate-600 outline-none transition focus:border-sectec-500 focus:bg-white focus:ring-2 focus:ring-sectec-100 sm:w-48"
                      >
                        <option>Todos</option>
                        {Object.keys(statusStyle).map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>

                <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                  <div className="hidden grid-cols-[1.2fr_0.78fr_0.62fr_44px] bg-slate-50 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400 lg:grid">
                    <span>Projeto</span>
                    <span>Status</span>
                    <span>Material</span>
                    <span />
                  </div>

                  <div className="divide-y divide-slate-100">
                    {projetosFiltrados.map((projeto) => (
                      <article key={projeto.id} className="grid gap-4 px-4 py-4 transition hover:bg-slate-50 lg:grid-cols-[1.2fr_0.78fr_0.62fr_44px] lg:items-center">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-black text-slate-900">{projeto.titulo}</h3>
                            <AdminChip className={prioridadeStyle[projeto.prioridade]}>{projeto.prioridade}</AdminChip>
                          </div>
                          <p className="mt-1 text-sm font-semibold text-slate-500">{projeto.autor} · {projeto.turma}</p>
                          <p className="mt-1 text-xs text-slate-400">{projeto.eixo} · {projeto.orientador} · {projeto.atualizadoEm}</p>
                        </div>

                        <AdminChip className={statusStyle[projeto.status]}>{projeto.status}</AdminChip>

                        <div className="flex gap-2 text-lg">
                          <span className={projeto.materiais.pdf ? "text-emerald-600" : "text-slate-300"} title="PDF">
                            <PiFilePdf />
                          </span>
                          <span className={projeto.materiais.youtube ? "text-emerald-600" : "text-slate-300"} title="Vídeo">
                            <PiYoutubeLogo />
                          </span>
                          <span className={projeto.materiais.resumo ? "text-emerald-600" : "text-slate-300"} title="Resumo">
                            <PiTextAlignLeft />
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAcaoIndisponivel("Abrir detalhes do projeto")}
                          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-sectec-200 hover:bg-sectec-50 hover:text-sectec-700"
                          aria-label={`Abrir ${projeto.titulo}`}
                        >
                          <PiArrowUpRight size={18} />
                        </button>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </section>

          <aside className="grid content-start gap-5">
            <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <PanelTitle icon={<PiGauge size={20} />} title="Saúde operacional" subtitle="Indicadores em formato de controle, não vitrine." />
              <div className="mt-5 space-y-4">
                {[
                  { label: "Submissões completas", value: `${materiaisCompletos}/${projetosMock.length}`, width: "50%", icon: <PiSealCheck /> },
                  { label: "Orientações pendentes", value: "1 crítica", width: "30%", icon: <PiWarningCircle /> },
                  { label: "Usuários provisionados", value: `${usuariosMock.length} contas`, width: "70%", icon: <PiUsersThree /> },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="mb-2 flex items-center justify-between text-xs font-black">
                      <span className="flex items-center gap-2 text-slate-600">{item.icon} {item.label}</span>
                      <span className="text-slate-900">{item.value}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-sectec-600" style={{ width: item.width }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <PanelTitle icon={<PiSlidersHorizontal size={20} />} title="Prazos" subtitle="Janelas que controlam edição e bloqueio." />
                <button
                  type="button"
                  onClick={() => handleAcaoIndisponivel("Editar prazos do evento")}
                  className="rounded-xl border border-sectec-200 bg-sectec-50 px-3 py-2 text-xs font-black text-sectec-700 transition hover:bg-sectec-100"
                >
                  Editar
                </button>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2">
                {fases.map((fase) => (
                  <div key={fase.nome} className={`rounded-2xl border p-3 ${fase.nome === faseAtual ? "border-sectec-200 bg-sectec-50" : "border-slate-100 bg-slate-50"}`}>
                    <p className="text-xs font-black text-slate-800">{fase.nome}</p>
                    <p className="mt-1 text-[11px] font-semibold text-slate-400">{fase.periodo}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <PanelTitle icon={<PiChalkboardTeacher size={20} />} title="Fila de orientação" subtitle="Solicitações que podem travar projeto." />
              <div className="mt-5 space-y-3">
                {solicitacoesMock.map((solicitacao) => (
                  <article key={solicitacao.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-black text-slate-900">{solicitacao.projeto}</h3>
                        <p className="mt-1 text-xs font-semibold text-slate-500">{solicitacao.aluno} · {solicitacao.eixo}</p>
                        <p className="mt-1 text-xs text-slate-400">{solicitacao.orientador} · {solicitacao.prazo}</p>
                      </div>
                      <PiBellRinging className={solicitacao.status === "Aguardando resposta" ? "text-amber-600" : "text-emerald-600"} size={19} />
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <PanelTitle icon={<PiUserGear size={20} />} title="Permissões" subtitle="Perfis ativos no evento." />
                <button
                  type="button"
                  onClick={() => handleAcaoIndisponivel("Criar usuário")}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white transition hover:bg-slate-800"
                  aria-label="Novo usuário"
                >
                  <PiPlus size={17} />
                </button>
              </div>
              <div className="mt-5 space-y-2">
                {usuariosMock.map((usuario) => (
                  <article key={usuario.id} className="grid grid-cols-[38px_1fr_auto] items-center gap-3 rounded-2xl bg-slate-50 px-3 py-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sectec-700 shadow-sm">
                      {usuario.perfil === "Aluno" ? <PiStudent /> : usuario.perfil === "Orientador" ? <PiChalkboardTeacher /> : <PiGraduationCap />}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-900">{usuario.nome}</p>
                      <p className="truncate text-[11px] text-slate-400">{usuario.email}</p>
                    </div>
                    <span className="text-right text-[11px] font-black uppercase text-slate-500">{usuario.perfil}</span>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <PanelTitle icon={<PiClockCounterClockwise size={20} />} title="Auditoria" subtitle="Eventos recentes da coordenação." />
              <div className="mt-5 space-y-4">
                {logsMock.map((log, index) => (
                  <article key={log.id} className="grid grid-cols-[28px_1fr] gap-3">
                    <div className="flex flex-col items-center">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sectec-50 text-sectec-700">
                        {index === 0 ? <PiNotebook size={14} /> : index === 1 ? <PiXCircle size={14} /> : <PiCheckCircle size={14} />}
                      </span>
                      {index < logsMock.length - 1 && <span className="mt-2 h-10 w-px bg-slate-200" />}
                    </div>
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-black text-slate-900">{log.acao}</h3>
                        <span className="text-[11px] font-bold text-slate-400">{log.quando}</span>
                      </div>
                      <p className="mt-1 text-xs font-bold text-slate-500">{log.usuario}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{log.detalhe}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </main>
    </MainLayout>
  );
}

export default Administrador;
