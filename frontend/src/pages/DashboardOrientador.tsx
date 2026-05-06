import { useState } from "react";
import { GiPig } from "react-icons/gi";
import {
  FiUser, FiChevronDown, FiCheck, FiFile, FiFolder,
  FiMessageSquare, FiCalendar, FiAlertCircle, FiClock,
  FiBell, FiSend, FiBookOpen
} from "react-icons/fi";
import { MainLayout } from "../componentes/SideBarUniversal";

// ─── Types ───────────────────────────────────────────────────────────────────

type ActivityStatus = "active" | "idle" | "inactive";
type TaskFilter = "all" | "urgent" | "pending";

interface GroupMember {
  name: string;
  avatar: string;
}

interface Group {
  id: string;
  name: string;
  category: string;
  icon: React.ReactNode;
  progress: number;
  status: ActivityStatus;
  statusLabel: string;
  members: GroupMember[];
}

interface PendingFile {
  id: string;
  fileName: string;
  student: string;
  group: string;
  submittedAt: string;
}

interface Task {
  id: string;
  title: string;
  assignee: string;
  deadline: string;
  priority: "urgent" | "normal" | "waiting";
  priorityLabel: string;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const groups: Group[] = [
  {
    id: "g1",
    name: "Grupo do Bola",
    category: "ROBÓTICA",
    icon: <GiPig />,
    progress: 68,
    status: "active",
    statusLabel: "Ativo hoje",
    members: [
      { name: 'Anderson "Bola"', avatar: "Bola" },
      { name: 'João "Porcão"', avatar: "Joao" },
    ],
  },
  {
    id: "g2",
    name: "Grupo Nexus",
    category: "IA & DADOS",
    icon: <span className="text-xl">🤖</span>,
    progress: 34,
    status: "idle",
    statusLabel: "Inativo há 3 dias",
    members: [
      { name: "Mariana Costa", avatar: "Mariana" },
      { name: "Rafael Lima", avatar: "Rafael" },
    ],
  },
];

const pendingFiles: PendingFile[] = [
  { id: "p1", fileName: "relatorio_fase2.pdf", student: "Bola", group: "Grupo do Bola", submittedAt: "há 2h" },
  { id: "p2", fileName: "prototipo_v3.zip", student: "Mariana", group: "Grupo Nexus", submittedAt: "há 1 dia" },
  { id: "p3", fileName: "apresentacao_final.pptx", student: 'João "Porcão"', group: "Grupo do Bola", submittedAt: "há 3h" },
];

const tasks: Task[] = [
  { id: "t1", title: "Pesquisar o impacto do Projeto", assignee: "Bola", deadline: "12/05", priority: "urgent", priorityLabel: "Urgente" },
  { id: "t2", title: "Revisar protótipo de hardware", assignee: "Mariana", deadline: "15/05", priority: "waiting", priorityLabel: "Aguardando" },
  { id: "t3", title: "Entrega da documentação técnica", assignee: "Rafael", deadline: "20/05", priority: "normal", priorityLabel: "Normal" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status, label }: { status: ActivityStatus; label: string }) {
  const styles: Record<ActivityStatus, string> = {
    active: "bg-[#dcfce7] text-[#15803d] border-[#bbf7d0]",
    idle: "bg-[#fef9c3] text-[#a16207] border-[#fde68a]",
    inactive: "bg-[#fee2e2] text-[#dc2626] border-[#fecaca]",
  };
  const dots: Record<ActivityStatus, string> = {
    active: "bg-[#15803d]",
    idle: "bg-[#a16207]",
    inactive: "bg-[#dc2626]",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${styles[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${dots[status]}`} />
      {label}
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="mt-2 space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-[#4a6356] font-bold uppercase tracking-widest">Progresso</span>
        <span className="text-[10px] font-black text-[#15803d]">{value}%</span>
      </div>
      <div className="w-full h-1.5 bg-[#e8f2ed] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#15803d] to-[#4ade80] rounded-full transition-all duration-700"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function GroupCard({ group }: { group: Group }) {
  const [showAta, setShowAta] = useState(false);
  const [ataText, setAtaText] = useState("");

  return (
    <details className="group/card bg-white border border-[#e8f2ed] rounded-2xl shadow-sm overflow-hidden transition-all">
      <summary className="flex items-center justify-between p-5 cursor-pointer list-none hover:bg-[#f0f7f3]/40 relative">
        {/* Hover action buttons */}
        <div className="absolute right-10 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-hover/card:opacity-100 transition-all duration-200 translate-x-2 group-hover/card:translate-x-0">
          <button
            onClick={(e) => e.preventDefault()}
            className="flex items-center gap-1.5 bg-white border border-[#cde4d5] text-[#15803d] text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-sm hover:bg-[#f0f7f3] transition-all"
          >
            <FiFolder size={11} /> Ver Arquivos
          </button>
          <button
            onClick={(e) => e.preventDefault()}
            className="flex items-center gap-1.5 bg-[#15803d] text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-sm hover:bg-[#116631] transition-all"
          >
            <FiMessageSquare size={11} /> Chat
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#f0f7f3] rounded-2xl flex items-center justify-center text-2xl text-[#15803d] border border-[#cde4d5]">
            {group.icon}
          </div>
          <div>
            <StatusBadge status={group.status} label={group.statusLabel} />
            <h4 className="font-bold text-[#1a3a2a] mt-1">{group.name}</h4>
            <p className="text-[10px] text-[#15803d] font-black tracking-widest uppercase">{group.category}</p>
            <ProgressBar value={group.progress} />
          </div>
        </div>
        <FiChevronDown className="text-[#15803d] transition-transform group-open/card:rotate-180 shrink-0 ml-2" />
      </summary>

      <div className="px-5 pb-5 border-t border-[#f0f7f3] bg-white animate-in slide-in-from-top-2 duration-300">
        <p className="text-[10px] font-black text-[#4a6356] uppercase mt-4 mb-3 tracking-widest opacity-60">
          Integrantes do Grupo
        </p>
        <div className="space-y-3">
          {group.members.map((m) => (
            <div key={m.avatar} className="flex items-center gap-3">
              <img
                className="w-8 h-8 rounded-lg"
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${m.avatar}`}
                alt={m.name}
              />
              <span className="text-sm font-bold text-[#1a3a2a]">{m.name}</span>
            </div>
          ))}
        </div>

