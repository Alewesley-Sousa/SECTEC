# 🔌 React.ButtonHTMLAttributes e Tipos React Explicado

Um guia completo sobre os tipos especiais do React para HTML.

---

## O que é `React.ButtonHTMLAttributes`?

**É um tipo TypeScript que representa TODOS os atributos nativos de um `<button>` HTML!**

Imagine que você quer usar um `<button>` com todas suas propriedades normais:

```html
<!-- HTML puro - tem vários atributos -->
<button 
  type="submit"
  disabled={false}
  onClick={() => alert('Clicou!')}
  className="btn-primary"
  id="meu-botao"
  data-test="button"
>
  Clique-me
</button>
```

Todos esses atributos (`type`, `disabled`, `onClick`, `className`, etc) são fornecidos pelo React através de `React.ButtonHTMLAttributes<HTMLButtonElement>`!

---

## Entendendo a Sintaxe

```tsx
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary'
}
```

Vamos quebrar isso:

### Parte 1: `React.ButtonHTMLAttributes<HTMLButtonElement>`
- **React.ButtonHTMLAttributes** = Tipo que contém TODOS os atributos de um botão
- **HTMLButtonElement** = O elemento HTML que estamos usando (`<button>`)

### Parte 2: `& { ... }`
- O `&` significa "E TAMBÉM adicione esses tipos customizados"
- Você está dizendo: "Quero tudo de ButtonHTMLAttributes MAIS meus tipos customizados"

---

## Visualizando o que está DENTRO de `ButtonHTMLAttributes`

Quando você usa `React.ButtonHTMLAttributes<HTMLButtonElement>`, você automaticamente ganha:

```tsx
type ButtonHTMLAttributes = {
  // Atributos normais
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  className?: string
  id?: string
  title?: string
  
  // Eventos
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
  onBlur?: (event: React.FocusEvent<HTMLButtonElement>) => void
  onFocus?: (event: React.FocusEvent<HTMLButtonElement>) => void
  onMouseEnter?: (event: React.MouseEvent<HTMLButtonElement>) => void
  onMouseLeave?: (event: React.MouseEvent<HTMLButtonElement>) => void
  
  // Data attributes
  'data-testid'?: string
  'data-custom'?: string
  
  // ... e muitos mais!
}
```

**Sem você precisar digitar TUDO isso!** React fornece automaticamente! 🎁

---

## Exemplo Prático Completo

### Componente Button com ButtonHTMLAttributes

```tsx
// src/components/Button.tsx
import React from 'react'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  type = 'button',  // Padrão HTML
  disabled = false,  // Padrão HTML
  className = '',    // Padrão HTML
  ...rest           // Todos os outros atributos HTML normais
}) => {
  const variantStyles = {
    primary: 'bg-blue-600 text-white',
    secondary: 'bg-gray-200 text-gray-900',
  }

  const sizeStyles = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  return (
    <button
      type={type}
      disabled={disabled}
      className={`${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...rest}  // Passa onClick, onHover, data-*, etc
    >
      {children}
    </button>
  )
}
```

### Usando o componente:

```tsx
// Você pode usar TODOS os atributos normais de <button>!

// ✅ Com onClick (vem de ButtonHTMLAttributes)
<Button onClick={() => console.log('Clicou!')}>
  Clique-me
</Button>

// ✅ Com type="submit" (vem de ButtonHTMLAttributes)
<Button type="submit">
  Enviar Formulário
</Button>

// ✅ Desabilitado (vem de ButtonHTMLAttributes)
<Button disabled={true}>
  Desabilitado
</Button>

// ✅ Data attributes (vem de ButtonHTMLAttributes)
<Button data-testid="submit-btn">
  Teste automático
</Button>

// ✅ Múltiplos atributos de uma vez!
<Button
  variant="secondary"
  size="lg"
  type="submit"
  disabled={false}
  onClick={handleClick}
  className="custom-class"
  title="Clique para enviar"
>
  Enviar
</Button>
```

---

## Outros Tipos React Úteis

### 1. **InputHTMLAttributes**
Para componentes `<input>`:

```tsx
type TextInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  error,
  type = 'text',
  placeholder,
  value,
  onChange,
  disabled,
  ...rest
}) => {
  return (
    <div>
      {label && <label>{label}</label>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        {...rest}
      />
      {error && <span className="error">{error}</span>}
    </div>
  )
}

// Uso:
<TextInput
  label="Email"
  type="email"
  placeholder="seu@email.com"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  required
  autoFocus
/>
```

### 2. **FormHTMLAttributes**
Para componentes `<form>`:

```tsx
type FormProps = React.FormHTMLAttributes<HTMLFormElement> & {
  onSubmit: (data: any) => void
}

export const Form: React.FC<FormProps> = ({
  onSubmit,
  children,
  ...rest
}) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSubmit(e)
  }

  return (
    <form onSubmit={handleSubmit} {...rest}>
      {children}
    </form>
  )
}

// Uso:
<Form onSubmit={handleFormSubmit} method="POST" action="/api/submit">
  <TextInput name="username" />
  <TextInput name="password" type="password" />
