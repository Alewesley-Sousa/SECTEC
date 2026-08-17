// components/ModalQuantidadeLote.tsx
import { useState } from 'react';
import { X, Loader2, Info } from 'lucide-react';
import Swal from 'sweetalert2';
import { useQuantidadeLote } from '../hooks/useQuantidadeLote';

interface Props {
  hook: ReturnType<typeof useQuantidadeLote>;
}

export function ModalQuantidadeLote({ hook }: Props) {
  const [mostrarTodos, setMostrarTodos] = useState(false);

  if (!hook.modalAberto) return null;

  const temExcesso = hook.alunosComExcesso.length > 0;
  const MAX_VISIVEIS = 5;
  const alunosVisiveis = mostrarTodos
    ? hook.alunosComExcesso
    : hook.alunosComExcesso.slice(0, MAX_VISIVEIS);
  const restante = hook.alunosComExcesso.length - MAX_VISIVEIS;
  const totalRemovidos = hook.alunosComExcesso.reduce((s, a) => s + a.faltam, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-5 sm:p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg sm:text-xl font-black text-slate-900">
            Definir quantidade em lote
          </h3>
          <button onClick={hook.fechar} className="p-2 rounded-full hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-black text-slate-700">
                Nova quantidade por aluno
              </label>
              <button
                type="button"
                onClick={() =>
                  Swal.fire({
                    title: 'Aviso sobre redução',
                    html: `
                      <div style="text-align: left; font-size: 14px; color: #334155;">
                        <p>Ao definir uma quantidade <strong>menor</strong> que os projetos já atribuídos a um aluno, 
                        os projetos excedentes serão <strong style="color:#dc2626;">automaticamente removidos</strong> 
                        da lista daquele aluno.</p>
                        <p style="margin-top: 8px;">Certifique-se de que essa ação é realmente desejada antes de prosseguir.</p>
                      </div>`,
                    icon: 'info',
                    confirmButtonColor: '#0f766e',
                  })
                }
                className="text-sectec-600 hover:text-sectec-700"
                title="Como funciona a redução?"
              >
                <Info size={18} />
              </button>
            </div>
            <input
              type="number"
              min="0"
              value={hook.quantidade}
              onChange={(e) => hook.setQuantidade(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sectec-500"
            />
          </div>

          <div className="flex items-center gap-2 hidden">
            <input
              type="checkbox"
              checked={hook.aplicarParaTodos}
              onChange={() => hook.setAplicarParaTodos(!hook.aplicarParaTodos)}
              className="h-4 w-4 accent-sectec-600"
            />
            <label className="text-sm font-black text-slate-700">
              Aplicar para todos os alunos
            </label>
          </div>

          {!hook.aplicarParaTodos && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              ⚠️ Seleção individual ainda não implementada.
            </div>
          )}

          {temExcesso && (
            <div className="rounded-2xl border border-red-200 bg-white shadow-sm overflow-hidden">
              {/* Cabeçalho do alerta */}
              <div className="flex items-center gap-3 bg-red-50 px-4 py-3 border-b border-red-100">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <span className="text-sm font-black">!</span>
                </span>
                <div>
                  <p className="text-sm font-bold text-red-800">
                    {hook.alunosComExcesso.length} aluno(s) afetado(s)
                  </p>
                  <p className="text-xs text-red-600">
                    A nova quantidade é menor que os projetos já atribuídos.
                  </p>
                </div>
              </div>

              {/* Lista de alunos afetados */}
              <div className="max-h-56 overflow-y-auto divide-y divide-red-50">
                {alunosVisiveis.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-red-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-700">
                        {a.nome
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {a.nome}
                        </p>
                        <p className="text-xs text-slate-400">ID #{a.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 text-right shrink-0">
                      <div className="text-xs text-slate-500">
                        <span className="font-medium text-slate-700">{a.totalAtribuidos}</span> atrib.
                      </div>
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                        –{a.faltam}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Botão "mostrar mais" */}
                {restante > 0 && !mostrarTodos && (
                  <button
                    onClick={() => setMostrarTodos(true)}
                    className="w-full px-4 py-2.5 text-center text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    + mostrar mais {restante} aluno(s)
                  </button>
                )}
              </div>

              {/* Checkbox de confirmação */}
              <label className="flex items-start gap-3 px-4 py-3 bg-red-50/50 border-t border-red-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hook.concordouReducao}
                  onChange={() => hook.setConcordouReducao(!hook.concordouReducao)}
                  className="mt-0.5 h-4 w-4 accent-sectec-600 rounded"
                />
                <span className="text-xs font-medium text-red-800 leading-relaxed">
                  Compreendo que os <strong>{totalRemovidos} projetos excedentes</strong> serão removidos permanentemente.
                </span>
              </label>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={hook.fechar}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              onClick={() => hook.salvar(temExcesso ? hook.concordouReducao : false)}
              disabled={hook.salvando || (temExcesso && !hook.concordouReducao)}
              className="rounded-xl bg-sectec-700 px-4 py-2 text-sm font-black text-white hover:bg-sectec-800 disabled:opacity-60"
            >
              {hook.salvando ? <Loader2 className="animate-spin" size={16} /> : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}