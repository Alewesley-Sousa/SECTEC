import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiChevronLeft, FiMenu } from "react-icons/fi";
import type { UserRole, NavItem } from "../helpes/InteligenciaSideBar";

export type SidebarProps = {
  items: NavItem[];
  userRole: UserRole;
};

// 1. COMPONENTE SIDEBAR COM TOGGLE E LOGO INTEGRADA
export function Sidebar({ items, userRole }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const location = useLocation();

  const canAccess = (item: NavItem) => {
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  };

  const filteredItems = items.filter(canAccess).map((item) => ({
    ...item,
    subItems: item.subItems?.filter(
      (sub) => !sub.roles || sub.roles.includes(userRole),
    ),
  }));

  return (
    <aside 
      className={`sticky top-0 left-0 z-20 h-screen shrink-0 bg-[#0b4d2c] text-white border-r border-white/5 flex flex-col shadow-2xl transition-all duration-300 ease-in-out ${
        isExpanded ? "w-64" : "w-20"
      }`}
    >
      {/* BOTÃO PARA ESCONDER/EXIBIR (Estilo Plan) */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -right-3 top-10 bg-white text-[#0b4d2c] rounded-full p-1 border border-slate-200 shadow-md hover:scale-110 transition-transform z-30"
      >
        {isExpanded ? <FiChevronLeft size={14} /> : <FiMenu size={14} />}
      </button>

      {/* SEÇÃO DA LOGO */}
      <div className="p-6 border-b border-white/5 overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="grid grid-cols-2 gap-1 shrink-0">
            <span className="h-5 w-5 rounded-md bg-sectec-700" />
            <span className="h-5 w-5 rounded-md bg-sectec-100" />
            <span className="h-5 w-5 rounded-md bg-sectec-600" />
            <span className="h-5 w-5 rounded-md bg-sectec-700" />
          </div>
          {isExpanded && (
            <div className="text-left animate-in fade-in duration-500">
              <h1 className="text-xl font-black leading-none text-white tracking-tighter uppercase">
                SECTEC
              </h1>
              <p className="text-[10px] font-bold text-white/40 tracking-widest uppercase mt-0.5">
                Projeto Escolar
              </p>
            </div>
          )}
        </div>
      </div>

      {/* NAVEGAÇÃO */}
      <nav className="flex-1 px-4 py-8 overflow-y-auto space-y-1 overflow-x-hidden">
        {filteredItems.map((item) => {
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isActive = location.pathname.startsWith(item.href || "");

          if (hasSubItems && isExpanded) {
            return (
              <details key={item.id} className="group" open={item.isActive}>
                <summary className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-semibold transition cursor-pointer list-none hover:bg-white/10 ${isActive ? "bg-white/15 text-white" : "text-white/70"}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-lg opacity-80 shrink-0">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  <span className="text-[10px] opacity-40 transition-transform group-open:rotate-180">▼</span>
                </summary>
                <div className="mt-1 ml-4 border-l border-white/10 pl-3 space-y-1">
                  {item.subItems!.map((sub) => (
                    <Link key={sub.id} to={sub.href || "#"} className="block py-2 px-3 text-xs font-medium text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition">
                      {sub.label}
                    </Link>
                  ))}
                </div>
              </details>
            );
          }

          return (
            <Link 
              key={item.id} 
              to={item.href || "#"} 
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold transition ${
                isActive ? "bg-white/15 text-white shadow-inner" : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="text-lg opacity-80 shrink-0">{item.icon}</span>
              {isExpanded && <span className="whitespace-nowrap animate-in slide-in-from-left-2 duration-300">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      
      {/* RODAPÉ / CONFIGURAÇÕES */}
      <div className="p-6 border-t border-white/5 overflow-hidden">
        <div className="flex items-center gap-3 opacity-50 hover:opacity-100 transition cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs shrink-0">⚙️</div>
          {isExpanded && <span className="text-xs font-bold animate-in fade-in">Configurações</span>}
        </div>
      </div>
    </aside>
  );
}

// 2. COMPONENTE MAINLAYOUT PARA ENVOLVER AS PÁGINAS
export function MainLayout({ children, userRole }: { children: React.ReactNode; userRole: UserRole }) {
  const location = useLocation();
  const rolePath = userRole === 'ADMIN' ? 'coordenacao' : userRole === 'Professor' ? 'orientador' : 'aluno';
  const dashboardPrefix = `/dashboard/${rolePath}`;

  const menuConfig: NavItem[] = [
    { id: '1', label: 'Painel', icon: '📊', href: dashboardPrefix, isActive: location.pathname === dashboardPrefix },
    {
      id: '2', label: 'Turmas', icon: '🏫', href: `${dashboardPrefix}/turmas`,
      isActive: location.pathname.startsWith(`${dashboardPrefix}/turmas`),
      roles: ['ADMIN', 'Professor'],
      subItems: [
        { id: '2-1', label: 'Minhas Turmas', href: `${dashboardPrefix}/turmas` },
        { id: '2-2', label: 'Frequência', href: `${dashboardPrefix}/frequencia`, roles: ['ADMIN'] }
      ]
    },
    { id: '3', label: 'Notas', icon: '📝', href: `${dashboardPrefix}/notas`, isActive: location.pathname === `${dashboardPrefix}/notas` },
  ];

  return (
    <div className="flex min-h-screen bg-[#f4f9f6] w-full font-sans antialiased">
      <Sidebar items={menuConfig} userRole={userRole} />
      
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Header Superior Sutil */}
        <header className="h-16 border-b border-slate-200 bg-white/50 backdrop-blur-md flex items-center justify-between px-10 shrink-0">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {location.pathname.split('/').pop()?.replace(/-/g, ' ')}
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase">{userRole}</p>
                <p className="text-xs font-bold text-slate-700">Usuário Conectado</p>
             </div>
             <div className="w-8 h-8 bg-[#15803d] rounded-lg flex items-center justify-center text-white text-xs font-bold">
                {userRole[0]}
             </div>
          </div>
        </header>

        {/* Conteúdo da Página */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}