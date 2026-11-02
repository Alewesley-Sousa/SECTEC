// components/ModalAtribuirProjetos.tsx
import { X, Loader2, Search, CheckCircle2, User, FileText, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';
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

  // Função para confirmar a troca antes de executar a lógica do hook
  const handleConfirmarAtribuicao = async () => {
    if (projetosSelecionados.length === 0) return;

    const confirmacao = await Swal.fire({
      icon: 'question',
      title: 'Confirmar atribuição?',
      html: `
        <p class="text-slate-600 text-sm">
          Você está prestes a atribuir <strong>${projetosSelecionados.length} projeto(s)</strong> para o aluno:
        </p>
        <p class="text-slate-900 font-bold text-lg mt-2 mb-4">${alunoSelecionado.aluno.nome}</p>
        <p class="text-slate-500 text-xs">Essa ação moverá o aluno para os projetos selecionados.</p>
      `,
      showCancelButton: true,
      confirmButtonText: 'Sim, atribuir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#15803d',
      cancelButtonColor: '#64748b',
    });

    if (confirmacao.isConfirmed) {
      hook.atribuir();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl overflow-hidden">
        
        {/* Cabeçalho Fixo */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white p-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sectec-100 text-sectec-700">
              <User size={20} />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 truncate">
                Trocando Aluno
              </h3>
              <p className="text-sm font-medium text-slate-500">
                {alunoSelecionado.aluno.nome} • {alunoSelecionado.aluno.email}
              </p>
            </div>
          </div>
          <button onClick={hook.fechar} className="p-2 rounded-full hover:bg-slate-100 shrink-0 transition-colors text-slate-400 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>

        {/* Corpo com scroll */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          
          {/* Resumo do Aluno (Status e Vagas) */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Situação Atual</p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-black text-slate-800">{totalAtribuidos}</span>
                <span className="text-sm font-medium text-slate-500 mb-1">/ {limite} projetos atribuídos</span>
              </div>
            </div>
            
            <div className={`flex-1 rounded-2xl border p-4 ${vagasRestantes > 0 ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
              <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${vagasRestantes > 0 ? 'text-emerald-600' : 'text-amber-600'}`}>Disponibilidade</p>
              <div className="flex items-center gap-2">
                {vagasRestantes > 0 ? (
                  <>
                    <CheckCircle2 size={20} className="text-emerald-600" />
                    <span className="text-sm font-bold text-emerald-800">{vagasRestantes} vaga(s) livre(s) para atribuir</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={20} className="text-amber-600" />
                    <span className="text-sm font-bold text-amber-800">Limite de projetos atingido</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Projetos Atuais (se houver) */}
          {alunoSelecionado.projetos_atribuidos.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <FileText size={16} className="text-slate-400" /> Projetos já atribuídos a este aluno
              </h4>
              <div className="flex flex-wrap gap-2">
                {alunoSelecionado.projetos_atribuidos.map((p: any) => (
                  <span key={p.id} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm">
                    {p.titulo}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Busca */}
          <div className="relative mb-4">
            <h4 className="text-sm font-bold text-slate-700 mb-2">Selecionar novos projetos</h4>
            <Search className="absolute left-3 top-[2.1rem] text-slate-400" size={18} />
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
                className="absolute right-3 top-[2.3rem] text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Lista de projetos */}
          {carregando ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
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
            <div className="space-y-3">
              {projetosDisponiveis.map((projeto) => {
                const isSelected = projetosSelecionados.includes(projeto.id);
                const desabilitado = !isSelected && projetosSelecionados.length >= vagasRestantes;

                return (
                  <label
                    key={projeto.id}
                    className={`relative flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition-all duration-200 hover:shadow-md ${
                      isSelected
                        ? 'border-sectec-500 bg-sectec-50/40 shadow-sm ring-1 ring-sectec-500'
                        : desabilitado
                        ? 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed'
                        : 'border-slate-200 bg-white hover:border-sectec-300'
                    }`}
                  >
                    <div className="flex h-5 w-5 items-center justify-center shrink-0 mt-0.5">
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
                            ? 'border-sectec-600 bg-sectec-600'
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
                          {projeto.area?.nome || 'Sem área'}
                        </span>
                        <span className="text-slate-500">
                          por <span className="font-medium text-slate-700">{projeto.alunoAutor?.nome || 'Desconhecido'}</span>
                        </span>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Rodapé Fixo */}
        <div className="border-t border-slate-200 bg-slate-50 p-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-slate-500 font-medium text-center sm:text-left">
            {projetosSelecionados.length} projeto(s) selecionado(s)
          </p>
          <div className="flex w-full sm:w-auto gap-3">
            <button
              onClick={hook.fechar}
              className="flex-1 sm:flex-none rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmarAtribuicao}
              disabled={atribuindo || projetosSelecionados.length === 0}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-sectec-700 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-sectec-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {atribuindo ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <span>Atribuir Projetos</span>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
