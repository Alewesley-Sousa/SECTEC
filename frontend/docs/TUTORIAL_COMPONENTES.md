# 🎓 Guia: Criando Componentes React do Zero

Um tutorial passo a passo para aprender a criar componentes React com TypeScript.

---

## 📚 Table of Contents
1. [Componente Bem Simples](#1-componente-bem-simples)
2. [Componente com Props](#2-componente-com-props)
3. [Componente com Tipos TypeScript](#3-componente-com-tipos-typescript)
4. [Componente com Tailwind CSS](#4-componente-com-tailwind-css)
5. [Componente com Eventos](#5-componente-com-eventos)
6. [Componente Completo (Button)](#6-componente-completo-button)

---

## 1. Componente Bem Simples

**O que é um componente?**
É uma função que retorna HTML (JSX).

```tsx
// src/components/Welcome.tsx
function Welcome() {
  return (
    <h1>Bem-vindo ao meu app!</h1>
  )
}

export default Welcome
```

**Como usar?**
```tsx
// Em qualquer página ou outro componente
import Welcome from "../components/Welcome"

function App() {
  return (
    <div>
      <Welcome />
    </div>
  )
}
```

**O que acontece?**
- React substitui `<Welcome />` pelo `<h1>Bem-vindo...</h1>`
- Pronto!

---

## 2. Componente com Props

**What são "props"?**
São dados que você **passa PARA o componente**. Como argumentos de uma função.

```tsx
// src/components/Greeting.tsx
function Greeting(props) {
  return (
    <h1>Olá, {props.name}!</h1>
  )
}

export default Greeting
```

**Como usar?**
```tsx
<Greeting name="Felipe" />
<Greeting name="Maria" />
```

**Resultado:**
```
Olá, Felipe!
Olá, Maria!
```

### Forma mais limpa (Destructuring):
```tsx
// src/components/Greeting.tsx
function Greeting({ name }) {
  return (
    <h1>Olá, {name}!</h1>
  )
}

export default Greeting
```

**É a mesma coisa**, só que mais limpo!

---

## 3. Componente com Tipos TypeScript

**Por que TypeScript?**
Evita erros! Você especifica **exatamente** que dados o componente espera receber.

```tsx
// src/components/Card.tsx
type CardProps = {
  title: string      // Espera um texto
  description: string // Espera um texto
  bgColor: string    // Espera um texto
}

function Card({ title, description, bgColor }: CardProps) {
  return (
    <div style={{ backgroundColor: bgColor, padding: '16px' }}>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  )
}

export default Card
```

**Como usar?**
```tsx
<Card 
  title="Meu Card" 
  description="Descrição do card"
  bgColor="lightblue"
/>
```

**O que acontece se errar?**
```tsx
// ❌ ERRO! TypeScript reclama
<Card 
  title={123}  // Deveria ser string!
  description="Ok"
  bgColor="blue"
/>
```

---

## 4. Componente com Tailwind CSS

**Tailwind é CSS em classe!**

```tsx
// src/components/Button.tsx
type ButtonProps = {
  text: string
  color: 'blue' | 'green' | 'red'  // Pode ser APENAS um desses 3
}

function Button({ text, color }: ButtonProps) {
  // Mapa de cores para classes Tailwind
  const colorClasses = {
    blue: 'bg-blue-500 hover:bg-blue-600',
    green: 'bg-green-500 hover:bg-green-600',
    red: 'bg-red-500 hover:bg-red-600',
  }

  return (
    <button className={`px-4 py-2 text-white rounded ${colorClasses[color]}`}>
      {text}
    </button>
  )
}

export default Button
```

**Decompondo as classes:**
- `px-4` = padding horizontal (esquerda + direita)
- `py-2` = padding vertical (cima + baixo)
- `text-white` = texto branco
- `rounded` = bordas arredondadas
- `bg-blue-500` = fundo azul
- `hover:bg-blue-600` = quando passa o mouse, fica mais escuro

**Como usar?**
```tsx
<Button text="Clique-me" color="blue" />
<Button text="Sucesso" color="green" />
<Button text="Deletar" color="red" />
```

---

## 5. Componente com Eventos

**Eventos são ações** (clique, mudança de input, etc)

```tsx
// src/components/Counter.tsx
import { useState } from 'react'

function Counter() {
  const [count, setCount] = useState(0)  // count = valor atual, setCount = função para mudar

  return (
    <div>
      <p>Cliques: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        +1
      </button>
    </div>
  )
}

export default Counter
```

**Como funciona `useState`?**
- `useState(0)` = começa em 0
- `count` = valor atual (primeiro clique: 0, segundo clique: 1, etc)
- `setCount()` = função para atualizar
- `onClick={() => setCount(count + 1)}` = quando clica, adiciona 1

**Resultado:**
```
Cliques: 0
[+1] ← Clique aqui

Cliques: 1
[+1] ← Clique de novo

Cliques: 2
```

---

## 6. Componente Completo (Button)

Agora vamos reunir TUDO:

```tsx
// src/components/Button/Button.tsx
import React from 'react'

// 1️⃣ DEFINIR OS TIPOS
export type ButtonVariant = 'primary' | 'secondary' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

// 2️⃣ TYPE COM AS PROPS
// Estende HTMLButtonElement = herda todas as propriedades normais de <button>
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant          // Tipo de botão (opcional, padrão = primary)
  size?: ButtonSize                // Tamanho (opcional, padrão = md)
  children: React.ReactNode        // Conteúdo do botão (texto, ícone, etc)
  isLoading?: boolean              // Se está carregando (opcional)
}

// 📖 Quer entender React.ButtonHTMLAttributes?
// Veja: docs/REACT_TYPES_EXPLICADO.md

// 3️⃣ MAPAS DE ESTILOS
// Cada variante tem suas classes Tailwind
const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-sectec-600 text-white hover:bg-sectec-700',
  secondary: 'bg-slate-200 text-slate-900 hover:bg-slate-300',
  danger: 'bg-red-500 text-white hover:bg-red-600',
}

// Cada tamanho tem seu padding e font-size
const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
}

// 4️⃣ COMPONENTE
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',      // Se não passar, usa 'primary'
  size = 'md',              // Se não passar, usa 'md'
  children,                 // O conteúdo
  isLoading = false,        // Se não passar, é false
  disabled = false,         // Se não passar, é false
  className = '',           // Classes adicionais customizadas
  ...props                  // Outros atributos (como onClick, type, etc)
}) => {
  // 5️⃣ LÓGICA
  const baseStyles = 'font-semibold rounded-lg transition-colors'
  const disabledStyles = disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''

  // Combinar todas as classes
  const finalClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyles} ${className}`

  // 6️⃣ RETORNAR JSX
  return (
    <button
      {...props}                    // Passar atributos normais (onClick, type, etc)
      disabled={disabled || isLoading}
      className={finalClassName}
    >
      {isLoading ? '⏳ Carregando...' : children}
    </button>
  )
}
```

### Passo a passo VISUAL:

```
┌─ COMPONENTE BUTTON ─────────────────────┐
│                                         │
│  1. Definir tipos (variant, size, etc) │
│     ↓                                   │
│  2. Criar interface com as props       │
│     ↓                                   │
│  3. Mapas de estilos (cores, tamanho)  │
│     ↓                                   │
│  4. Função do componente               │
│     ├─ Receber props                   │
│     ├─ Processar lógica                │
│     ├─ Juntar classes Tailwind         │
│     └─ Retornar JSX                    │
│                                         │
└─────────────────────────────────────────┘
```

### Como usar o Button:

```tsx
// Uso simples
<Button>Clique aqui</Button>

// Com variante
<Button variant="danger">Deletar</Button>

// Com tamanho
<Button size="lg">Grande</Button>

// Combinado
<Button variant="success" size="sm" onClick={() => alert('Clicou!')}>
  OK
</Button>

// Com loading
<Button isLoading>Aguarde...</Button>

// Desabilitado
<Button disabled>Indisponível</Button>
```

---

## 📌 Resumo das Coisas Importantes

### Interface TypeScript
```tsx
type Props = {
  title: string              // Obrigatório
  subtitle?: string          // Opcional (o `?` significa isso)
  count: number              // Um número
  isActive: boolean          // True ou false
  type: 'small' | 'large'    // Apenas um desses valores
  onClick: () => void        // Uma função que não retorna nada
  children: React.ReactNode  // Conteúdo do componente
}
```

### Valores Padrão
```tsx
type ButtonProps = {
  variant?: 'primary' | 'secondary'
}

function Button({ variant = 'primary' }: ButtonProps) {
  // Se não passar variant, usa 'primary'
}
```

### Spread Operator (`...`)
```tsx
function Button({ onClick, disabled, ...props }: ButtonProps) {
  return (
    <button {...props} onClick={onClick} disabled={disabled}>
      Botão
    </button>
  )
}

// `...props` passa TODOS os outros atributos normais
// Como: className, title, id, data-*, etc
```

### Record (para mapear valores)
```tsx
const colors: Record<'red' | 'blue', string> = {
  red: 'bg-red-500',
  blue: 'bg-blue-500',
}

// Ou no tipo genéricamente:
const colors: Record<string, string> = {
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
}
```

---

## 🎯 Exercício Prático

**Crie um componente Card sozinho!**

```tsx
// Requisitos:
// 1. Recebe: title (string), description (string), color (red|blue|green)
// 2. Mostra o título em bold
// 3. Mostra descrição em cinza
// 4. Fundo muda de cor conforme o color prop
// 5. Usa Tailwind CSS (padding, rounded, shadow)
// 6. Exporta com "export const Card"

// Dica: Use interface, mapas de estilos, desestruturação
```

**Solução (não vire antes de tentar!):**
```tsx
interface CardProps {
  title: string
  description: string
  color: 'red' | 'blue' | 'green'
}

const backgroundColors: Record<string, string> = {
  red: 'bg-red-100 border-l-4 border-red-500',
  blue: 'bg-blue-100 border-l-4 border-blue-500',
  green: 'bg-green-100 border-l-4 border-green-500',
}

export const Card: React.FC<CardProps> = ({ title, description, color }) => {
  return (
    <div className={`p-6 rounded-lg shadow-md ${backgroundColors[color]}`}>
      <h3 className="text-lg font-bold text-slate-900 mb-2">
        {title}
      </h3>
      <p className="text-slate-600">
        {description}
      </p>
    </div>
  )
}
```

---

## 🔗 Próximos Passos

1. ✅ Crie 3 componentes simples sozinho
2. ✅ Entenda o ciclo de vida (useState, useEffect)
3. ✅ Aprenda a passar componentes como props (composição)
4. ✅ Crie uma biblioteca de componentes reutilizáveis

---

**Dúvidas? Pergunte!** 🎉
