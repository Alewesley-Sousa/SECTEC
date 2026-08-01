// components/RelatorioAlunoCard.tsx
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video, Clock, CheckCircle2, Eye, EyeOff, ChevronRight,
  BookOpen, Users, Calendar, FileText, Sparkles, Send,
  UploadCloud, Loader2, X, Edit3, AlertTriangle, RefreshCw,
} from 'lucide-react';
import { EnvioRelatorioForm } from './EnvioRelatorioForm';
import {
  enviarLinkRelatorio,
  enviarPdfRelatorio,
  cancelarMaterialRelatorio,
} from '../relatorios';
import Swal from 'sweetalert2';
import { Pagination } from '../../../../componentes/PaginationUniversal';

type ProjetoRelatorio = {
  id: number;
  titulo: string;
  descricao: string;
  area: string;
  autores: { id: number; nome: string; turma: string; tipo: string }[];
  visualizado: boolean;
  data_atribuicao: string;
};

type DadosRelatorio = {
  status: string;
  quantidade_projetos: number;
  total_atribuidos: number;
  total_visualizados: number;
  data_ativacao: string;
  data_envio: string | null;
} | null;

interface Props {
  dadosRelatorio: DadosRelatorio;
  projetosRelatorio: ProjetoRelatorio[];
  onMarcarVisualizado?: (projetoId: number) => void;
  onEnvioRealizado?: () => void;
  videoMaterialIdInicial?: number | null;
  pdfMateriais?: { projetoId: number; materialId: number }[];
  videoStatus?: string | null;
  pdfStatus?: string | null;
  videoOpiniao?: string | null;
  pdfOpiniao?: string | null;
}

interface PdfSelecionado {
  file: File;
  previewUrl: string;
}

