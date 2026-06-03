# 🎯 Type vs Interface - Qual usar?

## TL;DR (Resumão)

**Use `type`!** É mais moderno e flexível. 

```tsx
// ✅ Recomendado para componentes React
type ButtonProps = {
  variant?: 'primary' | 'secondary'
  children: React.ReactNode
}
```

---

## Comparação Detalhada

### `Type` (Moderno e Flexível)

```tsx
type ButtonProps = {
  variant: 'primary' | 'secondary'
  size: 'sm' | 'md' | 'lg'
  onClick: () => void
}
```

✅ **Vantagens:**
- Pode ser usado para qualquer coisa (não só objetos)
- Suporta `union types` (A | B | C)
- Suporta `tuple types` ([string, number])
- Mais simples e direto
- Melhor para componentes React
- Pode estender com `&`

❌ **Desvantagens:**
- Não é "reciclável" para redeclaração (você não pode fazer `type X = { a: string }; type X = { b: number }` duas vezes)

---

### `Interface` (Mais estruturado)

```tsx
interface ButtonProps {
  variant: 'primary' | 'secondary'
  size: 'sm' | 'md' | 'lg'
  onClick: () => void
}
```

✅ **Vantagens:**
- Pode estender com `extends`
- Melhor para documentação de classes
- Pode ser "merged" (redeclarada múltiplas vezes)
- Mais tradicional

❌ **Desvantagens:**
- Só funciona para objetos
- Mais verboso
- Não tão flexível quanto `type`

---

## Exemplos Práticos

### Situação 1: Props de Componente
✅ **Use `type`**

```tsx
type ButtonProps = {
  variant: 'primary' | 'secondary'
  children: React.ReactNode
  onClick: () => void
}

export const Button = ({ variant, children, onClick }: ButtonProps) => {
  // ...
}
```

### Situação 2: Union Types
✅ **Use `type`** (interface não pode fazer isso!)

```tsx
type DataResult = 
  | { status: 'loading' }
  | { status: 'success'; data: string }
  | { status: 'error'; error: Error }

// Isso é IMPOSSÍVEL com interface!
```

### Situação 3: Estender tipos
**Ambos funcionam, mas `type` é mais simples:**

```tsx
// ✅ Com type (usando &)
type BaseProps = {
  id: string
  className?: string
}

type ButtonProps = BaseProps & {
  onClick: () => void
}

// Com interface (usando extends)
interface BaseProps {
  id: string
  className?: string
}

interface ButtonProps extends BaseProps {
  onClick: () => void
}
```

### Situação 4: Tipos primitivos
✅ **Use `type`** (interface não pode!)

```tsx
// ✅ Isso é possível com type
type ID = string | number
type Status = 'active' | 'inactive' | 'pending'

// ❌ Isso é IMPOSSÍVEL com interface
interface ID = string | number  // ERRO!
```

---

## Padrão SECTEC

**Para este projeto, use SEMPRE `type` para:**

1. ✅ Props de componentes
2. ✅ Estados (se precisar tipar)
3. ✅ Union types
4. ✅ Qualquer coisa que não seja uma classe

**Use `interface` APENAS se:**
- Estiver trabalhando com classes
- Precisar de herança complexa
- Tiver um motivo específico (raramente)

---

## Exemplos no Projeto

### ✅ Correto (Use assim!)

```tsx
// src/components/Button/Button.tsx
import React from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  children: React.ReactNode
  isLoading?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  isLoading = false,
  ...props
}) => {
  // ...
}
```

### ❌ Evite (Não use assim!)

```tsx
// Não use interface para props
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  children: React.ReactNode
  isLoading?: boolean
}
```

---

## Migração do Projeto

Todos os exemplos foram atualizados para usar `type`:

```
✅ TUTORIAL_COMPONENTES.md - Usando type
✅ EXEMPLOS_PRATICOS.md - Usando type
✅ src/components/Button/Button.tsx - Usando type
✅ STYLE_GUIDE.md - Exemplos com type
```

---

## Referência Rápida

| Situação | Type | Interface |
|----------|------|-----------|
| Props de componente | ✅ Sim | ❌ Evite |
| Union types (A \| B) | ✅ Sim | ❌ Não |
| Tuple types ([a, b]) | ✅ Sim | ❌ Não |
| Tipos primitivos | ✅ Sim | ❌ Não |
| Estender objetos | ✅ Sim (com &) | ✅ Sim (extends) |
| Classes | ❌ Não | ✅ Sim |

---

## Conclusão

```tsx
// 🎯 Padrão SECTEC: Use TYPE para tudo em React!

type ButtonProps = {
  // seu código aqui
}

export const Button = (props: ButtonProps) => {
  // seu componente aqui
}
```

**Simples, moderno e funciona perfeitamente!** 🚀
