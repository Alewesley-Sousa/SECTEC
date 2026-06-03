import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Check,
  ChevronDown,
  Download,
  Clock3,
  FileText,
  FolderOpen,
  Save,
  Search,
  SlidersHorizontal,
  Trash2,
  Users,
  X,
} from "lucide-react";
import Swal from "sweetalert2";

import { MainLayout } from "../componentes/SideBarUniversal";
import ConfigPerfil from "../componentes/configurações/config";
import {
  EIXOS_LIST,
  type EixoTematico,
} from "../componentes/EixoDropdown";
import { API_BASE_URL, apiRequest } from "../lib/api";

type EixoProjeto = Exclude<EixoTematico, "todos">;
type Risco = "alto" | "medio" | "baixo";
type StatusEntrega = "pendente" | "revisada" | "recusada";
type StatusProjeto = "aguardando" | "aprovado" | "ajustes";
type FiltroSolicitacao = "pendentes" | "reprovadas" | "todas";

type RegistroComEixo = {
  eixoSlug: EixoProjeto;
  temaId?: number;
};

type Equipe = RegistroComEixo & {
  id: string;
  projetoId?: number;
  nome: string;
  turma: string;
  turmaNome: string;
  ano: string;
  eixo: string;
  tema: string;
  lider: string;
  integrantes: number;
  integrantesNomes: string[];
  risco: Risco;
  dataOrdenacao: number;
};

type Entrega = RegistroComEixo & {
  id: string;
  projetoId?: number;
  materialId?: number;
  tipo: MaterialApi["tipo"] | "pdf_avulso";
  conteudo?: string;
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
  projetoId?: number;
  orientacaoId?: number;
  titulo: string;
  equipe: string;
  turma: string;
  enviadoEm: string;
  status: StatusProjeto;
  motivoRecusa?: string | null;
};

type UsuarioProjetoApi = {
  id: number | string;
  nome: string;
  ano?: number;
  turma?: string | null;
};

type ProjetoApi = {
  id: number;
  titulo: string;
  descricao?: string;
  temaId?: number;
  tema?: TemaOrientadorApi;
  criadoEm?: string;
  evento?: {
    id: number;
    titulo?: string;
  };
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
  motivoRecusa?: string | null;
  projeto?: ProjetoApi;
};

type MaterialApi = {
  id: number;
  tipo: "pdf" | "pdf_relatorio" | "link";
  status: "em_analise" | "aprovado" | "recusado";
  conteudo: string;
  opiniao?: string;
  criadoEm?: string;
  projeto?: ProjetoApi;
};

type ProjetoComMateriaisApi = ProjetoApi & {
  materiais?: MaterialApi[];
};

type AvaliarMaterialResponse = {
  mensagem: string;
  material: MaterialApi;
};

type PdfApi = {
  fileId: number;
  materialId?: number;
  projetoId: number;
  originalName?: string;
  status?: string;
  enviadoEm?: string;
};

type TemaOrientadorApi = {
  id: number;
  nome: string;
};

type EventoAtualApi = {
  id: number;
  titulo: string;
  temas?: TemaOrientadorApi[];
};

const eixosProjeto = EIXOS_LIST.filter((eixo): eixo is EixoProjeto => eixo !== "todos");
const MIN_TEMAS_ORIENTADOR = 4;

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function eixoFromTemaId(temaId?: number): EixoProjeto {
  if (!temaId || temaId < 1) return "tecnologia";
  return eixosProjeto[(temaId - 1) % eixosProjeto.length];
}

function temaIdFromProjeto(projeto?: ProjetoApi) {
  return projeto?.temaId ?? projeto?.tema?.id;
}