export function RelatorioAlunoCard({
  dadosRelatorio,
  projetosRelatorio,
  onMarcarVisualizado,
  onEnvioRealizado,
  videoMaterialIdInicial = null,
  pdfMateriais = [],
  videoStatus = null,
  pdfStatus = null,
  videoOpiniao = null,
  pdfOpiniao = null,
}: Props) {
  const [projetoExpandidoId, setProjetoExpandidoId] = useState<number | null>(null);
  const [exibindoFormulario, setExibindoFormulario] = useState(false);
  const [enviandoVideo, setEnviandoVideo] = useState(false);
  const [enviandoPdf, setEnviandoPdf] = useState(false);

  const extrairPdfMaterialId = (materiais: { projetoId: number; materialId: number }[]): number | null => {
    return materiais.length > 0 ? materiais[0].materialId : null;
  };

  const [videoMaterialId, setVideoMaterialId] = useState<number | null>(videoMaterialIdInicial);
  const [pdfMaterialId, setPdfMaterialId] = useState<number | null>(extrairPdfMaterialId(pdfMateriais));

  const [pdfSelecionado, setPdfSelecionado] = useState<PdfSelecionado | null>(null);
  const inputFileRef = useRef<HTMLInputElement>(null);

  const [modoEdicao, setModoEdicao] = useState(false);

  const ITEMS_POR_PAGINA = 3;
  const [paginaAtual, setPaginaAtual] = useState(1);

  // Reseta a página quando a lista de projetos mudar (ex.: nova distribuição)
  useEffect(() => {
    setPaginaAtual(1);
  }, [projetosRelatorio.length]);

  const totalPaginas = Math.ceil(projetosRelatorio.length / ITEMS_POR_PAGINA);
  const projetosPagina = projetosRelatorio.slice(
    (paginaAtual - 1) * ITEMS_POR_PAGINA,
    paginaAtual * ITEMS_POR_PAGINA
  );

  useEffect(() => {
    setVideoMaterialId(videoMaterialIdInicial);
  }, [videoMaterialIdInicial]);

  useEffect(() => {
    setPdfMaterialId(extrairPdfMaterialId(pdfMateriais));
  }, [pdfMateriais]);

  useEffect(() => {
    setModoEdicao(false);
  }, [dadosRelatorio?.status]);

  if (!dadosRelatorio) return null;

  const toggleExpandir = (id: number) => setProjetoExpandidoId(prev => prev === id ? null : id);

  const isProjetoNovo = (dataAtribuicao: string) => {
    const agora = Date.now();
    const atribuido = new Date(dataAtribuicao).getTime();
    return agora - atribuido < 24 * 60 * 60 * 1000;
  };

  // ───── Handlers ─────
  const handleEnviarVideo = async (link: string) => {
    setEnviandoVideo(true);
    try {
      if (videoMaterialId && videoStatus === 'devolvido') {
        await cancelarMaterialRelatorio(videoMaterialId);
        setVideoMaterialId(null);
      }
      const resposta = await enviarLinkRelatorio(link);
      setVideoMaterialId(resposta.material.id);
      Swal.fire({ icon: 'success', title: 'Vídeo enviado!', confirmButtonColor: '#15803d' });
      setExibindoFormulario(false);
      onEnvioRealizado?.();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Erro ao enviar vídeo', text: err.message });
    } finally {
      setEnviandoVideo(false);
    }
  };

  const handleCancelarVideo = async () => {
    if (!videoMaterialId) return;
    const confirm = await Swal.fire({
      title: 'Cancelar vídeo?',
      text: 'O vídeo será removido e você poderá enviar outro.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, cancelar',
      cancelButtonText: 'Manter',
      confirmButtonColor: '#dc2626',
    });
    if (!confirm.isConfirmed) return;
    try {
      await cancelarMaterialRelatorio(videoMaterialId);
      setVideoMaterialId(null);
      Swal.fire({ icon: 'success', title: 'Vídeo cancelado.', confirmButtonColor: '#15803d' });
      onEnvioRealizado?.();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Erro ao cancelar', text: err.message });
    }
  };

  const handleReenviarVideo = async () => {
    if (!videoMaterialId) return;
    try {
      await cancelarMaterialRelatorio(videoMaterialId);
      setVideoMaterialId(null);
      setExibindoFormulario(true);
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Erro ao preparar reenvio', text: err.message });
    }
  };

  const handleSelecionarArquivo = () => {
    inputFileRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setPdfSelecionado({ file, previewUrl });
    }
    if (inputFileRef.current) inputFileRef.current.value = '';
  };

  const handleConfirmarEnvioPdf = async () => {
    if (!pdfSelecionado) return;
    const { file, previewUrl } = pdfSelecionado;
    setEnviandoPdf(true);
    try {
      if (pdfMaterialId && pdfStatus === 'devolvido') {
        await cancelarMaterialRelatorio(pdfMaterialId);
        setPdfMaterialId(null);
      }
      const resposta = await enviarPdfRelatorio(file);
      setPdfMaterialId(resposta.material.id);
      Swal.fire({ icon: 'success', title: 'PDF enviado!', confirmButtonColor: '#15803d' });
      onEnvioRealizado?.();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Erro ao enviar PDF', text: err.message });
    } finally {
      setEnviandoPdf(false);
      URL.revokeObjectURL(previewUrl);
      setPdfSelecionado(null);
    }
  };

  const handleCancelarPreview = () => {
    if (pdfSelecionado) {
      URL.revokeObjectURL(pdfSelecionado.previewUrl);
      setPdfSelecionado(null);
    }
  };

  const handleCancelarPdf = async () => {
    if (!pdfMaterialId) return;
    const confirm = await Swal.fire({
      title: 'Cancelar PDF?',
      text: 'O PDF será removido e você poderá enviar novamente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, cancelar',
      cancelButtonText: 'Manter',
      confirmButtonColor: '#dc2626',
    });
    if (!confirm.isConfirmed) return;
    try {
      await cancelarMaterialRelatorio(pdfMaterialId);
      setPdfMaterialId(null);
      Swal.fire({ icon: 'success', title: 'PDF cancelado.', confirmButtonColor: '#15803d' });
      onEnvioRealizado?.();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Erro ao cancelar', text: err.message });
    }
  };

  const handleReenviarPdf = async () => {
    if (!pdfMaterialId) return;
    try {
      await cancelarMaterialRelatorio(pdfMaterialId);
      setPdfMaterialId(null);
      handleSelecionarArquivo();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Erro ao preparar reenvio', text: err.message });
    }
  };

  // ─── Estado: Pendente ───
  if (dadosRelatorio.status === 'pendente') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-b from-amber-50/50 to-white p-6 sm:p-8 md:p-10 text-center"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-amber-100/60 blur-2xl"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-amber-50 blur-2xl"
        />

        <div className="relative">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="mx-auto w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center mb-5 shadow-sm"
          >
            <Clock size={26} className="text-amber-600 sm:size-7 md:size-8" />
          </motion.div>

          <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-800 mb-2">
            Aguardando distribuição
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            A coordenação ainda não atribuiu os projetos que você deverá assistir.
          </p>

          <motion.div
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-4 py-2 text-xs font-medium text-amber-700"
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Em breve
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // ─── Estado: Finalizado (prioridade sobre outras verificações) ───
  // ─── Estado: Finalizado ───
  if (dadosRelatorio.status === 'finalizado') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-purple-50/70 to-white p-6 sm:p-8 md:p-10 text-center shadow-xl shadow-indigo-100/50"
      >
        {/* Fundo decorativo */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.7, 0.5] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-gradient-to-br from-purple-200/60 to-indigo-300/40 blur-2xl"
          />
          <motion.div
            animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0.65, 0.4] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-gradient-to-tr from-violet-200/50 to-fuchsia-200/30 blur-2xl"
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-to-b from-amber-100/20 to-transparent blur-3xl" />
        </div>

        {/* Partículas decorativas sutis */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 60, x: 0 }}
              animate={{
                opacity: [0, 0.6, 0],
                y: [-20, -100],
                x: [0, (i % 2 === 0 ? 30 : -30)],
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.8,
                ease: 'easeOut',
              }}
              className="absolute w-2 h-2 rounded-full bg-purple-300/50"
              style={{
                left: `${15 + i * 14}%`,
                bottom: '10%',
              }}
            />
          ))}
        </div>

        <div className="relative">
          {/* Ícone com efeito de brilho */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 180, delay: 0.3 }}
            className="mx-auto w-20 h-20 sm:w-22 sm:h-22 md:w-24 md:h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 shadow-xl shadow-purple-300/40 relative"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            >
              <CheckCircle2 size={36} className="text-white sm:size-10 md:size-11 drop-shadow-lg" />
            </motion.div>
            {/* Brilho pulsante ao redor */}
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-3xl bg-white/20 blur-md"
            />
          </motion.div>

          {/* Selo de concluído */}
          <motion.div
            initial={{ rotate: -15, scale: 0, opacity: 0 }}
            animate={{ rotate: -8, scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.6 }}
            className="inline-flex items-center gap-2 mb-4 px-5 py-2 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 shadow-md"
          >
            <motion.span
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="text-xl"
            >
              🎉
            </motion.span>
            <span className="text-sm font-black text-amber-700 tracking-wide uppercase">
              Avaliação concluída
            </span>
          </motion.div>

          <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-800 mb-3 tracking-tight">
            Relatório Finalizado
          </h3>
          <p className="text-sm sm:text-base text-slate-500 max-w-md mx-auto leading-relaxed mb-6">
            Sua avaliação foi concluída pela coordenação. Agora é só aguardar o resultado final.
          </p>

          {/* Card de informações */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="inline-flex flex-col sm:flex-row items-center gap-4 px-6 py-4 rounded-2xl bg-white/70 backdrop-blur-sm border border-slate-200 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500 shadow-sm shadow-purple-300" />
              <span className="text-sm font-semibold text-purple-700">
                Finalizado
              </span>
            </div>
            {dadosRelatorio.data_envio && (
              <>
                <div className="hidden sm:block w-px h-5 bg-slate-300" />
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-slate-400" />
                  <span className="text-sm text-slate-600">
                    {new Date(dadosRelatorio.data_envio).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </>
            )}
          </motion.div>

          {/* Mensagem motivacional */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="mt-6 text-xs text-slate-400 max-w-sm mx-auto"
          >
            Obrigado pela sua dedicação! Em breve você poderá conferir sua nota final.
          </motion.p>
        </div>
      </motion.div>
    );
  }

  // ⚠️ Interface de envio/cancelamento – visível enquanto houver pendências OU modo edição OU material devolvido
  const videoEnviado = videoMaterialId !== null;
  const pdfEnviado = pdfMaterialId !== null;
  const todosEnviados = videoEnviado && pdfEnviado;
  const exibirInterfaceEnvio = !todosEnviados || modoEdicao || videoStatus === 'devolvido' || pdfStatus === 'devolvido';

  if (exibirInterfaceEnvio) {
    const progresso =
      dadosRelatorio.quantidade_projetos > 0
        ? Math.round((dadosRelatorio.total_atribuidos / dadosRelatorio.quantidade_projetos) * 100)
        : 0;

    return (
      <>
        <input ref={inputFileRef} type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
        >
          <div className="relative bg-gradient-to-r from-sectec-700 via-sectec-600 to-emerald-800 px-4 sm:px-5 md:px-6 py-4 sm:py-5 text-white overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-2 right-4 w-16 h-16 rounded-full bg-white blur-xl" />
              <div className="absolute bottom-1 left-8 w-12 h-12 rounded-full bg-white blur-xl" />
            </div>

            <div className="relative flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center"
                >
                  <Video size={18} className="text-white sm:size-5" />
                </motion.div>
                <div>
                  <h3 className="text-sm sm:text-base md:text-lg font-bold">Modalidade Relatório</h3>
                  <p className="text-[10px] sm:text-xs text-white/70">Assista aos projetos e envie seu relatório</p>
                </div>
              </div>
              {modoEdicao && todosEnviados && videoStatus !== 'devolvido' && pdfStatus !== 'devolvido' && (
                <button
                  onClick={() => setModoEdicao(false)}
                  className="text-xs font-semibold text-white/80 hover:text-white underline underline-offset-2"
                >
                  Concluir edição
                </button>
              )}
            </div>

            <div className="relative flex items-center gap-2.5 sm:gap-3">
              <div className="flex-1 h-2 sm:h-2.5 rounded-full bg-white/20 overflow-hidden backdrop-blur-sm">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progresso}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                  className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-emerald-400"
                />
              </div>
              <span className="text-xs sm:text-sm font-bold tabular-nums min-w-[3ch] text-right">
                {dadosRelatorio.total_atribuidos}/{dadosRelatorio.quantidade_projetos}
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-5 md:p-6">
            <AnimatePresence mode="wait">
              {!exibindoFormulario ? (
                <motion.div
                  key="projetos"
                  initial={{ x: -300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -300, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  {/* Seção do vídeo */}
                  <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Video size={18} className="text-sectec-600" />
                        <h4 className="text-sm font-bold text-slate-800">Vídeo do Relatório</h4>
                      </div>
                      {videoEnviado ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">
                          <CheckCircle2 size={14} /> Enviado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                          Pendente
                        </span>
                      )}
                    </div>
                    {videoEnviado ? (
                      <>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-slate-500">Vídeo enviado.</p>
                          {videoStatus === 'devolvido' ? (
                            <button
                              onClick={handleReenviarVideo}
                              className="text-xs font-medium text-sectec-600 hover:text-sectec-800 underline flex items-center gap-1"
                            >
                              <RefreshCw size={12} /> Enviar novo vídeo
                            </button>
                          ) : (
                            <button onClick={handleCancelarVideo} className="text-xs text-red-600 hover:text-red-700 underline">
                              Cancelar envio
                            </button>
                          )}
                        </div>
                        {videoStatus === 'devolvido' && (
                          <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                            <div className="flex items-center gap-1 font-semibold mb-1">
                              <AlertTriangle size={12} className="text-amber-600" /> Devolvido pela coordenação
                            </div>
                            {videoOpiniao && <p className="text-amber-700">{videoOpiniao}</p>}
                          </div>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={() => setExibindoFormulario(true)}
                        className="flex items-center gap-2 mt-2 px-4 py-2 rounded-lg bg-sectec-700 text-white text-sm font-semibold hover:bg-sectec-800 transition-colors"
                      >
                        <Send size={16} /> Enviar Vídeo
                      </button>
                    )}
                  </div>

                  {/* Seção do PDF único */}
                  <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileText size={18} className="text-sectec-600" />
                        <h4 className="text-sm font-bold text-slate-800">Relatório em PDF</h4>
                      </div>
                      {pdfEnviado ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">
                          <CheckCircle2 size={14} /> Enviado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                          Pendente
                        </span>
                      )}
                    </div>
                    {pdfEnviado ? (
                      <>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-slate-500">PDF enviado.</p>
                          {pdfStatus === 'devolvido' ? (
                            <button
                              onClick={handleReenviarPdf}
                              className="text-xs font-medium text-sectec-600 hover:text-sectec-800 underline flex items-center gap-1"
                            >
                              <RefreshCw size={12} /> Enviar novo PDF
                            </button>
                          ) : (
                            <button onClick={handleCancelarPdf} className="text-xs text-red-600 hover:text-red-700 underline">
                              Cancelar envio
                            </button>
                          )}
                        </div>
                        {pdfStatus === 'devolvido' && (
                          <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                            <div className="flex items-center gap-1 font-semibold mb-1">
                              <AlertTriangle size={12} className="text-amber-600" /> Devolvido pela coordenação
                            </div>
                            {pdfOpiniao && <p className="text-amber-700">{pdfOpiniao}</p>}
                          </div>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={handleSelecionarArquivo}
                        disabled={enviandoPdf}
                        className="flex items-center gap-2 mt-2 px-4 py-2 rounded-lg bg-sectec-700 text-white text-sm font-semibold hover:bg-sectec-800 transition-colors disabled:opacity-50"
                      >
                        {enviandoPdf ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                        {enviandoPdf ? 'Enviando...' : 'Enviar PDF'}
                      </button>
                    )}
                  </div>

                  {/* Lista de projetos (informativa) */}
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen size={14} className="text-slate-400" />
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Projetos atribuídos ({projetosRelatorio.length})
                    </p>
                  </div>

                  <AnimatePresence>
                    {projetosPagina.map((projeto, index) => {
                      const expandido = projetoExpandidoId === projeto.id;
                      const novo = isProjetoNovo(projeto.data_atribuicao);

                      return (
                        <motion.div
                          key={projeto.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          layout
                          className={`rounded-2xl border bg-white transition-all duration-300 ${expandido
                            ? 'border-sectec-300 shadow-lg ring-1 ring-sectec-100'
                            : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                            }`}
                        >
                          <button
                            onClick={() => toggleExpandir(projeto.id)}
                            aria-expanded={expandido}
                            className="w-full text-left p-3 sm:p-4 flex items-start gap-3 sm:gap-4 focus-visible:outline-2 focus-visible:outline-sectec-500 rounded-2xl"
                          >
                            <motion.div
                              whileTap={{ scale: 0.9 }}
                              className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 cursor-pointer ${projeto.visualizado
                                ? 'border-emerald-400 bg-emerald-400'
                                : 'border-slate-300 bg-white hover:border-sectec-400'
                                }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onMarcarVisualizado?.(projeto.id);
                              }}
                              title={projeto.visualizado ? 'Marcar como não visto' : 'Marcar como visto'}
                            >
                              {projeto.visualizado ? (
                                <CheckCircle2 size={12} className="text-white" />
                              ) : (
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                              )}
                            </motion.div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                                  {novo && (
                                    <span className="shrink-0 inline-flex items-center gap-0.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-700">
                                      <Sparkles size={8} /> Novo
                                    </span>
                                  )}
                                  {projeto.titulo}
                                </h4>
                                <span
                                  className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${projeto.visualizado
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-amber-50 text-amber-700'
                                    }`}
                                >
                                  {projeto.visualizado ? <Eye size={10} /> : <EyeOff size={10} />}
                                  {projeto.visualizado ? 'Visto' : 'Pendente'}
                                </span>
                              </div>

                              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
                                  {projeto.area}
                                </span>
                                <span>{new Date(projeto.data_atribuicao).toLocaleDateString('pt-BR')}</span>
                              </div>
                            </div>

                            <motion.div
                              animate={{ rotate: expandido ? 90 : 0 }}
                              transition={{ duration: 0.2 }}
                              className="shrink-0 mt-1"
                            >
                              <ChevronRight
                                size={16}
                                className={`sm:size-4 transition-colors ${expandido ? 'text-sectec-500' : 'text-slate-300 group-hover:text-sectec-500'
                                  }`}
                              />
                            </motion.div>
                          </button>

                          <AnimatePresence>
                            {expandido && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                className="overflow-hidden"
                              >
                                <div className="px-3 sm:px-4 pb-3 sm:pb-4 border-t border-slate-100">
                                  <div className="pt-3 sm:pt-4 space-y-3 sm:space-y-4">
                                    <div>
                                      <div className="flex items-center gap-1.5 mb-2">
                                        <FileText size={12} className="text-slate-400 sm:size-3.5" />
                                        <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                          Descrição
                                        </p>
                                      </div>
                                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                        {projeto.descricao}
                                      </p>
                                    </div>

                                    <div>
                                      <div className="flex items-center gap-1.5 mb-2">
                                        <Users size={12} className="text-slate-400 sm:size-3.5" />
                                        <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                          Autores ({projeto.autores.length})
                                        </p>
                                      </div>
                                      <div className="grid gap-1.5 sm:gap-2 grid-cols-1 xs:grid-cols-2">
                                        {projeto.autores.map((autor) => (
                                          <div
                                            key={autor.id}
                                            className="flex items-center gap-2 sm:gap-2.5 rounded-xl bg-slate-50 px-2.5 sm:px-3 py-2 hover:bg-slate-100 transition-colors"
                                          >
                                            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-sectec-100 flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-sectec-700 shrink-0">
                                              {autor.nome
                                                .split(' ')
                                                .map((n) => n[0])
                                                .slice(0, 2)
                                                .join('')
                                                .toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                              <p className="text-[10px] sm:text-xs font-semibold text-slate-700 truncate">
                                                {autor.nome}
                                              </p>
                                              <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="text-[9px] sm:text-[10px] text-slate-400">
                                                  {autor.turma}
                                                </span>
                                                {autor.tipo === 'autor_principal' && (
                                                  <span className="inline-flex items-center rounded-full bg-amber-100 px-1 sm:px-1.5 py-0.5 text-[8px] sm:text-[9px] font-medium text-amber-700">
                                                    Autor principal
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 pt-1">
                                      <div className="flex items-center gap-1.5">
                                        <Calendar size={12} className="text-slate-400 sm:size-3.5" />
                                        <p className="text-[10px] sm:text-xs text-slate-500">
                                          Atribuído em{' '}
                                          {new Date(projeto.data_atribuicao).toLocaleDateString('pt-BR', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                          })}
                                        </p>
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onMarcarVisualizado?.(projeto.id);
                                        }}
                                        className={`inline-flex items-center gap-1 sm:gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-xs font-semibold transition-all active:scale-95 ${projeto.visualizado
                                          ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                          }`}
                                      >
                                        {projeto.visualizado ? (
                                          <><EyeOff size={12} /> Desmarcar</>
                                        ) : (
                                          <><Eye size={12} /> Marcar como visto</>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  {/* PAGINAÇÃO */}
                  {totalPaginas > 1 && (
                    <Pagination
                      page={paginaAtual}
                      totalPages={totalPaginas}
                      onPageChange={setPaginaAtual}
                      total={projetosRelatorio.length}
                      limit={ITEMS_POR_PAGINA}
                      showInfo
                    />
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="formulario"
                  initial={{ x: 300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 300, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="p-2 sm:p-4"
                >
                  <EnvioRelatorioForm
                    onCancelar={() => setExibindoFormulario(false)}
                    onEnviar={handleEnviarVideo}
                    enviando={enviandoVideo}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Modal de preview do PDF */}
        <AnimatePresence>
          {pdfSelecionado && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
              onClick={handleCancelarPreview}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Visualizar Documento</h3>
                    <p className="text-xs text-slate-500 truncate max-w-[300px]">{pdfSelecionado.file.name}</p>
                  </div>
                  <button onClick={handleCancelarPreview} className="p-2 rounded-full hover:bg-slate-100">
                    <X size={18} className="text-slate-500" />
                  </button>
                </div>

                <div className="relative flex-1 min-h-[400px] bg-slate-100">
                  <iframe
                    src={pdfSelecionado.previewUrl}
                    className="absolute inset-0 w-full h-full border-0"
                    title="Preview do documento"
                  />
                </div>

                <div className="flex items-center justify-between px-5 py-4 border-t border-slate-200 bg-slate-50">
                  <button onClick={handleCancelarPreview} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100">
                    <X size={16} /> Cancelar
                  </button>
                  <button
                    onClick={handleConfirmarEnvioPdf}
                    disabled={enviandoPdf}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sectec-700 text-sm font-bold text-white hover:bg-sectec-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {enviandoPdf ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                    {enviandoPdf ? 'Enviando...' : 'Confirmar envio'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // ─── Estado: Enviado / Distribuído (tela verde de sucesso) ───
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-b from-emerald-50/50 to-white p-6 sm:p-8 md:p-10 text-center"
    >
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-emerald-100/60 blur-2xl"
      />
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-emerald-50 blur-2xl"
      />

      <div className="relative">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          className="mx-auto w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center mb-5 shadow-sm"
        >
          <CheckCircle2 size={26} className="text-emerald-600 sm:size-7 md:size-8" />
        </motion.div>

        <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-800 mb-2">
          Relatório enviado
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
          Seu relatório foi recebido com sucesso e está em análise pela coordenação.
        </p>

        <motion.div
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-4 py-2"
        >
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-xs font-semibold text-emerald-700">
            {dadosRelatorio.status === 'enviado' ? 'Enviado' : 'Finalizado'}
          </span>
          {dadosRelatorio.data_envio && (
            <span className="text-xs text-emerald-600">
              em {new Date(dadosRelatorio.data_envio).toLocaleDateString('pt-BR')}
            </span>
          )}
        </motion.div>

        <div className="mt-8">
          <button
            onClick={() => setModoEdicao(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-400"
          >
            <Edit3 size={16} />
            Editar materiais
          </button>
          <p className="mt-2 text-xs text-slate-400">
            Caso precise alterar o vídeo ou o PDF enviado.
          </p>
        </div>
      </div>
    </motion.div>
  );
}