import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileText,
  FolderOpen,
  MessageSquare,
  Plus,
  Save,
  Search,
  Send,
  Settings2,
  SlidersHorizontal,
  Trash2,
  Users,
} from "lucide-react";

import { MainLayout } from "../componentes/SideBarUniversal";
import EixoDropdown, {
  EIXOS_LIST,
  type EixoTematico,
} from "../componentes/EixoDropdown";
import { apiRequest } from "../lib/api";

type EixoProjeto = Exclude<EixoTematico, "todos">;
type Risco = "alto" | "medio" | "baixo";
type StatusEntrega = "pendente" | "revisada" | "atrasada";
type StatusProjeto = "aguardando" | "aprovado" | "ajustes";

type RegistroComEixo = {
  eixoSlug: EixoProjeto;
};

type Equipe = RegistroComEixo & {
  id: string;
  nome: string;
  turma: string;
  eixo: string;
  tema: string;
  lider: string;
  integrantes: number;
  progresso: number;
  ultimoContato: string;
  proximaReuniao: string;
  risco: Risco;
};

type Entrega = RegistroComEixo & {
  id: string;
  arquivo: string;
  equipe: string;
  turma: string;
  aluno: string;
  etapa: string;
  data: string;
  status: StatusEntrega;
};

type Projeto = RegistroComEixo & {
  id: string;
  orientacaoId?: number;
  titulo: string;
  equipe: string;
  turma: string;
  enviadoEm: string;
  status: StatusProjeto;
};

type AgendaItem = RegistroComEixo & {
  id: string;
  hora: string;
  dia: string;
  titulo: string;
  equipe: string;
  local: string;
};

type NotaEquipe = RegistroComEixo & {
  equipe: string;
  turma: string;
  pesquisa: number;
  prototipo: number;
  apresentacao: number;
  documentacao: number;
};

type PerfilOrientador = {
  nome: string;
  area: string;
  bio: string;
};

type RegraFeira = {
  id: string;
  texto: string;
  ativo: boolean;
};

type AlertaConfig = {
  id: string;
  titulo: string;
  texto: string;
  ativo: boolean;
};

const turmas = [
  {
    id: "3info-a",
    nome: "3º Informática A",
    turno: "Manhã",
    alunos: 31,
  },
  {
    id: "3info-b",
    nome: "3º Informática B",
    turno: "Tarde",
    alunos: 28,
  },
  {
    id: "2info-a",
    nome: "2º Informática A",
    turno: "Manhã",
    alunos: 34,
  },
];

const equipesIniciais: Equipe[] = [
  {
    id: "eq-lab",
    nome: "Grupo Lab Fácil",
    turma: "3º Informática A",
    eixo: "Tecnologia e Inovação",
    eixoSlug: "tecnologia",
    tema: "Sistema de triagem para o laboratório escolar",
    lider: "Mariana Costa",
    integrantes: 6,
    progresso: 78,
    ultimoContato: "Hoje, 09:20",
    proximaReuniao: "Terça, 08:20",
    risco: "baixo",
  },
  {
    id: "eq-horta",
    nome: "Grupo HortaTech",
    turma: "3º Informática B",
    eixo: "Sustentabilidade Ambiental",
    eixoSlug: "sustentabilidade",
    tema: "Irrigação automatizada com sensores de umidade",
    lider: "Rafael Lima",
    integrantes: 7,
    progresso: 56,
    ultimoContato: "Ontem, 16:45",
    proximaReuniao: "Quarta, 10:00",
    risco: "medio",
  },
  {
    id: "eq-energia",
    nome: "Grupo Energia na Escola",
    turma: "2º Informática A",
    eixo: "Energia e Recursos Naturais",
    eixoSlug: "energia",
    tema: "Painel de acompanhamento do consumo de energia",
    lider: "João Victor",
    integrantes: 6,
    progresso: 39,
    ultimoContato: "Há 5 dias",
    proximaReuniao: "Sexta, 13:30",
    risco: "alto",
  },
  {
    id: "eq-inclusao",
    nome: "Grupo Acesso+",
    turma: "3º Informática A",
    eixo: "Sociedade e Cidadania",
    eixoSlug: "sociedade",
    tema: "Mapa colaborativo de acessibilidade na escola",
    lider: "Bianca Alves",
    integrantes: 5,
    progresso: 64,
    ultimoContato: "Hoje, 10:10",
    proximaReuniao: "Quinta, 09:30",
    risco: "medio",
  },
  {
    id: "eq-estudo",
    nome: "Grupo Estudaí",
    turma: "2º Informática A",
    eixo: "Educação",
    eixoSlug: "educacao",
    tema: "Plataforma de simulados e trilhas de revisão",
    lider: "Letícia Rocha",
    integrantes: 6,
    progresso: 82,
    ultimoContato: "Hoje, 13:40",
    proximaReuniao: "Quinta, 14:00",
    risco: "baixo",
  },
  {
    id: "eq-saude",
    nome: "Grupo Saúde em Foco",
    turma: "3º Informática B",
    eixo: "Saúde e Bem-estar",
    eixoSlug: "saude",
    tema: "Dashboard de hábitos saudáveis para estudantes",
    lider: "Pedro Henrique",
    integrantes: 5,
    progresso: 47,
    ultimoContato: "Há 3 dias",
    proximaReuniao: "Sexta, 09:00",
    risco: "alto",
  },
];

const entregasIniciais: Entrega[] = [
  {
    id: "ent-1",
    arquivo: "relatorio_metodologia.pdf",
    equipe: "Grupo Lab Fácil",
    turma: "3º Informática A",
    aluno: "Mariana Costa",
    etapa: "Metodologia",
    data: "Hoje, 09:20",
    status: "pendente",
    eixoSlug: "tecnologia",
  },
  {
    id: "ent-2",
    arquivo: "codigo_prototipo.zip",
    equipe: "Grupo HortaTech",
    turma: "3º Informática B",
    aluno: "Rafael Lima",
    etapa: "Protótipo",
    data: "Ontem, 16:45",
    status: "atrasada",
    eixoSlug: "sustentabilidade",
  },
  {
    id: "ent-3",
    arquivo: "banner_sectec.pdf",
    equipe: "Grupo Energia na Escola",
    turma: "2º Informática A",
    aluno: "João Victor",
    etapa: "Banner",
    data: "Hoje, 11:10",
    status: "revisada",
    eixoSlug: "energia",
  },
  {
    id: "ent-4",
    arquivo: "referencias_abnt.docx",
    equipe: "Grupo HortaTech",
    turma: "3º Informática B",
    aluno: "Ana Beatriz",
    etapa: "Referências",
    data: "Segunda, 14:05",
    status: "pendente",
    eixoSlug: "sustentabilidade",
  },
  {
    id: "ent-5",
    arquivo: "mapa_acessibilidade.fig",
    equipe: "Grupo Acesso+",
    turma: "3º Informática A",
    aluno: "Bianca Alves",
    etapa: "Protótipo visual",
    data: "Hoje, 15:05",
    status: "pendente",
    eixoSlug: "sociedade",
  },
  {
    id: "ent-6",
    arquivo: "simulados_backend.zip",
    equipe: "Grupo Estudaí",
    turma: "2º Informática A",
    aluno: "Letícia Rocha",
    etapa: "Código",
    data: "Ontem, 08:30",
    status: "revisada",
    eixoSlug: "educacao",
  },
];