function temaNomeFromProjeto(projeto?: ProjetoApi) {
  return projeto?.tema?.nome ?? (temaIdFromProjeto(projeto) ? `Tema #${temaIdFromProjeto(projeto)}` : "Tema não informado");
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

function anoFromProjeto(projeto?: ProjetoApi) {
  const ano = projeto?.alunoAutor?.ano ?? projeto?.projetoAlunos?.find((item) => item.aluno?.ano)?.aluno?.ano;
  return ano ? `${ano}º ano` : "Ano não informado";
}

function turmaNomeFromProjeto(projeto?: ProjetoApi) {
  const turma =
    projeto?.alunoAutor?.turma ?? projeto?.projetoAlunos?.find((item) => item.aluno?.turma)?.aluno?.turma;
  return turma ?? "Turma não informada";
}

function turmaFromProjeto(projeto?: ProjetoApi) {
  const ano = projeto?.alunoAutor?.ano ?? projeto?.projetoAlunos?.find((item) => item.aluno?.ano)?.aluno?.ano;
  const turma =
    projeto?.alunoAutor?.turma ?? projeto?.projetoAlunos?.find((item) => item.aluno?.turma)?.aluno?.turma;

  if (ano && turma) return `${ano}º ano - ${turma}`;
  if (ano) return `${ano}º ano`;
  if (turma) return turma;
  return "Turma não informada";
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

function integrantesNomesFromProjeto(projeto?: ProjetoApi) {
  const integrantes = new Map<string | number, string>();

  if (projeto?.alunoAutor?.id && projeto.alunoAutor.nome) {
    integrantes.set(projeto.alunoAutor.id, projeto.alunoAutor.nome);
  }

  projeto?.projetoAlunos?.forEach((item) => {
    if (item.aluno?.id && item.aluno.nome) {
      integrantes.set(item.aluno.id, item.aluno.nome);
    }
  });

  return Array.from(integrantes.values());
}

function dateWeight(value?: string | null) {
  if (!value) return 0;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
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

function mapOrientacaoToProjeto(orientacao: OrientacaoApi): Projeto {
  const projeto = orientacao.projeto;
  const temaId = temaIdFromProjeto(projeto);
  const eixoSlug = eixoFromTemaId(temaId);

  return {
    id: `orientacao-${orientacao.id}`,
    projetoId: projeto?.id,
    orientacaoId: orientacao.id,
    titulo: projeto?.titulo ?? "Projeto sem título",
    equipe: liderFromProjeto(projeto),
    turma: turmaFromProjeto(projeto),
    enviadoEm: formatBackendDate(orientacao.criadoEm),
    status: statusProjetoFromOrientacao(orientacao.status),
    motivoRecusa: orientacao.motivoRecusa,
    eixoSlug,
    temaId,
  };
}

function mapProjetoToOrientacao(projeto: ProjetoApi): OrientacaoApi {
  return {
    id: projeto.id,
    status: "aceito",
    criadoEm: projeto.criadoEm,
    respondidoEm: null,
    projeto,
  };
}

function orientacaoProjetoKey(orientacao: OrientacaoApi) {
  return orientacao.projeto?.id ? `projeto-${orientacao.projeto.id}` : `orientacao-${orientacao.id}`;
}

function orientacaoStatusWeight(status: OrientacaoApi["status"]) {
  if (status === "aceito") return 3;
  if (status === "pendente") return 2;
  return 1;
}

function dedupeOrientacoes(orientacoes: OrientacaoApi[]) {
  const mapa = new Map<string, OrientacaoApi>();

  orientacoes.forEach((orientacao) => {
    const key = orientacaoProjetoKey(orientacao);
    const atual = mapa.get(key);

    if (!atual || orientacaoStatusWeight(orientacao.status) > orientacaoStatusWeight(atual.status)) {
      mapa.set(key, orientacao);
    }
  });

  return Array.from(mapa.values());
}

function mapOrientacaoToEquipe(orientacao: OrientacaoApi): Equipe {
  const projeto = orientacao.projeto;
  const temaId = temaIdFromProjeto(projeto);
  const eixoSlug = eixoFromTemaId(temaId);
  const lider = liderFromProjeto(projeto);

  return {
    id: `orientacao-${orientacao.id}`,
    projetoId: projeto?.id,
    nome: projeto?.titulo ?? "Projeto sem título",
    turma: turmaFromProjeto(projeto),
    turmaNome: turmaNomeFromProjeto(projeto),
    ano: anoFromProjeto(projeto),
    eixo: temaNomeFromProjeto(projeto),
    eixoSlug,
    tema: projeto?.descricao ?? "Descrição não informada",
    lider,
    integrantes: integrantesFromProjeto(projeto),
    integrantesNomes: integrantesNomesFromProjeto(projeto),
    risco: riscoFromOrientacao(orientacao.status),
    dataOrdenacao: Math.max(
      dateWeight(orientacao.respondidoEm),
      dateWeight(orientacao.criadoEm),
      dateWeight(projeto?.criadoEm)
    ),
    temaId,
  };
}

function materialStatusToEntregaStatus(status: MaterialApi["status"]): StatusEntrega {
  if (status === "aprovado") return "revisada";
  if (status === "recusado") return "recusada";
  return "pendente";
}

function materialEtapa(tipo: MaterialApi["tipo"]) {
  if (tipo === "pdf_relatorio") return "Relatório final";
  if (tipo === "pdf") return "Banner";
  return "Link de vídeo";
}

function materialArquivo(material: MaterialApi) {
  if (!material.conteudo) return materialEtapa(material.tipo);

  const partes = material.conteudo.split("/");
  return partes.at(-1) || material.conteudo;
}

function mapMaterialToEntrega(material: MaterialApi, orientacao: OrientacaoApi): Entrega {
  const projeto = orientacao.projeto;
  const temaId = temaIdFromProjeto(projeto);
  const eixoSlug = eixoFromTemaId(temaId);

  return {
    id: `material-${material.id}`,
    projetoId: projeto?.id,
    materialId: material.id,
    tipo: material.tipo,
    conteudo: material.conteudo,
    arquivo: materialArquivo(material),
    equipe: projeto?.titulo ?? "Projeto sem título",
    turma: turmaFromProjeto(projeto),
    aluno: liderFromProjeto(projeto),
    etapa: materialEtapa(material.tipo),
    data: formatBackendDate(material.criadoEm),
    status: materialStatusToEntregaStatus(material.status),
    eixoSlug,
    temaId,
  };
}

function mapPdfToEntrega(pdf: PdfApi, orientacao: OrientacaoApi): Entrega {
  const projeto = orientacao.projeto;
  const temaId = temaIdFromProjeto(projeto);
  const eixoSlug = eixoFromTemaId(temaId);

  return {
    id: `pdf-${pdf.fileId}`,
    projetoId: projeto?.id,
    materialId: pdf.materialId,
    tipo: "pdf_avulso",
    arquivo: pdf.originalName ?? `PDF #${pdf.fileId}`,
    equipe: projeto?.titulo ?? "Projeto sem título",
    turma: turmaFromProjeto(projeto),
    aluno: liderFromProjeto(projeto),
    etapa: "PDF do projeto",
    data: formatBackendDate(pdf.enviadoEm),
    status: pdf.status === "VALID" || pdf.status === "aprovado" ? "revisada" : "pendente",
    eixoSlug,
    temaId,
  };
}

function mapProjetoPendenteToEntregas(projeto: ProjetoComMateriaisApi): Entrega[] {
  const orientacao = mapProjetoToOrientacao(projeto);
  return (projeto.materiais ?? []).map((material) => mapMaterialToEntrega(material, orientacao));
}

function mapMaterialOrientadoToEntrega(material: MaterialApi): Entrega {
  return mapMaterialToEntrega(material, mapProjetoToOrientacao(material.projeto ?? {
    id: 0,
    titulo: "Projeto não informado",
  }));
}

function useOrientadorBackendData() {
  const [orientacoes, setOrientacoes] = useState<OrientacaoApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let active = true;

    async function carregar() {
      setCarregando(true);

      try {
        const [todasResult, pendentesResult] = await Promise.allSettled([
          apiRequest<OrientacaoApi[]>("/orientacoes"),
          apiRequest<OrientacaoApi[]>("/orientacoes/pendentes"),
        ]);
        if (!active) return;

        if (todasResult.status === "rejected" && pendentesResult.status === "rejected") {
          throw todasResult.reason;
        }

        const todas = todasResult.status === "fulfilled" ? todasResult.value : [];
        const pendentes = pendentesResult.status === "fulfilled" ? pendentesResult.value : [];
        setOrientacoes(dedupeOrientacoes([...todas, ...pendentes]));
        setErro(pendentesResult.status === "rejected" ? "Orientações carregadas; pendentes dedicadas não puderam ser consultadas." : "");
      } catch (error) {
        try {
          const projetos = await apiRequest<ProjetoApi[]>("/projetos");
          if (!active) return;
          setOrientacoes(dedupeOrientacoes(projetos.map(mapProjetoToOrientacao)));
          setErro("O servidor publicado não tem /orientacoes; usando /projetos. Aceitar/recusar orientação fica sem backend.");
        } catch (fallbackError) {
          if (!active) return;
          setOrientacoes([]);
          setErro(
            fallbackError instanceof Error
              ? fallbackError.message
              : error instanceof Error
                ? error.message
                : "Não foi possível carregar dados do orientador no backend."
          );
        }
      } finally {
        if (active) setCarregando(false);
      }
    }

    carregar();

    return () => {
      active = false;
    };
  }, []);

  const equipes = useMemo(
    () =>
      orientacoes
        .filter((orientacao) => orientacao.status === "aceito")
        .map(mapOrientacaoToEquipe)
        .sort((a, b) => b.dataOrdenacao - a.dataOrdenacao),
    [orientacoes]
  );
  const projetos = useMemo(() => orientacoes.map(mapOrientacaoToProjeto), [orientacoes]);

  async function responderProjeto(projeto: Projeto, status: StatusProjeto, motivoRecusa?: string) {
    if (!projeto.orientacaoId) {
      throw new Error("Sem endpoint no backend publicado para aceitar ou recusar orientações.");
    }

    const action = status === "aprovado" ? "aceito" : "recusado";
    const orientacaoAtualizada = await apiRequest<OrientacaoApi>(`/orientacoes/${projeto.orientacaoId}/responder`, {
      method: "PATCH",
      body: action === "recusado" ? { action, motivoRecusa } : { action },
    });

    setOrientacoes((lista) =>
      dedupeOrientacoes(
        lista.map((orientacao) =>
          orientacao.id === orientacaoAtualizada.id
            ? { ...orientacao, ...orientacaoAtualizada, projeto: orientacaoAtualizada.projeto ?? orientacao.projeto }
            : orientacao
        )
      )
    );

    return true;
  }

  async function buscarProjetoDetalhe(projetoId: number) {
    return apiRequest<ProjetoApi>(`/projetos/${projetoId}`);
  }

  return { orientacoes, equipes, projetos, carregando, erro, responderProjeto, buscarProjetoDetalhe };
}

function useTemasOrientadorData() {
  const [temas, setTemas] = useState<TemaOrientadorApi[]>([]);
  const [selecionadosIds, setSelecionadosIds] = useState<number[]>([]);
  const [eventoTitulo, setEventoTitulo] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let active = true;

    async function carregar() {
      setCarregando(true);

      try {
        const evento = await apiRequest<EventoAtualApi | null>("/evento/atual/vigente");
        let temasSelecionadosIds: number[] = [];

        try {
          const temasOrientador = await apiRequest<TemaOrientadorApi[]>("/evento/orientador/meus-temas");
          temasSelecionadosIds = temasOrientador.map((tema) => tema.id);
        } catch {
          temasSelecionadosIds = [];
        }

        if (!active) return;
        const temasEvento = evento?.temas ?? [];
        const todosTemasIds = temasEvento.map((tema) => tema.id);
        setTemas(temasEvento);
        setSelecionadosIds(temasSelecionadosIds.length > 0 ? temasSelecionadosIds : todosTemasIds);
        setEventoTitulo(evento?.titulo ?? "");
        setErro("");
      } catch (error) {
        if (!active) return;
        setTemas([]);
        setSelecionadosIds([]);
        setEventoTitulo("");
        setErro(error instanceof Error ? error.message : "Não foi possível carregar os eixos temáticos do evento atual.");
      } finally {
        if (active) setCarregando(false);
      }
    }

    carregar();

    return () => {
      active = false;
    };
  }, []);

  async function salvar(novosSelecionadosIds: number[]) {
    setSalvando(true);

    try {
      await apiRequest("/evento/temas/sincronizar", {
        method: "POST",
        body: { temasIds: novosSelecionadosIds },
      });
      setSelecionadosIds(novosSelecionadosIds);
      setErro("");
    } finally {
      setSalvando(false);
    }
  }

  return {
    temas,
    selecionadosIds,
    setSelecionadosIds,
    eventoTitulo,
    carregando,
    salvando,
    erro,
    salvar,
  };
}

