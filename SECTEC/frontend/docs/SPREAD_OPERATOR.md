# 🔄 Spread Operator (`...`) Explicado

Guia completo sobre o operador spread em React e JavaScript.

---

## O que é o Spread Operator?

**O spread operator (`...`) pega um objeto ou array e "espalha" seus elementos.**

Pense assim: é como abrir uma mochila e tirar TUDO que está dentro! 🎒

---

## Exemplo Visual Progressivo

### Nível 1: Spread em Array

```tsx
// Problema: Você quer copiar um array
const numbers = [1, 2, 3]

// ❌ Sem spread (cria referência, não cópia)
const copy = numbers
copy.push(4)
console.log(numbers) // [1, 2, 3, 4] ← Original mudou! 😞

// ✅ Com spread (cria cópia real)
const copy = [...numbers]
copy.push(4)
console.log(numbers) // [1, 2, 3] ← Original intacto! ✅

// Combinando arrays
const arr1 = [1, 2]
const arr2 = [3, 4]
const combined = [...arr1, ...arr2]
console.log(combined) // [1, 2, 3, 4]
```

### Nível 2: Spread em Objeto

```tsx
// Problema: Você quer copiar um objeto
const user = { name: 'Felipe', age: 25 }

// ❌ Sem spread (cria referência)
const copy = user
copy.age = 26
console.log(user.age) // 26 ← Original mudou! 😞

// ✅ Com spread (cria cópia real)
const copy = { ...user }
copy.age = 26
console.log(user.age) // 25 ← Original intacto! ✅

// Combinando objetos
const user = { name: 'Felipe', age: 25 }
const extra = { city: 'São Paulo', country: 'Brasil' }
const full = { ...user, ...extra }
console.log(full)
// { name: 'Felipe', age: 25, city: 'São Paulo', country: 'Brasil' }
```

---

## O Spread (`...`) em Props React

**O spread é PERFEITO para passar props de um componente para outro!**

### Conceito Básico

```tsx
// Props que você recebe
const props = {
  onClick: handleClick,
  disabled: false,
  className: 'my-button',
  type: 'submit',
}

// ❌ Sem spread (muito tedioso!)
<button
  onClick={props.onClick}
  disabled={props.disabled}
  className={props.className}
  type={props.type}
>
  Clique
</button>

// ✅ Com spread (elegante!)
<button {...props}>
  Clique
</button>
// É idêntico ao de cima! ✅
```

---

## Desestruturação vs Spread

### São diferentes!

```tsx
// DESESTRUTURAÇÃO: Extrair valores
const { name, age } = user
// name = 'Felipe'
// age = 25

// SPREAD: Espalhar um objeto
const copy = { ...user }
// copy = { name: 'Felipe', age: 25 }
```

---

## Padrão Comum: Extrair + Spread

**Você pode extrair algumas propriedades E passar as outras via spread!**

```tsx
const props = {
  label: 'Clique-me',
  onClick: handleClick,
  disabled: false,
  className: 'btn-primary',
  type: 'submit',
  title: 'Um botão',
}

// ✅ Extrair o que você quer usar
const { label, ...rest } = props

// Agora:
// label = 'Clique-me'
// rest = {
//   onClick: handleClick,
//   disabled: false,
//   className: 'btn-primary',
//   type: 'submit',
//   title: 'Um botão',
// }

// Usar
<button {...rest}>
  {label}
</button>
```

---

## Exemplo Real: Componente Button

### Passo a Passo

```tsx
// 1️⃣ Suas props customizadas
type ButtonProps = {
  variant?: 'primary' | 'secondary'
  label: string
  // ... MAIS as props normais de button!
}

// 2️⃣ O componente recebe TUDO
export const Button = ({
  variant = 'primary',  // ← Customizadas
  label,                 // ← Customizadas
  ...rest               // ← Todas as outras (onClick, disabled, className, etc)
}: ButtonProps) => {
  const styles = {
    primary: 'bg-blue-600',
    secondary: 'bg-gray-200',
  }

  return (
    // 3️⃣ Passa TUDO para o button nativo
    <button className={styles[variant]} {...rest}>
      {label}
    </button>
  )
}
```

