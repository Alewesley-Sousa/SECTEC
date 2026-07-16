// src/pages/RelatorioAlunosCoordenacao.tsx
import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { createPortal } from 'react-dom';

function TooltipPortal({ label, children }: { label: string; children: React.ReactNode }) {
    const [show, setShow] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);

    const updatePosition = () => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        setPosition({
            top: rect.top - 8, // posiciona acima do elemento
            left: rect.left + rect.width / 2,
        });
    };

    useEffect(() => {
        if (show) {
            updatePosition();
            const handleResize = () => updatePosition();
            window.addEventListener('resize', handleResize);
            window.addEventListener('scroll', handleResize, true);
            return () => {
                window.removeEventListener('resize', handleResize);
                window.removeEventListener('scroll', handleResize, true);
            };
        }
    }, [show]);

    return (
        <span
            ref={triggerRef}
            className="inline-flex"
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
        >
            {children}
            {show && createPortal(
                <span
                    className="fixed z-[9999] -translate-x-1/2 whitespace-nowrap rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white shadow-lg"
                    style={{
                        top: position.top - 8,
                        left: position.left,
                        transform: 'translateX(-50%)',
                    }}
                >
                    {label}
                </span>,
                document.body
            )}
        </span>
    );
}
import { MainLayout } from '../../../../componentes/SideBarUniversal';
import Swal from 'sweetalert2';
import {
    PiFunnel,
    PiMagnifyingGlass,
    PiPlus,
    PiTrash,
} from 'react-icons/pi';
import { Eye, Pencil, Save, Loader2, RefreshCw, X } from 'lucide-react';
import {
    listarAlunosRelatorio,
    atualizarQuantidadeProjetos,
    distribuirProjetos,
    atribuirProjetosManualmente,
    removerProjetosManualmente,
    obterProjetosDisponiveis,
    atualizarQuantidadeEmLote,
    type AlunoRelatorioItem,
    type DistribuirProjetosResponse,
    type ProjetoDisponivel,
} from '../relatorios';

function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <span className="group relative inline-flex">
            {children}
            <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white opacity-0 shadow-lg transition group-hover:block group-hover:opacity-100">
                {label}
            </span>
        </span>
    );
}

