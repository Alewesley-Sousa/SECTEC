import React from "react";
import { Link, useLocation } from "react-router-dom";
import type { UserRole, NavItem } from "../helpes/InteligenciaSideBar";

export type SidebarProps = {
  brandName?: string;
  items: NavItem[];
  userRole: UserRole;
};

export function Sidebar({ brandName, items, userRole }: SidebarProps) {
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
    <aside className="sticky top-0 left-0 z-20 w-72 h-screen shrink-0 bg-sectec-900 text-white border-r border-sectec-800 flex flex-col shadow-xl">
      <div className="p-6 border-b border-sectec-800">
        <h1 className="text-3xl font-extrabold tracking-tight">{brandName}</h1>
      </div>

      <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-2">
        {filteredItems.map((item) => {
          const hasSubItems = item.subItems && item.subItems.length > 0;

          if (hasSubItems) {
            return (
              <details key={item.id} id={item.id} className="group" open={item.isActive}>
                <summary
                  className={`flex items-center justify-between w-full px-4 py-3 rounded-2xl text-sm font-medium transition cursor-pointer list-none hover:bg-sectec-800/70 ${
                    item.isActive ? "bg-sectec-800" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    {item.label}
                  </div>
                  <span className="text-[10px] transition-transform group-open:rotate-180">▼</span>
                </summary>

                <div className="mt-2 ml-4 border-l border-sectec-800 pl-3 space-y-1">
                  {item.subItems!.map((sub) => (
                    <Link
                      key={sub.id}
                      id={sub.id}
                      to={sub.href || "#"}
                      className="block py-2 px-3 text-sm text-sectec-200 hover:text-white hover:bg-sectec-800/40 rounded-lg transition"
                    >
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
              id={item.id}
              to={item.href || "#"}
              className={`flex items-center justify-between w-full px-4 py-3 rounded-2xl text-sm font-medium transition ${
                item.isActive
                  ? "bg-sectec-800 text-sectec-100"
                  : "text-sectec-100 hover:bg-sectec-800/70"
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function MainLayout({ children, userRole }: { children: React.ReactNode; userRole: UserRole }) {
  const location = useLocation();

  const rolePath = userRole === 'ADMIN'
    ? 'coordenacao'
    : userRole === 'Professor'
    ? 'orientador'
    : 'aluno';

  const dashboardPrefix = `/dashboard/${rolePath}`;

  const menuConfig: NavItem[] = [
    { id: '1', label: 'Painel', icon: '📊', href: dashboardPrefix, isActive: location.pathname === dashboardPrefix },
    {
      id: '2',
      label: 'Turmas',
      icon: '🏫',
      href: `${dashboardPrefix}/turmas`,
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
    /* CORREÇÃO AQUI: Adicionado 'flex' e 'w-full' */
    <div className="flex min-h-screen bg-sectec-50 w-full">
      <Sidebar brandName="SECTEC" items={menuConfig} userRole={userRole} />

      {/* CORREÇÃO AQUI: Trocado 'ml-72' por 'flex-1' para o flexbox controlar o espaço real */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="sticky top-0 z-10 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Pesquisar..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sectec-100 focus:border-sectec-400"
            />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
              Perfil: {userRole}
            </span>
            <div className="w-8 h-8 bg-sectec-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {userRole[0].toUpperCase()}
            </div>
          </div>
        </header>

        <div className="flex-1 p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}