# SECTEC

Sistema de gerenciamento da feira científica escolar, com controle de fluxo de projetos, papéis de usuários (RBAC), acompanhamento de prazos, avaliações e logs de auditoria.

## Visão Geral

O sistema surgiu a partir da observação de um problema recorrente nas instituições: a dificuldade em organizar, acompanhar e gerenciar informações de forma eficiente. Processos manuais, falta de padronização e baixa visibilidade dos dados acabam gerando erros, retrabalho e perda de controle.

A proposta do sistema SECTEC é centralizar e automatizar essas operações, oferecendo uma estrutura clara, acessível e confiável para alunos, orientadores e coordenação.

## Objetivos

- Gerenciar a submissão de projetos por alunos
- Controlar a seleção e aceitação de orientadores
- Organizar o fluxo de desenvolvimento dos projetos
- Controlar prazos automaticamente
- Permitir avaliação estruturada por avaliadores
- Garantir rastreabilidade com logs de auditoria
- Aplicar controle de acesso por níveis (RBAC)

## Equipe

- Alewesley Sousa
- Diego Santos
- Edmilson Carmo
- João Felipe Damasceno
- João Pedro Araújo
- Lívia Karoliny
- Nathan Barros
- Pedro José Ferreira
- Vinicius da Silva
- Yago Nascimento

## Módulos do Sistema

- Autenticação de usuários
- Gestão de projetos
- Controle de orientadores
- Submissão
- Avaliação
- Controle de prazos
- Auditoria

## Controle de Acesso

- **Coordenador**: gerencia usuários, prazos, projetos e auditoria
- **Orientador**: revisa e aprova projetos
- **Aluno**: cadastra e submete projetos

## Tecnologias

**Back-end**

- Node.js
- NestJS
- TypeScript
- TypeORM
- MySQL

**Front-end**

- React
- TypeScript
- Vite
- TailwindCSS

**Ferramentas**

- Git
- GitHub
- XAMPP

## Estrutura do Projeto

```txt
SECTEC
|-- backend/        # API NestJS
|   |-- src/
|   |-- test/
|   |-- docs/
|   |-- .env.example
|   `-- ...
|
|-- frontend/       # Interface React
|   |-- src/
|   |-- public/
|   |-- docs/
|   `-- ...
|
`-- README.md
```

## Requisitos

- Node.js v18 ou superior
- NPM
- Git
- XAMPP com MySQL ativo

> Problema comum: se `node -v` ou `npm -v` não funcionarem, o Node.js não está instalado ou não foi adicionado ao PATH.

## Configuração Inicial

### 1. Clonar o repositório

```bash
git clone https://github.com/Alewesley-Sousa/SECTEC.git
cd SECTEC
```

> Problema comum: se o comando `cd SECTEC` falhar, confira o nome da pasta criada pelo Git ou abra o terminal diretamente dentro da pasta do projeto.

### 2. Instalar dependências do backend

```bash
cd backend
npm install
```

> Problema comum: se aparecer erro de pacote, apague `node_modules` e rode `npm install` novamente. No PowerShell, se `npm` for bloqueado por política de execução, use `npm.cmd install`.

### 3. Configurar variáveis de ambiente do backend

Crie um arquivo `.env` dentro de `backend/` usando `backend/.env.example` como base:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=
DB_NAME=sectec
JWT_SECRET=sua_chave_secreta_jwt
```

> Problema comum: erro de conexão com banco geralmente indica `.env` incorreto, MySQL desligado ou nome do banco diferente do configurado em `DB_NAME`.

### 4. Configurar o banco de dados

1. Abra o XAMPP.
2. Inicie o MySQL.
3. Crie um banco com o mesmo nome usado em `DB_NAME`.
4. Importe o arquivo:

```txt
backend/docs/estrutura-banco-de-dados.sql
```

> Problema comum: como o backend usa `synchronize: false`, as tabelas não são criadas automaticamente. Se aparecer erro de tabela inexistente, importe o SQL novamente no banco correto.

### 5. Instalar dependências do frontend

Em outro terminal, a partir da raiz do projeto:

```bash
cd frontend
npm install
```

> Problema comum: se o frontend não encontrar dependências, confira se você está dentro da pasta `frontend/`, não dentro de `backend/`.

## Validação Rápida

Dentro de `backend/`:

```bash
npm run build
npm test
```

No PowerShell, se necessário:

```bash
npm.cmd run build
npm.cmd test
```

Dentro de `frontend/`:

```bash
npm run build
```

> Problema comum: erro no build normalmente indica import quebrado, arquivo faltando ou dependência não instalada.

## Problemas Comuns

**`npm` bloqueado no PowerShell**

Use `npm.cmd` no lugar de `npm`:

```bash
npm.cmd run start:dev
```

**Erro de conexão com MySQL**

Confira se o MySQL está ativo no XAMPP e se as variáveis do `.env` batem com o banco criado.

**Erro de tabela inexistente**

Importe o arquivo `backend/docs/estrutura-banco-de-dados.sql` no banco configurado em `DB_NAME`.

**Backend abre, mas frontend não busca dados**

Confira se o backend está rodando em `http://localhost:3000` e se não houve erro no terminal da API.

**Porta já em uso**

Feche o processo que está usando a porta ou configure outra porta no `.env` do backend.

## Execução do Sistema

### Backend

Dentro da pasta `backend/`:

```bash
npm run start:dev
```

No Windows PowerShell, se o `npm` for bloqueado:

```bash
npm.cmd run start:dev
```

> Problema comum: se a porta `3000` já estiver em uso, finalize o processo antigo ou altere a variável `PORT` no `.env`.

### Frontend

Em outro terminal, dentro da pasta `frontend/`:

```bash
npm run dev
```

No Windows PowerShell, se necessário:

```bash
npm.cmd run dev
```

> Problema comum: se a tela carregar mas não buscar dados, confira se o backend também está rodando em `http://localhost:3000`.

### Acessos

Frontend:

```txt
http://localhost:5173
```

Backend:

```txt
http://localhost:3000
```

Swagger da API:

```txt
http://localhost:3000/api
```

> Problema comum: se o Swagger não abrir, o backend provavelmente não está rodando ou iniciou em outra porta.
