import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export interface AbaModal {
  id: string;
  rotulo: string;
  icone: ReactNode;
  conteudo: ReactNode;
}

interface ModalAtualizacoesProps {
  aberto: boolean;
  onClose: () => void;
  titulo?: string;
  subtitulo?: string;
  abas: AbaModal[];
}

export default function ModalAtualizacoes({
  aberto,
  onClose,
  titulo = "Central do Sistema",
  subtitulo = "Gerencie recursos e novidades",
  abas,
}: ModalAtualizacoesProps) {
  const [abaAtiva, setAbaAtiva] = useState(abas[0]?.id ?? "");

  return (
    <AnimatePresence>
      {aberto && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative z-10 flex max-h-[85vh] w-full max-w-[650px] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            {/* Cabeçalho com gradiente futurista */}
            <div className="relative flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-slate-900 via-emerald-900 to-slate-900 px-6 py-4">
              {/* Partículas decorativas */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-400/10 blur-2xl" />
                <div className="absolute -left-8 -bottom-8 h-24 w-24 rounded-full bg-cyan-400/10 blur-2xl" />
              </div>

              <div className="relative flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/20">
                  {/* Ícone dinâmico da aba ativa */}
                  {abas.find((a) => a.id === abaAtiva)?.icone ?? (
                    <span className="text-lg">⚡</span>
                  )}
                </div>
                <div>
                  <h2 className="text-base font-black text-white">{titulo}</h2>
                  <p className="text-xs font-semibold text-white/60">
                    {subtitulo}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white/80 transition hover:border-red-400/50 hover:bg-red-500/20 hover:text-red-300"
              >
                <X size={17} />
              </button>
            </div>

            {/* Barra de navegação futurista */}
            <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-2 backdrop-blur">
              <nav className="flex gap-1 overflow-x-auto">
                {abas.map((aba) => {
                  const ativa = aba.id === abaAtiva;
                  return (
                    <button
                      key={aba.id}
                      type="button"
                      onClick={() => setAbaAtiva(aba.id)}
                      className={`
                        relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition-all
                        ${
                          ativa
                            ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/60"
                            : "text-slate-500 hover:bg-white/60 hover:text-slate-700"
                        }
                      `}
                    >
                      <span className={ativa ? "text-emerald-600" : "text-slate-400"}>
                        {aba.icone}
                      </span>
                      {aba.rotulo}
                      {ativa && (
                        <motion.div
                          layoutId="aba-ativa"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Conteúdo da aba ativa */}
            <div className="flex-1 overflow-y-auto p-5">
              {abas.find((a) => a.id === abaAtiva)?.conteudo ?? (
                <p className="text-sm text-slate-500">Nenhum conteúdo disponível.</p>
              )}
            </div>

            {/* Rodapé sutil */}
            <div className="border-t border-slate-100 bg-slate-50/80 px-5 py-2.5 text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                SECTEC · Painel de Coordenação
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}