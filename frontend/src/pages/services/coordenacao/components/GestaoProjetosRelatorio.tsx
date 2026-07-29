// services/coordenacao/components/GestaoProjetosRelatorio.tsx
import { motion } from 'motion/react';
import { PiFunnel, PiMagnifyingGlass, PiPlus } from 'react-icons/pi';
import { Eye, Pencil, Save, Loader2, X, User } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { Pagination } from '../../../../componentes/PaginationUniversal'; // ajuste o caminho conforme sua estrutura

// Tipos
export interface AlunoRelatorioItem {
  id: number;
  aluno: { nome: string; email: string };
  status: string;
  quantidade_projetos: number;
  projetos_atribuidos?: any[];
}

interface GestaoProjetosRelatorioProps {
  alunos: AlunoRelatorioItem[];
  total: number;
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
  statusFiltro: string;
  setStatusFiltro: (status: string) => void;
  nomeFiltro: string;
  setNomeFiltro: (nome: string) => void;
  carregando: boolean;
  erro: string;
  carregarDados: () => void;
  limit?: number; // itens por página (opcional, padrão 10)

  distribuicao: {
    handleDistribuir: () => void;
    distribuindo: boolean;
  };
  atribuicao: {
    abrir: (item: AlunoRelatorioItem) => void;
  };
  quantidadeInd: {
    editandoId: number | null;
    setEditandoId: (id: number | null) => void;
    novoValor: number | null;
    setNovoValor: (val: number | null) => void;
    salvar: (id: number) => void;
  };
  visualizacao: {
    abrir: (item: AlunoRelatorioItem) => void;
  };
  lote: {
    abrir: () => void;
  };
}

