# 📚 Documentação - Frontend SECTEC

## Conteúdo

### 📐 [STYLE_GUIDE.md](./STYLE_GUIDE.md)
**Guia completo de estilo e padrões do projeto**

Contém:
- 🎨 Paleta de cores (Sectec Green)
- 🔤 Hierarquia tipográfica (Poppins)
- 📏 Sistema de espaçamento (4px base)
- 🔘 Componentes padrão (Button, Card, Input, Header)
- ✅ Boas práticas
- 📝 Exemplos de código

### 🎓 [TUTORIAL_COMPONENTES.md](./TUTORIAL_COMPONENTES.md)
**Aprenda a criar componentes React do ZERO**

Perfeito para quem não entende como criar componentes!

Cobre:
- 1️⃣ Componente bem simples (Hello World)
- 2️⃣ Componente com Props (dados)
- 3️⃣ Tipos TypeScript (interfaces)
- 4️⃣ Tailwind CSS (estilos)
- 5️⃣ Eventos (onClick, onChange)
- 6️⃣ Componente completo (Button)

**Recomendacao:** Leia na ordem! Cada seção se baseia na anterior.

### 🎯 [TYPE_VS_INTERFACE.md](./TYPE_VS_INTERFACE.md)
**Entender quando usar `type` vs `interface`**

Resumão:
- **Use `type`** para props e componentes React
- **Use `interface`** só para classes (raramente)
- **type é mais flexível e moderno!**

Inclui exemplos e padrão do projeto.
### 🔌 [REACT_TYPES_EXPLICADO.md](./REACT_TYPES_EXPLICADO.md)
**O que é `React.ButtonHTMLAttributes` e como usar**

Entender os tipos chegou de forma:
- **React.ButtonHTMLAttributes** - Todos os atributos `<button>`
- **React.InputHTMLAttributes** - Todos os atributos `<input>`
- **Spread operator `...rest`** - Como passar props
- **Exemplos práticos completos**

Essencial para fazer componentes profissionais!

### 📦 [RECORD_E_REACT_FC.md](./RECORD_E_REACT_FC.md)
**O que é `Record` e `React.FC`?**

Os dois tipos mais importantes:
- **Record** - Mapear variantes para valores
- **React.FC** - Definir um componente funcional
- **Combinação poderosa** para componentes profissionais

Inclui exemplos reais do projeto SECTEC!

### 🔄 [SPREAD_OPERATOR.md](./SPREAD_OPERATOR.md)
**Como funciona o spread operator (`...props`)?**

Essencial para React:
- **Spread em arrays** - Copiar e combinar
- **Spread em objetos** - Copiar e combinar
- **Spread em props** - Passar atributos
- **Desestruturação + spread** - O padrão profissional

Inclui visualização do fluxo e casos de uso reais!

### 🎨 [LUCIDE_ICONS.md](./LUCIDE_ICONS.md)
**Como usar ícones com Lucide React**

Guia completo de ícones:
- **O que é Lucide React** - Biblioteca de ícones SVG
- **Como importar e usar** - Syntax básica
- **Customização** - Tamanhos, cores, animações
- **Ícones populares** - Lista com exemplos
- **Animações** - Girar, pulsar, deslizar
- **Boas práticas** - Dicas de design

Perfeito para Settings, Menu, Delete, etc!

## Como usar este guia

1. **Novo membro da equipe?**
   - Comece com [TUTORIAL_COMPONENTES.md](./TUTORIAL_COMPONENTES.md)
   - Depois va para [EXEMPLOS_PRATICOS.md](./EXEMPLOS_PRATICOS.md)
   - Finalize com [STYLE_GUIDE.md](./STYLE_GUIDE.md)

2. **Criando novo componente?**
   - Siga o checklist de boas práticas no STYLE_GUIDE
   - Use os exemplos práticos como referência
   - Use Tailwind CSS apenas (sem `style` inline)
   - Mantenha a tipagem TypeScript

3. **Dúvida sobre cores, fontes ou espaçamento?**
   - Verifique o STYLE_GUIDE.md

4. **Quer aprender a fazer componentes?**
   - Leia TUTORIAL_COMPONENTES.md
   - Copie exemplos do EXEMPLOS_PRATICOS.md
   - Teste sozinho!

## Estrutura do Projeto

```
frontend/
├── docs/                      ← Você está aqui
│   ├── README.md             (Este arquivo)
│   └── STYLE_GUIDE.md        (Guia completo)
├── src/
│   ├── components/           ← Componentes reutilizáveis
│   │   ├── Button/
│   │   ├── Card/
│   │   └── Header/
│   ├── pages/                ← Páginas da aplicação
│   ├── App.tsx
│   ├── index.css             ← Estilos globais + Tailwind
│   └── main.tsx
├── tailwind.config.js        ← Configuração Tailwind
└── postcss.config.js         ← Configuração PostCSS
```

## Fonts

**Poppins** é a fonte padrão do projeto.
- Importada de Google Fonts
- Disponível em pesos: 400, 500, 600, 700, 800
- Configurada no `src/index.css`

## Cores

Paleta principal: **Sectec Green**

```
sectec-900  → Header/Navbar (escuro)
sectec-600  → Primária (botões, links ativos)
sectec-100  → Backgrounds leves
sectec-50   → Hover states
```

## Começando um novo feature

```bash
# 1. Criar novo componente
src/components/MyComponent/MyComponent.tsx

# 2. Seguir o padrão do STYLE_GUIDE.md
# 3. Usar apenas Tailwind CSS
# 4. Adicionar tipos TypeScript

# 5. Exemplo simples:
import React from 'react'

interface MyComponentProps {
  title: string
}

export const MyComponent: React.FC<MyComponentProps> = ({ title }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-slate-900">
        {title}
      </h2>
    </div>
  )
}
```

## Dúvidas frequentes

**P: Posso usar cores diferentes das do Sectec?**
A: Sim, use a paleta `slate-*` (cinzas) para backgrounds e textos secundários. Reserve `sectec-*` para elementos principais.

**P: Qual é o espaçamento padrão?**
A: Base de 4px. Isso significa `p-1` = 4px, `p-2` = 8px, etc.

**P: Posso usar inline styles?**
A: Sim e Não,E melhor usar Tailwind,mas se precisar em casos extremos pode usar css("Lembre de comentar oque aquilo faz").

**P: Como sei qual tamanho de fonte usar?**
A: Veja a tabela no STYLE_GUIDE.md. `text-base` é o padrão.
---

**Última atualização:** 19 de abril de 2026