const projetosIniciais: Projeto[] = [
  {
    id: "apr-1",
    titulo: "Coleta seletiva com pontos inteligentes",
    equipe: "Equipe Recicla+",
    turma: "2º Informática A",
    enviadoEm: "Hoje, 07:50",
    status: "aguardando",
    eixoSlug: "sustentabilidade",
  },
  {
    id: "apr-2",
    titulo: "Aplicativo de achados e perdidos da escola",
    equipe: "Equipe Conecta",
    turma: "3º Informática A",
    enviadoEm: "Ontem, 12:10",
    status: "ajustes",
    eixoSlug: "sociedade",
  },
  {
    id: "apr-3",
    titulo: "Sensor de presença para salas ociosas",
    equipe: "Equipe Volt",
    turma: "3º Informática B",
    enviadoEm: "Segunda, 08:30",
    status: "aprovado",
    eixoSlug: "energia",
  },
  {
    id: "apr-4",
    titulo: "Aplicativo de revisão por flashcards",
    equipe: "Equipe Memo",
    turma: "2º Informática A",
    enviadoEm: "Hoje, 13:20",
    status: "aguardando",
    eixoSlug: "educacao",
  },
];

const agendaInicial: AgendaItem[] = [
  {
    id: "age-1",
    hora: "08:20",
    dia: "Terça",
    titulo: "Problema, objetivo e justificativa",
    equipe: "Grupo Lab Fácil",
    local: "Lab 2",
    eixoSlug: "tecnologia",
  },
  {
    id: "age-2",
    hora: "10:00",
    dia: "Quarta",
    titulo: "Teste dos sensores e coleta de dados",
    equipe: "Grupo HortaTech",
    local: "Pátio",
    eixoSlug: "sustentabilidade",
  },
  {
    id: "age-3",
    hora: "13:30",
    dia: "Sexta",
    titulo: "Revisão do banner e apresentação",
    equipe: "Grupo Energia na Escola",
    local: "Sala 11",
    eixoSlug: "energia",
  },
  {
    id: "age-4",
    hora: "09:30",
    dia: "Quinta",
    titulo: "Validação com usuários",
    equipe: "Grupo Acesso+",
    local: "Biblioteca",
    eixoSlug: "sociedade",
  },
];

const notasIniciais: NotaEquipe[] = [
  {
    equipe: "Grupo Lab Fácil",
    turma: "3º Informática A",
    pesquisa: 9,
    prototipo: 8.5,
    apresentacao: 8.8,
    documentacao: 9.2,
    eixoSlug: "tecnologia",
  },
  {
    equipe: "Grupo HortaTech",
    turma: "3º Informática B",
    pesquisa: 7.8,
    prototipo: 8.9,
    apresentacao: 7.4,
    documentacao: 7,
    eixoSlug: "sustentabilidade",
  },
  {
    equipe: "Grupo Energia na Escola",
    turma: "2º Informática A",
    pesquisa: 8.4,
    prototipo: 7.6,
    apresentacao: 8.1,
    documentacao: 7.8,
    eixoSlug: "energia",
  },
  {
    equipe: "Grupo Acesso+",
    turma: "3º Informática A",
    pesquisa: 8,
    prototipo: 7.8,
    apresentacao: 8.5,
    documentacao: 8.1,
    eixoSlug: "sociedade",
  },
  {
    equipe: "Grupo Estudaí",
    turma: "2º Informática A",
    pesquisa: 9.1,
    prototipo: 8.8,
    apresentacao: 8.6,
    documentacao: 8.9,
    eixoSlug: "educacao",
  },
  {
    equipe: "Grupo Saúde em Foco",
    turma: "3º Informática B",
    pesquisa: 7.2,
    prototipo: 7,
    apresentacao: 7.5,
    documentacao: 6.8,
    eixoSlug: "saude",
  },
];

const perfilInicial: PerfilOrientador = {
  nome: "Professor orientador",
  area: "Informática e projetos integradores",
  bio: "Responsável por acompanhar equipes, revisar entregas e avaliar projetos da SECTEC.",
};

const regrasIniciais: RegraFeira[] = [
  { id: "relatorio", texto: "Exigir relatório antes da banca", ativo: true },
  { id: "reenvio", texto: "Permitir reenvio até o prazo final", ativo: true },
  { id: "media", texto: "Usar média entre quatro critérios", ativo: true },
  { id: "bloqueio", texto: "Bloquear notas depois da publicação", ativo: false },
];

const alertasIniciais: AlertaConfig[] = [
  {
    id: "atrasadas",
    titulo: "Entregas atrasadas",
    texto: "Avisar quando uma equipe passar do prazo.",
    ativo: true,
  },
  {
    id: "duvidas",
    titulo: "Dúvidas dos alunos",
    texto: "Avisar quando houver novo comentário.",
    ativo: true,
  },
  {
    id: "notas",
    titulo: "Notas pendentes",
    texto: "Avisar quando uma equipe estiver sem avaliação.",
    ativo: false,
  },
];

type UsuarioProjetoApi = {
  id: number | string;
  nome: string;
  ano?: number;
};

type ProjetoApi = {
  id: number;
  titulo: string;
  descricao?: string;
  temaId?: number;
  criadoEm?: string;
  alunoAutor?: UsuarioProjetoApi;
  projetoAlunos?: Array<{
    id?: number | string;
    aluno?: UsuarioProjetoApi;
  }>;
};

type OrientacaoApi = {
  id: number;
  status: "pendente" | "aceito" | "recusado";
  criadoEm?: string;
  respondidoEm?: string | null;
  projeto?: ProjetoApi;
};

const rubrica = [
  ["Pesquisa", "Problema, objetivo, justificativa, fontes e metodologia."],
  ["Protótipo", "Funcionamento, teste, aplicação prática e evidências."],
  ["Apresentação", "Clareza, domínio do tema e resposta à banca."],
  ["Documentação", "Relatório, banner, código e organização dos arquivos."],
];