export function GestaoProjetosRelatorio({
  alunos,
  total,
  page,
  setPage,
  totalPages,
  statusFiltro,
  setStatusFiltro,
  nomeFiltro,
  setNomeFiltro,
  carregando,
  erro,
  carregarDados,
  limit = 10,
  distribuicao,
  atribuicao,
  quantidadeInd,
  visualizacao,
  lote,
}: GestaoProjetosRelatorioProps) {
  return (
    <motion.section
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-sectec-100 bg-sectec-50 text-sectec-700">
            <PiFunnel size={20} />
          </span>
          <div>
            <h2 className="text-base font-black text-slate-900">Lista de Alunos</h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
              Gerencie a quantidade de projetos por aluno e visualize os projetos já atribuídos.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={distribuicao.handleDistribuir}
            disabled={distribuicao.distribuindo}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-700 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-70"
          >
            {distribuicao.distribuindo ? <Loader2 className="animate-spin" size={16} /> : <PiPlus size={16} />}
            {distribuicao.distribuindo ? 'Distribuindo...' : 'Distribuir Projetos'}
          </button>
          <button
            onClick={lote.abrir}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
          >
            <Pencil size={16} />
            Definir quantidade em lote
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="mt-5 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <PiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input
            value={nomeFiltro}
            onChange={(e) => setNomeFiltro(e.target.value)}
            placeholder="Buscar por nome"
            className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-semibold outline-none focus:border-sectec-500"
          />
        </div>
        <select
          value={statusFiltro}
          onChange={(e) => setStatusFiltro(e.target.value)}
          className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-black outline-none focus:border-sectec-500"
        >
          <option value="">Todos os status</option>
          <option value="pendente">Pendente</option>
          <option value="distribuido">Distribuído</option>
          <option value="enviado">Enviado</option>
          <option value="finalizado">Finalizado</option>
        </select>
      </div>

      {/* Tabela / Cards responsivos */}
      <motion.div
        className="mt-6 overflow-hidden rounded-2xl border border-slate-200 min-h-[300px]"
        animate={{ opacity: carregando ? 0.8 : 1 }}
        transition={{ duration: 0.3 }}
      >
        {carregando && (
          <div className="space-y-3 p-6">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-12 rounded-xl bg-gradient-to-r from-emerald-50 via-emerald-100 to-emerald-50 animate-pulse"
                style={{ animationDelay: `${i * 0.1}s`, backgroundSize: '200% 100%' }}
              />
            ))}
          </div>
        )}
        {erro && <div className="p-4 text-center text-red-600">{erro}</div>}
        {!carregando && !erro && (
          <>
            {/* Desktop: tabela normal */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full min-w-[700px] text-sm">
                <thead className="bg-slate-50 text-left text-[11px] font-black uppercase tracking-widest text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Nome</th>
                    <th className="px-4 py-3">E-mail</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Quantidade</th>
                    <th className="px-4 py-3">Atribuídos</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {alunos.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-black text-slate-900">{item.aluno.nome}</td>
                      <td className="px-4 py-3 text-slate-600">{item.aluno.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2 py-1 text-xs font-black uppercase ${item.status === 'distribuido' ? 'bg-emerald-100 text-emerald-800' :
                            item.status === 'pendente' ? 'bg-amber-100 text-amber-800' :
                              item.status === 'enviado' ? 'bg-blue-100 text-blue-800' :
                                'bg-slate-100 text-slate-600'
                          }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {quantidadeInd.editandoId === item.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              value={quantidadeInd.novoValor ?? item.quantidade_projetos}
                              onChange={(e) => quantidadeInd.setNovoValor(Number(e.target.value))}
                              className="w-20 rounded-xl border border-slate-200 px-2 py-1 text-sm"
                            />
                            <button
                              onClick={() => quantidadeInd.salvar(item.id)}
                              className="text-emerald-600 hover:text-emerald-800"
                            >
                              <Save size={16} />
                            </button>
                            <button
                              onClick={() => { quantidadeInd.setEditandoId(null); quantidadeInd.setNovoValor(null); }}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <span className="font-bold">{item.quantidade_projetos}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-700">{item.projetos_atribuidos?.length || 0}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Tooltip label="Ver projetos">
                            <button
                              onClick={() => visualizacao.abrir(item)}
                              className="rounded-xl border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                            >
                              <Eye size={16} />
                            </button>
                          </Tooltip>
                          {quantidadeInd.editandoId !== item.id && (
                            <>
                              <Tooltip label="Atribuir projetos">
                                <button
                                  onClick={() => atribuicao.abrir(item)}
                                  className="rounded-xl border border-emerald-200 bg-emerald-50 p-1.5 text-emerald-700 hover:bg-emerald-100"
                                >
                                  <PiPlus size={16} />
                                </button>
                              </Tooltip>
                              <button
                                onClick={() => {
                                  quantidadeInd.setEditandoId(item.id);
                                  quantidadeInd.setNovoValor(item.quantidade_projetos);
                                }}
                                className="rounded-xl border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                              >
                                <Pencil size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {alunos.length === 0 && (
                    <tr><td colSpan={6} className="p-6 text-center text-slate-500">Nenhum aluno encontrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile: cards empilhados */}
            <div className="sm:hidden divide-y divide-slate-100">
              {alunos.length === 0 && (
                <div className="p-6 text-center text-slate-500">Nenhum aluno encontrado.</div>
              )}
              {alunos.map((item) => (
                <div key={item.id} className="p-4 space-y-3">
                  {/* Nome e status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <User size={16} className="text-slate-400 shrink-0" />
                      <span className="font-black text-slate-900 truncate">{item.aluno.nome}</span>
                    </div>
                    <span className={`inline-block rounded-full px-2 py-1 text-xs font-black uppercase ${item.status === 'distribuido' ? 'bg-emerald-100 text-emerald-800' :
                        item.status === 'pendente' ? 'bg-amber-100 text-amber-800' :
                          item.status === 'enviado' ? 'bg-blue-100 text-blue-800' :
                            'bg-slate-100 text-slate-600'
                      }`}>
                      {item.status}
                    </span>
                  </div>

                  {/* E-mail */}
                  <p className="text-xs text-slate-500 break-all">{item.aluno.email}</p>

                  {/* Quantidade e atribuídos */}
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Qtd:</span>{' '}
                      {quantidadeInd.editandoId === item.id ? (
                        <span className="inline-flex items-center gap-2 ml-1">
                          <input
                            type="number"
                            min="0"
                            value={quantidadeInd.novoValor ?? item.quantidade_projetos}
                            onChange={(e) => quantidadeInd.setNovoValor(Number(e.target.value))}
                            className="w-16 rounded-xl border border-slate-200 px-2 py-0.5 text-sm"
                          />
                          <button onClick={() => quantidadeInd.salvar(item.id)} className="text-emerald-600">
                            <Save size={16} />
                          </button>
                          <button onClick={() => { quantidadeInd.setEditandoId(null); quantidadeInd.setNovoValor(null); }} className="text-slate-400">
                            <X size={16} />
                          </button>
                        </span>
                      ) : (
                        <span className="font-bold text-slate-700 ml-1">{item.quantidade_projetos}</span>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-500">Atribuídos:</span>{' '}
                      <span className="font-bold text-slate-700">{item.projetos_atribuidos?.length || 0}</span>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <Tooltip label="Ver projetos">
                      <button
                        onClick={() => visualizacao.abrir(item)}
                        className="rounded-xl border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                      >
                        <Eye size={16} />
                      </button>
                    </Tooltip>
                    {quantidadeInd.editandoId !== item.id && (
                      <>
                        <Tooltip label="Atribuir projetos">
                          <button
                            onClick={() => atribuicao.abrir(item)}
                            className="rounded-xl border border-emerald-200 bg-emerald-50 p-1.5 text-emerald-700 hover:bg-emerald-100"
                          >
                            <PiPlus size={16} />
                          </button>
                        </Tooltip>
                        <button
                          onClick={() => {
                            quantidadeInd.setEditandoId(item.id);
                            quantidadeInd.setNovoValor(item.quantidade_projetos);
                          }}
                          className="rounded-xl border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                        >
                          <Pencil size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>

      {/* Paginação Universal */}
      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        total={total}
        limit={limit}
      />
      {/* Botões de rolagem rápida (mobile) */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2 sm:hidden z-40">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-slate-200 shadow-lg text-slate-600 hover:bg-slate-50 active:scale-95 transition"
          aria-label="Ir para o topo"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m18 15-6-6-6 6" />
          </svg>
        </button>
        <button
          onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-slate-200 shadow-lg text-slate-600 hover:bg-slate-50 active:scale-95 transition"
          aria-label="Ir para o final"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>
    </motion.section>
  );
}