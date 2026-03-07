# 💰 Controle Financeiro

> Plataforma full stack para gestão financeira pessoal e colaborativa, com autenticação completa, dashboard analítico, controle de receitas, despesas, cartões, faturas e convites para mesas compartilhadas.

![Status](https://img.shields.io/badge/Status-Em%20desenvolvimento-blue)
![Frontend](https://img.shields.io/badge/Frontend-Next.js%2016-black)
![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green)
![Database](https://img.shields.io/badge/Database-MySQL%208.0-blue)
![License](https://img.shields.io/badge/License-MIT-brightgreen)

---

## 📋 Sobre o Projeto

O **Controle Financeiro** é uma aplicação completa que ajuda usuários a organizar sua vida financeira com recursos de categorização inteligente, controle de cartões com faturas, parcelamento, despesas recorrentes e colaboração entre pessoas através de mesas compartilhadas.

O projeto é dividido em dois módulos independentes:

- **Backend** (`backend/`) — API RESTful com Node.js + Express + MySQL
- **Frontend** (`frontend/`) — Aplicação web com Next.js + React + TypeScript

---

## ✨ Principais Funcionalidades

### 🔐 Autenticação e Segurança

- Cadastro com verificação de email
- Login com JWT (stateless)
- Recuperação de senha por email
- Troca de senha e email seguros (com confirmação)
- Proteção contra SQL Injection (prepared statements)
- Senhas criptografadas com bcrypt

### 👥 Colaboração por Mesas

- Criação de mesas de controle financeiro (limite no plano free)
- Convite de usuários por email
- Aceite/recusa de convites com notificação
- Papéis: criador (controle total) vs convidado
- Gestão de membros com remoção e cancelamento de convites

### 💰 Gestão Financeira Completa

- **Receitas** — cadastro, parcelamento, recorrência, confirmação de recebimento (provisionado vs real)
- **Despesas** — tipo (variável/fixa/assinatura), recorrência com cancelamento, parcelamento automático
- **Cartões** — crédito e débito, limites real e pessoal, fechamento e vencimento, cores customizáveis
- **Faturas** — geração automática por cartão/mês, pagamento com quitação em cascata
- **Categorias** — separação por tipo (receita/despesa), soft delete com reativação
- **Comprovantes** — upload de imagens ao pagar despesas

### 📊 Dashboard e Inteligência

- KPIs: receitas confirmadas, despesas pagas, saldo atual e previsto
- Gráficos de evolução mensal (últimos 6 meses)
- Top categorias de gastos com detalhamento
- Alertas de despesas vencidas e vencendo hoje
- Filtros por mês e por mesa
- Consolidação multi-mesa

### 📧 Comunicação

- Emails transacionais (verificação, convites, recuperação de senha, troca de email)
- Templates HTML profissionais
- Sistema de notificações in-app ("sininho") com alertas financeiros automáticos

### 👤 Área de Conta

- Edição de perfil (nome, telefone, foto)
- Preferências (moeda, formato de data, notificações)
- Troca de senha e email com confirmação segura
- Canal de suporte/SAC

---

## 🧱 Arquitetura do Repositório

```
controleFinanceiro/
├── backend/                      # API REST
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js       # Pool de conexão MySQL
│   │   ├── controllers/          # 11 controllers
│   │   │   ├── authController.js
│   │   │   ├── mesaController.js
│   │   │   ├── mesaMembroController.js
│   │   │   ├── categoriaController.js
│   │   │   ├── bandeiraController.js
│   │   │   ├── tipoPagamentoController.js
│   │   │   ├── cartaoController.js
│   │   │   ├── receitaController.js
│   │   │   ├── despesaController.js
│   │   │   ├── faturaController.js
│   │   │   ├── conviteController.js
│   │   │   ├── notificacaoController.js
│   │   │   ├── alertasController.js
│   │   │   ├── dashboardController.js
│   │   │   └── contaController.js
│   │   ├── models/               # 11 models
│   │   │   ├── User.js
│   │   │   ├── Mesa.js
│   │   │   ├── Categoria.js
│   │   │   ├── Bandeira.js
│   │   │   ├── TipoPagamento.js
│   │   │   ├── Cartao.js
│   │   │   ├── Receita.js
│   │   │   ├── Despesa.js
│   │   │   ├── Fatura.js
│   │   │   ├── Convite.js
│   │   │   ├── Notificacao.js
│   │   │   └── TokenVerificacao.js
│   │   ├── routes/               # 15 arquivos de rota
│   │   │   ├── authRoutes.js
│   │   │   ├── mesaRoutes.js
│   │   │   ├── mesaMembroRoutes.js
│   │   │   ├── categoriaRoutes.js
│   │   │   ├── bandeiraRoutes.js
│   │   │   ├── tipoPagamentoRoutes.js
│   │   │   ├── cartaoRoutes.js
│   │   │   ├── receitaRoutes.js
│   │   │   ├── despesaRoutes.js
│   │   │   ├── faturaRoutes.js
│   │   │   ├── conviteRoutes.js
│   │   │   ├── notificacaoRoutes.js
│   │   │   ├── dashboardRoutes.js
│   │   │   └── contaRoutes.js
│   │   ├── middlewares/
│   │   │   ├── authMiddleware.js  # Verificação de JWT
│   │   │   └── uploadMiddleware.js# Configuração Multer
│   │   └── services/
│   │       └── emailService.js    # Envio de emails transacionais
│   ├── database/
│   │   └── schema.sql             # Script completo de criação do banco
│   ├── uploads/                   # Comprovantes de pagamento
│   ├── swagger.js                 # Configuração Swagger
│   ├── server.js                  # Arquivo principal
│   ├── .env.example               # Exemplo de configuração
│   └── package.json
│
├── frontend/                      # Aplicação Web
│   ├── src/
│   │   ├── app/                   # 10 páginas (App Router)
│   │   ├── components/            # Componentes reutilizáveis
│   │   ├── contexts/              # MesaContext (estado global)
│   │   ├── services/              # 14 services de integração
│   │   ├── types/                 # Tipagens TypeScript
│   │   └── lib/                   # Utilitários
│   ├── public/                    # Assets estáticos
│   └── package.json
│
├── LICENSE
└── README.md                      # ← Este arquivo
```

---

## 🗄️ Banco de Dados

### 13 Tabelas

| Tabela               | Descrição                                               |
| -------------------- | ------------------------------------------------------- |
| `users`              | Usuários com perfil, foto, preferências e plano         |
| `tokens_verificacao` | Tokens de verificação de email e recuperação de senha   |
| `mesas`              | Mesas de controle financeiro                            |
| `mesa_usuarios`      | Relacionamento N:N entre usuários e mesas (com papel)   |
| `categorias`         | Categorias de receitas e despesas                       |
| `bandeiras`          | Bandeiras de cartão (Visa, Mastercard, etc)             |
| `tipos_pagamento`    | Tipos de pagamento (Crédito, Débito, Pix, etc)          |
| `cartoes`            | Cartões de crédito/débito com limites e vencimento      |
| `faturas`            | Faturas mensais dos cartões                             |
| `receitas`           | Receitas com confirmação, parcelas e recorrência        |
| `despesas`           | Despesas com tipo, parcelas, recorrência e comprovantes |
| `convites`           | Convites para participar de mesas                       |
| `notificacoes`       | Sistema de notificações e alertas financeiros           |

### Diagrama ER Simplificado

```
users (1) ──→ (N) mesas (como criador)
users (N) ←──→ (N) mesas (através de mesa_usuarios)
users (1) ──→ (N) cartoes
cartoes (1) ──→ (N) faturas
mesas (1) ──→ (N) receitas
mesas (1) ──→ (N) despesas
faturas (1) ──→ (N) despesas (despesas de cartão de crédito)
categorias (1) ──→ (N) receitas/despesas
tipos_pagamento (1) ──→ (N) receitas/despesas/cartoes
bandeiras (1) ──→ (N) cartoes
```

---

## ⚙️ Como Rodar o Projeto

### Pré-requisitos

- **Node.js** 18+
- **MySQL** 8.0+
- **Conta de email** (Gmail com senha de app, ou Mailtrap para dev)

### 1) Banco de Dados

```bash
mysql -u root -p < backend/database/schema.sql
```

Isso cria o banco `controle_financeiro` com todas as 13 tabelas, categorias padrão, bandeiras e tipos de pagamento.

### 2) Backend

```bash
cd backend
npm install
cp .env.example .env
```

Configure o `.env` com banco, JWT e email:

```env
PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=controle_financeiro
JWT_SECRET=sua_chave_secreta_super_segura
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu_email@gmail.com
EMAIL_PASSWORD=sua_senha_de_app
EMAIL_FROM=Controle Financeiro <seu_email@gmail.com>
APP_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
```

Inicie o servidor:

```bash
npm run dev
```

Backend em: **http://localhost:3001** | Swagger em: **http://localhost:3001/api-docs**

### 3) Frontend

Em outro terminal:

```bash
cd frontend
npm install
```

Crie `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

Inicie a aplicação:

```bash
npm run dev
```

Frontend em: **http://localhost:3000**

---

## 📡 API — Visão Geral

A API possui **55+ endpoints** totalmente documentados via Swagger UI.

### Módulos Principais

```
POST   /api/auth/register                    # Registrar
POST   /api/auth/login                       # Login
GET    /api/auth/verificar-email/:token       # Verificar email

POST   /api/mesas                             # Criar mesa
GET    /api/mesas                             # Listar mesas do usuário

POST   /api/receitas                          # Criar receita(s)
PATCH  /api/receitas/:id/confirmar            # Confirmar recebimento

POST   /api/despesas                          # Criar despesa(s)
PATCH  /api/despesas/:id/pagar                # Marcar como paga (com comprovante)

GET    /api/faturas?cartao_id=X&mesa_id=Y     # Faturas de um cartão
PATCH  /api/faturas/:id/pagar                 # Pagar fatura inteira

GET    /api/dashboard?mes=2026-03             # Dashboard consolidado

POST   /api/convites                          # Enviar convite
GET    /api/notificacoes                      # Listar notificações

GET    /api/conta/perfil                      # Dados da conta
PUT    /api/conta/preferencias                # Atualizar preferências
```

**Documentação completa interativa:** `http://localhost:3001/api-docs`

---

## 📊 Estatísticas do Projeto

| Métrica            | Backend | Frontend | Total    |
| ------------------ | ------- | -------- | -------- |
| Linhas de código   | ~5.000+ | ~6.000+  | ~11.000+ |
| Endpoints/Páginas  | 55+     | 10       | —        |
| Tabelas/Services   | 13      | 14       | —        |
| Models/Componentes | 12      | 5+       | —        |
| Controllers        | 15      | —        | —        |

---

## 🔒 Segurança

- ✅ Senhas criptografadas com bcrypt (salt rounds: 10)
- ✅ Autenticação stateless com JWT
- ✅ Tokens com expiração configurável
- ✅ Validação de tipos de arquivo no upload (apenas imagens, máx 5MB)
- ✅ Proteção contra SQL Injection (prepared statements)
- ✅ CORS configurado por ambiente
- ✅ Verificação de email obrigatória
- ✅ Troca de senha/email com confirmação por token
- ✅ Separação de permissões (criador vs convidado)
- ✅ Soft delete em entidades críticas (categorias, cartões, despesas, receitas)

---

## 🚀 Deploy

### Plataformas Recomendadas

| Componente   | Opções                                   |
| ------------ | ---------------------------------------- |
| **Frontend** | Vercel (recomendado), Netlify, Render    |
| **Backend**  | Railway, Render, DigitalOcean, AWS       |
| **MySQL**    | PlanetScale, Railway, serviço gerenciado |

### Checklist de Produção

1. Configurar variáveis de ambiente por ambiente (dev/staging/prod)
2. Habilitar HTTPS em ambos os serviços
3. Ajustar CORS no backend para o domínio do frontend
4. Usar serviço de email profissional (SendGrid, Amazon SES)
5. Configurar backup automático do banco
6. Monitorar logs e erros de autenticação
7. Usar PM2 para gerenciar o processo Node.js em VPS

---

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/minha-feature`)
3. Faça commit das alterações (`git commit -m 'feat: descrição'`)
4. Envie para o repositório (`git push origin feature/minha-feature`)
5. Abra um Pull Request

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [`LICENSE`](LICENSE) para mais detalhes.

---

## 📚 Documentações por Módulo

Para detalhes completos de cada parte do sistema:

- **Backend:** [`backend/README.md`](backend/README.md) — endpoints, models, configuração do banco
- **Frontend:** [`frontend/README.md`](frontend/README.md) — páginas, services, padrões de UI

---

## 👨‍💻 Autor

**José Aroldo Soares Bezerra** — NASAM Dev.

- Email: joseharoldoparente@gmail.com
- LinkedIn: [José Aroldo Soares](https://www.linkedin.com/in/josearoldosoares/)
- GitHub: [@zeharoldoparente](https://github.com/zeharoldoparente)

---

<p align="center">
  Feito com ❤️ por José Aroldo | NASAM Dev.
</p>
