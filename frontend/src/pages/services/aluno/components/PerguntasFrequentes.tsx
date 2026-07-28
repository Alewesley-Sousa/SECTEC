import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, Video, FileText, X } from 'lucide-react';

interface Pergunta {
  id: number;
  pergunta: string;
  resposta: string;
}

const perguntas: Pergunta[] = [
  {
    id: 1,
    pergunta: 'Como funciona a modalidade relatório?',
    resposta:
      'Você assiste aos projetos distribuídos pela coordenação e grava um vídeo apresentando sua análise. Depois envia o link do vídeo e um PDF com seu relatório. Sua nota será baseada na qualidade do material enviado.',
  },
  {
    id: 2,
    pergunta: 'Quanto tempo tenho para enviar os materiais?',
    resposta:
      'O prazo é definido pela coordenação e será informado no sistema assim que os projetos forem distribuídos. Fique atento ao cronograma!',
  },
  {
    id: 3,
    pergunta: 'Posso alterar o vídeo ou o PDF depois de enviar?',
    resposta:
      'Sim, você pode cancelar um material já enviado e reenviá-lo enquanto o status ainda estiver "Em análise". Basta usar o botão "Cancelar envio" ao lado do material.',
  },
  {
    id: 4,
    pergunta: 'Como minha nota é calculada?',
    resposta:
      'A coordenação avaliará o vídeo e o PDF do relatório. A nota final será informada ao término do período de avaliação.',
  },
  {
    id: 5,
    pergunta: 'O que acontece se eu não enviar no prazo?',
    resposta:
      'Caso você perca o prazo de envio, a coordenação poderá aplicar penalidades conforme as regras da instituição. Procure enviar o quanto antes!',
  },
];

