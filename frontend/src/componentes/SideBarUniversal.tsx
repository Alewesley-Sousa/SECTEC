import React from 'react';
import { useLocation } from 'react-router-dom';
import type { UserRole, NavItem } from '../helpes/InteligenciaSideBar'
import { Sidebar } from '../helpes/InteligenciaSideBar'

type LayoutProps = {
  children: React.ReactNode;
  userRole: UserRole;
};

export function MainLayout({ children, userRole }: LayoutProps) {
  const location = useLocation();

  const menuConfig: NavItem[] = [
    { id: '1', label: 'Painel', icon: '📊', href: '/', isActive: location.pathname === '/' },
    { id: '2', label: 'Painel Professor', icon: '👩‍🏫', href: '/professor', isActive: location.pathname === '/professor', roles: ['Professor'] },
    { 
      id: '3', 
      label: 'Turmas', 
      icon: '🏫', 
      href: '/turmas',
      isActive: location.pathname.startsWith('/turmas'),
      roles: ['ADMIN', 'Professor'],
      subItems: [
        { id: '3-1', label: 'Minhas Turmas', href: '/turmas' },
        { id: '3-2', label: 'Frequência', href: '/frequencia', roles: ['ADMIN'] }
      ]
    },
    { id: '4', label: 'Notas', icon: '📝', href: '/notas', isActive: location.pathname === '/notas' },
  ];

  return (
    <div className="min-h-screen bg-sectec-50">
      <Sidebar brandName="SECTEC" items={menuConfig} userRole={userRole} />

      <main className="ml-72 min-h-screen flex flex-col overflow-hidden">
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

        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
