// components/ModalVisualizarRemover.tsx
import { X, Loader2, Trash2, CheckSquare, Square } from 'lucide-react';
import { PiTrash } from 'react-icons/pi';
import { useVisualizacaoRemocao } from '../hooks/useVisualizacaoRemocao';
import { TooltipPortal } from './TooltipPortal';

interface Props {
  hook: ReturnType<typeof useVisualizacaoRemocao>;
  onSuccess: () => void;
}

export function ModalVisualizarRemover({ hook, onSuccess }: Props) {
  if (!hook.modalAberto || !hook.aluno) return null;

  const todosIds = hook.aluno.projetos_atribuidos.map((p) => p.id);
  const todosSelecionados = todosIds.length > 0 && hook.selecionados.length === todosIds.length;
  const algumSelecionado = hook.selecionados.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-4 sm:p-6 shadow-2xl">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-xl font-black text-slate-900 truncate">
            Projetos de {hook.aluno.aluno.nome}
          </h3>
          <button onClick={hook.fechar} className="p-2 rounded-full hover:bg-slate-100 shrink-0">
            <X size={20} />
          </button>
        </div>

        {/* Info + ações em massa */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-xs sm:text-sm text-slate-600">
            <strong>{hook.aluno.projetos_atribuidos.length}</strong> projetos atribuídos
            {hook.aluno.quantidade_projetos > 0 && (
              <> de <strong>{hook.aluno.quantidade_projetos}</strong> permitidos</>
            )}
          </p>

          {hook.aluno.projetos_atribuidos.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={hook.selecionarTodos}
                className="text-xs font-semibold text-slate-600 hover:text-sectec-700 underline"
              >
                {todosSelecionados ? 'Desmarcar todos' : 'Selecionar todos'}
              </button>
              {algumSelecionado && (
                <button
                  onClick={() => hook.removerSelecionados(onSuccess)}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 transition"
                >
                  <Trash2 size={14} />
                  <span className="hidden sm:inline">Remover selecionados</span>
                  <span className="sm:hidden">Remover ({hook.selecionados.length})</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Lista de projetos */}
        {hook.aluno.projetos_atribuidos.length === 0 ? (
          <p className="text-center text-xs sm:text-sm text-slate-500 py-8">
            Nenhum projeto atribuído a este aluno.
          </p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto overflow-x-hidden pr-1">
            {hook.aluno.projetos_atribuidos.map((projeto) => {
              const isSelected = hook.selecionados.includes(projeto.id);
              return (
                <div
                  key={projeto.id}
                  onClick={() => hook.toggleSelecionado(projeto.id)}
                  className={`flex items-center gap-2 sm:gap-3 rounded-xl border p-2.5 sm:p-3 transition cursor-pointer select-none ${
                    isSelected ? 'border-red-300 bg-red-50/50' : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      hook.toggleSelecionado(projeto.id);
                    }
                  }}
                >
                  <span className="shrink-0 text-slate-400 pointer-events-none">
                    {isSelected ? (
                      <CheckSquare size={18} className="text-red-600" />
                    ) : (
                      <Square size={18} />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                      <p className="font-bold text-sm sm:text-base text-slate-900 truncate">
                        {projeto.titulo}
                      </p>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span>Área: {projeto.area || 'Não definida'}</span>
                      <span>{projeto.visualizado ? 'Visualizado' : 'Não visualizado'}</span>
                      <span className="hidden sm:inline">
                        {new Date(projeto.data_atribuicao).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  <TooltipPortal label="Remover projeto">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        hook.removerProjeto(projeto.id, onSuccess);
                      }}
                      disabled={hook.removendoId === projeto.id}
                      className="shrink-0 rounded-xl border border-red-200 bg-red-50 p-1.5 sm:p-2 text-red-600 hover:bg-red-100 disabled:opacity-50"
                    >
                      {hook.removendoId === projeto.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <PiTrash size={16} />
                      )}
                    </button>
                  </TooltipPortal>
                </div>
              );
            })}
          </div>
        )}

        {/* Rodapé com botões Fechar e Remover todos */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => hook.removerTodos(onSuccess)}
            className="inline-flex items-center gap-1 rounded-xl border border-red-300 bg-red-100 px-4 py-2 text-sm font-black text-red-800 hover:bg-red-200 transition"
          >
            <Trash2 size={16} />
            <span className="hidden sm:inline">Remover todos</span>
            <span className="sm:hidden">Todos</span>
          </button>
          <button
            onClick={hook.fechar}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-600 hover:bg-slate-50"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}