function useEntregasBackendData(orientacoes: OrientacaoApi[], orientacoesCarregando: boolean) {
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let active = true;

    async function carregar() {
      if (orientacoesCarregando) return;

      setCarregando(true);

      try {
        const materiaisOrientados = await apiRequest<MaterialApi[]>("/materiais/projetos-orientados");
        if (!active) return;

        setEntregas(materiaisOrientados.map(mapMaterialOrientadoToEntrega));
        setErro("");
        setCarregando(false);
        return;
      } catch {
        // Fallback para backends antigos que ainda não possuem a rota com todos os materiais.
      }

      try {
        const projetosPendentes = await apiRequest<ProjetoComMateriaisApi[]>("/materiais/pendentes-orientador");
        if (!active) return;

        setEntregas(projetosPendentes.flatMap(mapProjetoPendenteToEntregas));
        setErro("");
        setCarregando(false);
        return;
      } catch {
        // Fallback final para rotas antigas por projeto.
      }

      const orientacoesAceitas = orientacoes.filter((orientacao) => orientacao.status === "aceito" && orientacao.projeto?.id);

      if (orientacoesAceitas.length === 0) {
        setEntregas([]);
        setErro("");
        setCarregando(false);
        return;
      }

      const respostas = await Promise.allSettled(
        orientacoesAceitas.map(async (orientacao) => {
          try {
            const materiais = await apiRequest<MaterialApi[]>(`/materiais/projeto/${orientacao.projeto?.id}`);
            return materiais.map((material) => mapMaterialToEntrega(material, orientacao));
          } catch {
            const pdf = await apiRequest<PdfApi>(`/pdf/projeto/${orientacao.projeto?.id}`);
            return [mapPdfToEntrega(pdf, orientacao)];
          }
        })
      );

      if (!active) return;

      const entregasCarregadas = respostas.flatMap((resposta) => (resposta.status === "fulfilled" ? resposta.value : []));
      const falhas = respostas.filter((resposta) => resposta.status === "rejected").length;

      setEntregas(entregasCarregadas);
      setErro(falhas ? "Algumas entregas não puderam ser carregadas pela rota antiga de materiais." : "");
      setCarregando(false);
    }

    carregar();

    return () => {
      active = false;
    };
  }, [orientacoes, orientacoesCarregando]);

  async function revisarEntrega(entrega: Entrega, status: "aprovado" | "recusado" = "aprovado", opiniao?: string) {
    if (!entrega.materialId) {
      throw new Error("Sem endpoint no backend publicado para revisar esta entrega.");
    }

    const resposta = await apiRequest<AvaliarMaterialResponse>(`/materiais/${entrega.materialId}/avaliar`, {
      method: "PATCH",
      body: status === "aprovado" ? { decisao: "APROVAR" } : { decisao: "RECUSAR", opiniao },
    });
    const atualizado = resposta.material;

    setEntregas((lista) =>
      lista.map((item) =>
        item.materialId === atualizado.id ? { ...item, status: materialStatusToEntregaStatus(atualizado.status) } : item
      )
    );
  }

  return { entregas, carregando, erro, revisarEntrega };
}

