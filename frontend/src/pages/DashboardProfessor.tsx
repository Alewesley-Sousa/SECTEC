import { MainLayout } from "../componentes/SideBarUniversal";

function DashboardProfessor() {
  return (
    <MainLayout userRole="Professor">
  <div className="max-w-6xl mx-auto py-8 px-4 font-sans text-slate-900">
    
    {/* Cabeçalho Minimalista */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 pb-6 border-b border-slate-200">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Painel do Orientador</h1>
        <p className="text-slate-500 text-sm">Bem-vindo à área de gestão da SECTEC 2026.</p>
      </div>
      <div className="flex gap-3 mt-4 sm:mt-0">
        <button className="h-10 px-4 text-sm font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 transition">Mensagens</button>
        <button className="h-10 px-4 text-sm font-semibold bg-black text-white rounded-lg hover:bg-slate-800 transition">Criar Projeto</button>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      
      {/* Coluna de Atividade (Esquerda - 4 colunas) */}
      <div className="lg:col-span-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">Atividade Recente</h3>
        
        <div className="space-y-8 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
          {/* Item 1 */}
          <div className="relative flex gap-4">
            <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center z-10 shrink-0">
              <div className="w-2 h-2 rounded-full bg-sectec-500"></div>
            </div>
            <div>
              <p className="text-sm leading-relaxed">
                <span className="font-semibold text-slate-900">Marta Rocha</span> comentou no documento de robótica.
              </p>
              <span className="text-[11px] text-slate-400">Há 10 min</span>
            </div>
          </div>

          {/* Item 2 */}
          <div className="relative flex gap-4">
            <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center z-10 shrink-0">
              <div className="w-2 h-2 rounded-full bg-slate-300"></div>
            </div>
            <div>
              <p className="text-sm leading-relaxed">Novo resumo submetido pela Turma 2º B.</p>
              <span className="text-[11px] text-slate-400">Ontem às 15:20</span>
            </div>
          </div>
        </div>
      </div>
      {/* Fim da Coluna de Atividade */}
      
      {/* Coluna de Tarefas (Direita - 8 colunas) */}
      <div className="lg:col-span-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Tarefas Pendentes</h3>
          <button className="text-xs font-bold text-sectec-600 hover:underline">+ Nova Tarefa</button>
        </div>

        <div className="space-y-3">
          {/* Card de Tarefa Estilo "Apple/Modern" */}
          {[
            { t: "Validar grupos de pesquisa", d: "Hoje 12:00", p: "Importante" },
            { t: "Revisar normas da SECTEC", d: "Amanhã 09:00", p: "Normal" }
          ].map((task, i) => (
            <div key={i} className="group flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:border-sectec-200 hover:shadow-sm transition-all cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-5 h-5 rounded-full border-2 border-slate-200 group-hover:border-sectec-400 transition-colors"></div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{task.t}</p>
                  <p className="text-[11px] text-slate-400">Prazo: {task.d}</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                task.p === 'Importante' ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-400'
              }`}>
                {task.p}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  </div>
</MainLayout>
  );
}

export default DashboardProfessor;