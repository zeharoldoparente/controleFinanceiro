# 🖥️ Controle Financeiro Web (Frontend)

> Interface web do sistema de controle financeiro pessoal, com dashboard analítico, gestão completa de mesas, receitas, despesas, cartões, categorias, conta e convites.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4)
![Recharts](https://img.shields.io/badge/Recharts-Gráficos-8884D8)

---

## 📋 Sobre o Projeto

O frontend do **Controle Financeiro** foi construído com **Next.js (App Router)** e **TypeScript**, oferecendo uma experiência moderna, responsiva e focada em produtividade para o gerenciamento financeiro pessoal e colaborativo.

A aplicação se integra à API do backend para autenticação, organização por mesas, categorização de lançamentos, controle de cartões e visualização de indicadores estratégicos.

### ✨ Principais Diferenciais

- 📊 **Dashboard inteligente** com gráficos e indicadores de receitas, despesas e saldo
- 👥 **Fluxo colaborativo** com mesas compartilhadas e gestão de convites
- 💳 **Controle de cartões** com uso de limite e acompanhamento visual
- 🧾 **Gestão financeira completa** de receitas e despesas (incluindo recorrência e parcelas)
- 🧩 **Arquitetura por serviços** para integração centralizada com a API
- 🔐 **Autenticação com JWT** usando interceptor automático nas requisições
- 📱 **Interface responsiva** para desktop e mobile

---

## 🚀 Tecnologias Utilizadas

### Core

- **Next.js 16** - Framework React com App Router
- **React 19** - Biblioteca para construção da interface
- **TypeScript 5** - Tipagem estática para maior confiabilidade

### UI e Experiência

- **Tailwind CSS 4** - Estilização utilitária
- **Recharts** - Visualização de dados e gráficos financeiros

### Integração

- **Axios** - Cliente HTTP para comunicação com backend

### Qualidade

- **ESLint 9** + `eslint-config-next` - Padronização e boas práticas

---

## 📁 Estrutura do Projeto

```
frontend/
├── src/
│   ├── app/                              # Rotas e páginas (App Router)
│   │   ├── page.tsx                      # Landing page
│   │   ├── login/page.tsx                # Login
│   │   ├── registro/page.tsx             # Cadastro
│   │   ├── recuperar-senha/page.tsx      # Solicitação de recuperação
│   │   ├── resetar-senha/[token]/page.tsx# Redefinição de senha
│   │   └── dashboard/                    # Área autenticada
│   │       ├── page.tsx                  # Dashboard principal (gráficos/indicadores)
│   │       ├── mesas/page.tsx
│   │       ├── receitas/page.tsx
│   │       ├── despesas/page.tsx
│   │       ├── categorias/page.tsx
│   │       ├── cartoes/page.tsx
│   │       └── conta/page.tsx
│   ├── components/
│   │   ├── IndicadorSenha.tsx            # Feedback visual de força da senha
│   │   └── dashboard/                    # Componentes do layout autenticado
│   ├── contexts/
│   │   └── MesaContext.tsx               # Estado global da mesa selecionada
│   ├── services/                         # Camada de integração com API
│   │   ├── api.ts                        # Instância Axios e interceptor JWT
│   │   ├── authService.ts
│   │   ├── dashboardService.ts
│   │   ├── mesaService.ts
│   │   ├── receitaService.ts
│   │   ├── despesaService.ts
│   │   ├── categoriaService.ts
│   │   ├── cartaoService.ts
│   │   ├── conviteService.ts
│   │   ├── notificacaoService.ts
│   │   ├── contaService.ts
│   │   ├── bandeiraService.ts
│   │   ├── faturaService.ts
│   │   └── tipoPagamentoService.ts
│   ├── types/
│   │   └── index.ts                      # Tipagens compartilhadas
│   └── lib/
│       └── senhaValidacao.ts             # Regras de validação de senha
├── public/                               # Logos e assets estáticos
├── next.config.ts
├── eslint.config.mjs
├── tsconfig.json
└── package.json
```

---

## ⚙️ Instalação e Configuração

### Pré-requisitos

- Node.js 18+
- Backend da API rodando (padrão: `http://localhost:3001`)

### Passo 1: Acesse a pasta do frontend

```bash
cd frontend
```

### Passo 2: Instale as dependências

```bash
npm install
```

### Passo 3: Configure as variáveis de ambiente

Crie um arquivo `.env.local` na pasta `frontend/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

> Se não configurada, a aplicação usa automaticamente `http://localhost:3001/api` como fallback.

### Passo 4: Inicie o projeto

**Desenvolvimento:**

**Build de produção:**

```bash
npm run build
npm start
```

A aplicação estará disponível em: **http://localhost:3000**

---

## 🔐 Fluxo de Autenticação

O frontend usa JWT retornado pelo backend após login.

1. Usuário faz login/cadastro
2. Token JWT é salvo no navegador
3. Interceptor Axios adiciona `Authorization: Bearer <token>` automaticamente
4. Rotas autenticadas consomem dados da API

---

## 🎯 Funcionalidades da Interface

### 1. 🔐 Autenticação e Conta

- ✅ Cadastro de usuário
- ✅ Login
- ✅ Recuperação de senha
- ✅ Redefinição via token
- ✅ Área de conta para gestão de dados do usuário

### 2. 📊 Dashboard Financeiro

- ✅ KPIs de receitas, despesas e saldo
- ✅ Gráficos de evolução por período
- ✅ Filtros por mês e por mesa
- ✅ Visualização de tendências e distribuição por categorias

### 3. 👥 Mesas de Controle

- ✅ Criação, listagem e gerenciamento de mesas
- ✅ Seleção de contexto de mesa para exibir dados relacionados
- ✅ Suporte a fluxo colaborativo com convites

### 4. 💰 Receitas

- ✅ Cadastro e edição de receitas
- ✅ Associação com categoria, mesa e data
- ✅ Listagem com feedback visual

### 5. 💸 Despesas

- ✅ Cadastro e edição de despesas
- ✅ Suporte a recorrência e parcelamento
- ✅ Marcação de pagamento e organização por status
- ✅ Integração com categoria, forma de pagamento e cartão

### 6. 📁 Categorias

- ✅ Gestão de categorias de receitas e despesas
- ✅ Organização para melhor análise financeira

### 7. 💳 Cartões e Pagamentos

- ✅ Cadastro de cartões
- ✅ Exibição de limite e utilização
- ✅ Integração com despesas do cartão
- ✅ Gestão de formas/tipos de pagamento

### 8. 🔔 Convites e Notificações

- ✅ Recebimento e gerenciamento de convites para mesas
- ✅ Integração com notificações da plataforma

---

## 🔗 Integração com Backend

Este frontend foi projetado para consumir a API do projeto `backend/`.

### Endpoints consumidos (resumo)

- `/auth` - login, registro, recuperação, reset
- `/mesas` - gestão de mesas
- `/receitas` - operações de receitas
- `/despesas` - operações de despesas
- `/categorias` - gestão de categorias
- `/cartoes` - gestão de cartões
- `/convites` - fluxo de colaboração
- `/notificacoes` - alertas do usuário
- `/dashboard` - consolidação de métricas

---

## 🧪 Scripts Disponíveis

```bash
npm run dev     # desenvolvimento
npm run build   # build de produção
npm start       # execução em produção
npm run lint    # análise estática com ESLint
```

---

## 🚀 Deploy

### Opções recomendadas

- **Vercel** (integração nativa com Next.js)
- **Netlify**
- **Railway**
- **Render**

### Checklist de produção

1. Configurar `NEXT_PUBLIC_API_URL` para a API em produção
2. Garantir CORS habilitado no backend
3. Rodar `npm run build` antes do deploy
4. Validar fluxo de autenticação e rotas protegidas

---

1. Crie uma branch para sua feature (`git checkout -b feature/minha-feature`)
2. Faça os commits (`git commit -m 'feat: minha feature'`)
3. Envie para o repositório remoto (`git push origin feature/minha-feature`)
4. Abra um Pull Request

---

## 📝 Licença

Este módulo segue a licença MIT do projeto.
