# 💰 Controle Financeiro

> Plataforma full stack para gestão financeira pessoal e colaborativa, com autenticação completa, dashboard analítico, controle de receitas, despesas, cartões, faturas, notificações e o IAn como assistente financeiro dinâmico.

![Status](https://img.shields.io/badge/Status-Em%20desenvolvimento-blue)
![Frontend](https://img.shields.io/badge/Frontend-Next.js%2016-black)
![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green)
![Database](https://img.shields.io/badge/Database-MySQL%208.0-blue)
![License](https://img.shields.io/badge/License-MIT-brightgreen)

---

## 📋 Sobre o Projeto

O **Controle Financeiro** é uma aplicação completa que ajuda usuários a organizar a vida financeira com recursos de categorização, controle de cartões com faturas, parcelamento, despesas recorrentes, colaboração entre pessoas por mesas compartilhadas e acompanhamento inteligente de metas com o **IAn**.

O projeto é dividido em dois módulos independentes:

- **Backend** (`backend/`) - API RESTful com Node.js, Express e MySQL
- **Frontend** (`frontend/`) - Aplicação web com Next.js, React e TypeScript

---

## ✨ Principais Funcionalidades

### 🔐 Autenticação e Segurança

- Cadastro com verificação de email
- Login com JWT
- Recuperação de senha por email
- Troca de senha e email com confirmação
- Proteção contra SQL Injection com prepared statements
- Senhas criptografadas com bcrypt
- CORS configurável por ambiente
- Rate limiting por tipo de operação

### 👥 Colaboração por Mesas

- Criação de mesas de controle financeiro
- Convites por email
- Aceite e recusa de convites
- Gestão de membros por mesa
- Separação entre criador e convidados

### 💰 Gestão Financeira Completa

- **Receitas** - cadastro, parcelamento, recorrência e confirmação de recebimento
- **Despesas** - tipos variáveis/fixas/assinaturas, recorrência, parcelamento e pagamento
- **Cartões** - crédito e débito, limites, vencimento, fechamento e cores customizadas
- **Faturas** - geração e pagamento consolidado
- **Categorias** - separação por tipo, soft delete e reativação
- **Comprovantes** - upload de imagens em despesas pagas

### 📊 Dashboard e Inteligência

- KPIs de receitas, despesas e saldo
- Gráficos de evolução mensal
- Top categorias de gastos
- Alertas financeiros e notificações
- Filtros por mês e por mesa
- Consolidação por contexto financeiro

### 🧠 IAn - Assistente Financeiro

- Geração de plano financeiro com diagnóstico
- Estratégias de acompanhamento por mesa
- Sugestões de aplicação para pesquisa
- Acompanhamento diário, semanal e mensal
- Registro de evolução mensal da meta
- Cálculo de patrimônio acumulado, percentual concluído e valor faltante
- Projeção de prazo para atingir a meta
- Histórico mensal da meta e resumo da carteira consolidada

### 👤 Área de Conta

- Edição de perfil
- Foto do usuário
- Preferências de moeda e data
- Notificações por email
- Troca de senha
- Troca de email
- Canal de suporte

---

## 🧱 Arquitetura do Repositório

```text
controleFinanceiro/
├── backend/                      # API REST
│   ├── database/
│   │   └── schema.sql           # Schema principal do banco
│   ├── public/                  # Assets públicos do Swagger
│   ├── src/
│   │   ├── config/              # Configuração de banco
│   │   ├── controllers/         # Regras por módulo
│   │   ├── docs/                # Tema do Swagger
│   │   ├── middlewares/         # Auth, rate limit, segurança, upload
│   │   ├── models/              # Acesso a dados
│   │   ├── routes/              # Rotas da API
│   │   ├── services/            # Serviços do sistema e do IAn
│   │   └── utils/               # Utilitários
│   ├── .env.example
│   ├── package.json
│   ├── server.js
│   └── swagger.js
│
├── frontend/                    # Aplicação web
│   ├── public/
│   ├── src/
│   │   ├── app/                 # Rotas App Router
│   │   ├── components/          # Componentes reutilizáveis
│   │   ├── contexts/            # MesaContext e afins
│   │   ├── hooks/
│   │   ├── services/            # Integração com a API
│   │   └── types/
│   ├── .env.local
│   └── package.json
│
├── LICENSE
└── README.md
```

---

## 🗄️ Banco de Dados

### Schema principal

O arquivo `backend/database/schema.sql` cria o banco principal com tabelas como:

- `users`
- `tokens_verificacao`
- `mesas`
- `mesa_usuarios`
- `categorias`
- `bandeiras`
- `tipos_pagamento`
- `cartoes`
- `faturas`
- `receitas`
- `despesas`
- `convites`
- `notificacoes`

### Tabelas adicionais do IAn

Além do schema principal, o backend cria sob demanda:

- `ian_planos`
- `ian_registros_mensais`

Essas tabelas são criadas automaticamente no primeiro uso do IAn e não exigem migração manual separada.

---

## ⚙️ Como Rodar o Projeto

### Pré-requisitos

- **Node.js** 18+
- **MySQL** 8.0+
- Conta de email SMTP para fluxos transacionais

### 1) Banco de Dados

```bash
mysql -u root -p < backend/database/schema.sql
```

### 2) Backend

```bash
cd backend
npm install
cp .env.example .env
```

Configure o `.env`:

```env
PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=controle_financeiro
JWT_SECRET=sua_chave_secreta

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu_email@gmail.com
EMAIL_PASSWORD=sua_senha_de_app
EMAIL_FROM=Controle Financeiro <seu_email@gmail.com>

APP_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000

# Opcional para enriquecer sugestões do IAn com cotações
BRAPI_TOKEN=
```

Inicie o backend:

```bash
npm run dev
```

Backend em: **http://localhost:3001**  
Swagger em: **http://localhost:3001/api-docs**

### 3) Frontend

```bash
cd frontend
npm install
```

Crie `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

Inicie o frontend:

```bash
npm run dev
```

Frontend em: **http://localhost:3000**

---

## 📡 API - Visão Geral

A API é documentada via Swagger e inclui módulos como:

```text
POST   /api/auth/register
POST   /api/auth/login

GET    /api/mesa
POST   /api/mesa

POST   /api/receitas
POST   /api/despesas
PATCH  /api/faturas/:id/pagar

GET    /api/dashboard

GET    /api/ian/plano-ativo
POST   /api/ian/plano
POST   /api/ian/ativar
POST   /api/ian/registro-mensal
POST   /api/ian/sugestoes
```

**Documentação completa:** `http://localhost:3001/api-docs`

---

## 🔒 Segurança

- ✅ Senhas criptografadas com bcrypt
- ✅ Autenticação com JWT
- ✅ Verificação de email
- ✅ Recuperação de senha por token
- ✅ CORS configurável
- ✅ Rate limiting por rota crítica
- ✅ Prepared statements no banco
- ✅ Soft delete em entidades sensíveis
- ✅ Upload validado para comprovantes

---

## 🚀 Deploy

### Plataformas recomendadas

| Componente   | Opções                                    |
| ------------ | ----------------------------------------- |
| **Frontend** | Vercel, Netlify, Render                   |
| **Backend**  | Railway, Render, DigitalOcean, AWS        |
| **MySQL**    | Railway, PlanetScale, serviço gerenciado  |

### Checklist de produção

1. Configurar variáveis de ambiente por ambiente
2. Ajustar CORS para os domínios reais
3. Rodar `npm run build` no frontend
4. Validar emails transacionais
5. Configurar backup do banco
6. Monitorar logs e limites da API

---

## 📝 Documentações por Módulo

- **Backend:** [backend/README.md](backend/README.md)
- **Frontend:** [frontend/README.md](frontend/README.md)

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja [`LICENSE`](LICENSE).
