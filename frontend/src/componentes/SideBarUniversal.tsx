import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { clearSession } from "../lib/api";
import {
  ChevronLeft,
  Menu,
  X,
  LayoutDashboard,
  School,
  FileSpreadsheet,
  Settings,
  ChevronDown,
  CalendarDays,
  ClipboardList,
  LogOut,
  Users,
  FileText,
  ShieldCheck,
} from "lucide-react";

import type { UserRole, NavItem } from "../helpes/InteligenciaSideBar";

export type SidebarProps = {
  items: NavItem[];
  userRole: UserRole;
  mobile?: boolean;
  onClose?: () => void;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
};

export function Sidebar({
  items,
  userRole,
  mobile = false,
  onClose,
  expanded: expandedProp,
  onExpandedChange,
}: SidebarProps) {
  const navigate = useNavigate();
  const [internalExpanded, setInternalExpanded] = useState(true);
  const controlledExpanded = expandedProp ?? internalExpanded;
  const expanded = mobile ? true : controlledExpanded;

  function toggleExpanded() {
    const next = !controlledExpanded;
    setInternalExpanded(next);
    onExpandedChange?.(next);
  }

  function handleLogout() {
    clearSession();
    navigate("/login", { replace: true });
  }

  const canAccess = (item: NavItem) => {
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  };

  const filteredItems = items.filter(canAccess).map((item) => ({
    ...item,
    subItems: item.subItems?.filter(
      (sub) => !sub.roles || sub.roles.includes(userRole)
    ),
  }));
  const settingsItem = filteredItems.find(
    (item) =>
      item.id.toLowerCase().includes("config") ||
      item.href?.includes("/configuracoes")
  );
  const visibleItems = settingsItem
    ? filteredItems.filter((item) => item.id !== settingsItem.id)
    : filteredItems;

  return (
    <motion.aside
      initial={mobile ? { x: -320 } : false}
      animate={mobile ? { x: 0 } : { width: expanded ? 256 : 80 }}
      exit={mobile ? { x: -320 } : undefined}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className={`${
        mobile
          ? "fixed inset-y-0 left-0 z-50 w-72 flex"
          : "fixed inset-y-0 left-0 z-20 hidden h-dvh min-h-dvh shrink-0 lg:flex"
      } bg-[#0b4d2c] text-white border-r border-white/5 flex-col shadow-2xl overflow-visible`}
    >
      {!mobile && (
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          onClick={toggleExpanded}
          className="absolute -right-3 top-20 bg-white text-[#0b4d2c] rounded-full p-1 border border-slate-200 shadow-md z-30"
          type="button"
        >
          {expanded ? <ChevronLeft size={14} /> : <Menu size={14} />}
        </motion.button>
      )}

      {mobile && (
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg bg-white/10 p-2 text-white hover:bg-white/15 transition"
          type="button"
          aria-label="Fechar menu"
        >
          <X size={18} />
        </motion.button>
      )}

      <div className="p-5 sm:p-6 border-b border-white/5 overflow-hidden">
        <motion.div
          layout
          className={`flex items-center gap-3 ${
            expanded ? "justify-start" : "justify-center"
          }`}
        >
          <motion.div
            layout
            whileHover={{ rotate: 3, scale: 1.04 }}
            className="grid grid-cols-2 gap-1 shrink-0"
          >
            <span className="h-5 w-5 rounded-md bg-sectec-700" />
            <span className="h-5 w-5 rounded-md bg-sectec-100" />
            <span className="h-5 w-5 rounded-md bg-sectec-600" />
            <span className="h-5 w-5 rounded-md bg-sectec-700" />
          </motion.div>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }}
                className="text-left"
              >
                <h1 className="text-xl font-black leading-none text-white tracking-tighter uppercase">
                  SECTEC
                </h1>
                <p className="text-[10px] font-bold text-white/40 tracking-widest uppercase mt-0.5">
                  Projeto Escolar
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <nav className="flex-1 px-3 sm:px-4 py-6 sm:py-8 overflow-y-auto space-y-1 overflow-x-hidden">
        {visibleItems.map((item, index) => {
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isActive = Boolean(item.isActive);

          if (hasSubItems && expanded) {
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04, duration: 0.2 }}
              >
                <details className="group" open={item.isActive}>
                  <summary
                    className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-semibold transition cursor-pointer list-none hover:bg-white/10 ${
                      isActive ? "bg-white/15 text-white" : "text-white/70"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="opacity-80 shrink-0">{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                    </div>

                    <ChevronDown
                      size={14}
                      className="opacity-40 transition-transform group-open:rotate-180 shrink-0"
                    />
                  </summary>

                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    className="mt-1 ml-4 border-l border-white/10 pl-3 space-y-1"
                  >
                    {item.subItems!.map((sub) => (
                      <Link
                        key={sub.id}
                        to={sub.href || "#"}
                        onClick={onClose}
                        className="block py-2 px-3 text-xs font-medium text-white/55 hover:text-white hover:bg-white/5 rounded-lg transition"
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </motion.div>
                </details>
              </motion.div>
            );
          }

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04, duration: 0.2 }}
              whileTap={{ scale: 0.97 }}
            >
              <Link
                to={item.href || "#"}
                onClick={onClose}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold transition ${
                  isActive
                    ? "bg-white/15 text-white shadow-inner"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="opacity-80 shrink-0">{item.icon}</span>

                <AnimatePresence>
                  {expanded && (
                    <motion.span
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -6 }}
                      transition={{ duration: 0.16 }}
                      className="whitespace-nowrap truncate"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      <div className="p-3 sm:p-4 border-t border-white/5 overflow-hidden space-y-2">
        <motion.button
          whileHover={{ scale: expanded ? 1.02 : 1.1 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full rounded-xl text-sm font-semibold transition cursor-pointer text-rose-300 hover:bg-rose-500/20 hover:text-rose-200 ${
            !expanded ? "justify-center p-3" : "py-3 px-4"
          }`}
          title="Sair do sistema"
        >
          <span className="shrink-0"><LogOut size={20} /></span>
          <AnimatePresence>
            {expanded && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.16 }}
                className="whitespace-nowrap truncate"
              >
                Sair
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        <motion.div
          whileHover={{ scale: expanded ? 1.02 : 1.1 }}
          whileTap={{ scale: 0.97 }}
        >
          <Link
            to={settingsItem?.href || "#"}
            onClick={onClose}
            className={`flex items-center gap-3 w-full rounded-xl text-sm font-semibold transition text-white/70 hover:bg-white/10 hover:text-white ${
              !expanded ? "justify-center p-3" : "py-3 px-4"
            }`}
            title="Configurações"
          >
            <span className="opacity-80 shrink-0">
              {settingsItem?.icon || <Settings size={20} />}
            </span>

          <AnimatePresence>
            {expanded && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.16 }}
                className="whitespace-nowrap truncate"
              >
                {settingsItem?.label || "Configurações"}
                {false && <span className="hidden">
                  Usuário conectado
                </span>}
                {false && <span className="hidden">
                  {userRole}
                </span>}
              </motion.span>
            )}
          </AnimatePresence>
          </Link>
        </motion.div>
      </div>
    </motion.aside>
  );
}

export function MainLayout({
  children,
  userRole,
}: {
  children: React.ReactNode;
  userRole: UserRole;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const location = useLocation();

  const rolePath =
    userRole === "coordenador" || userRole === "comissao"
      ? "coordenacao"
      : userRole === "orientador"
      ? "orientador"
      : "aluno";

  const dashboardPrefix = `/dashboard/${rolePath}`;

  const pageLabels: Record<string, string> = {
    [dashboardPrefix]: "Painel",
    [`${dashboardPrefix}/turmas`]: "Turmas",
    [`${dashboardPrefix}/entregas`]: "Entregas",
    [`${dashboardPrefix}/agenda`]: "Agenda",
    [`${dashboardPrefix}/relatorios`]: "Relatórios",
    [`${dashboardPrefix}/notas`]: "Avaliações",
    [`${dashboardPrefix}/usuarios`]: "Usuários",
    [`${dashboardPrefix}/configuracoes`]: "Configurações",
  };

  const currentPage =
    pageLabels[location.pathname] ||
    location.pathname.split("/").pop()?.replace(/-/g, " ") ||
    "painel";

  const orientadorMenu: NavItem[] = [
    {
      id: "orientador-painel",
      label: "Painel",
      icon: <LayoutDashboard size={20} />,
      href: dashboardPrefix,
      isActive: location.pathname === dashboardPrefix,
      roles: ["orientador"],
    },
    {
      id: "orientador-turmas",
      label: "Turmas",
      icon: <School size={20} />,
      href: `${dashboardPrefix}/turmas`,
      isActive: location.pathname === `${dashboardPrefix}/turmas`,
      roles: ["orientador"],
    },
    {
      id: "orientador-entregas",
      label: "Entregas",
      icon: <ClipboardList size={20} />,
      href: `${dashboardPrefix}/entregas`,
      isActive: location.pathname === `${dashboardPrefix}/entregas`,
      roles: ["orientador"],
    },
    {
      id: "orientador-agenda",
      label: "Agenda",
      icon: <CalendarDays size={20} />,
      href: `${dashboardPrefix}/agenda`,
      isActive: location.pathname === `${dashboardPrefix}/agenda`,
      roles: ["orientador"],
    },
    {
      id: "orientador-notas",
      label: "Avaliações",
      icon: <FileSpreadsheet size={20} />,
      href: `${dashboardPrefix}/notas`,
      isActive: location.pathname === `${dashboardPrefix}/notas`,
      roles: ["orientador"],
    },
    {
      id: "orientador-config",
      label: "Configurações",
      icon: <Settings size={20} />,
      href: `${dashboardPrefix}/configuracoes`,
      isActive: location.pathname === `${dashboardPrefix}/configuracoes`,
      roles: ["orientador"],
    },
  ];

  const alunoMenu: NavItem[] = [
    {
      id: "painel",
      label: "Painel",
      icon: <LayoutDashboard size={20} />,
      href: dashboardPrefix,
      isActive: location.pathname === dashboardPrefix,
      roles: ["aluno"],
    },
    {
      id: "aluno-relatorios",
      label: "Relatórios",
      icon: <FileText size={20} />,
      href: `${dashboardPrefix}/relatorios`,
      isActive: location.pathname === `${dashboardPrefix}/relatorios`,
      roles: ["aluno"],
    },
    {
      id: "aluno-notas",
      label: "Notas",
      icon: <FileSpreadsheet size={20} />,
      href: `${dashboardPrefix}/notas`,
      isActive: location.pathname === `${dashboardPrefix}/notas`,
      roles: ["aluno"],
    },
    {
      id: "aluno-config",
      label: "Configurações",
      icon: <Settings size={20} />,
      href: `${dashboardPrefix}/configuracoes`,
      isActive: location.pathname === `${dashboardPrefix}/configuracoes`,
      roles: ["aluno"],
    },
  ];

  const coordenadorMenu: NavItem[] = [
    {
      id: "coordenacao-painel",
      label: "Painel",
      icon: <LayoutDashboard size={20} />,
      href: dashboardPrefix,
      isActive: location.pathname === dashboardPrefix,
      roles: ["coordenador", "comissao"],
    },
    {
      id: "coordenacao-projetos",
      label: "Projetos",
      icon: <FileText size={20} />,
      href: `${dashboardPrefix}#coord-projetos`,
      isActive: location.hash === "#coord-projetos",
      roles: ["coordenador", "comissao"],
    },
    {
      id: "coordenacao-turmas",
      label: "Turmas",
      icon: <School size={20} />,
      href: `${dashboardPrefix}#coord-turmas`,
      isActive: location.hash === "#coord-turmas",
      roles: ["coordenador", "comissao"],
    },
    {
      id: "coordenacao-orientacoes",
      label: "Orientações",
      icon: <ClipboardList size={20} />,
      href: `${dashboardPrefix}#coord-orientacoes`,
      isActive: location.hash === "#coord-orientacoes",
      roles: ["coordenador", "comissao"],
    },
    {
      id: "coordenacao-usuarios",
      label: "Usuários",
      icon: <Users size={20} />,
      href: `${dashboardPrefix}/usuarios`,
      isActive: location.pathname === `${dashboardPrefix}/usuarios`,
      roles: ["coordenador", "comissao"],
    },
    {
      id: "coordenacao-prazos",
      label: "Prazos",
      icon: <CalendarDays size={20} />,
      href: `${dashboardPrefix}#coord-prazos`,
      isActive: location.hash === "#coord-prazos",
      roles: ["coordenador", "comissao"],
    },
    {
      id: "coordenacao-pdfs",
      label: "Relatórios & PDFs",
      icon: <FileSpreadsheet size={20} />,
      href: `${dashboardPrefix}#coord-pdfs`,
      isActive: location.hash === "#coord-pdfs",
      roles: ["coordenador", "comissao"],
    },
    {
      id: "coordenacao-auditoria",
      label: "Auditoria",
      icon: <ShieldCheck size={20} />,
      href: `${dashboardPrefix}#coord-auditoria`,
      isActive: location.hash === "#coord-auditoria",
      roles: ["coordenador", "comissao"],
    },
  ];

  const menuConfig =
    userRole === "orientador"
      ? orientadorMenu
      : userRole === "coordenador" || userRole === "comissao"
      ? coordenadorMenu
      : alunoMenu;

  return (
    <div className="flex min-h-screen bg-[#f4f9f6] w-full font-sans antialiased overflow-x-hidden">
      <Sidebar
        items={menuConfig}
        userRole={userRole}
        expanded={sidebarExpanded}
        onExpandedChange={setSidebarExpanded}
      />

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Fechar menu"
              onClick={() => setMobileMenuOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            />

            <Sidebar
              items={menuConfig}
              userRole={userRole}
              mobile
              onClose={() => setMobileMenuOpen(false)}
            />
          </>
        )}
      </AnimatePresence>

      <main
        className={`flex-1 flex flex-col min-h-screen min-w-0 transition-[padding] duration-300 ${
          sidebarExpanded ? "lg:pl-64" : "lg:pl-20"
        }`}
      >
        <motion.header
          initial={{ y: -18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="h-16 border-b border-slate-200 bg-white/70 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 lg:px-10 shrink-0 sticky top-0 z-30"
        >
          <div className="flex items-center gap-3 min-w-0">
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-[#0b4d2c] shadow-sm"
              aria-label="Abrir menu"
            >
              <Menu size={18} />
            </motion.button>

            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest truncate">
              {currentPage}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black text-slate-400 uppercase">
                {userRole}
              </p>
              <p className="text-xs font-bold text-slate-700">
                Usuário conectado
              </p>
            </div>

            <motion.div
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              className="w-8 h-8 bg-[#15803d] rounded-lg flex items-center justify-center text-white text-xs font-bold"
            >
              {userRole[0]}
            </motion.div>
          </div>
        </motion.header>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="flex-1 overflow-y-auto min-w-0"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
