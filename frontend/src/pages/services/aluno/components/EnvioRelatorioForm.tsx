// frontend/src/pages/services/aluno/components/EnvioRelatorioForm.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Loader2, Link as LinkIcon, AlertCircle } from 'lucide-react';

interface Props {
  onCancelar: () => void;
  onEnviar: (link: string) => Promise<void>;
  enviando: boolean;
}

export function EnvioRelatorioForm({ onCancelar, onEnviar, enviando }: Props) {
  const [link, setLink] = useState('');
  const [erro, setErro] = useState('');

  const linkValido = /^(https?:\/\/)?(www\.|m\.)?(youtube\.com\/(watch\?(.+&)?v=|shorts\/|embed\/)|youtu\.be\/)[\w-]{11}([?&].*)?$/i.test(link.trim());

  const handleSubmit = async () => {
    if (!link.trim()) {
      setErro('Informe o link do vídeo.');
      return;
    }
    if (!linkValido) {
      setErro('Link do YouTube inválido.');
      return;
    }
    setErro('');
    try {
      await onEnviar(link.trim());
    } catch (err: any) {
      setErro(err?.message || 'Erro ao enviar.');
    }
  };

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -300, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="space-y-6"
    >
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <button
          onClick={onCancelar}
          className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
          title="Voltar para projetos"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Enviar Relatório</h3>
          <p className="text-xs text-slate-500">Cole o link público do YouTube com sua apresentação.</p>
        </div>
      </div>

      {/* Campo de link */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Link do YouTube
        </label>
        <div className="relative">
          <LinkIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="url"
            value={link}
            onChange={(e) => {
              setLink(e.target.value);
              setErro('');
            }}
            placeholder="https://youtu.be/... ou https://youtube.com/watch?v=..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sectec-500 focus:border-transparent transition"
            disabled={enviando}
          />
        </div>
        {erro && (
          <div className="flex items-center gap-2 mt-2 text-xs text-red-600">
            <AlertCircle size={14} />
            {erro}
          </div>
        )}
        {link && !linkValido && !erro && (
          <p className="text-xs text-amber-600 mt-2">O link parece inválido. Verifique se é um link público do YouTube.</p>
        )}
      </div>

      {/* Botões */}
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancelar}
          disabled={enviando}
          className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={enviando || !linkValido}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sectec-700 text-sm font-bold text-white hover:bg-sectec-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {enviando ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Send size={18} />
          )}
          {enviando ? 'Enviando...' : 'Enviar Relatório'}
        </button>
      </div>
    </motion.div>
  );
}