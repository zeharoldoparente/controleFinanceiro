# 🖥️ Controle Financeiro — Frontend

> Interface web moderna do sistema de controle financeiro pessoal, com dashboard analítico, gestão completa de receitas, despesas, cartões e colaboração por mesas.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4)
![Recharts](https://img.shields.io/badge/Recharts-Gráficos-8884D8)

---

## 📋 Sobre o Projeto

O frontend do **Controle Financeiro** foi construído com **Next.js 16 (App Router)** e **TypeScript**, oferecendo uma experiência responsiva e focada em produtividade para o gerenciamento financeiro pessoal e colaborativo.

A aplicação consome a API REST do backend via Axios, com autenticação JWT e interceptor automático em todas as requisições autenticadas.

### ✨ Principais Diferenciais

- 📊 **Dashboard inteligente** — gráficos de evolução, KPIs de receita/despesa/saldo e maiores gastos por categoria
- 👥 **Colaboração por mesas** — convide pessoas para gerenciar finanças juntos
- 💳 **Controle visual de cartões** — estilo Apple Wallet no mobile, grid no desktop
- 🧾 **Despesas completas** — recorrência, parcelamento, cancelamento e comprovantes
- 💰 **Receitas com confirmação** — provisionado vs recebido, recorrentes com confirmação mensal
- 🔐 **Área de conta** — perfil, foto, preferências, troca de senha e email seguros
- 📱 **100% responsivo** — adaptado para desktop, tablet e mobile

---

## 🚀 Tecnologias Utilizadas

### Core

- **Next.js 16** — Framework React com App Router e Server Components
- **React 19** — Construção de interfaces declarativas
- **TypeScript 5** — Tipagem estática para maior confiabilidade

### UI e Visualização

- **Tailwind CSS 4** — Estilização utilitária e responsiva
- **Recharts** — Gráficos financeiros interativos (evolução mensal, pizza de categorias)

### Integração

- **Axios** — Cliente HTTP com interceptor JWT automático

### Qualidade

- **ESLint 9** + `eslint-config-next` — Padronização e boas práticas

---

## 📁 Estrutura do Projeto

```
frontend/
├── src/
│   ├── app/                                  # Rotas e páginas (App Router)
│   │   ├── page.tsx                          # Landing page
│   │   ├── login/page.tsx                    # Login
│   │   ├── registro/page.tsx                 # Cadastro
│   │   ├── recuperar-senha/page.tsx          # Solicitação de recuperação
│   │   ├── resetar-senha/[token]/page.tsx    # Redefinição de senha
│   │   └── dashboard/                        # Área autenticada
│   │       ├── layout.tsx                    # Layout com Sidebar + Header + MesaProvider
│   │       ├── page.tsx                      # Dashboard principal
│   │       ├── mesas/page.tsx                # Gestão de mesas
│   │       ├── receitas/page.tsx             # Receitas com confirmação
│   │       ├── despesas/page.tsx             # Despesas completas
│   │       ├── categorias/page.tsx           # Categorias por tipo
│   │       ├── cartoes/page.tsx              # Cartões visuais
│   │       └── conta/page.tsx                # Perfil e configurações
│   ├── components/
│   │   ├── IndicadorSenha.tsx                # Feedback visual de força da senha
│   │   └── dashboard/                        # Componentes do layout autenticado
│   │       ├── Header.tsx                    # Header com notificações e avatar
│   │       └── Sidebar.tsx                   # Menu lateral responsivo
│   ├── contexts/
│   │   └── MesaContext.tsx                    # Estado global da mesa selecionada
│   ├── services/                             # Camada de integração com API
│   │   ├── api.ts                            # Instância Axios + interceptor JWT
│   │   ├── authService.ts                    # Login, registro, recuperação
│   │   ├── dashboardService.ts               # Métricas e gráficos
│   │   ├── mesaService.ts                    # CRUD de mesas
│   │   ├── receitaService.ts                 # CRUD de receitas + confirmação
│   │   ├── despesaService.ts                 # CRUD de despesas + pagamento + comprovantes
│   │   ├── categoriaService.ts               # CRUD de categorias
│   │   ├── cartaoService.ts                  # CRUD de cartões
│   │   ├── bandeiraService.ts                # Bandeiras de cartão
│   │   ├── tipoPagamentoService.ts           # Tipos de pagamento
│   │   ├── faturaService.ts                  # Faturas de cartão
│   │   ├── conviteService.ts                 # Envio e gestão de convites
│   │   ├── notificacaoService.ts             # Sistema de notificações
│   │   └── contaService.ts                   # Perfil, foto, senha, email, preferências
│   ├── types/
│   │   └── index.ts                          # Tipagens compartilhadas
│   └── lib/
│       └── senhaValidacao.ts                 # Regras de validação de senha
├── public/                                   # Logos e assets estáticos
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

**Desenvolvimento (com hot reload):**

```bash
npm run dev
```

**Build de produção:**

```bash
npm run build
npm start
```

A aplicação estará disponível em: **http://localhost:3000**

---

## 🔐 Fluxo de Autenticação

A autenticação funciona com JWT retornado pelo backend após login:

1. Usuário faz login ou cadastro
2. Token JWT é salvo no `localStorage`
3. Interceptor Axios adiciona `Authorization: Bearer <token>` automaticamente
4. Rotas do `/dashboard/*` consomem dados protegidos da API
5. Token expirado redireciona automaticamente para `/login`

---

## 🎯 Funcionalidades da Interface

### 1. 🔐 Autenticação e Conta

- ✅ Cadastro de usuário com validação de senha visual
- ✅ Login com JWT
- ✅ Recuperação de senha por email (link + token)
- ✅ Redefinição de senha via token
- ✅ Área de conta com edição de perfil e foto
- ✅ Troca de senha segura (com confirmação por email)
- ✅ Troca de email com confirmação no novo endereço
- ✅ Preferências (moeda, formato de data, notificações)

### 2. 📊 Dashboard Financeiro

- ✅ KPIs: receitas confirmadas, despesas pagas e saldo atual/previsto
- ✅ Gráfico de evolução mensal (últimos 6 meses, Recharts)
- ✅ Top categorias de gastos com percentual e detalhamento expandível
- ✅ Alertas de despesas vencidas e vencendo hoje
- ✅ Filtros por mês e por mesa
- ✅ Consolidação multi-mesa ou filtro individual

### 3. 👥 Mesas de Controle

- ✅ Criação e gestão de mesas (limite no plano free)
- ✅ Seletor de contexto — todos os dados são filtrados pela mesa ativa
- ✅ Sistema de membros — listar, remover e cancelar convites pendentes
- ✅ Guard de mesa obrigatória — páginas exigem mesa selecionada antes de operar

### 4. 💰 Receitas

- ✅ Cadastro com descrição, valor, data, categoria e tipo de pagamento
- ✅ Suporte a parcelamento (N parcelas com grupo UUID)
- ✅ Receitas recorrentes (aparecem todo mês automaticamente)
- ✅ Confirmação de recebimento (valor real pode diferir do provisionado)
- ✅ Desfazer confirmação
- ✅ Soft delete com reativação

### 5. 💸 Despesas

- ✅ Cadastro completo: tipo (variável/fixa/assinatura), categoria, pagamento
- ✅ Vinculação com cartão de crédito/débito
- ✅ Parcelamento automático (total ÷ parcelas, com grupo UUID)
- ✅ Despesas recorrentes com cancelamento por mês
- ✅ Marcar como paga com valor real e comprovante opcional
- ✅ Desfazer pagamento
- ✅ Upload, visualização e exclusão de comprovantes
- ✅ Faturas unificadas por cartão/mês na listagem

### 6. 📁 Categorias

- ✅ CRUD completo separado por tipo (receita/despesa)
- ✅ Soft delete com reativação
- ✅ Filtro por tipo

### 7. 💳 Cartões

- ✅ Cadastro com nome, bandeira, tipo, limites, fechamento e vencimento
- ✅ Exibição visual estilo Apple Wallet (mobile) / Grid (desktop)
- ✅ Cores personalizáveis por cartão
- ✅ Integração com despesas e faturas
- ✅ Soft delete com reativação

### 8. 🔔 Convites e Notificações

- ✅ Envio de convites para mesas por email
- ✅ Aceitar/recusar convites recebidos
- ✅ Sistema de "sininho" com badge de não lidas
- ✅ Alertas financeiros automáticos (despesas vencidas, limites, etc.)
- ✅ Marcar como lida (individual ou todas)

---

## 🏗️ Padrões Arquiteturais

### MesaContext (Estado Global)

O `MesaContext` gerencia qual mesa está selecionada e é provido no layout do `/dashboard`. Todas as páginas internas acessam a mesa ativa via `useMesa()`.

**Regra importante:** `useMesa()` só funciona dentro do `MesaProvider`. Páginas fora desse contexto retornam `null` e falham silenciosamente — categorias e selects ficam vazios sem erro aparente.

### Camada de Services

Cada entidade tem um service dedicado que encapsula as chamadas à API:

```
Página → Service → Axios (interceptor JWT) → Backend API
```

Os services centralizam tipagem, formatação de payload e tratamento de resposta.

### Regras de Negócio no Frontend

- Cartão de crédito selecionado → desabilita recorrência (crédito não pode ser fixo/assinatura)
- Parcelamento e recorrência são mutuamente exclusivos
- Despesas no débito são auto-marcadas como pagas
- Guard de mesa obrigatória antes de exibir formulários

---

## 🔗 Endpoints Consumidos (Resumo)

| Módulo       | Base               | Operações                                              |
| ------------ | ------------------ | ------------------------------------------------------ |
| Auth         | `/auth`            | login, registro, verificação, recuperação, reset       |
| Mesas        | `/mesas`           | CRUD + membros                                         |
| Receitas     | `/receitas`        | CRUD + confirmar + desfazer + parcelas                 |
| Despesas     | `/despesas`        | CRUD + pagar + comprovantes + parcelas + recorrência   |
| Categorias   | `/categorias`      | CRUD + soft delete + reativar                          |
| Cartões      | `/cartoes`         | CRUD + soft delete + reativar                          |
| Bandeiras    | `/bandeiras`       | listagem                                               |
| Tipos Pgto   | `/tipos-pagamento` | CRUD + soft delete + reativar                          |
| Faturas      | `/faturas`         | listar por cartão/mesa + detalhar + pagar              |
| Convites     | `/convites`        | enviar + listar + aceitar + recusar                    |
| Notificações | `/notificacoes`    | listar + contar + marcar + deletar + alertas           |
| Dashboard    | `/dashboard`       | dados consolidados + detalhes por categoria            |
| Conta        | `/conta`           | perfil + foto + senha + email + preferências + suporte |

---

## 🧪 Scripts Disponíveis

```bash
npm run dev     # Desenvolvimento com hot reload
npm run build   # Build otimizado de produção
npm start       # Execução do build de produção
npm run lint    # Análise estática com ESLint
```

---

## 🚀 Deploy

### Opções Recomendadas

- **Vercel** — integração nativa com Next.js (recomendado)
- **Netlify** — alternativa com suporte a SSR
- **Railway** / **Render** — opções versáteis

### Checklist de Produção

1. Configurar `NEXT_PUBLIC_API_URL` para a URL da API em produção
2. Garantir CORS habilitado no backend para o domínio do frontend
3. Rodar `npm run build` e verificar que não há erros
4. Validar fluxo de autenticação completo (registro → verificação → login)
5. Testar envio de emails (convites, recuperação, troca)

---

## 📊 Estatísticas do Frontend

- **Páginas:** 10 (landing + auth + dashboard)
- **Services:** 14 (integração completa com API)
- **Componentes:** Header, Sidebar, IndicadorSenha + páginas
- **Contextos:** MesaContext (estado global)

---

## 🤝 Contribuição

1. Crie uma branch para sua feature (`git checkout -b feature/minha-feature`)
2. Faça os commits (`git commit -m 'feat: minha feature'`)
3. Envie para o repositório remoto (`git push origin feature/minha-feature`)
4. Abra um Pull Request

---

## 📝 Licença

Este módulo segue a licença MIT do projeto principal.

---

<p align="center">
  Feito com ❤️ por <a href="https://github.com/zeharoldoparente">José Aroldo</a> | NASAM Dev.
</p>
