import React from "react";
import { Link } from "react-router-dom";
// Definimos os níveis de acesso possíveis
export type UserRole = "ADMIN" | "Professor" | "aluno";

export type NavItem = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  isActive?: boolean;
  // Se 'roles' não existir, o item é público para todos
  roles?: UserRole[];
  subItems?: Omit<NavItem, "subItems" | "icon">[];
};

export type SidebarProps = {
  brandName?: string;
  items: NavItem[];
  userRole: UserRole;
};

export function Sidebar({ brandName, items, userRole }: SidebarProps) {
  // Função para verificar se o usuário tem permissão
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
    <aside className="fixed top-0 left-0 z-20 w-72 h-screen bg-sectec-900 text-white border-r border-sectec-800 flex flex-col shadow-xl">
      <div className="p-6 border-b border-sectec-800">
        <h1 className="text-3xl font-extrabold tracking-tight">{brandName}</h1>
      </div>

      <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-2">
        {filteredItems.map((item) => (
          <div key={item.id} className="mb-2">
            <Link
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

            {item.isActive && item.subItems && (
              <div className="mt-2 ml-4 border-l border-sectec-800 pl-3">
                {item.subItems.map((sub) => (
                  <Link
                    key={sub.id}
                    to={sub.href || "#"}
                    className="block py-2 text-sm text-sectec-200 hover:text-white"
                  >
                    {sub.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
