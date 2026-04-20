# 📐 SECTEC - Guia de Estilo

Documento padrão para manter consistência visual e de código no projeto SECTEC.

---

## 🎨 Paleta de Cores

### Cores Sectec (Green Palette)
```
sectec-50:   #f0fdf4  → Fundo claro / Hover states
sectec-100:  #dcfce7  → Backgrounds de cards/tabelas
sectec-500:  #22c55e  → Avisos e badges de sucesso
sectec-600:  #16a34a  → COR PRIMÁRIA (Botões, links ativos)
sectec-700:  #15803d  → Botões hover/estados pressionados
sectec-900:  #14532d  → Header/Navbar/Menu lateral
```

### Como usar:
```tsx
// Cor primária (botões, links)
<button className="bg-sectec-600 hover:bg-sectec-700">

// Fundo
<div className="bg-sectec-50">

// Header
<header className="bg-sectec-900">

// Status de sucesso
<span className="text-sectec-600 bg-sectec-100">
```

---

## 🔤 Tipografia

### Fonte Principal: **Poppins**
- Importada de Google Fonts
- Usado em **todo o projeto** (títulos, body, labels)
- Pesos disponíveis: 400, 500, 600, 700, 800

### Hierarquia de Tamanhos

| Classe | Tamanho | Peso | Uso |
|--------|---------|------|-----|
| `text-xs` | 12px | 400 | Labels, hints, helper text |
| `text-sm` | 14px | 400 | Body text, descrições |
| `text-base` | 16px | 500 | Texto padrão |
| `text-lg` | 18px | 600 | Subtítulos, labels importante |
| `text-xl` | 20px | 700 | Títulos de seções |
| `text-2xl` | 24px | 700 | Títulos principais |
| `text-3xl` | 30px | 800 | Títulos com destaque |

### Exemplos:
```tsx
// Titulo primário
<h1 className="text-3xl font-bold text-slate-900">Título Principal</h1>

// Subtítulo
<h2 className="text-xl font-semibold text-slate-700">Subtítulo</h2>

// Body text
<p className="text-base font-normal text-slate-600">Texto padrão do corpo</p>

// Label
<label className="text-sm font-medium text-slate-700">Label do input</label>
```

---

## 📏 Espaçamento

### Base: **4px**
O projeto segue múltiplos de 4px para consistência.

| Classe | Pixels | Uso |
|--------|--------|-----|
| p-1 / m-1 | 4px | Espaçamento mínimo |
| p-2 / m-2 | 8px | Espaçamento interno pequeno |
| p-3 / m-3 | 12px | Espaçamento padrão |
| p-4 / m-4 | 16px | Espaçamento normal |
| p-6 / m-6 | 24px | Espaçamento generoso |
| p-8 / m-8 | 32px | Espaçamento grande |

### Exemplos:
```tsx
// Padding padrão
<div className="p-4">Conteúdo</div>

// Margin entre elementos
<div className="mb-6">Seção</div>

// Espaçamento entre itens de lista
<ul className="space-y-4">
  <li>Item 1</li>
  <li>Item 2</li>
</ul>
```

---

## Componentes Padrão

### Botão Primário
```tsx
<button className="px-4 py-3 bg-sectec-600 text-white font-semibold rounded-lg hover:bg-sectec-700 transition-colors">
  Ação Primária
</button>
```

### Botão Secundário
```tsx
<button className="px-4 py-3 bg-slate-200 text-slate-900 font-semibold rounded-lg hover:bg-slate-300 transition-colors">
  Ação Secundária
</button>
```

### Card
```tsx
<div className="bg-white rounded-lg shadow-md p-6 border border-slate-200">
  <h3 className="text-lg font-semibold mb-2">Título do Card</h3>
  <p className="text-slate-600">Conteúdo do card</p>
</div>
```

### Input
```tsx
<input 
  type="text" 
  placeholder="Digite..." 
  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-sectec-600 focus:ring-2 focus:ring-sectec-100"
/>
```

### Header/Navbar
```tsx
<header className="bg-sectec-900 text-white p-4 flex justify-between items-center shadow-lg">
  <h1 className="text-xl font-bold">SECTEC</h1>
  <nav className="space-x-4">
    <a href="/" className="hover:text-sectec-100">Início</a>
    <a href="/login" className="hover:text-sectec-100">Login</a>
  </nav>
</header>
```

---

## 🎯 Boas Práticas

### 1. **Sempre use Tailwind CSS classes**
- ✅ Bom: `className="bg-sectec-600 text-white p-4"`
- ❌ Evitar: `style={{ backgroundColor: '#16a34a' }}`

### 2. **Reutilize componentes**
- Crie componentes React para padrões repetidos
- Armazene em `src/components/`

### 3. **Mantenha consistência de espaçamento**
- Use múltiplos de 4px
- Não misture diferentes unidades

### 4. **Cores do Sectec vs outras cores**
- Use `sectec-*` para componentes primários (header, botões principais)
- Use `slate-*` (cinza) para texto e backgrounds secundários
- Use `green-*` / `red-*` para status indicators

### 5. **Responsividade**
```tsx
// Mobile first
<div className="text-sm md:text-base lg:text-lg">
  Texto responsivo
</div>
```

---

## 📁 Estrutura de Componentes

```
src/
├── components/
│   ├── Header.tsx
│   ├── Button/
│   │   ├── Button.tsx
│   │   └── Button.types.ts
│   ├── Card/
│   │   ├── Card.tsx
│   │   └── Card.types.ts
│   └── Input/
│       ├── Input.tsx
│       └── Input.types.ts
├── pages/
│   ├── Dashboard.tsx
│   ├── Login.tsx
│   └── NotFound.tsx
└── styles/
    └── index.css
```

---

## 🚀 Checklist para novos componentes

- [ ] Usa **Poppins** via Tailwind (já configurado)
- [ ] Respeita espaçamento **base 4px**
- [ ] Usa cores da **paleta Sectec** ou **slate**
- [ ] Mobile **responsivo**
- [ ] Testado em **navegadores modernos**
- [ ] Nenhum `style` inline (apenas Tailwind)
- [ ] Exports tipado com TypeScript
- [ ] Documentação inline se complexo

---

## 📝 Exemplo de Componente Completo

```tsx
// src/components/Card/Card.tsx
import React from 'react'

interface CardProps {
  title: string
  description?: string
  children: React.ReactNode
  variant?: 'default' | 'highlighted'
}

export const Card: React.FC<CardProps> = ({
  title,
  description,
  children,
  variant = 'default'
}) => {
  const variantClasses = variant === 'highlighted' 
    ? 'border-l-4 border-sectec-600 bg-sectec-50'
    : 'border border-slate-200'

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${variantClasses}`}>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-slate-600 mb-4">
          {description}
        </p>
      )}
      <div>
        {children}
      </div>
    </div>
  )
}
```

---

## 🔗 Referências Úteis

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Tailwind v4 Theme API](https://tailwindcss.com/docs/theme)
- [Google Fonts - Poppins](https://fonts.google.com/specimen/Poppins)

---

**Última atualização:** 19 de abril de 2026
**Responsável:** Equipe SECTEC