const diasAgenda = ["Seg", "Ter", "Qua", "Qui", "Sex"];
const eixosProjeto = EIXOS_LIST.filter((eixo): eixo is EixoProjeto => eixo !== "todos");
const eixoLabels: Record<EixoProjeto, string> = {
  tecnologia: "Tecnologia e Inovação",
  sustentabilidade: "Sustentabilidade Ambiental",
  sociedade: "Sociedade e Cidadania",
  energia: "Energia e Recursos Naturais",
  educacao: "Educação",
  saude: "Saúde e Bem-estar",
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function eixoFromTemaId(temaId?: number): EixoProjeto {
  if (!temaId || temaId < 1) return "tecnologia";
  return eixosProjeto[(temaId - 1) % eixosProjeto.length];
}

function formatBackendDate(value?: string | null) {
  if (!value) return "Sem data";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sem data";

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function turmaFromProjeto(projeto?: ProjetoApi) {
  const ano = projeto?.alunoAutor?.ano ?? projeto?.projetoAlunos?.find((item) => item.aluno?.ano)?.aluno?.ano;
  return ano ? `${ano}º ano` : "Turma não informada";
}

function liderFromProjeto(projeto?: ProjetoApi) {
  return projeto?.alunoAutor?.nome ?? projeto?.projetoAlunos?.[0]?.aluno?.nome ?? "Aluno não informado";
}

function integrantesFromProjeto(projeto?: ProjetoApi) {
  const ids = new Set<number | string>();

  if (projeto?.alunoAutor?.id) ids.add(projeto.alunoAutor.id);
  projeto?.projetoAlunos?.forEach((item) => {
    if (item.aluno?.id) ids.add(item.aluno.id);
  });

  return Math.max(ids.size, 1);
}

function statusProjetoFromOrientacao(status: OrientacaoApi["status"]): StatusProjeto {
  if (status === "aceito") return "aprovado";
  if (status === "recusado") return "ajustes";
  return "aguardando";
}

function riscoFromOrientacao(status: OrientacaoApi["status"]): Risco {
  if (status === "pendente") return "alto";
  if (status === "recusado") return "medio";
  return "baixo";
}

function progressoFromOrientacao(status: OrientacaoApi["status"]) {
  if (status === "aceito") return 75;
  if (status === "recusado") return 35;
  return 45;
}

function mapOrientacaoToProjeto(orientacao: OrientacaoApi): Projeto {
  const projeto = orientacao.projeto;
  const eixoSlug = eixoFromTemaId(projeto?.temaId);

  return {
    id: `orientacao-${orientacao.id}`,
    orientacaoId: orientacao.id,
    titulo: projeto?.titulo ?? "Projeto sem título",
    equipe: liderFromProjeto(projeto),
    turma: turmaFromProjeto(projeto),
    enviadoEm: formatBackendDate(orientacao.criadoEm),
    status: statusProjetoFromOrientacao(orientacao.status),
    eixoSlug,
  };
}

function mapOrientacaoToEquipe(orientacao: OrientacaoApi): Equipe {
  const projeto = orientacao.projeto;
  const eixoSlug = eixoFromTemaId(projeto?.temaId);
  const lider = liderFromProjeto(projeto);

  return {
    id: `orientacao-${orientacao.id}`,
    nome: projeto?.titulo ? `Equipe ${projeto.titulo}` : `Equipe ${lider}`,
    turma: turmaFromProjeto(projeto),
    eixo: eixoLabels[eixoSlug],
    eixoSlug,
    tema: projeto?.descricao ?? projeto?.titulo ?? "Projeto sem descrição cadastrada",
    lider,
    integrantes: integrantesFromProjeto(projeto),
    progresso: progressoFromOrientacao(orientacao.status),
    ultimoContato: orientacao.respondidoEm ? formatBackendDate(orientacao.respondidoEm) : formatBackendDate(orientacao.criadoEm),
    proximaReuniao: "A definir",
    risco: riscoFromOrientacao(orientacao.status),
  };
}

function useOrientadorBackendData() {
  const [orientacoes, setOrientacoes] = useState<OrientacaoApi[] | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let active = true;

    async function carregar() {
      setCarregando(true);

      try {
        const data = await apiRequest<OrientacaoApi[]>("/orientacoes");
        if (!active) return;
        setOrientacoes(data);
        setErro("");
      } catch (error) {
        if (!active) return;
        setOrientacoes(null);
        setErro(error instanceof Error ? error.message : "Não foi possível carregar as orientações do backend.");
      } finally {
        if (active) setCarregando(false);
      }
    }

    carregar();

    return () => {
      active = false;
    };
  }, []);

  const equipes = useMemo(() => orientacoes?.map(mapOrientacaoToEquipe) ?? null, [orientacoes]);
  const projetos = useMemo(() => orientacoes?.map(mapOrientacaoToProjeto) ?? null, [orientacoes]);

  async function responderProjeto(projeto: Projeto, status: StatusProjeto) {
    if (!projeto.orientacaoId) return false;

    const action = status === "aprovado" ? "aceito" : "recusado";
    const orientacaoAtualizada = await apiRequest<OrientacaoApi>(`/orientacoes/${projeto.orientacaoId}/responder`, {
      method: "PATCH",
      body: { action },
    });

    setOrientacoes((lista) =>
      lista?.map((orientacao) => (orientacao.id === orientacaoAtualizada.id ? orientacaoAtualizada : orientacao)) ?? lista
    );

    return true;
  }

  return { equipes, projetos, carregando, erro, responderProjeto };
}

function useStoredState<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;

    const stored = window.localStorage.getItem(key);
    if (!stored) return initialValue;

    try {
      return JSON.parse(stored) as T;
    } catch {
      return initialValue;
    }
  });

  const setStoredState: React.Dispatch<React.SetStateAction<T>> = (value) => {
    setState((previous) => {
      const nextValue = value instanceof Function ? value(previous) : value;

      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(nextValue));
      }

      return nextValue;
    });
  };

  return [state, setStoredState] as const;
}

function matchesEixo<T extends RegistroComEixo>(item: T, eixoAtivo: EixoTematico) {
  return eixoAtivo === "todos" || item.eixoSlug === eixoAtivo;
}

function filterByEixo<T extends RegistroComEixo>(items: T[], eixoAtivo: EixoTematico) {
  return items.filter((item) => matchesEixo(item, eixoAtivo));
}

function countByEixo<T extends RegistroComEixo>(items: T[], eixo: EixoTematico) {
  return eixo === "todos" ? items.length : items.filter((item) => item.eixoSlug === eixo).length;
}

function formatShortNow() {
  return new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function clampNota(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.min(10, Math.max(0, value));
}

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
};

function PageShell({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <MainLayout userRole="Professor">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        transition={{ duration: 0.25 }}
        className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 sm:px-6 lg:px-8"
      >
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-sectec-700">
              {eyebrow}
            </p>
            <h1 className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {title}
            </h1>
            <p className="mt-2 break-words text-sm font-medium leading-6 text-slate-500">
              {description}
            </p>
          </div>

          {actions && <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">{actions}</div>}
        </div>

        {children}
      </motion.div>
    </MainLayout>
  );
}

function Button({
  children,
  variant = "primary",
  onClick,
  disabled = false,
  className,
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition sm:w-auto",
        variant === "primary" && "bg-sectec-700 text-white hover:bg-sectec-800",
        variant === "secondary" && "border border-slate-200 bg-white text-slate-700 hover:border-sectec-200 hover:bg-sectec-50 hover:text-sectec-700",
        variant === "danger" && "border border-red-100 bg-red-50 text-red-600 hover:bg-red-100",
        disabled && "cursor-not-allowed opacity-50 hover:bg-inherit",
        className
      )}
    >
      {children}
    </button>
  );
}