### Visualizando o Fluxo

```
Input do usuário:
<Button
  variant="primary"
  label="Clique-me"
  onClick={handleClick}
  disabled={false}
  className="custom"
/>

↓ Desestruturação no componente:
variant = 'primary'
label = 'Clique-me'
rest = {
  onClick: handleClick,
  disabled: false,
  className: 'custom',
}

↓ No retorno ({...rest}):
<button
  className="bg-blue-600 custom"
  onClick={handleClick}
  disabled={false}
>
  Clique-me
</button>
```

---

## Casos de Uso Comuns

### Use Case 1: Passar atributos HTML

```tsx
type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  ...rest  // ← Pega: type, value, onChange, placeholder, etc
}) => {
  return (
    <div>
      <label>{label}</label>
      <input {...rest} />  {/* ← Passa TUDO para o input */}
      {error && <span>{error}</span>}
    </div>
  )
}

// Uso:
<Input
  label="Email"
  type="email"           // ← Vai para rest
  placeholder="..."      // ← Vai para rest
  value={email}          // ← Vai para rest
  onChange={handleChange}// ← Vai para rest
  error={emailError}     // ← Customizado
/>
```

### Use Case 2: Adicionar propriedades

```tsx
const defaultProps = {
  onClick: () => console.log('Clicou'),
  disabled: false,
}

const userProps = {
  className: 'custom',
  title: 'Meu botão',
}

// ✅ Combinar: defaults + user props
const finalProps = { ...defaultProps, ...userProps }

// finalProps = {
//   onClick: handleClick,     // Do default
//   disabled: false,          // Do default
//   className: 'custom',      // Do user
//   title: 'Meu botão',       // Do user
// }
```

### Use Case 3: Sobrescrever valores

```tsx
const original = {
  name: 'Felipe',
  age: 25,
  city: 'São Paulo',
}

// ✅ Mudar um valor mantendo os outros
const updated = {
  ...original,
  age: 26,  // ← Sobrescreve
}

// updated = { name: 'Felipe', age: 26, city: 'São Paulo' }
```

---

## Spread em React Hooks

### Exemplo com useState

```tsx
// Estado complexo
const [user, setUser] = useState({
  name: 'Felipe',
  email: 'felipe@example.com',
  age: 25,
})

// ❌ Sem spread (perde outras propriedades!)
setUser({ age: 26 })
// user = { age: 26 } ← name e email sumiram! 😞

// ✅ Com spread (mantém tudo)
setUser({ ...user, age: 26 })
// user = { name: 'Felipe', email: 'felipe@example.com', age: 26 }

// Ou ainda melhor (se só age mudou):
setUser(prev => ({ ...prev, age: 26 }))
```

---

## Ordem Importa!

**Quando você faz spread, a ordem importa!**

```tsx
// Caso 1: spread primeiro, depois sobrescrever
const result = { ...user, age: 26 }
// age = 26 ✅

// Caso 2: sobrescrever primeiro, depois spread
const result = { age: 26, ...user }
// age = user.age (original) ✅

// Caso 3: spread no meio (confuso!)
const result = { name: 'Felipe', ...user, age: 26 }
// O último sempre vence!
```

---

## Padrão Completo: Button Profissional

```tsx
import React from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'danger'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  isLoading?: boolean
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 hover:bg-blue-700',
  secondary: 'bg-gray-200 hover:bg-gray-300',
  danger: 'bg-red-600 hover:bg-red-700',
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  isLoading = false,
  children,
  disabled = false,
  className = '',
  ...rest  // ← Pega: onClick, type, title, data-*, onMouseEnter, etc
}) => {
  const baseStyles = 'font-semibold px-4 py-2 rounded-lg'
  const finalClassName = `${baseStyles} ${variantStyles[variant]} ${className}`

  return (
    <button
      disabled={disabled || isLoading}
      className={finalClassName}
      {...rest}  // ← Passa TUDO: onClick, title, data-*, etc
    >
      {isLoading ? '⏳ Carregando...' : children}
    </button>
  )
}
```

