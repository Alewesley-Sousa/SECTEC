# 🚀 Exemplos Práticos - Componentes React

Copie e cole para aprender fazendo!

---

## 1. Hello World Simples

```tsx
// src/components/HelloWorld.tsx
export const HelloWorld = () => {
  return <h1>Olá, Mundo!</h1>
}
```

**Usar em Dashboard:**
```tsx
import { HelloWorld } from "../components/HelloWorld"

export default function Dashboard() {
  return <HelloWorld />
}
```

**Resultado:** Aparece "Olá, Mundo!" na tela

---

## 2. Componente com Um Prop

```tsx
// src/components/Welcome.tsx
type WelcomeProps = {
  name: string
}

export const Welcome = ({ name }: WelcomeProps) => {
  return <h1>Bem-vindo, {name}!</h1>
}
```

**Usar:**
```tsx
import { Welcome } from "../components/Welcome"

export default function Dashboard() {
  return (
    <>
      <Welcome name="Felipe" />
      <Welcome name="Maria" />
    </>
  )
}
```

**Resultado:**
```
Bem-vindo, Felipe!
Bem-vindo, Maria!
```

---

## 3. Card Simples

```tsx
// src/components/SimpleCard.tsx
type SimpleCardProps = {
  title: string
  content: string
}

export const SimpleCard = ({ title, content }: SimpleCardProps) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-slate-200">
      <h2 className="text-xl font-bold text-slate-900 mb-2">
        {title}
      </h2>
      <p className="text-slate-600">
        {content}
      </p>
    </div>
  )
}
```

**Usar:**
```tsx
import { SimpleCard } from "../components/SimpleCard"

export default function Dashboard() {
  return (
    <div className="p-8">
      <SimpleCard 
        title="Bem-vindo" 
        content="Este é seu primeiro componente!" 
      />
      <SimpleCard 
        title="Parabéns" 
        content="Você está aprendendo React!" 
      />
    </div>
  )
}
```

---

## 4. Contador (com STATE)

```tsx
// src/components/Counter.tsx
import { useState } from 'react'

export const Counter = () => {
  const [count, setCount] = useState(0)

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <p className="text-2xl font-bold mb-4">
        Você clicou {count} vezes
      </p>
      <button
        onClick={() => setCount(count + 1)}
        className="bg-sectec-600 text-white px-4 py-2 rounded-lg hover:bg-sectec-700"
      >
        Clique aqui! +1
      </button>
    </div>
  )
}
```

**Usar:**
```tsx
import { Counter } from "../components/Counter"

export default function Dashboard() {
  return (
    <div className="p-8">
      <Counter />
    </div>
  )
}
```

**Como funciona:**
1. Clica no botão
2. `onClick={() => setCount(count + 1)}` executa
3. `count` vira `count + 1`
4. React re-renderiza o componente com novo valor
5. A tela atualiza

---

## 5. Input com Mudança de Estado

```tsx
// src/components/NameInput.tsx
import { useState } from 'react'

export const NameInput = () => {
  const [name, setName] = useState('')

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Qual é seu nome?</h2>
      
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Digite seu nome..."
        className="w-full px-4 py-2 border border-slate-300 rounded-lg mb-4 focus:outline-none focus:border-sectec-600"
      />
      
      <p className="text-lg">
        {name ? `Olá, ${name}!` : 'Aguardando...'}
      </p>
    </div>
  )
}
```

**Entendendo:**
- `value={name}` = input mostra o valor que está em `name`
- `onChange={(e) => setName(e.target.value)}` = quando digita, atualiza `name`
- `e.target.value` = o que o usuário digitou

---

## 6. Lista de Items