export default function RelatorioAlunosCoordenacao() {
    const [alunos, setAlunos] = useState<AlunoRelatorioItem[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [statusFiltro, setStatusFiltro] = useState('');
    const [nomeFiltro, setNomeFiltro] = useState('');
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState('');
    const [distribuindo, setDistribuindo] = useState(false);
    const [editandoId, setEditandoId] = useState<number | null>(null);
    const [novoValor, setNovoValor] = useState<number | null>(null);

    // Estados para atribuição manual
    const [modalAtribuirAberto, setModalAtribuirAberto] = useState(false);
    const [alunoSelecionado, setAlunoSelecionado] = useState<AlunoRelatorioItem | null>(null);
    const [projetosDisponiveis, setProjetosDisponiveis] = useState<ProjetoDisponivel[]>([]);
    const [projetosSelecionados, setProjetosSelecionados] = useState<number[]>([]);
    const [buscaProjetos, setBuscaProjetos] = useState('');
    const [carregandoProjetos, setCarregandoProjetos] = useState(false);
    const [atribuindo, setAtribuindo] = useState(false);

    // Estados para visualização/remoção de projetos
    const [modalVisualizarAberto, setModalVisualizarAberto] = useState(false);
    const [alunoVisualizar, setAlunoVisualizar] = useState<AlunoRelatorioItem | null>(null);
    const [removendoProjeto, setRemovendoProjeto] = useState<number | null>(null);

    // Estados para quantidade em lote
    const [modalLoteAberto, setModalLoteAberto] = useState(false);
    const [quantidadeLote, setQuantidadeLote] = useState<number>(1);
    const [aplicarParaTodos, setAplicarParaTodos] = useState(true);
    const [salvandoLote, setSalvandoLote] = useState(false);

    const carregarDados = async () => {
        setCarregando(true);
        setErro('');
        try {
            const fetchPromise = listarAlunosRelatorio({
                status: statusFiltro || undefined,
                nome: nomeFiltro || undefined,
                page,
                limit,
            });
            const delayPromise = new Promise(resolve => setTimeout(resolve, 500));
            const [data] = await Promise.all([fetchPromise, delayPromise]);
            setAlunos(data.data || []);
            setTotal(data.meta?.total || 0);
        } catch (error) {
            setErro('Erro ao carregar dados. Tente novamente.');
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        carregarDados();
    }, [page, statusFiltro, nomeFiltro]);

    const handleSalvarQuantidade = async (id: number) => {
        if (novoValor === null || novoValor < 0) {
            Swal.fire('Atenção', 'Digite um número válido.', 'warning');
            return;
        }
        try {
            await atualizarQuantidadeProjetos(id, novoValor);
            await carregarDados();
            setEditandoId(null);
            setNovoValor(null);
            Swal.fire('Sucesso', 'Quantidade atualizada!', 'success');
        } catch (error) {
            Swal.fire('Erro', 'Não foi possível atualizar.', 'error');
        }
    };

    const handleDistribuir = async () => {
        const confirm = await Swal.fire({
            title: 'Distribuir projetos?',
            text: 'Isso vai atribuir projetos automaticamente para todos os alunos pendentes.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sim, distribuir',
            cancelButtonText: 'Cancelar',
        });
        if (!confirm.isConfirmed) return;

        setDistribuindo(true);
        try {
            const resultado = await distribuirProjetos();
            await carregarDados();
            let mensagem = 'Distribuição concluída!';
            if (resultado.alunos_nao_atendidos?.length > 0) {
                mensagem += ` Atenção: ${resultado.alunos_nao_atendidos.length} alunos não receberam todos os projetos.`;
            }
            Swal.fire('Sucesso', mensagem, 'info');
        } catch (error) {
            Swal.fire('Erro', 'Falha ao distribuir projetos.', 'error');
        } finally {
            setDistribuindo(false);
        }
    };

    const handleAtualizarQuantidadeEmLote = async () => {
        if (quantidadeLote < 0) {
            Swal.fire('Atenção', 'Digite um número válido.', 'warning');
            return;
        }

        setSalvandoLote(true);
        try {
            const resultado = await atualizarQuantidadeEmLote(
                quantidadeLote,
                aplicarParaTodos,
                aplicarParaTodos ? undefined : [] // se não for para todos, enviar lista vazia (ou implementar seleção)
            );
            Swal.fire('Sucesso', resultado.mensagem, 'success');
            setModalLoteAberto(false);
            await carregarDados(); // recarrega a lista
        } catch (error) {
            Swal.fire('Erro', 'Não foi possível atualizar a quantidade.', 'error');
        } finally {
            setSalvandoLote(false);
        }
    };

    // Funções para atribuição manual
    const abrirModalAtribuir = async (aluno: AlunoRelatorioItem) => {
        setAlunoSelecionado(aluno);
        setModalAtribuirAberto(true);
        setProjetosSelecionados([]);
        setBuscaProjetos('');
        await buscarProjetosDisponiveis(aluno.id);
    };

    const buscarProjetosDisponiveis = async (relatorioId: number, search?: string) => {
        setCarregandoProjetos(true);
        try {
            const dados = await obterProjetosDisponiveis(relatorioId, search);
            setProjetosDisponiveis(dados);
        } catch (error) {
            Swal.fire('Erro', 'Não foi possível carregar projetos disponíveis.', 'error');
        } finally {
            setCarregandoProjetos(false);
        }
    };

    const handleAtribuirProjetos = async () => {
        if (!alunoSelecionado || projetosSelecionados.length === 0) {
            Swal.fire('Atenção', 'Selecione pelo menos um projeto.', 'warning');
            return;
        }
        setAtribuindo(true);
        try {
            await atribuirProjetosManualmente(alunoSelecionado.id, projetosSelecionados);
            Swal.fire('Sucesso', 'Projetos atribuídos com sucesso!', 'success');
            setModalAtribuirAberto(false);
            await carregarDados();
        } catch (error) {
            Swal.fire('Erro', 'Falha ao atribuir projetos.', 'error');
        } finally {
            setAtribuindo(false);
        }
    };

    // Funções para visualizar e remover projetos
    const abrirModalVisualizar = (aluno: AlunoRelatorioItem) => {
        setAlunoVisualizar(aluno);
        setModalVisualizarAberto(true);
    };

    const handleRemoverProjeto = async (projetoId: number) => {
        if (!alunoVisualizar) return;

        const confirm = await Swal.fire({
            title: 'Remover projeto?',
            text: `Deseja remover este projeto do aluno ${alunoVisualizar.aluno.nome}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sim, remover',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc2626',
        });

        if (!confirm.isConfirmed) return;

        setRemovendoProjeto(projetoId);
        try {
            await removerProjetosManualmente(alunoVisualizar.id, [projetoId]);

            // Atualizar a lista de alunos (alunos)
            setAlunos(prevAlunos =>
                prevAlunos.map(aluno =>
                    aluno.id === alunoVisualizar.id
                        ? {
                            ...aluno,
                            projetos_atribuidos: aluno.projetos_atribuidos.filter(p => p.id !== projetoId),
                        }
                        : aluno
                )
            );

            // Atualizar o alunoVisualizar (se ainda estiver aberto)
            setAlunoVisualizar(prev =>
                prev
                    ? {
                        ...prev,
                        projetos_atribuidos: prev.projetos_atribuidos.filter(p => p.id !== projetoId),
                    }
                    : null
            );

            Swal.fire('Sucesso', 'Projeto removido com sucesso!', 'success');
        } catch (error) {
            Swal.fire('Erro', 'Não foi possível remover o projeto.', 'error');
        } finally {
            setRemovendoProjeto(null);
        }
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <MainLayout userRole="coordenador">
            <main className="min-h-screen bg-slate-50 px-4 py-5 sm:px-7 sm:py-7">
                <div className="mx-auto w-full max-w-[1500px] space-y-5">
                    {/* Cabeçalho */}
                    <section className="rounded-[2rem] bg-gradient-to-br from-emerald-800 via-emerald-700 to-slate-950 p-6 text-white shadow-sm sm:p-8">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-white/75">
                                    Gestão de Relatórios
                                </span>
                                <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">Alunos na Modalidade Relatório</h1>
                                <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-white/70 sm:text-base">
                                    Lista de alunos com status, quantidade de projetos definida e projetos já atribuídos.
                                    Acompanhe e gerencie a distribuição de projetos.
                                </p>
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row">
                                <Tooltip label="Atualizar lista">
                                    <button
                                        type="button"
                                        onClick={carregarDados}
                                        disabled={carregando}
                                        className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-white/15 sm:w-auto disabled:cursor-not-allowed disabled:opacity-70"
                                    >
                                        {carregando ? <Loader2 className="animate-spin" size={17} /> : <RefreshCw size={17} />}
                                        {carregando ? 'Atualizando...' : 'Atualizar'}
                                    </button>
                                </Tooltip>
                                <button
                                    type="button"
                                    onClick={handleDistribuir}
                                    disabled={distribuindo}
                                    className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-emerald-800 shadow-sm transition hover:bg-emerald-50 sm:w-auto disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {distribuindo ? <Loader2 className="animate-spin" size={17} /> : <PiPlus size={17} />}
                                    {distribuindo ? 'Distribuindo...' : 'Distribuir Projetos'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setModalLoteAberto(true)}
                                    className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-white/15 sm:w-auto"
                                >
                                    <Pencil size={17} />
                                    Definir quantidade em lote
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Painel de conteúdo */}
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
                                            style={{
                                                animationDelay: `${i * 0.1}s`,
                                                backgroundSize: '200% 100%',
                                            }}
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
                                                        <span className={`inline-block rounded-full px-2 py-1 text-xs font-black uppercase ${item.status === 'distribuido' ? 'bg-emerald-100 text-emerald-800' :
                                                            item.status === 'pendente' ? 'bg-amber-100 text-amber-800' :
                                                                'bg-slate-100 text-slate-600'
                                                            }`}>
                                                            {item.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {editandoId === item.id ? (
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    value={novoValor ?? item.quantidade_projetos}
                                                                    onChange={(e) => setNovoValor(Number(e.target.value))}
                                                                    className="w-20 rounded-xl border border-slate-200 px-2 py-1 text-sm"
                                                                />
                                                                <button
                                                                    onClick={() => handleSalvarQuantidade(item.id)}
                                                                    className="text-emerald-600 hover:text-emerald-800"
                                                                >
                                                                    <Save size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => { setEditandoId(null); setNovoValor(null); }}
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
                                                                    onClick={() => abrirModalVisualizar(item)}
                                                                    className="rounded-xl border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                                                                >
                                                                    <Eye size={16} />
                                                                </button>
                                                            </Tooltip>
                                                            {editandoId !== item.id && (
                                                                <>
                                                                    <Tooltip label="Atribuir projetos">
                                                                        <button
                                                                            onClick={() => abrirModalAtribuir(item)}
                                                                            className="rounded-xl border border-emerald-200 bg-emerald-50 p-1.5 text-emerald-700 hover:bg-emerald-100"
                                                                        >
                                                                            <PiPlus size={16} />
                                                                        </button>
                                                                    </Tooltip>
                                                                    <button
                                                                        onClick={() => { setEditandoId(item.id); setNovoValor(item.quantidade_projetos); }}
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

                        {/* Paginação */}
                        {totalPages > 1 && (
                            <div className="mt-4 flex items-center justify-between gap-3 text-sm font-semibold text-slate-600">
                                <span>Página {page} de {totalPages}</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="rounded-xl border border-slate-200 px-3 py-2 disabled:opacity-50"
                                    >
                                        Anterior
                                    </button>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="rounded-xl border border-slate-200 px-3 py-2 disabled:opacity-50"
                                    >
                                        Próxima
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.section>
                </div>
            </main>

            {/* Modal de atribuição manual */}
            {modalAtribuirAberto && alunoSelecionado && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm">
                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-black text-slate-900">
                                Atribuir projetos para {alunoSelecionado.aluno.nome}
                            </h3>
                            <button
                                onClick={() => setModalAtribuirAberto(false)}
                                className="p-2 rounded-full hover:bg-slate-100"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm text-slate-600">
                                Projetos já atribuídos: <strong>{alunoSelecionado.projetos_atribuidos.length}</strong> de{' '}
                                <strong>{alunoSelecionado.quantidade_projetos}</strong> permitidos.
                            </p>
                            <div className="relative mt-3">
                                <PiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                                <input
                                    value={buscaProjetos}
                                    onChange={(e) => {
                                        setBuscaProjetos(e.target.value);
                                        buscarProjetosDisponiveis(alunoSelecionado.id, e.target.value);
                                    }}
                                    placeholder="Buscar projetos por título..."
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-sectec-500"
                                />
                            </div>
                        </div>

                        {carregandoProjetos ? (
                            <div className="space-y-2">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
                                ))}
                            </div>
                        ) : projetosDisponiveis.length === 0 ? (
                            <p className="text-center text-sm text-slate-500 py-8">Nenhum projeto disponível para atribuição.</p>
                        ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {projetosDisponiveis.map((projeto) => {
                                    const isSelected = projetosSelecionados.includes(projeto.id);
                                    return (
                                        <label
                                            key={projeto.id}
                                            className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:bg-slate-50'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => {
                                                    setProjetosSelecionados(prev =>
                                                        prev.includes(projeto.id)
                                                            ? prev.filter(id => id !== projeto.id)
                                                            : [...prev, projeto.id]
                                                    );
                                                }}
                                                className="h-4 w-4 accent-sectec-600"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-slate-900">{projeto.titulo}</p>
                                                <p className="text-xs text-slate-500">
                                                    {projeto.tema?.nome || 'Sem tema'} • {projeto.alunoAutor?.nome || 'Sem autor'}
                                                </p>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        )}

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setModalAtribuirAberto(false)}
                                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-600 hover:bg-slate-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAtribuirProjetos}
                                disabled={atribuindo || projetosSelecionados.length === 0}
                                className="rounded-xl bg-sectec-700 px-4 py-2 text-sm font-black text-white hover:bg-sectec-800 disabled:opacity-60"
                            >
                                {atribuindo ? <Loader2 className="animate-spin" size={16} /> : 'Atribuir'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de visualização e remoção de projetos */}
            {modalVisualizarAberto && alunoVisualizar && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm">
                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-black text-slate-900">
                                Projetos de {alunoVisualizar.aluno.nome}
                            </h3>
                            <button
                                onClick={() => setModalVisualizarAberto(false)}
                                className="p-2 rounded-full hover:bg-slate-100"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm text-slate-600">
                                <strong>{alunoVisualizar.projetos_atribuidos.length}</strong> projetos atribuídos
                                {alunoVisualizar.quantidade_projetos > 0 && (
                                    <> de <strong>{alunoVisualizar.quantidade_projetos}</strong> permitidos</>
                                )}
                            </p>
                        </div>

                        {alunoVisualizar.projetos_atribuidos.length === 0 ? (
                            <p className="text-center text-sm text-slate-500 py-8">Nenhum projeto atribuído a este aluno.</p>
                        ) : (
                            <div className="space-y-3 max-h-60 overflow-y-auto overflow-x-hidden pr-1">
                                {alunoVisualizar.projetos_atribuidos.length === 0 ? (
                                    <p className="text-center text-sm text-slate-500 py-4">Nenhum projeto atribuído.</p>
                                ) : (
                                    alunoVisualizar.projetos_atribuidos.map((projeto) => (
                                        <div
                                            key={projeto.id}
                                            className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-300"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                                                    <p className="font-bold text-slate-900 truncate">{projeto.titulo}</p>
                                                </div>
                                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                                                    <span className="flex items-center gap-1">
                                                        <span className="font-medium text-slate-600">Área:</span> {projeto.area || 'Não definida'}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <span className={`inline-block h-1.5 w-1.5 rounded-full ${projeto.visualizado ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                                                        {projeto.visualizado ? 'Visualizado' : 'Não visualizado'}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">
                                                        {new Date(projeto.data_atribuicao).toLocaleDateString('pt-BR')}
                                                    </span>
                                                </div>
                                            </div>
                                            <TooltipPortal label="Remover projeto">
                                                <button
                                                    onClick={() => handleRemoverProjeto(projeto.id)}
                                                    disabled={removendoProjeto === projeto.id}
                                                    className="rounded-xl z-20 border border-red-200 bg-red-50 p-2 text-red-600 transition hover:bg-red-100 hover:text-red-700 disabled:opacity-50 flex-shrink-0"
                                                >
                                                    {removendoProjeto === projeto.id ? (
                                                        <Loader2 size={16} className="animate-spin" />
                                                    ) : (
                                                        <PiTrash size={16} />
                                                    )}
                                                </button>
                                            </TooltipPortal>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setModalVisualizarAberto(false)}
                                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-600 hover:bg-slate-50"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}



            {modalLoteAberto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-black text-slate-900">Definir quantidade em lote</h3>
                            <button onClick={() => setModalLoteAberto(false)} className="p-2 rounded-full hover:bg-slate-100">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-black text-slate-700">Nova quantidade por aluno</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={quantidadeLote}
                                    onChange={(e) => setQuantidadeLote(Number(e.target.value))}
                                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sectec-500"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={aplicarParaTodos}
                                    onChange={() => setAplicarParaTodos(!aplicarParaTodos)}
                                    className="h-4 w-4 accent-sectec-600"
                                />
                                <label className="text-sm font-black text-slate-700">Aplicar para todos os alunos</label>
                            </div>
                            {!aplicarParaTodos && (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                    ⚠️ Seleção individual ainda não implementada. Use "Aplicar para todos" por enquanto.
                                </div>
                            )}
                            <div className="flex justify-end gap-3 mt-4">
                                <button onClick={() => setModalLoteAberto(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-600 hover:bg-slate-50">
                                    Cancelar
                                </button>
                                <button onClick={handleAtualizarQuantidadeEmLote} disabled={salvandoLote} className="rounded-xl bg-sectec-700 px-4 py-2 text-sm font-black text-white hover:bg-sectec-800 disabled:opacity-60">
                                    {salvandoLote ? <Loader2 className="animate-spin" size={16} /> : 'Salvar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}