        {/* Ata de Reunião */}
        <div className="mt-5">
          <button
            onClick={() => setShowAta(!showAta)}
            className="flex items-center gap-2 text-[11px] font-bold text-[#15803d] border border-dashed border-[#86efac] rounded-xl px-4 py-2 hover:bg-[#f0f7f3] transition-all w-full justify-center"
          >
            <FiBookOpen size={13} />
            {showAta ? "Cancelar Ata" : "Registrar Ata de Reunião"}
          </button>
          {showAta && (
            <div className="mt-3 animate-in fade-in duration-300">
              <textarea
                rows={3}
                value={ataText}
                onChange={(e) => setAtaText(e.target.value)}
                placeholder="Descreva os pontos discutidos na reunião..."
                className="w-full text-sm p-3 rounded-xl border border-[#e8f2ed] bg-[#f9fcfa] text-[#1a3a2a] resize-none focus:outline-none focus:ring-2 focus:ring-[#86efac] placeholder:text-slate-400"
              />
              <button className="mt-2 w-full bg-[#15803d] text-white text-xs font-black py-2 rounded-xl hover:bg-[#116631] transition-all">
                Salvar Ata
              </button>
            </div>
          )}
        </div>
      </div>
    </details>
  );
}

function PendingCard({ file }: { file: PendingFile }) {
  const [feedback, setFeedback] = useState("");
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (feedback.trim()) {
      setSent(true);
      setTimeout(() => setSent(false), 2000);
      setFeedback("");
    }
  };

  return (
    <div className="bg-white border border-[#e8f2ed] rounded-xl p-4 flex flex-col gap-3 hover:shadow-sm transition-all animate-in fade-in duration-300">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#f0f7f3] rounded-xl flex items-center justify-center border border-[#cde4d5]">
            <FiFile size={14} className="text-[#15803d]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#1a3a2a] leading-tight">{file.fileName}</p>
            <p className="text-[11px] text-[#4a6356]">
              {file.student} · <span className="text-[#86efac] font-bold">{file.group}</span>
            </p>
          </div>
        </div>
        <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">{file.submittedAt}</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Feedback rápido..."
          className="flex-1 h-8 text-xs px-3 rounded-lg border border-[#e8f2ed] bg-[#f9fcfa] text-[#1a3a2a] focus:outline-none focus:ring-2 focus:ring-[#86efac] placeholder:text-slate-400"
        />
        <button
          onClick={handleSend}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
            sent ? "bg-[#dcfce7] text-[#15803d]" : "bg-[#15803d] text-white hover:bg-[#116631]"
          }`}
        >
          {sent ? <FiCheck size={13} /> : <FiSend size={13} />}
        </button>
      </div>
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  const priorityStyles: Record<Task["priority"], string> = {
    urgent: "bg-[#fff0f0] text-[#e54b4b]",
    waiting: "bg-[#fffbeb] text-[#d97706]",
    normal: "bg-[#f0f7f3] text-[#15803d]",
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-[#e8f2ed] flex items-center justify-between hover:shadow-md transition-all animate-in fade-in duration-300">
      <div className="flex items-start gap-4">
        <div className="mt-1 w-6 h-6 rounded-full border-2 border-[#15803d] flex items-center justify-center shrink-0">
          <div className="w-2.5 h-2.5 bg-[#15803d] rounded-full" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-[#1a3a2a] text-base leading-tight">{task.title}</span>
          <div className="mt-1 flex items-center gap-1.5 text-[#5c8a71]">
            <FiUser className="text-xs" />
            <span className="text-sm font-medium italic">
              Atribuída a: <span className="text-[#15803d] not-italic font-bold">{task.assignee}</span>
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 text-right shrink-0">
        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${priorityStyles[task.priority]}`}>
          {task.priority === "urgent" && <FiAlertCircle className="inline mr-1" />}
          {task.priority === "waiting" && <FiClock className="inline mr-1" />}
          {task.priorityLabel}
        </span>
        <span className="text-[11px] text-slate-400 font-bold tracking-tight">Prazo: {task.deadline}</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function DashboardOrientador() {
  const [notice, setNotice] = useState("");
  const [noticeSent, setNoticeSent] = useState(false);
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("all");
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const handleSendNotice = () => {
    if (notice.trim()) {
      setNoticeSent(true);
      setTimeout(() => { setNoticeSent(false); setNotice(""); }, 2500);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (taskFilter === "all") return true;
    if (taskFilter === "urgent") return t.priority === "urgent";
    if (taskFilter === "pending") return t.priority === "waiting";
    return true;
  });

  const filterButtons: { key: TaskFilter; label: string }[] = [
    { key: "all", label: "Todas" },
    { key: "urgent", label: "Urgentes" },
    { key: "pending", label: "Aguardando Correção" },
  ];

  return (
    <MainLayout userRole="Professor">
      <div className="max-w-[1200px] mx-auto py-10 px-6 space-y-8">

        {/* ── Mural de Avisos ── */}
        <div className="bg-[#f0f7f3] border-2 border-dashed border-[#86efac] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-in fade-in duration-500">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center border border-[#cde4d5] shadow-sm">
              <FiBell size={16} className="text-[#15803d]" />
            </div>
            <span className="text-xs font-black text-[#15803d] uppercase tracking-widest whitespace-nowrap">Aviso Rápido</span>
          </div>
          <input
            type="text"
            value={notice}
            onChange={(e) => setNotice(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendNotice()}
            placeholder="Escreva um aviso para todos os grupos..."
            className="flex-1 h-9 bg-white text-sm px-4 rounded-xl border border-[#cde4d5] text-[#1a3a2a] focus:outline-none focus:ring-2 focus:ring-[#86efac] placeholder:text-slate-400 w-full"
          />
          <button
            onClick={handleSendNotice}
            className={`h-9 px-5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
              noticeSent
                ? "bg-[#dcfce7] text-[#15803d] border border-[#86efac]"
                : "bg-[#15803d] text-white hover:bg-[#116631] shadow-sm"
            }`}
          >
            {noticeSent ? "✓ Enviado!" : "Enviar Aviso"}
          </button>
        </div>

        {/* ── Cabeçalho ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-[#1a3a2a] tracking-tight mb-2">Painel do Orientador</h1>
            <p className="text-[#4a6356] font-medium">Gerencie seus grupos e atividades do projeto escolar.</p>
          </div>
          <div className="flex flex-wrap gap-3 mt-6 md:mt-0">
            <button className="h-11 px-5 text-sm font-bold border border-slate-200 bg-white text-slate-600 rounded-xl hover:bg-slate-50 transition-all">
              Mensagens
            </button>
            <button
              onClick={() => setScheduleOpen(!scheduleOpen)}
              className="h-11 px-5 text-sm font-bold border border-[#15803d] text-[#15803d] bg-transparent rounded-xl hover:bg-[#f0f7f3] transition-all flex items-center gap-2"
            >
              <FiCalendar size={15} /> Abrir Horários
            </button>
            <button className="h-11 px-5 text-sm font-bold bg-[#15803d] text-white rounded-xl hover:bg-[#116631] shadow-lg shadow-green-900/20 transition-all">
              Criar Projeto
            </button>
          </div>
        </div>

        {/* ── Agenda expandível ── */}
        {scheduleOpen && (
          <div className="bg-white border border-[#e8f2ed] rounded-2xl p-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#4a6356] mb-4">
              📅 Disponibilidade da Semana
            </h3>
            <div className="grid grid-cols-5 gap-3">
              {["Seg", "Ter", "Qua", "Qui", "Sex"].map((day, i) => (
                <div key={day} className="text-center">
                  <p className="text-[11px] font-black text-[#4a6356] uppercase mb-2">{day}</p>
                  <div className={`h-16 rounded-xl border ${i === 1 || i === 3 ? "bg-[#f0f7f3] border-[#86efac]" : "bg-[#fef2f2] border-[#fecaca]"} flex items-center justify-center`}>
                    <span className={`text-xs font-bold ${i === 1 || i === 3 ? "text-[#15803d]" : "text-[#dc2626]"}`}>
                      {i === 1 || i === 3 ? "Disponível" : "Ocupado"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Grid Principal ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Coluna Esquerda — Grupos */}
          <div className="lg:col-span-5 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#4a6356] ml-1">
              Seus Grupos de Orientação
            </h3>
            {groups.map((g) => (
              <GroupCard key={g.id} group={g} />
            ))}
          </div>

          {/* Coluna Direita — Feedbacks + Tarefas */}
          <div className="lg:col-span-7 space-y-8">

            {/* Pendentes de Avaliação */}
            <div className="space-y-4">
              <div className="flex items-center justify-between ml-1">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#4a6356]">
                  Pendentes de Avaliação
                </h3>
                <span className="bg-[#fee2e2] text-[#dc2626] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                  {pendingFiles.length} novos
                </span>
              </div>
              <div className="space-y-3">
                {pendingFiles.map((f) => (
                  <PendingCard key={f.id} file={f} />
                ))}
              </div>
            </div>

            {/* Tarefas e Prazos */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 ml-1">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#4a6356]">
                  Tarefas e Prazos
                </h3>
                {/* Filtros */}
                <div className="flex items-center gap-2 flex-wrap">
                  {filterButtons.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setTaskFilter(key)}
                      className={`text-[11px] font-black px-3 py-1.5 rounded-xl border transition-all ${
                        taskFilter === key
                          ? "bg-[#15803d] text-white border-[#15803d] shadow-sm"
                          : "bg-white text-[#4a6356] border-[#e8f2ed] hover:bg-[#f0f7f3]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((t) => <TaskCard key={t.id} task={t} />)
                ) : (
                  <div className="bg-white border border-[#e8f2ed] rounded-2xl p-8 text-center animate-in fade-in duration-300">
                    <p className="text-sm text-[#4a6356] font-medium">Nenhuma tarefa nesta categoria.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default DashboardOrientador;
