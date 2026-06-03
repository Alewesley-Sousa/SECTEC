# 📦 Record e React.FC Explicado

Dois dos tipos mais importantes do React/TypeScript.

---

## 1. O que é `Record`?

**`Record` cria um objeto com chaves de um tipo e valores de outro tipo.**

É um atalho para criar objetos tipados facilmente.

### Exemplo Visual

```tsx
// Problema: Você tem cores e precisa tipar um objeto
const colors = {
  primary: 'bg-blue-600',
  secondary: 'bg-gray-200',
  danger: 'bg-red-600',
}

// Como tipar isso manualmente? 😞
type ColorMap = {
  primary: string
  secondary: string
  danger: string
}

// ✅ Com Record - muito mais simples! 🎉
type ButtonVariant = 'primary' | 'secondary' | 'danger'
type ColorMap = Record<ButtonVariant, string>

// São a MESMA coisa!
```

---

## Como funciona `Record`

### Sintaxe Básica

```tsx
Record<Keys, Values>
```

- **Keys** = Os nomes das chaves do objeto
- **Values** = O tipo dos valores

### Exemplos Progressivos

#### Exemplo 1: Cores de Botão

```tsx
type ButtonVariant = 'primary' | 'secondary' | 'danger'

// ❌ Sem Record (tedioso)
type ColorMap = {
  primary: string
  secondary: string
  danger: string
}

// ✅ Com Record (elegante!)
type ColorMap = Record<ButtonVariant, string>

// Uso:
const colors: ColorMap = {
  primary: 'bg-blue-600',
  secondary: 'bg-gray-200',
  danger: 'bg-red-600',
}

// TypeScript avisa se faltou alguma cor:
const colors: ColorMap = {
  primary: 'bg-blue-600',
  secondary: 'bg-gray-200',
  // ❌ ERRO: 'danger' is missing!
}
```

#### Exemplo 2: Tamanhos com múltiplas propriedades

```tsx
type ButtonSize = 'sm' | 'md' | 'lg'

// Cada tamanho tem múltiplas classes
type SizeStyles = Record<ButtonSize, {
  padding: string
  fontSize: string
  borderRadius: string
}>

const sizeStyles: SizeStyles = {
  sm: {
    padding: 'px-2 py-1',
    fontSize: 'text-xs',
    borderRadius: 'rounded',
  },
  md: {
    padding: 'px-4 py-2',
    fontSize: 'text-sm',
    borderRadius: 'rounded-lg',
  },
  lg: {
    padding: 'px-6 py-3',
    fontSize: 'text-base',
    borderRadius: 'rounded-xl',
  },
}
```

#### Exemplo 3: Mapeando status para mensagens

```tsx
type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered'

type StatusMessages = Record<OrderStatus, string>

const messages: StatusMessages = {
  pending: '⏳ Aguardando processamento...',
  processing: '🔄 Processando seu pedido...',
  shipped: '🚚 Em trânsito!',
  delivered: '✅ Entregue!',
}

// Uso:
function getStatusMessage(status: OrderStatus): string {
  return messages[status]
}

getStatusMessage('pending')    // '⏳ Aguardando processamento...'
getStatusMessage('delivered')  // '✅ Entregue!'
```

---

## Record vs Objeto Manual

### ❌ Sem Record (problema)

```tsx
// Você precisa listar TUDO manualmente
const styleMap = {
  primary: 'bg-blue-600 text-white',
  secondary: 'bg-gray-200 text-gray-900',
  danger: 'bg-red-600 text-white',
}

// Se você esquecer de adicionar uma cor, TypeScript NÃO reclama
// E seu código quebra no runtime 😞
```

### ✅ Com Record (solução)

```tsx
type ButtonVariant = 'primary' | 'secondary' | 'danger'

const styleMap: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 text-white',
  secondary: 'bg-gray-200 text-gray-900',
  danger: 'bg-red-600 text-white',
  // ❌ Se esquecer de uma, TypeScript reclama!
}
```

---

## Record com String ou Number

### Record com chaves String

```tsx
// Um objeto com chaves string
type UserPreferences = Record<string, boolean>

const prefs: UserPreferences = {
  notifications: true,
  darkMode: false,
  newsletter: true,
  // Pode adicionar quantas quiser!
}
```

### Record com chaves Number

```tsx
// Um objeto com chaves numéricas (incomum, mas possível)
type Scores = Record<number, string>

const scores: Scores = {
  1: 'Péssimo',
  2: 'Ruim',
  3: 'Okay',
  4: 'Bom',
  5: 'Excelente',
}
```

---

## O que é `React.FC`?

**`React.FC` = "React Function Component"**

É um tipo TypeScript que diz "isso é um componente React".

### Sintaxe

```tsx
type React.FC<Props> = (props: Props) => ReactNode
```

- **FC** = FunctionComponent (componente funcional)
- **<Props>** = O tipo das props que o componente recebe

---

## Usando React.FC

### Exemplo Básico

```tsx
// ❌ Sem React.FC (menos seguro)
function Button({ label }: { label: string }) {
  return <button>{label}</button>
}

// ✅ Com React.FC (mais seguro)
type ButtonProps = {
  label: string
}

const Button: React.FC<ButtonProps> = ({ label }) => {
  return <button>{label}</button>
}
```

### Visualizando a diferença