```tsx
// src/components/TodoList.tsx
import { useState } from 'react'

type Todo = {
  id: number
  text: string
  completed: boolean
}

export const TodoList = () => {
  const [todos, setTodos] = useState<Todo[]>([
    { id: 1, text: 'Aprender React', completed: false },
    { id: 2, text: 'Fazer projeto', completed: false },
    { id: 3, text: 'Deployar', completed: false },
  ])
  const [input, setInput] = useState('')

  const addTodo = () => {
    if (input.trim()) {
      setTodos([
        ...todos,
        { id: Date.now(), text: input, completed: false }
      ])
      setInput('')
    }
  }

  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Minha Lista</h2>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nova tarefa..."
          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg"
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
        />
        <button
          onClick={addTodo}
          className="bg-sectec-600 text-white px-4 py-2 rounded-lg hover:bg-sectec-700"
        >
          Adicionar
        </button>
      </div>

      <ul className="space-y-2">
        {todos.map(todo => (
          <li
            key={todo.id}
            onClick={() => toggleTodo(todo.id)}
            className={`p-3 rounded-lg cursor-pointer transition-all ${
              todo.completed
                ? 'bg-sectec-100 line-through text-slate-500'
                : 'bg-slate-100 hover:bg-slate-200'
            }`}
          >
            {todo.text}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

---

## 7. Componente com Props Diferentes (Botões)

```tsx
// src/components/ActionButtons.tsx
type ButtonType = 'save' | 'cancel' | 'delete'

type ActionButtonProps = {
  type: ButtonType
  label: string
  onClick: () => void
}

const buttonStyles: Record<ButtonType, string> = {
  save: 'bg-sectec-600 hover:bg-sectec-700 text-white',
  cancel: 'bg-slate-300 hover:bg-slate-400 text-slate-900',
  delete: 'bg-red-500 hover:bg-red-600 text-white',
}

export const ActionButton = ({ type, label, onClick }: ActionButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-2 rounded-lg font-semibold transition-colors ${buttonStyles[type]}`}
    >
      {label}
    </button>
  )
}
```

**Usar:**
```tsx
import { ActionButton } from "../components/ActionButtons"

export default function Dashboard() {
  return (
    <div className="flex gap-4">
      <ActionButton type="save" label="Salvar" onClick={() => alert('Saved!')} />
      <ActionButton type="cancel" label="Cancelar" onClick={() => alert('Cancelled')} />
      <ActionButton type="delete" label="Deletar" onClick={() => alert('Deleted!')} />
    </div>
  )
}
```

---

## 8. Componente com Condicional

```tsx
// src/components/LoginStatus.tsx
type LoginStatusProps = {
  isLoggedIn: boolean
  userName?: string
}

export const LoginStatus = ({ isLoggedIn, userName }: LoginStatusProps) => {
  if (isLoggedIn) {
    return (
      <div className="bg-sectec-100 p-4 rounded-lg text-sectec-900 border border-sectec-600">
        Bem-vindo, {userName}! ✅
      </div>
    )
  }

  return (
    <div className="bg-red-100 p-4 rounded-lg text-red-900 border border-red-500">
      Você não está logado. Faça login para continuar. ❌
    </div>
  )
}
```

**Usar:**
```tsx
<LoginStatus isLoggedIn={true} userName="Felipe" />
<LoginStatus isLoggedIn={false} />
```

---

## 📋 Checklist para Entender

- [ ] Component = função que retorna JSX
- [ ] Props = dados que você passa PARA o componente
- [ ] Interface = define que tipo de dados a props pode receber
- [ ] useState = para armazenar dados que mudam
- [ ] className = Tailwind CSS classes
- [ ] onClick = o que fazer quando clica
- [ ] Spread operator (`...`) = passa vários valores de uma vez
- [ ] map() = cria items a partir de uma lista

---

## 🔥 Super Desafio

**Crie um componente `ProductCard` que:**
1. Recebe: productName, price, inStock (boolean)
2. Mostra nome em bold
3. Mostra preço em verde
4. Se inStock = true, mostra "✅ Em Estoque", senão "❌ Fora de Estoque"
5. Se clicarem, mostra um alert com o nome do produto
6. Use Tailwind CSS

**Dica:** Combine tudo que você aprendeu!

---

**Parabéns! Você está aprendendo React!** 🚀
