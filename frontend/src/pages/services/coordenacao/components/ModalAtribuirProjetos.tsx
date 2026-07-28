// components/ModalAtribuirProjetos.tsx
import { X, Loader2, Search, CheckCircle2 } from 'lucide-react';
import { useAtribuicaoManual } from '../hooks/useAtribuicaoManual';

interface Props {
  hook: ReturnType<typeof useAtribuicaoManual>;
}

export function ModalAtribuirProjetos({ hook }: Props) {
  if (!hook.modalAberto || !hook.alunoSelecionado) return null;

  const { alunoSelecionado, projetosDisponiveis, projetosSelecionados, carregando, atribuindo } = hook;
  const totalAtribuidos = alunoSelecionado.projetos_atribuidos.length;
  const limite = alunoSelecionado.quantidade_projetos;
  const vagasRestantes = limite - totalAtribuidos;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-5 sm:p-6 shadow-2xl">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg sm:text-xl font-black text-slate-900 truncate">
            Atribuir projetos para {alunoSelecionado.aluno.nome}
          </h3>
          <button onClick={hook.fechar} className="p-2 rounded-full hover:bg-slate-100 shrink-0">
            <X size={20} />
          </button>
        </div>

        {/* Info de vagas */}
        <div className="mb-4 p-3 bg-slate-50 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Projetos já atribuídos:{' '}
              <strong className="text-slate-900">{totalAtribuidos}</strong> de{' '}
              <strong className="text-slate-900">{limite}</strong>
            </p>
            {vagasRestantes > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                {vagasRestantes} vaga(s) livre(s)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-800">
                Limite atingido
              </span>
            )}
          </div>
        </div>

        {/* Campo de busca */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            value={hook.busca}
            onChange={(e) => {
              hook.setBusca(e.target.value);
              hook.buscar(e.target.value);
            }}
            placeholder="Buscar projetos por título, área ou autor..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-sectec-500 focus:bg-white"
          />
          {hook.busca && (
            <button
              onClick={() => {
                hook.setBusca('');
                hook.buscar('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Lista de projetos */}
        {carregando ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : projetosDisponiveis.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Search size={40} className="mb-3 opacity-50" />
            <p className="text-sm font-medium">Nenhum projeto disponível.</p>
            <p className="text-xs">Tente alterar o termo de busca.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {projetosDisponiveis.map((projeto) => {
              const isSelected = projetosSelecionados.includes(projeto.id);
              const desabilitado = !isSelected && projetosSelecionados.length >= vagasRestantes;

              return (
                <label
                  key={projeto.id}
                  className={`relative flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition-all duration-200 hover:shadow-md ${
                    isSelected
                      ? 'border-emerald-400 bg-emerald-50/50 shadow-sm'
                      : desabilitado
                      ? 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  {/* Checkbox customizado */}
                  <div className="flex h-5 w-5 items-center justify-center shrink-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={desabilitado}
                      onChange={() => hook.toggleProjeto(projeto.id)}
                      className="peer sr-only"
                    />
                    <div
                      className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500'
                          : 'border-slate-300 bg-white'
                      } ${desabilitado ? 'opacity-50' : ''}`}
                    >
                      {isSelected && <CheckCircle2 size={14} className="text-white" />}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 leading-tight truncate">
                      {projeto.titulo}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
                        {projeto.tema?.nome || 'Sem área'}
                      </span>
                      <span className="text-slate-500">
                        por{' '}
                        <span className="font-medium text-slate-700">
                          {projeto.alunoAutor?.nome || 'Desconhecido'}
                        </span>
                      </span>
                      {projeto.alunoAutor?.turma && (
                        <span className="text-slate-400">• {projeto.alunoAutor.turma}</span>
                      )}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        )}

        {/* Rodapé */}
        <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
          <button
            onClick={hook.fechar}
            className="w-full sm:w-auto rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            onClick={hook.atribuir}
            disabled={atribuindo || projetosSelecionados.length === 0}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-sectec-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-sectec-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {atribuindo ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <span>Atribuir{projetosSelecionados.length > 0 ? ` (${projetosSelecionados.length})` : ''}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}