export function PerguntasFrequentes() {
  const [aberta, setAberta] = useState<number | null>(null);
  const [modalAberto, setModalAberto] = useState<'video' | 'pdf' | null>(null);

  const toggle = (id: number) => {
    setAberta((prev) => (prev === id ? null : id));
  };

  const abrirModal = (tipo: 'video' | 'pdf') => {
    setModalAberto(tipo);
  };

  const fecharModal = () => {
    setModalAberto(null);
  };

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle size={14} className="text-sectec-600" />
          <h3 className="text-sm font-semibold text-slate-700">Dúvidas frequentes</h3>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            type="button"
            onClick={() => abrirModal('video')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
          >
            <Video size={14} className="text-slate-500" />
            Formato do Vídeo
          </button>
          <button
            type="button"
            onClick={() => abrirModal('pdf')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
          >
            <FileText size={14} className="text-slate-500" />
            Formato do PDF
          </button>
        </div>

        <div className="space-y-2">
          {perguntas.map((item) => {
            const expandido = aberta === item.id;
            return (
              <div key={item.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggle(item.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-50"
                >
                  <span className="text-xs sm:text-sm font-medium text-slate-800 pr-4">
                    {item.pergunta}
                  </span>
                  <motion.div
                    animate={{ rotate: expandido ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0"
                  >
                    <ChevronDown
                      size={16}
                      className={`transition-colors ${
                        expandido ? 'text-sectec-600' : 'text-slate-400'
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
                      <div className="px-4 pb-4 pt-0.5 border-t border-slate-100">
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                          {item.resposta}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {modalAberto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
            onClick={fecharModal}
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
                <div className="flex items-center gap-2">
                  {modalAberto === 'video' ? (
                    <Video size={18} className="text-sectec-600" />
                  ) : (
                    <FileText size={18} className="text-sectec-600" />
                  )}
                  <h3 className="text-sm font-bold text-slate-900">
                    Formato do {modalAberto === 'video' ? 'Vídeo' : 'PDF'}
                  </h3>
                </div>
                <button onClick={fecharModal} className="p-2 rounded-full hover:bg-slate-100">
                  <X size={18} className="text-slate-500" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto text-sm text-slate-700 space-y-6">
                {modalAberto === 'video' ? (
                  <>
                    <section>
                      <h4 className="text-sm font-bold text-sectec-700 mb-2">🎬 Estrutura do Vídeo</h4>
                      <ol className="list-decimal pl-5 space-y-2 text-xs sm:text-sm">
                        <li>
                          <strong>Abertura</strong> (≈30 seg) – Nome, turma, objetivo.
                        </li>
                        <li>
                          <strong>Bloco por projeto</strong> (≈2-3 min cada) – Título, resumo, sua análise.
                        </li>
                        <li>
                          <strong>Encerramento</strong> (≈30 seg) – Comparações, aprendizados, despedida.
                        </li>
                      </ol>
                    </section>

                    <section>
                      <h4 className="text-sm font-bold text-sectec-700 mb-2">📋 Requisitos Técnicos</h4>
                      <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
                        <li><strong>Aparição obrigatória:</strong> você deve aparecer no vídeo para comprovar autoria.</li>
                        <li><strong>Duração total:</strong> 5 a 10 minutos (depende do número de projetos).</li>
                        <li><strong>Enquadramento:</strong> câmera fixa, mostrando rosto e ombros. Fundo neutro e bem iluminado.</li>
                        <li><strong>Áudio:</strong> voz clara, sem ruídos. Fale com calma.</li>
                        <li><strong>Formato:</strong> horizontal (16:9), salve e envie o link do YouTube.</li>
                      </ul>
                    </section>

                    <section>
                      <h4 className="text-sm font-bold text-sectec-700 mb-2">💡 Dicas</h4>
                      <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
                        <li>Ensaiar antes de gravar ajuda na fluência.</li>
                        <li>Use tópicos em vez de ler um texto longo.</li>
                        <li>Revise o vídeo após a gravação: som, imagem e cobertura de todos os projetos.</li>
                        <li>Escolha um ambiente silencioso e sem interrupções.</li>
                      </ul>
                    </section>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs sm:text-sm text-amber-800">
                      <span className="font-semibold">⚠️ Atenção:</span> É obrigatório que o aluno apareça no vídeo. Vídeos sem a presença do aluno não serão aceitos.
                    </div>
                  </>
                ) : (
                  <>
                    <section>
                      <h4 className="text-sm font-bold text-sectec-700 mb-2">📄 Estrutura do Relatório</h4>
                      <p className="mb-2 text-slate-600 text-xs sm:text-sm">
                        Organize seu relatório em seções bem definidas:
                      </p>
                      <ol className="list-decimal pl-5 space-y-2 text-xs sm:text-sm">
                        <li><strong>Capa</strong> – Nome completo, turma, data.</li>
                        <li><strong>Introdução</strong> – Breve apresentação da modalidade e projetos analisados.</li>
                        <li>
                          <strong>Seções por projeto</strong> (uma para cada projeto):
                          <ul className="list-disc pl-5 mt-1 space-y-1">
                            <li>Título e equipe</li>
                            <li>Resumo da apresentação</li>
                            <li>Análise crítica (objetivos, metodologia, resultados, conclusão)</li>
                            <li>Pontos fortes e sugestões</li>
                          </ul>
                        </li>
                        <li><strong>Considerações finais</strong> – Visão geral e aprendizados.</li>
                      </ol>
                    </section>

                    <section>
                      <h4 className="text-sm font-bold text-sectec-700 mb-2">✏️ Conteúdo</h4>
                      <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
                        <li>Seja pessoal: escreva com suas próprias palavras.</li>
                        <li>Evite apenas descrever; analise criticamente.</li>
                        <li>Use linguagem formal, revise ortografia e gramática.</li>
                        <li>Inclua exemplos do que foi apresentado.</li>
                      </ul>
                    </section>

                    <section>
                      <h4 className="text-sm font-bold text-sectec-700 mb-2">📐 Formatação</h4>
                      <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
                        <li>Fonte: Arial 11 ou Times New Roman 12.</li>
                        <li>Margens: 2,5 cm.</li>
                        <li>Espaçamento 1,5 entre linhas.</li>
                        <li>Salve em PDF e verifique a legibilidade.</li>
                      </ul>
                    </section>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs sm:text-sm text-amber-800">
                      <span className="font-semibold">⚠️ Importante:</span> Inclua <strong>todos</strong> os projetos atribuídos. A falta de algum projeto zerará a nota daquele item.
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}