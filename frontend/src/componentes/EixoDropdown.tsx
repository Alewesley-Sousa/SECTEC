import { useState } from 'react'
import { Filter, ChevronDown, Cpu, Leaf, Users, Zap, BookOpen, Heart } from 'lucide-react'

// ─── Tipos exportados ─────────────────────────────────────────────────────────

export type EixoTematico =
  | 'todos'
  | 'tecnologia'
  | 'sustentabilidade'
  | 'sociedade'
  | 'energia'
  | 'educacao'
  | 'saude'

type EixoConfig = {
  label: string
  icon: React.FC<{ size?: number; className?: string }>
  ativoBg: string
  ativoTexto: string
  tagBg: string
  tagTexto: string
  iconeBg: string
  iconeTexto: string
}

// ─── Config dos eixos ─────────────────────────────────────────────────────────

export const EIXOS_CONFIG: Record<EixoTematico, EixoConfig> = {
  todos: {
    label: 'Todos',
    icon: Filter,
    ativoBg: 'bg-sectec-600',
    ativoTexto: 'text-white',
    tagBg: 'bg-sectec-100',
    tagTexto: 'text-sectec-700',
    iconeBg: 'bg-sectec-50',
    iconeTexto: 'text-sectec-600',
  },
  tecnologia: {
    label: 'Tecnologia',
    icon: Cpu,
    ativoBg: 'bg-blue-600',
    ativoTexto: 'text-white',
    tagBg: 'bg-blue-100',
    tagTexto: 'text-blue-700',
    iconeBg: 'bg-blue-50',
    iconeTexto: 'text-blue-600',
  },
  sustentabilidade: {
    label: 'Sustentabilidade',
    icon: Leaf,
    ativoBg: 'bg-sectec-600',
    ativoTexto: 'text-white',
    tagBg: 'bg-sectec-100',
    tagTexto: 'text-sectec-700',
    iconeBg: 'bg-sectec-50',
    iconeTexto: 'text-sectec-600',
  },
  sociedade: {
    label: 'Sociedade',
    icon: Users,
    ativoBg: 'bg-orange-500',
    ativoTexto: 'text-white',
    tagBg: 'bg-orange-100',
    tagTexto: 'text-orange-700',
    iconeBg: 'bg-orange-50',
    iconeTexto: 'text-orange-600',
  },
  energia: {
    label: 'Energia',
    icon: Zap,
    ativoBg: 'bg-yellow-500',
    ativoTexto: 'text-white',
    tagBg: 'bg-yellow-100',
    tagTexto: 'text-yellow-700',
    iconeBg: 'bg-yellow-50',
    iconeTexto: 'text-yellow-600',
  },
  educacao: {
    label: 'Educação',
    icon: BookOpen,
    ativoBg: 'bg-purple-600',
    ativoTexto: 'text-white',
    tagBg: 'bg-purple-100',
    tagTexto: 'text-purple-700',
    iconeBg: 'bg-purple-50',
    iconeTexto: 'text-purple-600',
  },
  saude: {
    label: 'Saúde',
    icon: Heart,
    ativoBg: 'bg-red-500',
    ativoTexto: 'text-white',
    tagBg: 'bg-red-100',
    tagTexto: 'text-red-700',
    iconeBg: 'bg-red-50',
    iconeTexto: 'text-red-600',
  },
}

// ─── Props ────────────────────────────────────────────────────────────────────

type EixoDropdownProps = {
  eixoAtivo: EixoTematico
  eixosList: EixoTematico[]
  contagemPorEixo: (e: EixoTematico) => number
  onChange: (e: EixoTematico) => void
}

// ─── Componente ───────────────────────────────────────────────────────────────

const EixoDropdown: React.FC<EixoDropdownProps> = ({
  eixoAtivo,
  eixosList,
  contagemPorEixo,
  onChange,
}) => {
  const [aberto, setAberto] = useState(false)
  const cfg = EIXOS_CONFIG[eixoAtivo]
  const IconAtivo = cfg.icon

  return (
    <div className="relative">
      {/* Botão trigger — cor muda conforme o eixo ativo */}
      <button
        onClick={() => setAberto(v => !v)}
        className={`
          flex items-center gap-2.5 pl-3.5 pr-3 py-2.5 rounded-xl text-sm font-medium
          border-2 transition-all duration-200 cursor-pointer select-none min-w-56
          ${eixoAtivo === 'todos'
            ? 'bg-white border-slate-200 text-slate-700 hover:border-sectec-300'
            : `${cfg.ativoBg} ${cfg.ativoTexto} border-transparent shadow-md`
          }
        `}
      >
        <IconAtivo size={15} />
        <span className="flex-1 text-left">{cfg.label}</span>
        <span className={`
          px-1.5 py-0.5 rounded-full text-xs font-semibold mr-1
          ${eixoAtivo === 'todos' ? 'bg-slate-100 text-slate-500' : 'bg-white/25 text-white'}
        `}>
          {contagemPorEixo(eixoAtivo)}
        </span>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 flex-shrink-0 ${aberto ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Painel do dropdown */}
      {aberto && (
        <>
          {/* Overlay invisível para fechar ao clicar fora */}
          <div className="fixed inset-0 z-10" onClick={() => setAberto(false)} />

          <div className="absolute left-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 min-w-56 overflow-hidden py-1">
            {eixosList.map(eixo => {
              const c = EIXOS_CONFIG[eixo]
              const Icon = c.icon
              const ativo = eixoAtivo === eixo

              return (
                <button
                  key={eixo}
                  onClick={() => { onChange(eixo); setAberto(false) }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors cursor-pointer
                    ${ativo
                      ? `${c.tagBg} ${c.tagTexto} font-semibold`
                      : 'text-slate-600 hover:bg-slate-50'
                    }
                  `}
                >
                  {/* Ícone colorido por eixo */}
                  <span className={`
                    w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0
                    ${ativo ? c.ativoBg : c.iconeBg}
                  `}>
                    <Icon size={14} className={ativo ? 'text-white' : c.iconeTexto} />
                  </span>

                  <span className="flex-1 text-left">{c.label}</span>

                  {/* Contador */}
                  <span className={`
                    px-1.5 py-0.5 rounded-full text-xs font-semibold
                    ${ativo ? `${c.ativoBg} text-white` : 'bg-slate-100 text-slate-500'}
                  `}>
                    {contagemPorEixo(eixo)}
                  </span>

                  {/* Indicador de selecionado */}
                  {ativo && (
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.ativoBg}`} />
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export default EixoDropdown