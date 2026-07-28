// services/coordenacao/components/GestaoProjetosRelatorio.tsx
import { motion } from 'motion/react';
import { PiFunnel, PiMagnifyingGlass, PiPlus } from 'react-icons/pi';
import { Eye, Pencil, Save, Loader2, X } from 'lucide-react';
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
  limit = 10, // valor padrão
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

      {/* Tabela */}
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
          <div className="overflow-x-auto">
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
                      <span className={`inline-block rounded-full px-2 py-1 text-xs font-black uppercase ${
                        item.status === 'distribuido' ? 'bg-emerald-100 text-emerald-800' :
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
    </motion.section>
  );
}