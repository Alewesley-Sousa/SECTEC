import { GiPig } from "react-icons/gi";
import { FiUser, FiChevronDown } from "react-icons/fi"; // Importei ícones úteis
import { MainLayout } from "../componentes/SideBarUniversal";
function DashboardProfessor() {
  return (
    <>
      <MainLayout userRole="Professor">
      <div className="min-h-full bg-[#f4f9f6] font-sans antialiased pb-20">
        <div className="max-w-[1300px] mx-auto py-12 px-10">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-12">
            <div>
              <h1 className="text-4xl font-extrabold text-[#1a3a2a] tracking-tight mb-2">Painel do Orientador</h1>
              <p className="text-[#4a6356] text-lg">Gerencie seus grupos e atividades do projeto escolar.</p>
            </div>
            <div className="flex gap-4 mt-6 md:mt-0">
              <button className="h-12 px-6 text-sm font-bold border-2 border-[#15803d]/20 text-[#15803d] rounded-2xl hover:bg-[#15803d]/5 transition-all">Mensagens</button>
              <button className="h-12 px-6 text-sm font-bold bg-[#15803d] text-white rounded-2xl hover:bg-[#116631] transition-all shadow-lg shadow-[#15803d]/20">Criar Projeto</button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-5 space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#4a6356] ml-2">Seus Grupos de Orientação</h3>           
              <div className="space-y-4">
                <details className="group bg-white border border-[#e8f2ed] rounded-[1rem] shadow-sm overflow-hidden transition-all">
                  <summary className="flex items-center justify-between p-4 cursor-pointer list-none hover:bg-[#f0f7f3]/50">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-[#f0f7f3] rounded-2xl flex items-center justify-center text-2xl text-[#15803d] shadow-sm border border-[#cde4d5]">
                        <GiPig />
                      </div>
                      <div>
                        <h4 className="font-bold text-[#1a3a2a]">Grupo do Bola</h4>
                        <p className="text-xs text-[#15803d] font-bold tracking-tight">ROBÓTICA</p>
                      </div>
                    </div>
                    <FiChevronDown className="text-[#15803d] transition-transform group-open:rotate-180" />
                  </summary>

                  <div className="px-4 pb-4 border-t border-[#f0f7f3] bg-white">
                    <p className="text-[10px] font-black text-[#4a6356] uppercase mt-4 mb-2 tracking-widest">Integrantes do Grupo</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-2 hover:bg-[#f4f9f6] rounded-xl transition-colors">
                        <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border border-white shadow-sm">
                          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Bola" alt="Bola" />
                        </div>
                        <span className="text-sm font-bold text-slate-700">bolinha "Bola"</span>
                      </div>
                      <div className="flex items-center gap-3 p-2 hover:bg-[#f4f9f6] rounded-xl transition-colors">
                        <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border border-white shadow-sm">
                          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=João" alt="João" />
                        </div>
                        <span className="text-sm font-bold text-slate-700">João "Porcão"</span>
                      </div>
                    </div>
                  </div>
                </details>
              </div>
            </div>

            {/* Coluna Tarefas */}
            <div className="lg:col-span-7 space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#4a6356] ml-2">Tarefas e Prazos</h3>
              <div className="space-y-4">
                 
                 <div className="bg-white p-6 rounded-[1rem] border border-[#e8f2ed] flex items-center justify-between hover:shadow-md transition-all">
                    <div className="flex items-start gap-4">
                       <div className="mt-1 w-6 h-6 rounded-full border-2 border-[#15803d] flex items-center justify-center shrink-0">
                          <div className="w-2.5 h-2.5 bg-[#15803d] rounded-full"></div>
                       </div>
                       
                       <div className="flex flex-col">
                          <span className="font-bold text-[#1a3a2a] text-lg leading-tight">Pesquisar o impacto do Projeto</span>
                          
                          {/* Responsável sutil mas nem tanto */}
                          <div className="mt-1 flex items-center gap-1.5 text-[#5c8a71]">
                             <FiUser className="text-xs" />
                             <span className="text-sm font-medium italic">Atribuída a: <span className="text-[#15803d] not-italic font-bold">Bola</span></span>
                          </div>
                       </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                       <span className="bg-[#fff0f0] text-[#e54b4b] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">Importante</span>
                       <span className="text-[11px] text-[#4a6356] font-medium tracking-tight">Prazo: 12/05</span>
                    </div>
                 </div>

              </div>
            </div>
          </div>

        </div>
      </div>
      </MainLayout>
    </>
  );
}

export default DashboardProfessor;