</Form>
```

### 3. **DivHTMLAttributes**
Para componentes genéricos `<div>`:

```tsx
type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  title: string
  onClick?: () => void
}

export const Card: React.FC<CardProps> = ({
  title,
  children,
  className = '',
  ...rest
}) => {
  return (
    <div className={`bg-white p-4 rounded ${className}`} {...rest}>
      <h2>{title}</h2>
      {children}
    </div>
  )
}

// Uso:
<Card
  title="Meu Card"
  onClick={() => navigate('/detail')}
  className="custom"
  data-testid="card-1"
>
  Conteúdo aqui
</Card>
```

---

## O que é o `...rest`?

O **spread operator** (`...`) pega todos os atributos restantes que não foram desestruturados:

```tsx
// Exemplo educacional
function Button({ variant, size, children, ...rest }) {
  // variant = 'primary'      ✅ Extraído
  // size = 'md'              ✅ Extraído
  // children = 'Clique'      ✅ Extraído
  // rest = {                 ✅ Todos os outros!
  //   onClick: ...,
  //   disabled: true,
  //   className: 'custom',
  //   type: 'submit',
  //   'data-testid': 'btn'
  // }

  return (
    <button
      {...rest}  // ← Passa TUDO para o button nativo
    >
      {children}
    </button>
  )
}
```

**Visualizando:**

```
Input do usuário:
<Button 
  variant="primary"
  size="md"
  onClick={handleClick}
  disabled={true}
  className="custom"
  type="submit"
  data-testid="btn"
>
  Clique
</Button>

Desestruturação:
variant = 'primary'
size = 'md'
children = 'Clique'
rest = {
  onClick: handleClick,
  disabled: true,
  className: 'custom',
  type: 'submit',
  'data-testid': 'btn'
}

Retorno:
<button
  onClick={handleClick}
  disabled={true}
  className="custom"
  type="submit"
  data-testid="btn"
>
  Clique
</button>
```

---

## Exemplo Completo do Mundo Real

```tsx
// src/components/Button/Button.tsx
import React from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  disabled = false,
  className = '',
  type = 'button',
  ...rest  // ← Captura: onClick, onHover, id, data-*, etc
}) => {
  const baseStyles = 'font-semibold rounded-lg transition-colors'
  const disabledStyles = disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'

  const finalClassName = `
    ${baseStyles}
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    ${disabledStyles}
    ${className}
  `.trim()

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={finalClassName}
      {...rest}  // ← Passa TUDO: onClick, data-testid, title, etc
    >
      {isLoading ? '⏳ Carregando...' : children}
    </button>
  )
}
```

### Usando com todos os atributos:

```tsx
<Button
  // Customizações do componente
  variant="danger"
  size="lg"
  isLoading={isDeleting}
  
  // Atributos HTML normais (vêm de ButtonHTMLAttributes)
  type="submit"
  onClick={handleDelete}
  disabled={!hasPermission}
  className="mt-4"
  id="delete-btn"
  title="Clique para deletar (confirmação necessária)"
  data-testid="delete-button"
  onMouseEnter={() => setShowWarning(true)}
  onMouseLeave={() => setShowWarning(false)}
>
  ⚠️ Deletar Permanentemente
</Button>
```

---

## Lista Completa de Types do React

| Elemento | Type |
|----------|------|
| `<button>` | `React.ButtonHTMLAttributes<HTMLButtonElement>` |
| `<input>` | `React.InputHTMLAttributes<HTMLInputElement>` |
| `<form>` | `React.FormHTMLAttributes<HTMLFormElement>` |
| `<div>` | `React.HTMLAttributes<HTMLDivElement>` |
| `<img>` | `React.ImgHTMLAttributes<HTMLImageElement>` |
| `<a>` | `React.AnchorHTMLAttributes<HTMLAnchorElement>` |
| `<textarea>` | `React.TextareaHTMLAttributes<HTMLTextAreaElement>` |
| `<select>` | `React.SelectHTMLAttributes<HTMLSelectElement>` |
| `<table>` | `React.TableHTMLAttributes<HTMLTableElement>` |
| Genérico | `React.HTMLAttributes<HTMLElement>` |

---

## Por que usar isso?

### ❌ Sem ButtonHTMLAttributes
```tsx
// Você precisa digitar TUDO à mão
type ButtonProps = {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit' | 'reset'
  id?: string
  title?: string
  // ... 50+ outros atributos!
  variant?: string
  size?: string
}
```

### ✅ Com ButtonHTMLAttributes
```tsx
// React já fornece tudo!
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: string
  size?: string
}
```

**Você economiza horas de digitação e consegue atualizações automáticas quando o React adiciona novos atributos!** 🚀

---

## Resumo

```tsx
// Padrão React Moderno:

type ComponentProps = React.SeuHTMLAttributesAqui<SeuElementoHTML> & {
  // Seus props customizados aqui
}

export const Component: React.FC<ComponentProps> = ({
  // Desestruture o que precisar
  customProp,
  // Capture o resto
  ...rest
}) => {
  return (
    <elemento {...rest}>
      {/* rest contém onClick, className, id, data-*, etc */}
    </elemento>
  )
}
```

**Pronto!** Você tem um componente totalmente flexível que suporta TUDO! 🎉