function filterByTemasSelecionados<T extends RegistroComEixo>(items: T[], temasIds: number[], totalTemas = temasIds.length) {
  if (totalTemas > 0 && temasIds.length === 0) return [];
  if (totalTemas > 0 && temasIds.length >= totalTemas) return items;
  return items.filter((item) => item.temaId !== undefined && temasIds.includes(item.temaId));
}

function countByTema<T extends RegistroComEixo>(items: T[], temaId: number) {
  return items.filter((item) => item.temaId === temaId).length;
}

function filterByTemaAtivo<T extends RegistroComEixo>(items: T[], temaAtivoId: number | "todos") {
  if (temaAtivoId === "todos") return items;
  return items.filter((item) => item.temaId === temaAtivoId);
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
    <MainLayout userRole="orientador">
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

function mostrarAvisoOrientador({
  tipo,
  titulo,
  texto,
}: {
  tipo: "success" | "error" | "warning";
  titulo: string;
  texto?: string;
}) {
  void Swal.fire({
    icon: tipo,
    title: titulo,
    text: texto,
    confirmButtonColor: "#15803d",
    showConfirmButton: tipo !== "success",
    timer: tipo === "success" ? 1500 : undefined,
    timerProgressBar: tipo === "success",
  });
}

async function solicitarJustificativaReprovacao(titulo: string, texto: string) {
  const resultado = await Swal.fire({
    title: titulo,
    text: texto,
    input: "textarea",
    inputPlaceholder: "Descreva o motivo para o aluno...",
    inputAttributes: {
      "aria-label": "Justificativa da reprovação",
    },
    showCancelButton: true,
    confirmButtonText: "Reprovar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#b91c1c",
    cancelButtonColor: "#475569",
    background: "#ffffff",
    color: "#0f172a",
    customClass: {
      popup: "rounded-xl border border-slate-200 shadow-xl",
      title: "text-slate-900",
      htmlContainer: "text-slate-500",
      input: "rounded-lg border-slate-200 text-sm focus:border-sectec-600 focus:ring-sectec-100",
      confirmButton: "rounded-lg",
      cancelButton: "rounded-lg",
    },
    inputValidator: (value) => {
      if (!value?.trim()) return "Informe a justificativa antes de reprovar.";
      return undefined;
    },
  });

  if (!resultado.isConfirmed) return undefined;
  return typeof resultado.value === "string" ? resultado.value.trim() : undefined;
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm font-semibold text-slate-400">
      {text}
    </div>
  );
}