function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className={cx("min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5", className)}
    >
      {children}
    </motion.div>
  );
}

function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "green" | "yellow" | "red" | "blue" | "neutral";
}) {
  return (
    <span
      className={cx(
        "inline-flex max-w-full items-center rounded-md px-2.5 py-1 text-[11px] font-semibold",
        tone === "green" && "bg-sectec-50 text-sectec-700",
        tone === "yellow" && "bg-amber-50 text-amber-700",
        tone === "red" && "bg-red-50 text-red-600",
        tone === "blue" && "bg-sky-50 text-sky-700",
        tone === "neutral" && "bg-slate-100 text-slate-600"
      )}
    >
      {children}
    </span>
  );
}

function Notice({ message }: { message: string }) {
  if (!message) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-sectec-200 bg-sectec-50 px-4 py-3 text-sm font-semibold text-sectec-800"
    >
      {message}
    </motion.div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm font-semibold text-slate-400">
      {text}
    </div>
  );
}

function Progress({ value }: { value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs font-semibold">
        <span className="text-slate-400">andamento</span>
        <span className="text-slate-700">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="h-full rounded-full bg-sectec-600"
        />
      </div>
    </div>
  );
}

function riscoTone(risco: Risco) {
  if (risco === "alto") return "red";
  if (risco === "medio") return "yellow";
  return "green";
}

function entregaTone(status: StatusEntrega) {
  if (status === "atrasada") return "red";
  if (status === "pendente") return "yellow";
  return "green";
}

function projetoTone(status: StatusProjeto) {
  if (status === "aprovado") return "green";
  if (status === "ajustes") return "yellow";
  return "blue";
}

function projetoLabel(status: StatusProjeto) {
  if (status === "aguardando") return "analisar";
  if (status === "ajustes") return "ajustes";
  return "aprovado";
}

function mediaNota(item: NotaEquipe) {
  return ((item.pesquisa + item.prototipo + item.apresentacao + item.documentacao) / 4).toFixed(1);
}

function StatCard({
  label,
  value,
  detail,
  icon,
  tone = "green",
  className,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  tone?: "green" | "yellow" | "red" | "blue";
  className?: string;
}) {
  return (
    <Card className={cx("h-full", className)}>
      <div className="flex h-full items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
          <p
            className={cx(
              "mt-1 text-xs font-medium",
              tone === "red" && "text-red-500",
              tone === "yellow" && "text-amber-600",
              tone === "blue" && "text-sky-600",
              tone === "green" && "text-slate-400"
            )}
          >
            {detail}
          </p>
        </div>
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-sectec-50 text-sectec-700">
          {icon}
        </div>
      </div>
    </Card>
  );
}

function DetailLine({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">{label}</p>
      <div className="mt-1 break-words text-sm font-semibold text-slate-700">{value}</div>
    </div>
  );
}

function FiltroEixoBox({
  eixoAtivo,
  onChange,
  contagemPorEixo,
  title = "Filtro por eixo",
  description = "Use o dropdown para ver apenas os dados do eixo selecionado.",
}: {
  eixoAtivo: EixoTematico;
  onChange: (eixo: EixoTematico) => void;
  contagemPorEixo: (eixo: EixoTematico) => number;
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{title}</p>
        <p className="mt-1 text-sm font-medium text-slate-500">{description}</p>
      </div>
      <EixoDropdown
        eixoAtivo={eixoAtivo}
        eixosList={EIXOS_LIST}
        contagemPorEixo={contagemPorEixo}
        onChange={onChange}
      />
    </div>
  );
}

function EquipeRow({
  equipe,
  onOpen,
}: {
  equipe: Equipe;
  onOpen?: (equipe: Equipe) => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-slate-900">{equipe.nome}</h3>
            <Badge tone={riscoTone(equipe.risco)}>
              {equipe.risco === "alto" ? "risco alto" : equipe.risco === "medio" ? "acompanhar" : "em dia"}
            </Badge>
          </div>
          <p className="mt-1 text-sm font-medium leading-6 text-slate-500">{equipe.tema}</p>
          <p className="mt-2 text-xs font-semibold text-slate-400">
            {equipe.turma} · {equipe.eixo} · líder: {equipe.lider}
          </p>
        </div>

        <Button variant="secondary" onClick={() => onOpen?.(equipe)}>
          <MessageSquare size={15} />
          Abrir
        </Button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end">
        <Progress value={equipe.progresso} />
        <div className="text-xs">
          <p className="font-semibold text-slate-400">último contato</p>
          <p className="break-words font-semibold text-slate-700">{equipe.ultimoContato}</p>
        </div>
        <div className="text-xs">
          <p className="font-semibold text-slate-400">próxima orientação</p>
          <p className="break-words font-semibold text-slate-700">{equipe.proximaReuniao}</p>
        </div>
      </div>
    </div>
  );
}

