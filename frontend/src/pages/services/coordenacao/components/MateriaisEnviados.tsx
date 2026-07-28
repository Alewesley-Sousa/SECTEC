// services/coordenacao/components/MateriaisEnviados.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileSearch, Video, FileText, X, Loader2, Calendar, User, ExternalLink,
  Search, Undo2, MessageCircle, ChevronRight, Eye, Upload, CheckCircle,
} from 'lucide-react';
import { apiRequest, API_BASE_URL } from '../../../../lib/api';
import Swal from 'sweetalert2';
import { Pagination } from '../../../../componentes/PaginationUniversal';

// ------ Tipos ------
interface MaterialItem {
  id: number;
  tipo: 'link' | 'pdf';
  conteudo: string;
  status: string;
  criadoEm: string;
  opiniao?: string;
}

interface AlunoMaterial {
  aluno: { id: number; nome: string; turma: string };
  relatorioId: number;
  statusRelatorio: string;
  materiais: MaterialItem[];
}

interface MateriaisResponse {
  data: AlunoMaterial[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ------ Funções auxiliares ------
function extrairYouTubeId(url: string): string | null {
  const regex =
    /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.+&)?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})(?:[?&].*)?$/i;
  const match = url.match(regex);
  return match ? match[1] : null;
}

function formatarData(dataISO: string) {
  return new Date(dataISO).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function contarMateriais(materiais: MaterialItem[]) {
  const enviados = materiais.filter((m) => m.status === 'enviado').length;
  const devolvidos = materiais.filter((m) => m.status === 'devolvido').length;
  return { enviados, devolvidos };
}

// ------ Componente principal ------
export function MateriaisEnviados() {
  const [dados, setDados] = useState<AlunoMaterial[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalMaterial, setModalMaterial] = useState<MaterialItem | null>(null);
  const [modalAluno, setModalAluno] = useState<AlunoMaterial['aluno'] | null>(null);
  const [modalStatusRelatorio, setModalStatusRelatorio] = useState<string | null>(null);
  const [modalUrl, setModalUrl] = useState<string | null>(null);
  const [carregandoPdf, setCarregandoPdf] = useState(false);
  const [nomeBusca, setNomeBusca] = useState('');
  const [debouncedNome, setDebouncedNome] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Paginação
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const limit = 9;

  // Expansão inline
  const [expandedAlunos, setExpandedAlunos] = useState<Set<number>>(new Set());

  // Debounce para busca
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedNome(nomeBusca.trim());
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [nomeBusca]);

  const carregarMateriais = useCallback(
    async (nome?: string, pagina = 1) => {
      setCarregando(true);
      try {
        const params = new URLSearchParams();
        if (nome) params.append('nome', nome);
        params.append('page', String(pagina));
        params.append('limit', String(limit));
        const res = await apiRequest<MateriaisResponse>(
          `/relatorio-aluno/coordenador/materiais?${params.toString()}`
        );
        setDados(res.data);
        setTotalPages(res.meta.totalPages);
        setTotalRegistros(res.meta.total);
      } catch (error) {
        console.error(error);
      } finally {
        setCarregando(false);
      }
    },
    [limit]
  );

  useEffect(() => {
    setPage(1);
    carregarMateriais(debouncedNome, 1);
  }, [debouncedNome, carregarMateriais]);

  useEffect(() => {
    if (page > 1) {
      carregarMateriais(debouncedNome, page);
    }
  }, [page]);

  useEffect(() => {
    if (!carregando && document.activeElement !== inputRef.current) {
      inputRef.current?.focus();
    }
  }, [carregando]);

  const toggleExpandirAluno = (alunoId: number) => {
    setExpandedAlunos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(alunoId)) {
        newSet.delete(alunoId);
      } else {
        newSet.add(alunoId);
      }
      return newSet;
    });
  };

  // Handlers de abertura de modal – agora recebem o status do relatório
  const abrirVideo = (material: MaterialItem, aluno: AlunoMaterial['aluno'], statusRelatorio: string) => {
    const id = extrairYouTubeId(material.conteudo);
    setModalMaterial(material);
    setModalAluno(aluno);
    setModalStatusRelatorio(statusRelatorio);
    if (id) {
      setModalUrl(`https://www.youtube.com/embed/${id}`);
    } else {
      setModalUrl(material.conteudo);
    }
    setCarregandoPdf(false);
  };

  const abrirPdf = async (material: MaterialItem, aluno: AlunoMaterial['aluno'], statusRelatorio: string) => {
    setModalMaterial(material);
    setModalAluno(aluno);
    setModalStatusRelatorio(statusRelatorio);
    setCarregandoPdf(true);
    setModalUrl(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/relatorio-aluno/coordenador/materiais/${material.id}/pdf`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error('Falha ao carregar PDF');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setModalUrl(url);
    } catch (error) {
      console.error(error);
      setModalUrl(null);
    } finally {
      setCarregandoPdf(false);
    }
  };

  const fecharModal = () => {
    if (modalUrl && modalMaterial?.tipo === 'pdf') {
      URL.revokeObjectURL(modalUrl);
    }
    setModalMaterial(null);
    setModalAluno(null);
    setModalUrl(null);
    setCarregandoPdf(false);
    setModalStatusRelatorio(null);
  };

  const handleDevolver = async (material: MaterialItem) => {
    const { value: opiniao } = await Swal.fire({
      title: 'Justificativa da devolução',
      input: 'textarea',
      inputPlaceholder: 'Descreva o motivo...',
      inputAttributes: { 'aria-label': 'Justificativa' },
      showCancelButton: true,
      confirmButtonText: 'Devolver',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value || value.trim().length < 10) {
          return 'A justificativa precisa ter pelo menos 10 caracteres.';
        }
        return null;
      },
    });

    if (!opiniao) return;

    try {
      await apiRequest(`/relatorio-aluno/coordenador/materiais/${material.id}/devolver`, {
        method: 'PUT',
        body: { opiniao },
      });
      setDados((prev) =>
        prev.map((aluno) => ({
          ...aluno,
          materiais: aluno.materiais.map((m) =>
            m.id === material.id ? { ...m, status: 'devolvido', opiniao } : m
          ),
        }))
      );
      Swal.fire({ icon: 'success', title: 'Devolvido!', confirmButtonColor: '#15803d' });
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: error.message || 'Não foi possível devolver o material.',
        confirmButtonColor: '#15803d',
      });
    }
  };

  const handleFinalizar = async (relatorioId: number) => {
    const confirm = await Swal.fire({
      title: 'Finalizar avaliação?',
      text: 'Isso marcará o relatório como finalizado e o aluno verá que sua avaliação foi concluída.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sim, finalizar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#15803d',
    });
    if (!confirm.isConfirmed) return;

    try {
      await apiRequest(`/relatorio-aluno/coordenador/alunos-relatorio/${relatorioId}/finalizar`, {
        method: 'PUT',
      });
      setDados((prev) =>
        prev.map((aluno) =>
          aluno.relatorioId === relatorioId
            ? { ...aluno, statusRelatorio: 'finalizado' }
            : aluno
        )
      );
      Swal.fire({ icon: 'success', title: 'Finalizado!', confirmButtonColor: '#15803d' });
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: error.message || 'Não foi possível finalizar o relatório.',
        confirmButtonColor: '#15803d',
      });
    }
  };

  return (
    <>
      <motion.section
        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileSearch size={18} className="text-sectec-600" />
            <h2 className="text-base font-black text-slate-900">Materiais Enviados</h2>
          </div>
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar aluno..."
              value={nomeBusca}
              onChange={(e) => setNomeBusca(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-sectec-500"
            />
          </div>
        </div>

        {carregando && dados.length === 0 ? (
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-slate-100 rounded-2xl" />
            ))}
          </div>
        ) : dados.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            {debouncedNome ? 'Nenhum aluno encontrado.' : 'Nenhum material enviado até o momento.'}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dados.map((item) => {
                const expandido = expandedAlunos.has(item.aluno.id);
                const contagem = contarMateriais(item.materiais);

                return (
                  <motion.div
                    key={item.aluno.id}
                    layout
                    className={`rounded-2xl border bg-white transition-all duration-300 ${
                      expandido
                        ? 'border-sectec-300 shadow-lg ring-1 ring-sectec-100'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    <button
                      onClick={() => toggleExpandirAluno(item.aluno.id)}
                      className="w-full text-left p-4 focus-visible:outline-2 focus-visible:outline-sectec-500"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-900 truncate">{item.aluno.nome}</h3>
                          <p className="text-xs text-slate-500">{item.aluno.turma}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-black ${
                            item.statusRelatorio === 'finalizado' ? 'bg-purple-100 text-purple-800' :
                            item.statusRelatorio === 'enviado' ? 'bg-emerald-100 text-emerald-800' :
                            item.statusRelatorio === 'distribuido' ? 'bg-blue-100 text-blue-800' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {item.statusRelatorio}
                          </span>
                          <motion.div
                            animate={{ rotate: expandido ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronRight
                              size={16}
                              className={`transition-colors ${
                                expandido ? 'text-sectec-500' : 'text-slate-300'
                              }`}
                            />
                          </motion.div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Upload size={12} /> {contagem.enviados} enviado{contagem.enviados !== 1 ? 's' : ''}
                        </span>
                        {contagem.devolvidos > 0 && (
                          <span className="flex items-center gap-1 text-red-600">
                            <Undo2 size={12} /> {contagem.devolvidos} devolvido{contagem.devolvidos !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
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
                          <div className="px-4 pb-4 border-t border-slate-100">
                            <div className="pt-3 space-y-2">
                              {item.materiais.map((material) => (
                                <div
                                  key={material.id}
                                  className="flex items-center justify-between bg-slate-50 rounded-xl p-2.5 border border-slate-100"
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    {material.tipo === 'link' ? (
                                      <Video size={14} className="text-red-500 shrink-0" />
                                    ) : (
                                      <FileText size={14} className="text-blue-500 shrink-0" />
                                    )}
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-xs font-semibold text-slate-700 truncate">
                                        {material.tipo === 'link' ? 'Vídeo' : 'PDF'}
                                      </span>
                                      <span className="text-[10px] text-slate-400">
                                        {formatarData(material.criadoEm)}
                                        {material.status === 'devolvido' && (
                                          <span className="ml-1 text-red-600 font-medium">• Devolvido</span>
                                        )}
                                      </span>
                                      {material.opiniao && (
                                        <div className="flex items-start gap-1 mt-0.5 text-[10px] text-amber-700 bg-amber-50 rounded-md px-1.5 py-0.5">
                                          <MessageCircle size={10} className="shrink-0 mt-0.5" />
                                          <span className="line-clamp-2">{material.opiniao}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0 ml-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        material.tipo === 'link'
                                          ? abrirVideo(material, item.aluno, item.statusRelatorio)
                                          : abrirPdf(material, item.aluno, item.statusRelatorio)
                                      }
                                      className="text-xs font-medium text-sectec-600 hover:text-sectec-800 hover:underline flex items-center gap-1"
                                    >
                                      <Eye size={12} /> Visualizar
                                    </button>
                                    {item.statusRelatorio !== 'finalizado' && (
                                      <button
                                        type="button"
                                        disabled={material.status === 'devolvido'}
                                        onClick={() => handleDevolver(material)}
                                        className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
                                        title="Mandar de volta"
                                      >
                                        <Undo2 size={14} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                              {(item.statusRelatorio === 'enviado' || item.statusRelatorio === 'distribuido') && (
                                <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
                                  <button
                                    onClick={() => handleFinalizar(item.relatorioId)}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 border border-purple-200 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 transition-colors"
                                  >
                                    <CheckCircle size={14} />
                                    Finalizar avaliação
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              total={totalRegistros}
              limit={limit}
            />
          </>
        )}
      </motion.section>

      {/* Modal de visualização de mídia */}
      <AnimatePresence>
        {modalMaterial && (modalUrl || carregandoPdf) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4"
            onClick={fecharModal}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              className={`w-full bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col ${
                modalMaterial.tipo === 'link' ? 'max-w-3xl' : 'max-w-4xl max-h-[90vh]'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Cabeçalho do modal */}
              <div className="relative bg-gradient-to-r from-sectec-700 to-emerald-800 px-6 py-4 sm:px-8 sm:py-5">
                <div className="absolute inset-0 bg-white/5" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl bg-white/20 backdrop-blur-sm ${
                        modalMaterial.tipo === 'link' ? 'text-red-300' : 'text-blue-200'
                      }`}
                    >
                      {modalMaterial.tipo === 'link' ? <Video size={20} /> : <FileText size={20} />}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        {modalMaterial.tipo === 'link' ? 'Vídeo do Relatório' : 'PDF do Relatório'}
                      </h3>
                      {modalAluno && (
                        <div className="flex items-center gap-3 mt-1 text-xs text-white/80">
                          <span className="flex items-center gap-1">
                            <User size={12} /> {modalAluno.nome}
                          </span>
                          <span className="text-white/40">•</span>
                          <span className="flex items-center gap-1">
                            <Calendar size={12} /> {formatarData(modalMaterial.criadoEm)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={fecharModal}
                    className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Corpo do modal */}
              <div className="flex-1 bg-slate-50/80 min-h-0">
                {modalMaterial.tipo === 'link' ? (
                  <div className="aspect-video w-full">
                    <iframe
                      src={modalUrl!}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="Vídeo do relatório"
                    />
                  </div>
                ) : carregandoPdf ? (
                  <div className="h-[80vh] max-h-[80vh] flex flex-col items-center justify-center gap-4">
                    <Loader2 className="animate-spin text-sectec-600" size={48} />
                    <p className="text-sm text-slate-500">Carregando documento...</p>
                  </div>
                ) : modalUrl ? (
                  <div className="h-[80vh] max-h-[80vh]">
                    <iframe src={modalUrl} className="w-full h-full border-0" title="PDF do relatório" />
                  </div>
                ) : (
                  <div className="h-[80vh] max-h-[80vh] flex flex-col items-center justify-center gap-3">
                    <div className="p-4 rounded-2xl bg-red-50 text-red-600">
                      <X size={32} />
                    </div>
                    <p className="text-sm font-medium text-slate-600">Não foi possível carregar o documento.</p>
                    <button
                      onClick={() => abrirPdf(modalMaterial, modalAluno!, modalStatusRelatorio ?? '')}
                      className="text-sm text-sectec-600 hover:underline"
                    >
                      Tentar novamente
                    </button>
                  </div>
                )}
              </div>

              {/* Rodapé do modal */}
              <div className="px-6 py-3 border-t border-slate-200 bg-white flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      modalMaterial.status === 'devolvido'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {modalMaterial.status === 'devolvido' ? '↩ Devolvido' : '✓ Enviado'}
                  </span>
                  <div className="flex items-center gap-3">
                    {modalMaterial.tipo === 'link' && (
                      <a
                        href={modalMaterial.conteudo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-sectec-600 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink size={12} /> Abrir no YouTube
                      </a>
                    )}
                    {modalMaterial.status !== 'devolvido' && modalStatusRelatorio !== 'finalizado' && (
                      <button
                        onClick={() => {
                          fecharModal();
                          handleDevolver(modalMaterial);
                        }}
                        className="text-xs font-medium text-red-600 hover:text-red-800 flex items-center gap-1"
                      >
                        <Undo2 size={12} /> Mandar de volta
                      </button>
                    )}
                  </div>
                </div>
                {modalMaterial.opiniao && (
                  <div className="flex items-start gap-1.5 bg-amber-50 rounded-lg px-3 py-2 text-xs text-amber-800">
                    <MessageCircle size={12} className="shrink-0 mt-0.5 text-amber-600" />
                    <span>{modalMaterial.opiniao}</span>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}