function entregaTone(status: StatusEntrega) {
  if (status === "recusada") return "red";
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
  if (status === "ajustes") return "reprovado";
  return "aprovado";
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

function TemasChecklist({
  temas,
  selecionadosIds,
  eventoTitulo,
  carregando,
  salvando,
  contagemPorTema,
  onChange,
  onSave,
}: {
  temas: TemaOrientadorApi[];
  selecionadosIds: number[];
  eventoTitulo: string;
  carregando: boolean;
  salvando: boolean;
  contagemPorTema: (temaId: number) => number;
  onChange: (ids: number[]) => void;
  onSave: () => void;
}) {
  const [modalAberto, setModalAberto] = useState(false);
  const precisaMaisTemas = temas.length > 0 && selecionadosIds.length < MIN_TEMAS_ORIENTADOR;

  function toggleTema(temaId: number) {
    if (selecionadosIds.includes(temaId) && selecionadosIds.length <= MIN_TEMAS_ORIENTADOR) return;

    onChange(
      selecionadosIds.includes(temaId)
        ? selecionadosIds.filter((id) => id !== temaId)
        : [...selecionadosIds, temaId]
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Eixos temáticos</p>
          <h2 className="mt-1 text-lg font-bold text-slate-900">
            {selecionadosIds.length} eixo(s) ativo(s)
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {eventoTitulo ? `Evento atual: ${eventoTitulo}` : "Eixos carregados pelo evento atual."} Selecione no mínimo {MIN_TEMAS_ORIENTADOR} eixos para orientar.
          </p>
        </div>

        <Button onClick={() => setModalAberto(true)} disabled={carregando}>
          <SlidersHorizontal size={16} />
          Eixos temáticos
        </Button>
      </div>

      <AnimatePresence>
        {modalAberto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4 py-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl"
            >
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Eixos temáticos</p>
                  <h2 className="mt-1 text-lg font-bold text-slate-900">Eixos que o professor orienta</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Fechar eixos temáticos"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-5">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {carregando ? (
                    <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm font-semibold text-slate-400 sm:col-span-2">
                      Carregando eixos do evento atual...
                    </div>
                  ) : temas.length > 0 ? (
                    temas.map((tema) => {
                      const ativo = selecionadosIds.includes(tema.id);

                      return (
                        <label
                          key={tema.id}
                          className={cx(
                            "flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition",
                            ativo
                              ? "border-sectec-300 bg-sectec-50 text-sectec-800"
                              : "border-slate-200 bg-white text-slate-600 hover:border-sectec-200 hover:bg-sectec-50"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={ativo}
                            disabled={ativo && selecionadosIds.length <= MIN_TEMAS_ORIENTADOR}
                            onChange={() => toggleTema(tema.id)}
                            className="h-4 w-4 shrink-0 accent-sectec-700"
                          />
                          <span className="min-w-0 flex-1 break-words text-sm font-semibold">{tema.nome}</span>
                          <span className="rounded-md bg-white px-2 py-1 text-xs font-bold text-slate-500">
                            {contagemPorTema(tema.id)}
                          </span>
                        </label>
                      );
                    })
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm font-semibold text-slate-400 sm:col-span-2">
                      Nenhum eixo temático veio do evento atual.
                    </div>
                  )}
                </div>
                {precisaMaisTemas ? (
                  <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
                    Selecione pelo menos {MIN_TEMAS_ORIENTADOR} eixos temáticos para salvar.
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-2 border-t border-slate-100 p-5 sm:flex-row sm:justify-end">
                <Button variant="secondary" onClick={() => onChange(temas.map((tema) => tema.id))} disabled={carregando || salvando}>
                  Todos
                </Button>
                <Button
                  onClick={() => {
                    onSave();
                    if (!precisaMaisTemas) setModalAberto(false);
                  }}
                  disabled={carregando || salvando || temas.length === 0 || precisaMaisTemas}
                >
                  <Save size={16} />
                  {salvando ? "Salvando" : "Salvar temas"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function FiltroTemaOrientador({
  temas,
  temaAtivoId,
  contagemPorTema,
  onChange,
}: {
  temas: TemaOrientadorApi[];
  temaAtivoId: number | "todos";
  contagemPorTema: (temaId: number | "todos") => number;
  onChange: (temaId: number | "todos") => void;
}) {
  if (temas.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Filtro por tema</p>
        <p className="mt-1 text-sm font-medium text-slate-500">
          Aparecem aqui somente os temas que ficaram marcados para o orientador.
        </p>
      </div>
      <select
        value={String(temaAtivoId)}
        onChange={(event) => {
          const value = event.target.value;
          onChange(value === "todos" ? "todos" : Number(value));
        }}
        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-sectec-600 focus:ring-2 focus:ring-sectec-100 sm:w-72"
      >
        <option value="todos">Todos ({contagemPorTema("todos")})</option>
        {temas.map((tema) => (
          <option key={tema.id} value={tema.id}>
            {tema.nome} ({contagemPorTema(tema.id)})
          </option>
        ))}
      </select>
    </div>
  );
}

function ProjetoDetalheCard({
  projeto,
  carregando,
  erro,
  onClose,
}: {
  projeto: ProjetoApi | null;
  carregando: boolean;
  erro: string;
  onClose: () => void;
}) {
  if (!projeto && !carregando && !erro) return null;

  const integrantes = integrantesNomesFromProjeto(projeto ?? undefined);

  return (
    <Card>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Detalhe do backend</p>
          <h2 className="mt-1 break-words text-lg font-bold text-slate-900">
            {carregando ? "Carregando projeto..." : projeto?.titulo ?? "Projeto"}
          </h2>
        </div>
        <Button variant="secondary" onClick={onClose} className="w-auto sm:w-auto">
          Fechar
        </Button>
      </div>

      {erro ? (
        <EmptyState text={erro} />
      ) : carregando ? (
        <EmptyState text="Buscando /projetos/:id no backend..." />
      ) : projeto ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <DetailLine label="Título" value={projeto.titulo} />
          <DetailLine label="Aluno autor" value={projeto.alunoAutor?.nome ?? "Não informado"} />
          <DetailLine label="Turma" value={turmaFromProjeto(projeto)} />
          <DetailLine label="Tema" value={temaNomeFromProjeto(projeto)} />
          <DetailLine label="Evento" value={projeto.evento?.titulo ?? projeto.evento?.id ?? "Não informado"} />
          <DetailLine label="Criado em" value={formatBackendDate(projeto.criadoEm)} />
          <div className="sm:col-span-2">
            <DetailLine label="Descrição" value={projeto.descricao || "Sem descrição cadastrada"} />
          </div>
          <div className="sm:col-span-2">
            <DetailLine
              label="Integrantes"
              value={
                integrantes.length > 0 ? (
                  <ul className="space-y-2">
                    {integrantes.map((nome) => (
                      <li
                        key={nome}
                        title={nome}
                        className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700"
                      >
                        {nome}
                      </li>
                    ))}
                  </ul>
                ) : (
                  "Nenhum integrante extra retornado"
                )
              }
            />
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function EquipeCollapseCard({
  equipe,
  onDetalhes,
  compacta = false,
}: {
  equipe: Equipe;
  onDetalhes?: (projetoId?: number) => void;
  compacta?: boolean;
}) {
  const [aberta, setAberta] = useState(false);

  return (
    <div className="self-start rounded-lg border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setAberta((valor) => !valor)}
        className="flex w-full flex-col gap-3 p-4 text-left sm:flex-row sm:items-start sm:justify-between"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <ChevronDown
              size={17}
              className={cx("shrink-0 text-slate-400 transition", aberta && "rotate-180")}
            />
            <h3 className="break-words font-bold text-slate-900">{equipe.nome}</h3>
          </div>
          <p className="mt-1 break-words text-sm font-medium leading-6 text-slate-500">{equipe.tema}</p>
          <p className="mt-2 text-xs font-semibold text-slate-400">
            {equipe.turma} · {equipe.eixo} · líder: {equipe.lider}
          </p>
        </div>
        <Badge tone="blue">{equipe.integrantes} integrante(s)</Badge>
      </button>

      <AnimatePresence initial={false}>
        {aberta ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-slate-100"
          >
            <div className="space-y-4 p-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Participantes</p>
                {equipe.integrantesNomes.length > 0 ? (
                  <ul className="mt-2 space-y-2">
                    {(compacta ? equipe.integrantesNomes.slice(0, 4) : equipe.integrantesNomes).map((nome) => (
                      <li
                        key={nome}
                        className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700"
                      >
                        {nome}
                      </li>
                    ))}
                    {compacta && equipe.integrantesNomes.length > 4 ? (
                      <li className="px-3 py-1 text-xs font-semibold text-slate-400">
                        +{equipe.integrantesNomes.length - 4} participante(s)
                      </li>
                    ) : null}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm font-semibold text-slate-400">Participantes não retornados pelo backend.</p>
                )}
              </div>

              {!compacta ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <DetailLine label="Turma" value={equipe.turma} />
                  <DetailLine label="Tema" value={equipe.eixo} />
                </div>
              ) : null}

              {onDetalhes ? (
                <Button variant="secondary" onClick={() => onDetalhes(equipe.projetoId)}>
                  <Search size={15} />
                  Detalhes
                </Button>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function DashboardOrientador() {
  const backend = useOrientadorBackendData();
  const temasBackend = useTemasOrientadorData();
  const [turmaFiltro, setTurmaFiltro] = useState("todas");
  const [temaFiltro, setTemaFiltro] = useState<number | "todos">("todos");
  const [filtroSolicitacao, setFiltroSolicitacao] = useState<FiltroSolicitacao>("pendentes");
  const [projetoDetalhe, setProjetoDetalhe] = useState<ProjetoApi | null>(null);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);
  const [erroDetalhe, setErroDetalhe] = useState("");
  const equipesData = backend.equipes;
  const projetosData = backend.projetos;
  const temasSelecionados = useMemo(
    () => temasBackend.temas.filter((tema) => temasBackend.selecionadosIds.includes(tema.id)),
    [temasBackend.selecionadosIds, temasBackend.temas]
  );

  useEffect(() => {
    if (temaFiltro !== "todos" && !temasBackend.selecionadosIds.includes(temaFiltro)) {
      setTemaFiltro("todos");
    }
  }, [temaFiltro, temasBackend.selecionadosIds]);

  const equipesPorTemasSelecionados = useMemo(
    () => filterByTemasSelecionados(equipesData, temasBackend.selecionadosIds, temasBackend.temas.length),
    [equipesData, temasBackend.selecionadosIds, temasBackend.temas.length]
  );
  const projetosPorTemasSelecionados = useMemo(
    () => filterByTemasSelecionados(projetosData, temasBackend.selecionadosIds, temasBackend.temas.length),
    [projetosData, temasBackend.selecionadosIds, temasBackend.temas.length]
  );
  const equipesFiltradas = useMemo(
    () => filterByTemaAtivo(equipesPorTemasSelecionados, temaFiltro),
    [equipesPorTemasSelecionados, temaFiltro]
  );
  const projetosPorTema = useMemo(
    () => filterByTemaAtivo(projetosPorTemasSelecionados, temaFiltro),
    [projetosPorTemasSelecionados, temaFiltro]
  );
  const turmasSolicitacoes = useMemo(
    () => Array.from(new Set(projetosPorTema.map((projeto) => projeto.turma))).sort(),
    [projetosPorTema]
  );
  const projetosParaAnalise = useMemo(
    () =>
      projetosPorTema.filter((projeto) => {
        const bateTurma = turmaFiltro === "todas" || projeto.turma === turmaFiltro;
        const bateStatus =
          filtroSolicitacao === "todas" ||
          (filtroSolicitacao === "pendentes" && projeto.status === "aguardando") ||
          (filtroSolicitacao === "reprovadas" && projeto.status === "ajustes");

        return bateTurma && bateStatus;
      }),
    [filtroSolicitacao, projetosPorTema, turmaFiltro]
  );

  const riscosAltos = equipesFiltradas.filter((equipe) => equipe.risco === "alto").length;
  const solicitacoesPendentes = projetosPorTema.filter((projeto) => projeto.status === "aguardando").length;
  const solicitacoesAprovadas = projetosPorTema.filter((projeto) => projeto.status === "aprovado").length;
  const solicitacoesReprovadas = projetosPorTema.filter((projeto) => projeto.status === "ajustes").length;
  const aguardandoAprovacao = projetosParaAnalise.filter((projeto) => projeto.status === "aguardando").length;
  const eixosSelecionadosLabel =
    temasBackend.selecionadosIds.length > 0
      ? `${temasBackend.selecionadosIds.length} eixo(s) selecionado(s)`
      : "nenhum eixo selecionado";
  const avisoEixos =
    !temasBackend.carregando && temasBackend.temas.length > 0 && temasBackend.selecionadosIds.length < MIN_TEMAS_ORIENTADOR
      ? `Você precisa selecionar no mínimo ${MIN_TEMAS_ORIENTADOR} eixos temáticos para orientar.`
      : "";

  async function atualizarProjeto(id: string, status: StatusProjeto) {
    const projeto = projetosData.find((item) => item.id === id);
    let motivoRecusa: string | undefined;

    if (status === "ajustes") {
      motivoRecusa = await solicitarJustificativaReprovacao(
        "Reprovar projeto",
        "Informe o motivo da recusa. Essa mensagem ficará visível para a equipe."
      );
      if (!motivoRecusa) {
        return;
      }
    }

    try {
      if (!projeto) return;
      await backend.responderProjeto(projeto, status, motivoRecusa);

      mostrarAvisoOrientador({
        tipo: "success",
        titulo: status === "aprovado" ? "Solicitação aceita" : "Solicitação recusada",
        texto:
          status === "aprovado"
            ? "Você agora orienta este projeto."
            : "A equipe poderá visualizar o motivo da recusa.",
      });
    } catch (error) {
      mostrarAvisoOrientador({
        tipo: "error",
        titulo: "Não foi possível responder",
        texto: error instanceof Error ? error.message : "Não foi possível atualizar o projeto.",
      });
    }
  }

  async function salvarTemas() {
    if (temasBackend.temas.length > 0 && temasBackend.selecionadosIds.length < MIN_TEMAS_ORIENTADOR) {
      mostrarAvisoOrientador({
        tipo: "warning",
        titulo: "Selecione mais eixos",
        texto: `Selecione pelo menos ${MIN_TEMAS_ORIENTADOR} eixos temáticos para orientar.`,
      });
      return;
    }

    try {
      await temasBackend.salvar(temasBackend.selecionadosIds);
      mostrarAvisoOrientador({
        tipo: "success",
        titulo: "Temas salvos",
        texto: "Seus eixos de orientação foram atualizados.",
      });
    } catch (error) {
      mostrarAvisoOrientador({
        tipo: "error",
        titulo: "Não foi possível salvar",
        texto: error instanceof Error ? error.message : "Não foi possível salvar os temas do orientador.",
      });
    }
  }

  async function abrirDetalheProjeto(projetoId?: number) {
    if (!projetoId) {
      setErroDetalhe("Este item não veio do backend com ID de projeto.");
      setProjetoDetalhe(null);
      return;
    }

    setCarregandoDetalhe(true);
    setErroDetalhe("");

    try {
      const detalhe = await backend.buscarProjetoDetalhe(projetoId);
      setProjetoDetalhe(detalhe);
    } catch (error) {
      setProjetoDetalhe(null);
      setErroDetalhe(error instanceof Error ? error.message : "Não foi possível carregar os detalhes do projeto.");
    } finally {
      setCarregandoDetalhe(false);
    }
  }

  function fecharDetalheProjeto() {
    setProjetoDetalhe(null);
    setErroDetalhe("");
    setCarregandoDetalhe(false);
  }

  return (
    <PageShell
      eyebrow="Orientação SECTEC"
      title="Painel do orientador"
      description="Consulte solicitações, equipes e selecione os eixos temáticos que você orienta."
      actions={
        <>
          <Button
            variant="secondary"
            onClick={() => {
              setTurmaFiltro("todas");
              setTemaFiltro("todos");
              setFiltroSolicitacao("todas");
            }}
          >
            <SlidersHorizontal size={16} />
            Limpar filtros
          </Button>
          <Button onClick={() => setFiltroSolicitacao("pendentes")}>
            <Search size={16} />
            Ver pendentes
          </Button>
        </>
      }
    >
      <Notice message={avisoEixos} />

      <TemasChecklist
        temas={temasBackend.temas}
        selecionadosIds={temasBackend.selecionadosIds}
        eventoTitulo={temasBackend.eventoTitulo}
        carregando={temasBackend.carregando}
        salvando={temasBackend.salvando}
        contagemPorTema={(temaId) => countByTema(projetosData, temaId)}
        onChange={temasBackend.setSelecionadosIds}
        onSave={salvarTemas}
      />

      <FiltroTemaOrientador
        temas={temasSelecionados}
        temaAtivoId={temaFiltro}
        contagemPorTema={(temaId) => (temaId === "todos" ? projetosPorTemasSelecionados.length : countByTema(projetosPorTemasSelecionados, temaId))}
        onChange={setTemaFiltro}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Pendentes"
          value={String(solicitacoesPendentes)}
          detail="solicitações para analisar"
          icon={<Clock3 size={18} />}
          tone="yellow"
        />
        <StatCard
          label="Orientando"
          value={String(equipesFiltradas.length)}
          detail={eixosSelecionadosLabel}
          icon={<FolderOpen size={18} />}
          tone="blue"
        />
        <StatCard
          label="Atenção"
          value={String(riscosAltos + solicitacoesReprovadas)}
          detail={`${riscosAltos} equipe(s) e ${solicitacoesReprovadas} solicitação(ões)`}
          icon={<Users size={18} />}
          tone="red"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <Card>
          <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Solicitações</p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">Projetos para consultar</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                {aguardandoAprovacao} pendente(s), {solicitacoesAprovadas} aprovado(s)
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[180px_minmax(0,1fr)]">
              <label className="min-w-0 space-y-2">
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Turma</span>
                <select
                  value={turmaFiltro}
                  onChange={(event) => setTurmaFiltro(event.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-sectec-600 focus:ring-2 focus:ring-sectec-100"
                >
                  <option value="todas">Todas</option>
                  {turmasSolicitacoes.map((turma) => (
                    <option key={turma} value={turma}>
                      {turma}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex flex-wrap items-end gap-2">
                {([
                  ["pendentes", "Pendentes"],
                  ["reprovadas", "Reprovadas"],
                  ["todas", "Todas"],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFiltroSolicitacao(value)}
                    className={cx(
                      "h-10 rounded-lg px-4 text-sm font-semibold transition",
                      filtroSolicitacao === value
                        ? "bg-sectec-700 text-white"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-sectec-200 hover:bg-sectec-50 hover:text-sectec-700"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {projetosParaAnalise.length > 0 ? (
              projetosParaAnalise.map((projeto) => (
                <div key={projeto.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="break-words font-semibold leading-5 text-slate-900">{projeto.titulo}</p>
                        <Badge tone={projetoTone(projeto.status)}>{projetoLabel(projeto.status)}</Badge>
                      </div>
                      <p className="mt-1 break-words text-sm font-medium text-slate-500">
                        {projeto.equipe} · {projeto.turma} · enviado em {projeto.enviadoEm}
                      </p>
                      {projeto.status === "ajustes" && projeto.motivoRecusa ? (
                        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                          Motivo da recusa: {projeto.motivoRecusa}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button variant="secondary" onClick={() => abrirDetalheProjeto(projeto.projetoId)}>
                        <Search size={15} />
                        Detalhes
                      </Button>
                      {projeto.status === "aguardando" ? (
                        <>
                          <Button variant="secondary" onClick={() => atualizarProjeto(projeto.id, "ajustes")}>
                            <Trash2 size={15} />
                            Reprovar
                          </Button>
                          <Button onClick={() => atualizarProjeto(projeto.id, "aprovado")}>
                            <Check size={15} />
                            Aprovar
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState text="Nenhum projeto encontrado para estes filtros." />
            )}
          </div>
        </Card>

        <div className="grid grid-cols-1 content-start gap-5">
          <ProjetoDetalheCard
            projeto={projetoDetalhe}
            carregando={carregandoDetalhe}
            erro={erroDetalhe}
            onClose={fecharDetalheProjeto}
          />

          <Card>
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Equipes</p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">Minhas equipes</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">Aceitas recentemente.</p>
              </div>
              <Badge tone="blue">{equipesFiltradas.length}</Badge>
            </div>

            {equipesFiltradas.length > 0 ? (
              <div className="space-y-3">
                {equipesFiltradas.slice(0, 4).map((equipe) => (
                  <EquipeCollapseCard key={equipe.id} equipe={equipe} onDetalhes={abrirDetalheProjeto} compacta />
                ))}
              </div>
            ) : (
              <EmptyState text="Nenhuma equipe aprovada para estes temas." />
            )}
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

export function TurmasOrientador() {
  const backend = useOrientadorBackendData();
  const equipesData = backend.equipes;
  const [temaFiltro, setTemaFiltro] = useState<number | "todos">("todos");
  const [turmaFiltro, setTurmaFiltro] = useState("todas");
  const [anoFiltro, setAnoFiltro] = useState("todos");

  const temasDisponiveis = useMemo(() => {
    const mapa = new Map<number, string>();
    equipesData.forEach((equipe) => {
      if (equipe.temaId) mapa.set(equipe.temaId, equipe.eixo);
    });
    return Array.from(mapa.entries())
      .map(([id, nome]) => ({ id, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [equipesData]);
  const turmasDisponiveis = useMemo(
    () => Array.from(new Set(equipesData.map((equipe) => equipe.turmaNome))).sort(),
    [equipesData]
  );
  const anosDisponiveis = useMemo(
    () => Array.from(new Set(equipesData.map((equipe) => equipe.ano))).sort(),
    [equipesData]
  );
  const equipesFiltradas = useMemo(
    () =>
      equipesData.filter((equipe) => {
        const bateTema = temaFiltro === "todos" || equipe.temaId === temaFiltro;
        const bateTurma = turmaFiltro === "todas" || equipe.turmaNome === turmaFiltro;
        const bateAno = anoFiltro === "todos" || equipe.ano === anoFiltro;

        return bateTema && bateTurma && bateAno;
      }),
    [anoFiltro, equipesData, temaFiltro, turmaFiltro]
  );

  return (
    <PageShell
      eyebrow="Turmas"
      title="Minhas turmas"
      description="Resumo das turmas vinculadas, quantidade de equipes e alunos envolvidos."
    >
      <Card>
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Filtros</p>
          <h2 className="mt-1 text-lg font-bold text-slate-900">Filtrar equipes</h2>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Tema</span>
            <select
              value={String(temaFiltro)}
              onChange={(event) => {
                const value = event.target.value;
                setTemaFiltro(value === "todos" ? "todos" : Number(value));
              }}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-sectec-600 focus:ring-2 focus:ring-sectec-100"
            >
              <option value="todos">Todos</option>
              {temasDisponiveis.map((tema) => (
                <option key={tema.id} value={tema.id}>
                  {tema.nome}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Turma</span>
            <select
              value={turmaFiltro}
              onChange={(event) => setTurmaFiltro(event.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-sectec-600 focus:ring-2 focus:ring-sectec-100"
            >
              <option value="todas">Todas</option>
              {turmasDisponiveis.map((turma) => (
                <option key={turma} value={turma}>
                  {turma}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Ano</span>
            <select
              value={anoFiltro}
              onChange={(event) => setAnoFiltro(event.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-sectec-600 focus:ring-2 focus:ring-sectec-100"
            >
              <option value="todos">Todos</option>
              {anosDisponiveis.map((ano) => (
                <option key={ano} value={ano}>
                  {ano}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      <Card>
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Mapa de orientação</p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">Equipes por turma</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">{equipesFiltradas.length} equipe(s) encontrada(s)</p>
          </div>
          <Search className="text-slate-300" />
        </div>

        <div>
          {equipesFiltradas.length > 0 ? (
            <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
              {equipesFiltradas.map((equipe) => (
                <EquipeCollapseCard key={equipe.id} equipe={equipe} />
              ))}
            </div>
          ) : (
            <EmptyState text="Nenhuma equipe encontrada." />
          )}
        </div>
      </Card>
    </PageShell>
  );
}

export function EntregasOrientador() {
  const backend = useOrientadorBackendData();
  const entregasBackend = useEntregasBackendData(backend.orientacoes, backend.carregando);
  const [filtro, setFiltro] = useState<"todas" | StatusEntrega>("todas");
  const [gruposAbertos, setGruposAbertos] = useState<string[]>([]);
  const entregasData = entregasBackend.entregas;

  const entregasFiltradas = useMemo(() => {
    if (filtro === "todas") return entregasData;
    return entregasData.filter((entrega) => entrega.status === filtro);
  }, [entregasData, filtro]);
  const gruposEntrega = useMemo(() => {
    const mapa = new Map<string, { id: string; equipe: string; turma: string; aluno: string; entregas: Entrega[] }>();

    entregasFiltradas.forEach((entrega) => {
      const id = entrega.projetoId ? `projeto-${entrega.projetoId}` : `sem-projeto-${entrega.equipe}`;
      const grupo = mapa.get(id) ?? {
        id,
        equipe: entrega.equipe,
        turma: entrega.turma,
        aluno: entrega.aluno,
        entregas: [],
      };

      grupo.entregas.push(entrega);
      mapa.set(id, grupo);
    });

    return Array.from(mapa.values());
  }, [entregasFiltradas]);

  function toggleGrupo(grupoId: string) {
    setGruposAbertos((atuais) =>
      atuais.includes(grupoId) ? atuais.filter((id) => id !== grupoId) : [...atuais, grupoId]
    );
  }

  function abrirArquivo(entrega: Entrega) {
    if (entrega.tipo === "link" && entrega.conteudo) {
      window.open(entrega.conteudo, "_blank", "noopener,noreferrer");
      return;
    }

    if (!entrega.projetoId || !entrega.materialId) return;
    window.open(`${API_BASE_URL}/files/download/projeto/${entrega.projetoId}/material/${entrega.materialId}`, "_blank", "noopener,noreferrer");
  }

  function podeAbrirArquivo(entrega: Entrega) {
    if (entrega.tipo === "link") return Boolean(entrega.conteudo);
    return Boolean(entrega.projetoId && entrega.materialId);
  }

  async function revisarEntrega(id: string, status: "aprovado" | "recusado" = "aprovado") {
    const entrega = entregasData.find((item) => item.id === id);
    if (!entrega) return;

    let opiniao: string | undefined;
    if (status === "recusado") {
      opiniao = await solicitarJustificativaReprovacao(
        "Reprovar entrega",
        "Informe a orientação para a equipe corrigir o arquivo enviado."
      );
      if (!opiniao) {
        return;
      }
    }

    try {
      await entregasBackend.revisarEntrega(entrega, status, opiniao);
      mostrarAvisoOrientador({
        tipo: "success",
        titulo: status === "aprovado" ? "Material aprovado" : "Material recusado",
        texto:
          status === "aprovado"
            ? "A equipe poderá acompanhar a aprovação do material."
            : "A equipe poderá visualizar a orientação de correção.",
      });
    } catch (error) {
      mostrarAvisoOrientador({
        tipo: "error",
        titulo: "Não foi possível avaliar",
        texto: error instanceof Error ? error.message : "Não foi possível avaliar a entrega.",
      });
    }
  }

  return (
    <PageShell
      eyebrow="Entregas"
      title="Arquivos para revisar"
      description="Fila de relatórios, protótipos, banners e evidências enviados pelas equipes."
    >
      <Card>
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Revisão</p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">Fila de entregas</h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {(["todas", "pendente", "recusada", "revisada"] as const).map((item) => (
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

        {gruposEntrega.length === 0 ? (
          <EmptyState text="Nenhuma entrega encontrada neste filtro." />
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {gruposEntrega.map((grupo) => {
                const aberto = gruposAbertos.includes(grupo.id);
                const pendentes = grupo.entregas.filter((entrega) => entrega.status === "pendente").length;

                return (
                  <motion.div
                    key={grupo.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="rounded-lg border border-slate-200"
                  >
                    <button
                      type="button"
                      onClick={() => toggleGrupo(grupo.id)}
                      className="flex w-full flex-col gap-3 p-4 text-left sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <ChevronDown
                            size={17}
                            className={cx("shrink-0 text-slate-400 transition", aberto && "rotate-180")}
                          />
                          <h3 className="break-words font-bold text-slate-900">{grupo.equipe}</h3>
                        </div>
                        <p className="mt-1 break-words text-sm font-medium text-slate-500">
                          {grupo.aluno} · {grupo.turma}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge tone="blue">{grupo.entregas.length} arquivo(s)</Badge>
                        {pendentes > 0 ? <Badge tone="yellow">{pendentes} pendente(s)</Badge> : null}
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {aberto ? (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden border-t border-slate-100"
                        >
                          <div className="space-y-3 p-4">
                            {grupo.entregas.map((entrega) => (
                              <div key={entrega.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                  <div className="min-w-0">
                                    <div className="flex items-start gap-2">
                                      <FileText size={16} className="mt-0.5 shrink-0 text-slate-400" />
                                      <p className="break-all font-semibold text-slate-900">{entrega.arquivo}</p>
                                    </div>
                                    <p className="mt-2 text-sm font-medium text-slate-500">
                                      {entrega.etapa} · enviado em {entrega.data}
                                    </p>
                                  </div>
                                  <Badge tone={entregaTone(entrega.status)}>{entrega.status}</Badge>
                                </div>

                                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                                  <Button
                                    variant="secondary"
                                    disabled={!podeAbrirArquivo(entrega)}
                                    onClick={() => abrirArquivo(entrega)}
                                  >
                                    <Download size={15} />
                                    {entrega.tipo === "link" ? "Abrir link" : "Baixar"}
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    disabled={entrega.status !== "pendente"}
                                    onClick={() => revisarEntrega(entrega.id, "aprovado")}
                                  >
                                    <Check size={15} />
                                    Aprovar
                                  </Button>
                                  <Button
                                    variant="danger"
                                    disabled={entrega.status !== "pendente"}
                                    onClick={() => revisarEntrega(entrega.id, "recusado")}
                                  >
                                    <X size={15} />
                                    Reprovar
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </Card>
    </PageShell>
  );
}

export function ConfigOrientador() {
  return <ConfigPerfil userRole="orientador" />;
}

export default DashboardOrientador;
