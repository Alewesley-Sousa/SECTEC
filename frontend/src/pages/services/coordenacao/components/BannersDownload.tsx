// src/pages/coordenacao/components/BannersDownload.tsx
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    ArrowLeft,
    Download,
    FileWarning,
    FolderKanban,
    Info,
    Loader2,
    RefreshCw,
    X,
} from "lucide-react";
import Swal from "sweetalert2";
import { apiRequest, API_BASE_URL } from "../../../../lib/api";

type ValidacaoResponse = {
    incluidos: number;
    faltando: {
        total: number;
        primeiros: string[];
        restante: number;
    };
};

export default function BannersDownload({
    aberto,
    onClose,
}: {
    aberto: boolean;
    onClose: () => void;
}) {
    const [cursoFiltro, setCursoFiltro] = useState("");
    const [serieFiltro, setSerieFiltro] = useState("");
    const [validacao, setValidacao] = useState<ValidacaoResponse | null>(null);
    const [carregandoValidacao, setCarregandoValidacao] = useState(false);
    const [baixando, setBaixando] = useState(false);

    const cursos = ["informatica", "contabilidade", "enfermagem"];
    const series = ["1", "2", "3"];

    async function validarBanners() {
        setCarregandoValidacao(true);
        setValidacao(null);

        try {
            const params = new URLSearchParams();
            if (cursoFiltro) params.append("curso", cursoFiltro);
            if (serieFiltro) params.append("serie", serieFiltro);

            const data = await apiRequest<ValidacaoResponse>(
                `/coordenador/banners/validar?${params.toString()}`
            );
            setValidacao(data);
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Erro ao validar banners",
                text: error instanceof Error ? error.message : "Tente novamente.",
                confirmButtonColor: "#15803d",
            });
        } finally {
            setCarregandoValidacao(false);
        }
    }

    async function baixarBanners() {
        if (validacao && validacao.faltando.total > 0) {
            const result = await Swal.fire({
                icon: "warning",
                title: "Projetos sem banner",
                html: `
          <div style="text-align:left; font-size:14px;">
            <p><strong>${validacao.faltando.total} projeto(s)</strong> não possuem banner aprovado e serão ignorados.</p>
            ${validacao.faltando.primeiros.length > 0 ? `
              <p style="margin-top:8px;"><strong>Primeiros:</strong></p>
              <ul style="padding-left:18px; margin-top:4px;">
                ${validacao.faltando.primeiros.map(p => `<li>${p}</li>`).join("")}
              </ul>
            ` : ""}
            ${validacao.faltando.restante > 0 ? `
              <p style="margin-top:8px;">... e mais <strong>${validacao.faltando.restante}</strong> projeto(s).</p>
            ` : ""}
            <p style="margin-top:12px;">Deseja continuar com o download mesmo assim?</p>
          </div>
        `,
                showCancelButton: true,
                confirmButtonText: "Sim, baixar mesmo assim",
                cancelButtonText: "Cancelar",
                confirmButtonColor: "#15803d",
                cancelButtonColor: "#64748b",
            });

            if (!result.isConfirmed) return;
        }

        setBaixando(true);

        try {
            const params = new URLSearchParams();
            if (cursoFiltro) params.append("curso", cursoFiltro);
            if (serieFiltro) params.append("serie", serieFiltro);

            const token = localStorage.getItem("token");
            const response = await fetch(
                `${API_BASE_URL}/coordenador/banners/download?${params.toString()}`,
                {
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                }
            );

            if (!response.ok) {
                throw new Error("Erro ao baixar o arquivo ZIP.");
            }

            // Pega o nome do arquivo do header Content-Disposition
            const disposition = response.headers.get("Content-Disposition");
            const filenameMatch = disposition?.match(/filename="?(.+)"?/);
            const filename = filenameMatch?.[1] ?? "banners-sectec.zip";

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            Swal.fire({
                icon: "success",
                title: "Download concluído!",
                showConfirmButton: false,
                timer: 1500,
                timerProgressBar: true,
            });
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Erro ao baixar",
                text: error instanceof Error ? error.message : "Tente novamente.",
                confirmButtonColor: "#15803d",
            });
        } finally {
            setBaixando(false);
        }
    }

    return (
        <AnimatePresence>
            {aberto && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl"
                    >
                        {/* Header */}
                        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur-sm">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex min-w-0 items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
                                        aria-label="Fechar painel"
                                    >
                                        <ArrowLeft size={17} />
                                    </button>
                                    <div>
                                        <h2 className="text-lg font-black text-slate-950">
                                            Download de Banners
                                        </h2>
                                        <p className="text-xs font-semibold text-slate-500">
                                            Exportação em lote dos banners aprovados
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Conteúdo */}
                        <div className="space-y-5 p-6">
                            {/* Filtros */}
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                                    Filtros
                                </p>

                                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                    <label className="block">
                                        <span className="text-xs font-bold text-slate-600">
                                            Curso
                                        </span>
                                        <select
                                            value={cursoFiltro}
                                            onChange={(e) => setCursoFiltro(e.target.value)}
                                            className="mt-1 h-11 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 outline-none transition focus:border-sectec-500 focus:ring-2 focus:ring-sectec-100"
                                        >
                                            <option value="">Todos os cursos</option>
                                            {cursos.map((curso) => (
                                                <option key={curso} value={curso}>
                                                    {curso.charAt(0).toUpperCase() + curso.slice(1)}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <label className="block">
                                        <span className="text-xs font-bold text-slate-600">
                                            Série
                                        </span>
                                        <select
                                            value={serieFiltro}
                                            onChange={(e) => setSerieFiltro(e.target.value)}
                                            className="mt-1 h-11 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 outline-none transition focus:border-sectec-500 focus:ring-2 focus:ring-sectec-100"
                                        >
                                            <option value="">Todas as séries</option>
                                            {series.map((serie) => (
                                                <option key={serie} value={serie}>
                                                    {serie}º Ano
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                            </div>

                            {/* Validação */}
                            <div className="rounded-2xl border border-slate-200 p-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                                        Validar antes de baixar
                                    </p>
                                    <button
                                        type="button"
                                        onClick={validarBanners}
                                        disabled={carregandoValidacao}
                                        className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {carregandoValidacao ? (
                                            <Loader2 className="animate-spin" size={14} />
                                        ) : (
                                            <RefreshCw size={14} />
                                        )}
                                        {carregandoValidacao ? "Validando..." : "Validar"}
                                    </button>
                                </div>

                                {validacao && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-4 space-y-3"
                                    >
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="rounded-xl bg-emerald-50 p-3">
                                                <p className="text-xs font-bold text-emerald-700">
                                                    Com banner
                                                </p>
                                                <p className="mt-1 text-2xl font-black text-emerald-900">
                                                    {validacao.incluidos}
                                                </p>
                                            </div>
                                            <div className="rounded-xl bg-amber-50 p-3">
                                                <p className="text-xs font-bold text-amber-700">
                                                    Sem banner
                                                </p>
                                                <p className="mt-1 text-2xl font-black text-amber-900">
                                                    {validacao.faltando.total}
                                                </p>
                                            </div>
                                        </div>

                                        {validacao.faltando.total > 0 && (
                                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                                                <div className="flex items-start gap-2">
                                                    <Info
                                                        size={16}
                                                        className="mt-0.5 shrink-0 text-amber-600"
                                                    />
                                                    <div>
                                                        <p className="text-sm font-bold text-amber-800">
                                                            Projetos sem banner aprovado
                                                        </p>
                                                        {validacao.faltando.primeiros.length > 0 && (
                                                            <ul className="mt-2 space-y-1">
                                                                {validacao.faltando.primeiros.map(
                                                                    (projeto, idx) => (
                                                                        <li
                                                                            key={idx}
                                                                            className="text-xs font-semibold text-amber-700"
                                                                        >
                                                                            • {projeto}
                                                                        </li>
                                                                    )
                                                                )}
                                                            </ul>
                                                        )}
                                                        {validacao.faltando.restante > 0 && (
                                                            <p className="mt-2 text-xs font-semibold text-amber-700">
                                                                ... e mais {validacao.faltando.restante} projeto(s)
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </div>

                            {/* Botão de download */}
                            <button
                                type="button"
                                onClick={baixarBanners}
                                disabled={baixando || !validacao || validacao.incluidos === 0}
                                className="inline-flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-sectec-700 px-6 py-4 text-base font-black text-white shadow-sm transition hover:bg-sectec-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {baixando ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <Download size={20} />
                                )}
                                {baixando
                                    ? "Gerando ZIP..."
                                    : !validacao
                                        ? "Valide primeiro para habilitar o download"
                                        : validacao.incluidos === 0
                                            ? "Nenhum banner aprovado encontrado"
                                            : `Baixar ${validacao.incluidos} banner(s) em ZIP`}
                            </button>

                            {/* Info adicional */}
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-start gap-2">
                                    <FolderKanban
                                        size={16}
                                        className="mt-0.5 shrink-0 text-slate-400"
                                    />
                                    <div>
                                        <p className="text-xs font-bold text-slate-600">
                                            Estrutura do ZIP
                                        </p>
                                        <p className="mt-1 text-xs font-semibold text-slate-500">
                                            Os arquivos serão organizados em pastas por curso e série,
                                            seguindo o padrão:{" "}
                                            <code className="rounded bg-slate-200 px-1 py-0.5 text-[11px]">
                                                Curso/Série/banner_titulo_aluno.pdf
                                            </code>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}