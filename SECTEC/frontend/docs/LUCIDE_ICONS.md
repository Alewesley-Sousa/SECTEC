# 🎨 Guia de Ícones com Lucide React

## O que é Lucide React?

Lucide React é uma biblioteca de ícones SVG pequenos, limpos e customizáveis. Já está instalada no projeto!

```bash
npm install lucide-react
```

## Importação Básica

```tsx
import { Settings, Menu, X, Heart, Star, Home } from 'lucide-react'
```

Cada ícone é um componente React que você pode usar direto:

```tsx
<Settings />
<Menu />
<X />
<Heart />
<Star />
<Home />
```

## Tamanho do Ícone

Use `w-` e `h-` do Tailwind para ajustar o tamanho:

```tsx
// Pequeno
<Settings className="w-4 h-4" />

// Médio (padrão)
<Settings className="w-6 h-6" />

// Grande
<Settings className="w-8 h-8" />

// Extra grande
<Settings className="w-12 h-12" />
```

## Cor do Ícone

Use as classes de cor do Tailwind:

```tsx
// Sectec (principal)
<Settings className="text-sectec-600" />

// Hover interativo
<Settings className="text-sectec-600 hover:text-sectec-700" />

// Variações
<Settings className="text-slate-600" />
<Settings className="text-red-500" />
<Settings className="text-blue-500" />
```

## Ícones Interativos (com Click)

```tsx
import { Settings } from 'lucide-react'

export const ConfigButton = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Settings 
      className="w-6 h-6 text-sectec-600 cursor-pointer hover:text-sectec-700" 
      onClick={() => setIsOpen(!isOpen)}
    />
  )
}
```

## Animações com Ícones

### Exemplo 1: Girar (como Settings)

**No `index.css`:**
```css
@keyframes spin-smooth {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.spin-icon {
  animation: spin-smooth 0.6s ease-in-out forwards;
}
```

**No componente:**
```tsx
import { Settings } from 'lucide-react'
import { useState } from 'react'

export const ConfigButton = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Settings 
      className={`w-6 h-6 text-sectec-600 cursor-pointer ${isOpen ? 'spin-icon' : ''}`}
      onClick={() => setIsOpen(!isOpen)}
    />
  )
}
```

### Exemplo 2: Pulsar (para atenção)

**No `index.css`:**
```css
@keyframes pulse-glow {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.pulse-icon {
  animation: pulse-glow 1.5s ease-in-out infinite;
}
```

**No componente:**
```tsx
<Heart className="w-6 h-6 text-red-500 pulse-icon" />
```

### Exemplo 3: Deslizar do lado (Menu)

**No `index.css`:**
```css
@keyframes slide-in {
  from {
    transform: translateX(-20px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.slide-in-icon {
  animation: slide-in 0.4s ease-out;
}
```

## Ícones Populares no SECTEC

```tsx
import {
  Settings,        // ⚙️ Configurações
  Menu,            // ☰ Menu
  X,               // ✕ Fechar
  Home,            // 🏠 Home
  Heart,           // ❤️ Favorito
  Star,            // ⭐ Star
  Search,          // 🔍 Buscar
  Bell,            // 🔔 Notificação
  User,            // 👤 Perfil
  LogOut,          // 🚪 Sair
  Check,           // ✓ Confirmar/OK
  AlertCircle,     // ⚠️ Alerta
  Trash2,          // 🗑️ Deletar
  Edit,            // ✏️ Editar
  Plus,            // ➕ Adicionar
  ChevronDown,     // V Expandir
  ChevronUp,       // ^ Colapsar
  ArrowRight,      // → Avançar
  ArrowLeft,       // ← Voltar
  Loading,         // ⟳ Carregando
} from 'lucide-react'
```

## Exemplo Completo de Componente

```tsx
import { Settings, X } from 'lucide-react'
import { useState } from 'react'

type IconButtonProps = {
  icon: React.ComponentType<{ className?: string }>
  onClick?: () => void
  label?: string
}

export const IconButton = ({ icon: Icon, onClick, label }: IconButtonProps) => {
  return (
    <button
      onClick={onClick}
      title={label}
      className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
    >
      <Icon className="w-5 h-5 text-sectec-600 hover:text-sectec-700" />
    </button>
  )
}

// Uso:
<IconButton icon={Settings} label="Configurações" onClick={() => alert('Settings!')} />
<IconButton icon={X} label="Fechar" onClick={() => close()} />
```

## Combinando com Button Component

```tsx
import { Button } from './Button'
import { Plus, Trash2 } from 'lucide-react'

export const ActionButtons = () => {
  return (
    <div className="flex gap-2">
      <Button variant="primary" className="flex items-center gap-2">
        <Plus className="w-4 h-4" />
        Adicionar
      </Button>

      <Button variant="danger" className="flex items-center gap-2">
        <Trash2 className="w-4 h-4" />
        Deletar
      </Button>
    </div>
  )
}
```

## Propriedades dos Ícones

```tsx
<Settings
  className="w-6 h-6 text-sectec-600"    // Tamanho e cor
  strokeWidth={2}                         // Espessura da linha (1-3)
  onClick={() => {}}                      // Click handler
  style={{ transition: 'all 0.3s' }}     // Estilos inline
/>
```

## Procurando Ícones

Todos os ícones disponíveis: https://lucide.dev

Busque por nome como:
- `Alert` - alertas
- `Check` - confirmações
- `Clock` - tempo
- `Calendar` - datas
- `Mail` - email
- `Phone` - telefone
- `Download` - baixar
- `Upload` - enviar

## Boas Práticas

✅ **Recomendado:**
```tsx
// Importar específicos
import { Settings, Home } from 'lucide-react'
```

❌ **Evitar:**
```tsx
// Não importar tudo
import * as Icons from 'lucide-react'
```

✅ **Usar com Tailwind:**
```tsx
<Settings className="w-6 h-6 text-sectec-600 hover:text-sectec-700 transition-colors" />
```

❌ **Não misturar:**
```tsx
<Settings size={24} color="#16a34a" />  // Prefira Tailwind classes
```

## Dicas de Design

1. **Consistência de tamanho:** Use `w-6 h-6` para ícones normais em headers/menus
2. **Cor primária:** Sectec-600 para ícones positivos
3. **Cor destaque:** Vermelho para deletar, amarelo para alerta
4. **Hover effect:** Adicione sempre `hover:text-sectec-700` para UX melhor
5. **Transição:** `transition-colors` deixa mais suave

## Exemplos de Animações em index.css

```css
/* Girar infinito (loading) */
.spin-infinite {
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Bounce (atenção) */
.bounce-icon {
  animation: bounce 1s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

/* Fade in */
.fade-in {
  animation: fade-in 0.3s ease-in-out;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

---

**Referência rápida:** https://lucide.dev
