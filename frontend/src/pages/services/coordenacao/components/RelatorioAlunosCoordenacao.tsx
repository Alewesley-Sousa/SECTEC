// frontend/src/pages/services/coordenacao/components/RelatorioAlunosCoordenacao.tsx
import { useState } from 'react';
import { MainLayout } from '../../../../componentes/SideBarUniversal';
import { RefreshCw, Loader2 } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { GestaoProjetosRelatorio } from './GestaoProjetosRelatorio';
import { ModalAtribuirProjetos } from './ModalAtribuirProjetos';
import { ModalVisualizarRemover } from './ModalVisualizarRemover';
import { ModalQuantidadeLote } from './ModalQuantidadeLote';
import { useRelatorioAlunos } from '../hooks/useRelatorioAlunos';
import { useDistribuicao } from '../hooks/useDistribuicao';
import { useAtribuicaoManual } from '../hooks/useAtribuicaoManual';
import { useQuantidadeIndividual } from '../hooks/useQuantidadeIndividual';
import { useVisualizacaoRemocao } from '../hooks/useVisualizacaoRemocao';
import { useQuantidadeLote } from '../hooks/useQuantidadeLote';
import { MateriaisEnviados } from './MateriaisEnviados';

type Aba = 'gestao' | 'materiais';

export default function RelatorioAlunosCoordenacao() {
    const [abaAtiva, setAbaAtiva] = useState<Aba>('gestao');

    const relatorio = useRelatorioAlunos();
    const distribuicao = useDistribuicao(relatorio.carregarDados);
    const atribuicao = useAtribuicaoManual(relatorio.carregarDados);
    const quantidadeInd = useQuantidadeIndividual(relatorio.carregarDados);
    const visualizacao = useVisualizacaoRemocao();
    const lote = useQuantidadeLote(relatorio.carregarDados);

    return (
        <MainLayout userRole="coordenador">
            <main className="min-h-screen bg-slate-50 px-4 py-5 sm:px-7 sm:py-7">
                <div className="mx-auto w-full max-w-[1500px] space-y-5">
                    {/* Cabeçalho (mantido igual, com os botões de ação removidos) */}
                    <section className="rounded-[2rem] bg-gradient-to-br from-emerald-800 via-emerald-700 to-slate-950 p-6 text-white shadow-sm sm:p-8">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-white/75">
                                    Gestão de Relatórios
                                </span>
                                <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">Alunos na Modalidade Relatório</h1>
                                <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-white/70 sm:text-base">
                                    Gerencie a distribuição de projetos e acompanhe os materiais enviados.
                                </p>
                            </div>

                            {/* Botão de atualizar permanece */}
                            <Tooltip label="Atualizar lista">
                                <button
                                    onClick={relatorio.carregarDados}
                                    disabled={relatorio.carregando}
                                    className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-white/15 sm:w-auto disabled:opacity-70"
                                >
                                    {relatorio.carregando ? <Loader2 className="animate-spin" size={17} /> : <RefreshCw size={17} />}
                                    {relatorio.carregando ? 'Atualizando...' : 'Atualizar'}
                                </button>
                            </Tooltip>
                        </div>

                        {/* Abas de navegação */}
                        <div className="mt-6 flex gap-2">
                            <button
                                onClick={() => setAbaAtiva('gestao')}
                                className={`px-4 py-2 rounded-xl text-sm font-black transition ${abaAtiva === 'gestao'
                                        ? 'bg-white text-emerald-800 shadow'
                                        : 'bg-white/10 text-white hover:bg-white/20'
                                    }`}
                            >
                                Gestão de Projetos
                            </button>
                            <button
                                onClick={() => setAbaAtiva('materiais')}
                                className={`px-4 py-2 rounded-xl text-sm font-black transition ${abaAtiva === 'materiais'
                                        ? 'bg-white text-emerald-800 shadow'
                                        : 'bg-white/10 text-white hover:bg-white/20'
                                    }`}
                            >
                                Materiais Enviados
                            </button>
                        </div>
                    </section>

                    {/* Conteúdo da aba ativa */}
                    {abaAtiva === 'gestao' && (
                        <GestaoProjetosRelatorio
                            alunos={relatorio.alunos}
                            total={relatorio.total}
                            page={relatorio.page}
                            setPage={relatorio.setPage}
                            totalPages={relatorio.totalPages}
                            statusFiltro={relatorio.statusFiltro}
                            setStatusFiltro={relatorio.setStatusFiltro}
                            nomeFiltro={relatorio.nomeFiltro}
                            setNomeFiltro={relatorio.setNomeFiltro}
                            carregando={relatorio.carregando}
                            erro={relatorio.erro}
                            distribuicao={distribuicao}
                            atribuicao={atribuicao}
                            quantidadeInd={quantidadeInd}
                            visualizacao={visualizacao}
                            lote={lote}
                        />
                    )}

                    {abaAtiva === 'materiais' && <MateriaisEnviados />}
                </div>
            </main>

            {/* Modais (mantidos no nível do Dashboard) */}
            <ModalAtribuirProjetos hook={atribuicao} />
            <ModalVisualizarRemover hook={visualizacao} onSuccess={relatorio.carregarDados} />
            <ModalQuantidadeLote hook={lote} />
        </MainLayout>
    );
}