```tsx
// React.FC fornece:
// 1. Tipar as props automaticamente
// 2. O componente SEMPRE retorna ReactNode (ou null)
// 3. Suporte a children automático
// 4. Melhor autocompletar do IDE

type ButtonProps = {
  label: string
  onClick: () => void
}

// A função PRECISA retornar JSX/null
const Button: React.FC<ButtonProps> = ({ label, onClick }) => {
  return <button onClick={onClick}>{label}</button>

  // ✅ Como é React.FC, TypeScript garante que retorna JSX
  // ❌ Se você não retornar nada, TypeScript reclama
}
```

---

## React.FC com Children

**`children` é um prop especial do React que permite passar conteúdo dentro de um componente.**

```tsx
// ❌ Sem React.FC (você precisa digitar tudo)
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2>{title}</h2>
      {children}
    </div>
  )
}

// ✅ Com React.FC (children já está incluído!)
type CardProps = {
  title: string
  // Você NÃO precisa digitar children!
  // React.FC traz isso automaticamente
}

const Card: React.FC<CardProps> = ({ title, children }) => {
  return (
    <div>
      <h2>{title}</h2>
      {children}
    </div>
  )
}

// Uso:
<Card title="Meu Card">
  <p>Esse é o children!</p>
  <button>Botão</button>
</Card>
```

---

## Record + React.FC = Composição Perfeita

### Componente Button Profissional

```tsx
import React from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'danger'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
}

// ✅ Record mapeia variantes para estilos
// ✅ React.FC define o componente tipado
const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  children,
  className = '',
  ...rest
}) => {
  const finalClasses = `${variantStyles[variant]} ${className}`

  return (
    <button className={finalClasses} {...rest}>
      {children}
    </button>
  )
}
```

### Uso:

```tsx
// TypeScript sabe que variant DEVE ser uma dessas 3
<Button variant="primary">Primário</Button>
<Button variant="secondary">Secundário</Button>
<Button variant="danger">Perigo</Button>

// ❌ ERRO: TypeScript reclama
<Button variant="invalid">Inválido</Button>
```

---

## Comparação: Com e Sem Record/React.FC

### ❌ Código Desorganizado (Evite!)

```tsx
// Sem tipos bem definidos
function Button(props) {
  const styles = {
    primary: 'bg-blue-600',
    secondary: 'bg-gray-200',
    danger: 'bg-red-600',
  }

  return (
    <button className={styles[props.variant]}>
      {props.children}
    </button>
  )
}

// Problemas:
// - Sem autocomplete
// - Sem aviso de erros
// - Sem sugestão de variantes
```

### ✅ Código Profissional (Use assim!)

```tsx
import React from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600',
  secondary: 'bg-gray-200',
  danger: 'bg-red-600',
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  children,
  ...rest
}) => (
  <button className={variantStyles[variant]} {...rest}>
    {children}
  </button>
)

// Benefícios:
// ✅ Autocomplete: variant="[ctrl+space]"
// ✅ Type-safe: variant="invalid" → ERRO
// ✅ Self-documenting: Claro o que cada tipo faz
// ✅ Profissional: Padrão da indústria
```

---

## Resumo Rápido

### Record
```tsx
// Mapeia valores para chaves tipadas
type Status = 'active' | 'inactive' | 'pending'
type Messages = Record<Status, string>

const messages: Messages = {
  active: 'Ativo',
  inactive: 'Inativo',
  pending: 'Aguardando',
  // ❌ Se faltar algum, TypeScript reclama!
}
```

### React.FC
```tsx
// Define um componente funcional React
type Props = { title: string }

const MyComponent: React.FC<Props> = ({ title, children }) => {
  return (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  )
}

// Benefícios:
// ✅ Props tipadas
// ✅ children automático
// ✅ Retorno garantido
```

---

## Exemplo Completo do Projeto SECTEC

```tsx
// src/components/Button/Button.tsx
import React from 'react'

// ✅ Union type para variantes
export type ButtonVariant = 'primary' | 'secondary' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

// ✅ Props bem tipadas
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
}

// ✅ Record mapeia cada variante para estilos
const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-sectec-600 hover:bg-sectec-700 text-white',
  secondary: 'bg-slate-200 hover:bg-slate-300 text-slate-900',
  danger: 'bg-red-500 hover:bg-red-600 text-white',
}

// ✅ Record mapeia cada tamanho para estilos
const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
}

// ✅ React.FC define o componente
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  disabled = false,
  className = '',
  ...rest
}) => {
  const baseStyles = 'font-semibold rounded-lg transition-colors'
  const disabledStyles = disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''

  const finalClassName = `
    ${baseStyles}
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    ${disabledStyles}
    ${className}
  `.trim()

  return (
    <button
      disabled={disabled || isLoading}
      className={finalClassName}
      {...rest}
    >
      {isLoading ? '⏳ Carregando...' : children}
    </button>
  )
}
```

---

## Checklist de Boas Práticas

- [ ] Usar `Record` para mapear valores repetidos
- [ ] Usar `React.FC` para todos os componentes
- [ ] Sempre tipar os Records completamente
- [ ] Desestruturar props corretamente
- [ ] Usar spread `...rest` para passar todos os atributos
- [ ] Fornecer valores padrão onde apropriado

---

## Próximos Passos

1. ✅ Entenda `Record` e `React.FC`
2. ✅ Aplique em seus componentes
3. ✅ Use `type` em vez de `interface`
4. ✅ Sempre spreadeie `...rest` para atributos HTML

**Agora você está pronto para criar componentes profissionais!** 🚀