### Usando com TODOS os atributos

```tsx
<Button
  // Customizados
  variant="danger"
  isLoading={isDeleting}
  
  // HTML padrão (vão para ...rest)
  onClick={handleDelete}
  disabled={!hasPermission}
  type="submit"
  className="mt-4"
  id="delete-btn"
  title="Clique para deletar"
  data-testid="delete-button"
  onMouseEnter={() => setWarning(true)}
>
  🗑️ Deletar
</Button>

// Resultado final:
// <button
//   disabled={false}
//   className="font-semibold px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 mt-4"
//   onClick={handleDelete}
//   type="submit"
//   id="delete-btn"
//   title="Clique para deletar"
//   data-testid="delete-button"
//   onMouseEnter={() => setWarning(true)}
// >
//   🗑️ Deletar
// </button>
```

---

## Troubleshooting

### Problema 1: Props está undefined

```tsx
// ❌ ERRO
const { ...props } = undefined
// TypeError!

// ✅ Solução
const props = {}
const { ...rest } = props
```

### Problema 2: Perder dados ao fazer spread

```tsx
// ❌ Problema
const obj = { a: 1, b: 2, c: 3 }
const { a, ...rest } = obj

// a = 1
// rest = { b: 2, c: 3 } ← 'a' desapareceu do rest

// ✅ Solução: dependendo do que você quer
const copy = { ...obj }  // Cópia completa
```

### Problema 3: Sobrescrita acidental

```tsx
// ❌ Bug
const props = { className: 'custom', ...defaultProps }
// defaultProps.className sobrescreve o custom!

// ✅ Correto
const props = { ...defaultProps, className: 'custom' }
// custom sobrescreve o default (o que você quer)
```

---

## Resumo Rápido

### Spread em Array
```tsx
const arr1 = [1, 2]
const arr2 = [3, 4]
const combined = [...arr1, ...arr2]  // [1, 2, 3, 4]
```

### Spread em Objeto
```tsx
const obj1 = { a: 1, b: 2 }
const obj2 = { c: 3, d: 4 }
const combined = { ...obj1, ...obj2 }  // { a: 1, b: 2, c: 3, d: 4 }
```

### Spread em Props React
```tsx
const props = { onClick, disabled, className }

// Sem spread
<button onClick={props.onClick} disabled={props.disabled} className={props.className} />

// Com spread (idêntico, mas mais limpo!)
<button {...props} />
```

### Spread + Desestruturação
```tsx
const { name, ...rest } = { name: 'Felipe', age: 25, city: 'SP' }
// name = 'Felipe'
// rest = { age: 25, city: 'SP' }
```

---

## Checklist

- [ ] Entendo o que `...` faz (espalha valores)
- [ ] Entendo `{ ...objeto }` (cria cópia)
- [ ] Entendo `[...array]` (cria cópia)
- [ ] Entendo `{ a, ...rest }` (desestrutura e pega resto)
- [ ] Entendo `<Button {...props} />` (passa todos os atributos)
- [ ] Entendo ordem importa em spread
- [ ] Posso usar em meus componentes

---

## Prática

Crie um componente `Card` que:
1. Aceita `title` (customizado)
2. Aceita `children` (customizado)
3. Passa `...rest` para a `<div>`
4. Use no Dashboard com `className`, `id`, `data-testid`

```tsx
// Solução:
type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  title: string
}

export const Card: React.FC<CardProps> = ({
  title,
  children,
  ...rest
}) => {
  return (
    <div {...rest}>
      <h2>{title}</h2>
      {children}
    </div>
  )
}

// Uso:
<Card
  title="Meu Card"
  className="bg-white p-4"
  id="card-1"
  data-testid="card-test"
>
  Conteúdo aqui
</Card>
```

---

**Agora você é um mestre do spread operator!** 🚀
