import { useState, type ComponentType } from 'react'
import { Filter, ChevronDown, Cpu, Leaf, Users, Zap, BookOpen, Heart } from 'lucide-react'

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
  icon: ComponentType<{ size?: number; className?: string }>
  ativoBg: string
  ativoTexto: string
  tagBg: string
  tagTexto: string
  iconeBg: string
  iconeTexto: string
}

const EIXOS_CONFIG: Record<EixoTematico, EixoConfig> = {
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

export const EIXOS_LIST: EixoTematico[] = [
  'todos',
  'tecnologia',
  'sustentabilidade',
  'sociedade',
  'energia',
  'educacao',
  'saude',
]

type EixoDropdownProps = {
  eixoAtivo: EixoTematico
  eixosList?: EixoTematico[]
  contagemPorEixo: (e: EixoTematico) => number
  onChange: (e: EixoTematico) => void
  className?: string
}

const EixoDropdown = ({
  eixoAtivo,
  eixosList = EIXOS_LIST,
  contagemPorEixo,
  onChange,
  className = '',
}: EixoDropdownProps) => {
  const [aberto, setAberto] = useState(false)
  const cfg = EIXOS_CONFIG[eixoAtivo] ?? EIXOS_CONFIG.todos
  const IconAtivo = cfg.icon

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        onClick={() => setAberto((valorAtual) => !valorAtual)}
        className={`
          flex min-h-11 w-full min-w-56 items-center gap-2.5 rounded-xl border-2 py-2.5 pl-3.5 pr-3
          text-sm font-semibold transition-all duration-200 sm:w-auto
          ${
            eixoAtivo === 'todos'
              ? 'border-slate-200 bg-white text-slate-700 hover:border-sectec-300'
              : `${cfg.ativoBg} ${cfg.ativoTexto} border-transparent shadow-md`
          }
        `}
      >
        <IconAtivo size={15} className="shrink-0" />
        <span className="flex-1 text-left">{cfg.label}</span>
        <span
          className={`mr-1 rounded-full px-1.5 py-0.5 text-xs font-bold ${
            eixoAtivo === 'todos' ? 'bg-slate-100 text-slate-500' : 'bg-white/25 text-white'
          }`}
        >
          {contagemPorEixo(eixoAtivo)}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 transition-transform duration-200 ${aberto ? 'rotate-180' : ''}`}
        />
      </button>

      {aberto && (
        <>
          <button
            type="button"
            aria-label="Fechar filtro de eixo"
            className="fixed inset-0 z-10 cursor-default bg-transparent"
            onClick={() => setAberto(false)}
          />

          <div
            role="listbox"
            className="absolute left-0 top-full z-20 mt-1.5 min-w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1 shadow-xl"
          >
            {eixosList.map((eixo) => {
              const c = EIXOS_CONFIG[eixo] ?? EIXOS_CONFIG.todos
              const Icon = c.icon
              const ativo = eixoAtivo === eixo

              return (
                <button
                  key={eixo}
                  type="button"
                  role="option"
                  aria-selected={ativo}
                  onClick={() => {
                    onChange(eixo)
                    setAberto(false)
                  }}
                  className={`
                    flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors
                    ${ativo ? `${c.tagBg} ${c.tagTexto} font-bold` : 'text-slate-600 hover:bg-slate-50'}
                  `}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                      ativo ? c.ativoBg : c.iconeBg
                    }`}
                  >
                    <Icon size={14} className={ativo ? 'text-white' : c.iconeTexto} />
                  </span>

                  <span className="flex-1 text-left">{c.label}</span>

                  <span
                    className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                      ativo ? `${c.ativoBg} text-white` : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {contagemPorEixo(eixo)}
                  </span>

                  {ativo && <span className={`h-2 w-2 shrink-0 rounded-full ${c.ativoBg}`} />}
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
