# 🖥️ Controle Financeiro - Frontend

> Interface web moderna do sistema de controle financeiro, com dashboard analítico, gestão de mesas, receitas, despesas, cartões, faturas, notificações e a experiência completa do IAn.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4)
![Recharts](https://img.shields.io/badge/Recharts-Gráficos-8884D8)

---

## 📋 Sobre o Projeto

O frontend do **Controle Financeiro** foi construído com **Next.js 16**, **React 19** e **TypeScript**, oferecendo uma experiência responsiva e orientada à operação do dia a dia financeiro.

### ✨ Principais Diferenciais

- 📊 **Dashboard inteligente** com indicadores e gráficos
- 👥 **Contexto por mesas** para colaboração financeira
- 💳 **Gestão visual de cartões** e integração com faturas
- 🧾 **Despesas completas** com pagamento, recorrência, parcelamento e comprovantes
- 💰 **Receitas com confirmação** e recorrência
- 🔔 **Notificações e alertas** no produto
- 🧠 **IAn completo** com plano, sugestões e fechamento mensal da meta
- 📱 **Interface responsiva** para desktop e mobile

---

## 🚀 Tecnologias Utilizadas

### Core

- **Next.js 16**
- **React 19**
- **TypeScript 5**

### UI e Visualização

- **Tailwind CSS 4**
- **Recharts**

### Integração

- **Axios**

### Qualidade

- **ESLint 9**

---

## 📁 Estrutura do Projeto

```text
frontend/
├── public/
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── login/
│   │   ├── registro/
│   │   ├── recuperar-senha/
│   │   ├── resetar-senha/
│   │   └── dashboard/
│   │       ├── page.tsx
│   │       ├── mesas/
│   │       ├── receitas/
│   │       ├── despesas/
│   │       ├── categorias/
│   │       ├── cartoes/
│   │       ├── conta/
│   │       └── ian/
│   ├── components/
│   ├── contexts/
│   ├── hooks/
│   ├── services/
│   └── types/
├── .env.local
└── package.json
```

---

## ⚙️ Instalação e Configuração

### Pré-requisitos

- Node.js 18+
- Backend rodando em `http://localhost:3001`

### Passo 1: Instale as dependências

```bash
cd frontend
npm install
```

### Passo 2: Configure o ambiente

Crie o arquivo `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

Se a variável não for definida, o frontend usa esse mesmo valor como fallback.

### Passo 3: Rode a aplicação

**Desenvolvimento:**

```bash
npm run dev
```

**Build de produção:**

```bash
npm run build
npm start
```

Frontend em: **http://localhost:3000**

---

## 🔐 Fluxo de Autenticação

A autenticação funciona com JWT:

1. Usuário faz login
2. Token é salvo no `localStorage`
3. O Axios injeta `Authorization: Bearer <token>`
4. As páginas autenticadas consomem a API normalmente
5. Fluxos protegidos dependem do token válido

---

## 🎯 Funcionalidades da Interface

### 1. 🔐 Autenticação e Conta

- ✅ Login e cadastro
- ✅ Recuperação e redefinição de senha
- ✅ Perfil do usuário
- ✅ Foto de perfil
- ✅ Preferências
- ✅ Troca de senha
- ✅ Troca de email
- ✅ Suporte

### 2. 📊 Dashboard

- ✅ KPIs financeiros
- ✅ Gráficos de evolução mensal
- ✅ Top categorias
- ✅ Alertas de despesas
- ✅ Filtros por mês e por mesa

### 3. 👥 Mesas

- ✅ Criação e gestão de mesas
- ✅ Seleção de mesa ativa
- ✅ Membros e convites
- ✅ Contexto compartilhado entre telas

### 4. 💰 Receitas

- ✅ Cadastro
- ✅ Confirmação de recebimento
- ✅ Parcelamento
- ✅ Recorrência
- ✅ Soft delete

### 5. 💸 Despesas

- ✅ Cadastro completo
- ✅ Pagamento com valor real
- ✅ Parcelamento
- ✅ Recorrência
- ✅ Comprovantes
- ✅ Integração com cartões e faturas

### 6. 💳 Cartões e Faturas

- ✅ Cadastro de cartões
- ✅ Limites e vencimentos
- ✅ Pagamento de faturas
- ✅ Integração com despesas

### 7. 🔔 Notificações

- ✅ Badge de não lidas
- ✅ Leitura individual e em lote
- ✅ Alertas financeiros automáticos

### 8. 🧠 IAn

- ✅ Geração de plano financeiro
- ✅ Ativação de estratégia
- ✅ Sugestões de aplicação para pesquisa
- ✅ Acompanhamento ao vivo da estratégia
- ✅ Registro mensal da evolução da meta
- ✅ Histórico mensal do patrimônio construído
- ✅ Cálculo de percentual concluído, valor faltante e projeção
- ✅ Resumo da carteira consolidada com base no histórico informado

---

## 🏗️ Padrões Arquiteturais

### MesaContext

O `MesaContext` define a mesa ativa da área autenticada. Ele é essencial para que receitas, despesas, dashboard e IAn operem no contexto correto.

### Camada de Services

O frontend usa services para centralizar as chamadas da API:

```text
Página -> Service -> Axios -> Backend
```

### Interceptor HTTP

O arquivo `src/services/api.ts`:

- injeta o token JWT automaticamente;
- remove o `Content-Type` manual em requests com `FormData`, para permitir que o navegador monte o boundary corretamente.

---

## 🔌 Services Principais

Entre os serviços do frontend, estão:

- `authService.ts`
- `mesaService.ts`
- `dashboardService.ts`
- `receitaService.ts`
- `despesaService.ts`
- `cartaoService.ts`
- `faturaService.ts`
- `notificacaoService.ts`
- `contaService.ts`
- `ianService.ts`

---

## 🧠 IAn no Frontend

A página `src/app/dashboard/ian/page.tsx` hoje suporta:

- gerar um plano com base no objetivo e na mesa ativa;
- ativar uma estratégia do IAn;
- buscar sugestões de aplicação para pesquisa;
- registrar fechamento mensal da meta;
- informar valor guardado, dividendos e investimentos do mês;
- visualizar patrimônio acumulado, percentual concluído e previsão de conclusão;
- acompanhar o histórico mensal;
- visualizar o resumo da carteira consolidada.

O service `src/services/ianService.ts` cobre:

```text
POST /ian/plano
GET  /ian/plano-ativo
POST /ian/ativar
POST /ian/registro-mensal
POST /ian/sugestoes
```

---

## 🧪 Scripts Disponíveis

```bash
npm run dev
npm run build
npm start
npm run lint
```

---

## 🚀 Deploy

### Opções Recomendadas

- **Vercel**
- **Netlify**
- **Render**

### Checklist de Produção

1. Configurar `NEXT_PUBLIC_API_URL`
2. Garantir CORS no backend para o domínio do frontend
3. Rodar `npm run build`
4. Validar autenticação, dashboard e IAn
5. Conferir integração com a API e uploads

---

## 📝 Licença

Este módulo segue a licença MIT do projeto principal.