function DashboardOrientador() {
  const backend = useOrientadorBackendData();
  const [eixoAtivo, setEixoAtivo] = useState<EixoTematico>("todos");
  const [equipesLocais, setEquipesLocais] = useStoredState("sectec:equipes", equipesIniciais);
  const [entregasData] = useStoredState("sectec:entregas", entregasIniciais);
  const [projetosLocais, setProjetosLocais] = useStoredState("sectec:projetos", projetosIniciais);
  const [agendaData, setAgendaData] = useStoredState("sectec:agenda", agendaInicial);
  const [aviso, setAviso] = useState("");
  const [equipeAberta, setEquipeAberta] = useState<Equipe | null>(null);
  const [contatosAtualizados, setContatosAtualizados] = useState<Record<string, string>>({});

  const equipesBase = backend.equipes ?? equipesLocais;
  const equipesData = useMemo(
    () =>
      equipesBase.map((equipe) =>
        contatosAtualizados[equipe.id] ? { ...equipe, ultimoContato: contatosAtualizados[equipe.id] } : equipe
      ),
    [contatosAtualizados, equipesBase]
  );
  const projetosData = backend.projetos ?? projetosLocais;

  const equipesFiltradas = useMemo(() => filterByEixo(equipesData, eixoAtivo), [equipesData, eixoAtivo]);
  const entregasFiltradas = useMemo(() => filterByEixo(entregasData, eixoAtivo), [entregasData, eixoAtivo]);
  const projetosFiltrados = useMemo(() => filterByEixo(projetosData, eixoAtivo), [projetosData, eixoAtivo]);
  const agendaFiltrada = useMemo(() => filterByEixo(agendaData, eixoAtivo), [agendaData, eixoAtivo]);

  const riscosAltos = equipesFiltradas.filter((equipe) => equipe.risco === "alto").length;
  const pendentes = entregasFiltradas.filter((entrega) => entrega.status === "pendente" || entrega.status === "atrasada").length;
  const aguardandoAprovacao = projetosFiltrados.filter((projeto) => projeto.status === "aguardando").length;

  function mostrarAviso(mensagem: string) {
    setAviso(mensagem);
  }

  function agendarOrientacao() {
    const equipe = equipesFiltradas[0] ?? equipesData[0];
    if (!equipe) return;

    const novoItem: AgendaItem = {
      id: `age-${Date.now()}`,
      hora: formatShortNow(),
      dia: "Hoje",
      titulo: "Orientação rápida registrada pelo painel",
      equipe: equipe.nome,
      local: "Lab 1",
      eixoSlug: equipe.eixoSlug,
    };

    setAgendaData((lista) => [novoItem, ...lista]);
    mostrarAviso(`Orientação criada para ${equipe.nome}.`);
  }

  function registrarReuniao() {
    const equipe = equipesFiltradas[0] ?? equipesData[0];
    if (!equipe) return;

    const contato = `Hoje, ${formatShortNow()}`;

    if (backend.equipes) {
      setContatosAtualizados((lista) => ({ ...lista, [equipe.id]: contato }));
    } else {
      setEquipesLocais((lista) => lista.map((item) => (item.id === equipe.id ? { ...item, ultimoContato: contato } : item)));
    }

    mostrarAviso(`Último contato atualizado para ${equipe.nome}.`);
  }

  async function atualizarProjeto(id: string, status: StatusProjeto) {
    const projeto = projetosData.find((item) => item.id === id);

    try {
      const atualizadoNoBackend = projeto ? await backend.responderProjeto(projeto, status) : false;

      if (!atualizadoNoBackend) {
        setProjetosLocais((lista) => lista.map((item) => (item.id === id ? { ...item, status } : item)));
      }

      mostrarAviso(status === "aprovado" ? "Projeto aprovado." : "Projeto marcado para ajustes.");
    } catch (error) {
      mostrarAviso(error instanceof Error ? error.message : "Não foi possível atualizar o projeto.");
    }
  }

  return (
    <PageShell
      eyebrow="Orientação SECTEC"
      title="Painel do orientador"
      description="Acompanhe equipes, aprove projetos, revise entregas e organize as orientações da feira científica."
      actions={
        <>
          <Button variant="secondary" onClick={agendarOrientacao}>
            <CalendarDays size={16} />
            Agendar orientação
          </Button>
          <Button onClick={registrarReuniao}>
            Registrar reunião
            <ArrowUpRight size={16} />
          </Button>
        </>
      }
    >
      <Notice
        message={
          aviso ||
          (backend.carregando ? "Carregando dados do backend..." : backend.erro ? `Usando dados locais: ${backend.erro}` : "")
        }
      />

      <FiltroEixoBox
        eixoAtivo={eixoAtivo}
        onChange={setEixoAtivo}
        contagemPorEixo={(eixo) => countByEixo(equipesData, eixo)}
        description="O filtro altera estatísticas, equipes, aprovações e agenda deste painel."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-10">
        <StatCard
          label="Turmas"
          value={String(new Set(equipesFiltradas.map((equipe) => equipe.turma)).size)}
          detail="turmas no filtro"
          icon={<Users size={18} />}
          className="xl:col-span-3"
        />
        <StatCard
          label="Equipes"
          value={String(equipesFiltradas.length)}
          detail="com orientação ativa"
          icon={<FolderOpen size={18} />}
          tone="blue"
          className="xl:col-span-3"
        />
        <StatCard
          label="Entregas"
          value={String(pendentes)}
          detail="aguardando revisão"
          icon={<FileText size={18} />}
          tone="yellow"
          className="xl:col-span-2"
        />
        <StatCard
          label="Riscos"
          value={String(riscosAltos)}
          detail="equipe precisa de ação"
          icon={<AlertTriangle size={18} />}
          tone="red"
          className="xl:col-span-2"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <Card className="xl:col-span-7">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Equipes orientadas</p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">Andamento e risco</h2>
            </div>
            <SlidersHorizontal className="text-slate-300" />
          </div>

          <div className="space-y-3">
            {equipesFiltradas.length > 0 ? (
              equipesFiltradas.map((equipe) => <EquipeRow key={equipe.id} equipe={equipe} onOpen={setEquipeAberta} />)
            ) : (
              <EmptyState text="Nenhuma equipe encontrada neste eixo." />
            )}
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-5 xl:col-span-5">
          {equipeAberta && (
            <Card>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Detalhes</p>
                  <h2 className="mt-1 break-words text-lg font-bold text-slate-900">{equipeAberta.nome}</h2>
                </div>
                <Button variant="secondary" onClick={() => setEquipeAberta(null)} className="w-auto sm:w-auto">
                  Fechar
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DetailLine label="Turma" value={equipeAberta.turma} />
                <DetailLine label="Eixo" value={equipeAberta.eixo} />
                <DetailLine label="Líder" value={equipeAberta.lider} />
                <DetailLine label="Integrantes" value={equipeAberta.integrantes} />
              </div>
            </Card>
          )}

          <Card>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Aprovação</p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">Projetos enviados</h2>
              </div>
              <Badge tone="blue">{aguardandoAprovacao} novo</Badge>
            </div>

            <div className="space-y-3">
              {projetosFiltrados.length > 0 ? (
                projetosFiltrados.map((projeto) => (
                  <div key={projeto.id} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words font-semibold leading-5 text-slate-900">{projeto.titulo}</p>
                        <p className="mt-1 break-words text-xs font-medium text-slate-500">
                          {projeto.equipe} · {projeto.turma}
                        </p>
                      </div>
                      <Badge tone={projetoTone(projeto.status)}>{projetoLabel(projeto.status)}</Badge>
                    </div>
                    <p className="mt-3 text-xs font-semibold text-slate-400">enviado em {projeto.enviadoEm}</p>
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <Button variant="secondary" onClick={() => atualizarProjeto(projeto.id, "ajustes")}>
                        <Send size={15} />
                        Ajustes
                      </Button>
                      <Button onClick={() => atualizarProjeto(projeto.id, "aprovado")}>
                        <Check size={15} />
                        Aprovar
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState text="Nenhum projeto enviado neste eixo." />
              )}
            </div>
          </Card>

          <Card>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Agenda</p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">Próximas orientações</h2>
              </div>
              <Clock3 className="text-slate-300" />
            </div>

            <div className="space-y-4">
              {agendaFiltrada.length > 0 ? (
                agendaFiltrada.slice(0, 4).map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 shrink-0">
                      <p className="text-sm font-bold text-slate-900">{item.hora}</p>
                      <p className="text-xs font-semibold text-slate-400">{item.dia}</p>
                    </div>
                    <div className="min-w-0 flex-1 border-l border-slate-200 pl-4">
                      <p className="font-semibold leading-5 text-slate-900">{item.titulo}</p>
                      <p className="mt-1 text-sm font-medium text-slate-500">
                        {item.equipe} · {item.local}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState text="Sem orientação marcada neste eixo." />
              )}
            </div>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

export function TurmasOrientador() {
  const backend = useOrientadorBackendData();
  const [eixoAtivo, setEixoAtivo] = useState<EixoTematico>("todos");
  const [equipesLocais] = useStoredState("sectec:equipes", equipesIniciais);
  const equipesData = backend.equipes ?? equipesLocais;
  const equipesFiltradas = useMemo(() => filterByEixo(equipesData, eixoAtivo), [equipesData, eixoAtivo]);

  return (
    <PageShell
      eyebrow="Turmas"
      title="Minhas turmas"
      description="Resumo das turmas vinculadas, quantidade de equipes, alunos envolvidos e pendências de orientação."
      actions={
        <Button onClick={() => setEixoAtivo("todos")}>
          <Plus size={16} />
          Ver todas
        </Button>
      }
    >
      <Notice
        message={
          backend.carregando ? "Carregando dados do backend..." : backend.erro ? `Usando dados locais: ${backend.erro}` : ""
        }
      />

      <FiltroEixoBox
        eixoAtivo={eixoAtivo}
        onChange={setEixoAtivo}
        contagemPorEixo={(eixo) => countByEixo(equipesData, eixo)}
        description="Filtra o mapa de orientação e recalcula os dados das turmas pelo eixo."
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-12">
        {turmas.map((turma, index) => {
          const equipesDaTurma = equipesFiltradas.filter((equipe) => equipe.turma === turma.nome);
          const pendencias = equipesDaTurma.filter((equipe) => equipe.risco !== "baixo").length;
          const mediaProgresso = equipesDaTurma.length
            ? Math.round(equipesDaTurma.reduce((total, equipe) => total + equipe.progresso, 0) / equipesDaTurma.length)
            : 0;

          return (
            <Card
              key={turma.id}
              className={cx(
                "h-full",
                index === 0 && "xl:col-span-5",
                index === 1 && "xl:col-span-4",
                index === 2 && "xl:col-span-3"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="break-words text-lg font-bold text-slate-900">{turma.nome}</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-400">{turma.turno}</p>
                </div>
                <Badge tone={pendencias > 1 ? "yellow" : "green"}>{pendencias} pendências</Badge>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
                <div>
                  <p className="text-2xl font-bold text-slate-900">{turma.alunos}</p>
                  <p className="text-xs font-semibold text-slate-400">alunos</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{equipesDaTurma.length}</p>
                  <p className="text-xs font-semibold text-slate-400">equipes</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{mediaProgresso}%</p>
                  <p className="text-xs font-semibold text-slate-400">média</p>
                </div>
              </div>

              <div className="mt-5">
                <Progress value={mediaProgresso} />
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Mapa de orientação</p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">Equipes por turma</h2>
          </div>
          <Search className="text-slate-300" />
        </div>

        <div className="space-y-3">
          {equipesFiltradas.length > 0 ? (
            equipesFiltradas.map((equipe) => <EquipeRow key={equipe.id} equipe={equipe} />)
          ) : (
            <EmptyState text="Nenhuma equipe encontrada para este filtro." />
          )}
        </div>
      </Card>
    </PageShell>
  );
}

export function EntregasOrientador() {
  const [filtro, setFiltro] = useState<"todas" | StatusEntrega>("todas");
  const [eixoAtivo, setEixoAtivo] = useState<EixoTematico>("todos");
  const [entregasData, setEntregasData] = useStoredState("sectec:entregas", entregasIniciais);
  const [aviso, setAviso] = useState("");

  const entregasPorEixo = useMemo(() => filterByEixo(entregasData, eixoAtivo), [entregasData, eixoAtivo]);
  const entregasFiltradas = useMemo(() => {
    if (filtro === "todas") return entregasPorEixo;
    return entregasPorEixo.filter((entrega) => entrega.status === filtro);
  }, [entregasPorEixo, filtro]);

  function revisarEntrega(id: string) {
    setEntregasData((lista) => lista.map((entrega) => (entrega.id === id ? { ...entrega, status: "revisada" } : entrega)));
    setAviso("Entrega marcada como revisada.");
  }

  function marcarLoteRevisado() {
    const idsVisiveis = new Set(entregasFiltradas.map((entrega) => entrega.id));
    const total = entregasFiltradas.filter((entrega) => entrega.status !== "revisada").length;

    if (!total) {
      setAviso("Não há entregas pendentes neste filtro.");
      return;
    }

    setEntregasData((lista) =>
      lista.map((entrega) => (idsVisiveis.has(entrega.id) ? { ...entrega, status: "revisada" } : entrega))
    );
    setAviso(`${total} entrega(s) marcada(s) como revisadas.`);
  }

  return (
    <PageShell
      eyebrow="Entregas"
      title="Arquivos para revisar"
      description="Fila de relatórios, protótipos, banners e evidências enviados pelas equipes."
      actions={
        <Button variant="secondary" onClick={marcarLoteRevisado}>
          <CheckCircle2 size={16} />
          Marcar lote revisado
        </Button>
      }
    >
      <Notice message={aviso} />

      <FiltroEixoBox
        eixoAtivo={eixoAtivo}
        onChange={setEixoAtivo}
        contagemPorEixo={(eixo) => countByEixo(entregasData, eixo)}
        description="Filtra a fila de entregas pelo eixo temático do projeto."
      />

      <Card>
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Revisão</p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">Fila de entregas</h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {(["todas", "pendente", "atrasada", "revisada"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFiltro(item)}
                className={cx(
                  "rounded-md px-3 py-1.5 text-xs font-semibold transition",
                  filtro === item
                    ? "bg-sectec-700 text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-sectec-50 hover:text-sectec-700"
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {entregasFiltradas.length === 0 ? (
          <EmptyState text="Nenhuma entrega encontrada neste filtro." />
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              <AnimatePresence mode="popLayout">
                {entregasFiltradas.map((entrega) => (
                  <motion.div
                    key={entrega.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="rounded-lg border border-slate-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-start gap-2">
                          <FileText size={16} className="mt-0.5 shrink-0 text-slate-400" />
                          <p className="break-all font-semibold text-slate-900">{entrega.arquivo}</p>
                        </div>
                        <p className="mt-2 break-words text-sm font-medium text-slate-500">{entrega.equipe}</p>
                      </div>
                      <Badge tone={entregaTone(entrega.status)}>{entrega.status}</Badge>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <DetailLine label="Aluno" value={entrega.aluno} />
                      <DetailLine label="Etapa" value={entrega.etapa} />
                      <DetailLine label="Turma" value={entrega.turma} />
                      <DetailLine label="Data" value={entrega.data} />
                    </div>

                    <Button
                      variant="secondary"
                      disabled={entrega.status === "revisada"}
                      onClick={() => revisarEntrega(entrega.id)}
                      className="mt-4"
                    >
                      <Check size={15} />
                      Revisar
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[920px] border-separate border-spacing-0 text-left">
                <thead>
                  <tr className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    <th className="border-b border-slate-200 py-3">Arquivo</th>
                    <th className="border-b border-slate-200 py-3">Equipe</th>
                    <th className="border-b border-slate-200 py-3">Aluno</th>
                    <th className="border-b border-slate-200 py-3">Etapa</th>
                    <th className="border-b border-slate-200 py-3">Data</th>
                    <th className="border-b border-slate-200 py-3">Status</th>
                    <th className="border-b border-slate-200 py-3 text-right">Ação</th>
                  </tr>
                </thead>

                <tbody>
                  <AnimatePresence mode="popLayout">
                    {entregasFiltradas.map((entrega) => (
                      <motion.tr
                        key={entrega.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-sm"
                      >
                        <td className="border-b border-slate-100 py-4 font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            <FileText size={16} className="text-slate-400" />
                            {entrega.arquivo}
                          </div>
                        </td>
                        <td className="border-b border-slate-100 py-4 text-slate-600">{entrega.equipe}</td>
                        <td className="border-b border-slate-100 py-4 text-slate-600">{entrega.aluno}</td>
                        <td className="border-b border-slate-100 py-4 text-slate-600">{entrega.etapa}</td>
                        <td className="border-b border-slate-100 py-4 text-slate-500">{entrega.data}</td>
                        <td className="border-b border-slate-100 py-4">
                          <Badge tone={entregaTone(entrega.status)}>{entrega.status}</Badge>
                        </td>
                        <td className="border-b border-slate-100 py-4 text-right">
                          <Button
                            variant="secondary"
                            disabled={entrega.status === "revisada"}
                            onClick={() => revisarEntrega(entrega.id)}
                          >
                            <Check size={15} />
                            Revisar
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </PageShell>
  );
}

export function AgendaOrientador() {
  const [eixoAtivo, setEixoAtivo] = useState<EixoTematico>("todos");
  const [agendaData, setAgendaData] = useStoredState("sectec:agenda", agendaInicial);
  const [equipesData] = useStoredState("sectec:equipes", equipesIniciais);
  const [aviso, setAviso] = useState("");

  const agendaFiltrada = useMemo(() => filterByEixo(agendaData, eixoAtivo), [agendaData, eixoAtivo]);

  function novoHorario() {
    const equipe = filterByEixo(equipesData, eixoAtivo)[0] ?? equipesData[0];
    if (!equipe) return;

    const novoItem: AgendaItem = {
      id: `age-${Date.now()}`,
      hora: formatShortNow(),
      dia: "Hoje",
      titulo: "Novo horário de orientação",
      equipe: equipe.nome,
      local: "Lab 1",
      eixoSlug: equipe.eixoSlug,
    };

    setAgendaData((lista) => [novoItem, ...lista]);
    setAviso(`Novo horário criado para ${equipe.nome}.`);
  }

  function removerHorario(id: string) {
    setAgendaData((lista) => lista.filter((item) => item.id !== id));
    setAviso("Horário removido da agenda.");
  }

  return (
    <PageShell
      eyebrow="Agenda"
      title="Orientações da semana"
      description="Planeje horários, locais e assuntos de cada reunião com as equipes."
      actions={
        <Button onClick={novoHorario}>
          <CalendarDays size={16} />
          Novo horário
        </Button>
      }
    >
      <Notice message={aviso} />

      <FiltroEixoBox
        eixoAtivo={eixoAtivo}
        onChange={setEixoAtivo}
        contagemPorEixo={(eixo) => countByEixo(agendaData, eixo)}
        description="Mostra somente os horários do eixo selecionado."
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-12">
        {diasAgenda.map((dia, index) => {
          const reunioes = agendaFiltrada.filter((item) => item.dia.startsWith(dia));

          return (
            <Card
              key={dia}
              className={cx(
                "xl:min-h-72",
                index === 0 && "xl:col-span-3",
                index === 1 && "xl:col-span-2",
                index === 2 && "xl:col-span-3",
                index === 3 && "xl:col-span-2",
                index === 4 && "xl:col-span-2"
              )}
            >
              <h2 className="font-bold text-slate-900">{dia}</h2>
              <div className="mt-4 space-y-3">
                {reunioes.length > 0 ? (
                  reunioes.map((item) => (
                    <div key={item.id} className="rounded-lg border border-slate-200 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold text-sectec-700">{item.hora}</p>
                          <p className="mt-1 break-words text-sm font-semibold leading-5 text-slate-900">{item.equipe}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removerHorario(item.id)}
                          className="rounded-lg p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-500"
                          aria-label="Remover horário"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <p className="mt-1 break-words text-xs font-medium text-slate-500">{item.titulo}</p>
                      <p className="mt-2 text-xs font-semibold text-slate-400">{item.local}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm font-medium text-slate-400">
                    Sem orientação marcada.
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </PageShell>
  );
}

export function AvaliacoesOrientador() {
  const [eixoAtivo, setEixoAtivo] = useState<EixoTematico>("todos");
  const [notasData, setNotasData] = useStoredState("sectec:notas", notasIniciais);
  const [aviso, setAviso] = useState("");

  const notasFiltradas = useMemo(() => filterByEixo(notasData, eixoAtivo), [notasData, eixoAtivo]);

  function atualizarNota(equipe: string, campo: keyof Pick<NotaEquipe, "pesquisa" | "prototipo" | "apresentacao" | "documentacao">, valor: number) {
    setNotasData((lista) => lista.map((item) => (item.equipe === equipe ? { ...item, [campo]: clampNota(valor) } : item)));
  }

  return (
    <PageShell
      eyebrow="Avaliação"
      title="Notas e rubrica"
      description="Lance notas por critério e mantenha a avaliação consistente para todas as equipes."
      actions={
        <Button onClick={() => setAviso("Notas salvas no armazenamento local do navegador.")}>
          <Save size={16} />
          Salvar notas
        </Button>
      }
    >
      <Notice message={aviso} />

      <FiltroEixoBox
        eixoAtivo={eixoAtivo}
        onChange={setEixoAtivo}
        contagemPorEixo={(eixo) => countByEixo(notasData, eixo)}
        description="Filtra as notas das equipes por eixo temático."
      />

      <Card>
        {notasFiltradas.length === 0 ? (
          <EmptyState text="Nenhuma avaliação encontrada neste eixo." />
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {notasFiltradas.map((item) => (
                <div key={item.equipe} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="break-words font-bold text-slate-900">{item.equipe}</h3>
                      <p className="mt-1 break-words text-sm font-medium text-slate-500">{item.turma}</p>
                    </div>
                    <Badge tone="green">{mediaNota(item)}</Badge>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {([
                      ["Pesquisa", "pesquisa", item.pesquisa],
                      ["Protótipo", "prototipo", item.prototipo],
                      ["Apresentação", "apresentacao", item.apresentacao],
                      ["Documentação", "documentacao", item.documentacao],
                    ] as const).map(([label, campo, valor]) => (
                      <label key={campo} className="min-w-0 space-y-1">
                        <span className="block break-words text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">
                          {label}
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={10}
                          step={0.1}
                          value={valor}
                          onChange={(event) => atualizarNota(item.equipe, campo, Number(event.target.value))}
                          className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-sectec-600 focus:ring-2 focus:ring-sectec-100"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[860px] border-separate border-spacing-0 text-left">
                <thead>
                  <tr className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    <th className="border-b border-slate-200 py-3">Equipe</th>
                    <th className="border-b border-slate-200 py-3">Turma</th>
                    <th className="border-b border-slate-200 py-3">Pesquisa</th>
                    <th className="border-b border-slate-200 py-3">Protótipo</th>
                    <th className="border-b border-slate-200 py-3">Apresentação</th>
                    <th className="border-b border-slate-200 py-3">Documentação</th>
                    <th className="border-b border-slate-200 py-3">Média</th>
                  </tr>
                </thead>
                <tbody>
                  {notasFiltradas.map((item) => (
                    <tr key={item.equipe} className="text-sm">
                      <td className="border-b border-slate-100 py-4 font-bold text-slate-900">{item.equipe}</td>
                      <td className="border-b border-slate-100 py-4 text-slate-600">{item.turma}</td>
                      {([
                        ["pesquisa", item.pesquisa],
                        ["prototipo", item.prototipo],
                        ["apresentacao", item.apresentacao],
                        ["documentacao", item.documentacao],
                      ] as const).map(([campo, valor]) => (
                        <td key={campo} className="border-b border-slate-100 py-4">
                          <input
                            type="number"
                            min={0}
                            max={10}
                            step={0.1}
                            value={valor}
                            onChange={(event) => atualizarNota(item.equipe, campo, Number(event.target.value))}
                            className="h-9 w-20 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-sectec-600 focus:ring-2 focus:ring-sectec-100"
                          />
                        </td>
                      ))}
                      <td className="border-b border-slate-100 py-4">
                        <Badge tone="green">{mediaNota(item)}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-12">
        {rubrica.map(([titulo, texto], index) => (
          <Card
            key={titulo}
            className={cx(
              index === 0 && "xl:col-span-3",
              index === 1 && "xl:col-span-5",
              index === 2 && "xl:col-span-2",
              index === 3 && "xl:col-span-2"
            )}
          >
            <ClipboardCheck className="mb-4 text-sectec-600" />
            <h3 className="font-bold text-slate-900">{titulo}</h3>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-500">{texto}</p>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}

export function ConfigOrientador() {
  const [perfil, setPerfil] = useStoredState("sectec:perfil", perfilInicial);
  const [regras, setRegras] = useStoredState("sectec:regras", regrasIniciais);
  const [alertas, setAlertas] = useStoredState("sectec:alertas", alertasIniciais);
  const [aviso, setAviso] = useState("");

  return (
    <PageShell
      eyebrow="Sistema"
      title="Configurações do orientador"
      description="Preferências de perfil, regras da feira e alertas importantes do acompanhamento."
      actions={
        <Button onClick={() => setAviso("Configurações salvas no navegador.")}>
          <Save size={16} />
          Salvar alterações
        </Button>
      }
    >
      <Notice message={aviso} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <Card className="lg:col-span-8 xl:col-span-7">
          <div className="mb-6 flex items-center gap-3">
            <Settings2 className="text-sectec-600" />
            <h2 className="text-lg font-bold text-slate-900">Perfil do orientador</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Nome</span>
              <input
                value={perfil.nome}
                onChange={(event) => setPerfil((valor) => ({ ...valor, nome: event.target.value }))}
                className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-sectec-600 focus:ring-2 focus:ring-sectec-100"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Área</span>
              <input
                value={perfil.area}
                onChange={(event) => setPerfil((valor) => ({ ...valor, area: event.target.value }))}
                className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-sectec-600 focus:ring-2 focus:ring-sectec-100"
              />
            </label>
            <label className="space-y-2 sm:col-span-2">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Bio curta</span>
              <textarea
                rows={4}
                value={perfil.bio}
                onChange={(event) => setPerfil((valor) => ({ ...valor, bio: event.target.value }))}
                className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-medium outline-none focus:border-sectec-600 focus:ring-2 focus:ring-sectec-100"
              />
            </label>
          </div>
        </Card>

        <Card className="lg:col-span-4 xl:col-span-5">
          <div className="mb-6 flex items-center gap-3">
            <CheckCircle2 className="text-sectec-600" />
            <h2 className="text-lg font-bold text-slate-900">Regras da feira</h2>
          </div>

          <div className="space-y-3">
            {regras.map((item) => (
              <label key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-4">
                <span className="min-w-0 break-words text-sm font-semibold text-slate-700">{item.texto}</span>
                <input
                  type="checkbox"
                  checked={item.ativo}
                  onChange={() =>
                    setRegras((lista) => lista.map((regra) => (regra.id === item.id ? { ...regra, ativo: !regra.ativo } : regra)))
                  }
                  className="h-4 w-4 accent-sectec-700"
                />
              </label>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Alertas</p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">Notificações importantes</h2>
          </div>
          <BarChart3 className="text-slate-300" />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {alertas.map((alerta) => (
            <button
              type="button"
              key={alerta.id}
              onClick={() =>
                setAlertas((lista) => lista.map((item) => (item.id === alerta.id ? { ...item, ativo: !item.ativo } : item)))
              }
              className={cx(
                "rounded-lg border p-4 text-left transition",
                alerta.ativo ? "border-sectec-200 bg-sectec-50" : "border-slate-200 bg-white hover:bg-slate-50"
              )}
            >
              <div className="mb-3 flex items-center gap-2">
                <Check size={17} className={alerta.ativo ? "text-sectec-600" : "text-slate-300"} />
                <h3 className="font-bold text-slate-900">{alerta.titulo}</h3>
              </div>
              <p className="text-sm font-medium leading-6 text-slate-500">{alerta.texto}</p>
              <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                {alerta.ativo ? "ativo" : "desativado"}
              </p>
            </button>
          ))}
        </div>
      </Card>
    </PageShell>
  );
}

export default DashboardOrientador;
