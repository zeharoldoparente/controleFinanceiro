# 🖥️ Controle Financeiro - Backend

> API RESTful do sistema de controle financeiro, com autenticação completa, mesas colaborativas, gestão financeira detalhada, notificações, emails transacionais e o IAn como motor inteligente de planejamento e acompanhamento.

![Node.js](https://img.shields.io/badge/Node.js-v20+-green)
![MySQL](https://img.shields.io/badge/MySQL-8.0-blue)
![Express](https://img.shields.io/badge/Express-5.x-lightgrey)
![JWT](https://img.shields.io/badge/JWT-Auth-orange)
![Swagger](https://img.shields.io/badge/Swagger-Docs-brightgreen)

---

## 📋 Sobre o Projeto

A API do **Controle Financeiro** foi construída em Node.js e Express para centralizar a lógica de negócio da aplicação, oferecendo recursos para autenticação, colaboração por mesas, operações financeiras, notificações e acompanhamento de metas com o **IAn**.

### ✨ Principais Diferenciais

- 🔐 **Autenticação completa** com verificação de email e recuperação de senha
- 👥 **Mesas colaborativas** para gestão financeira em grupo
- 📧 **Emails transacionais** para verificação, convites e segurança da conta
- 📸 **Upload de comprovantes** em despesas pagas
- 🔔 **Notificações in-app** com alertas automáticos
- 📊 **Dashboard consolidado** por mesa
- 🧠 **IAn dinâmico** com plano, acompanhamento e histórico mensal da meta
- 📝 **Swagger** com documentação interativa da API

---

## 🚀 Tecnologias Utilizadas

### Core

- **Node.js**
- **Express 5**
- **MySQL 8**

### Autenticação e Segurança

- **jsonwebtoken**
- **bcryptjs**
- **CORS**
- **Rate limiting customizado**

### Upload e Email

- **Multer**
- **Nodemailer**

### Documentação

- **Swagger UI Express**
- **Swagger JSDoc**

### Utilidades

- **dotenv**
- **uuid**

---

## 📁 Estrutura do Projeto

```text
backend/
├── database/
│   └── schema.sql
├── public/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   ├── docs/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── utils/
├── .env.example
├── package.json
├── server.js
└── swagger.js
```

Hoje o backend possui módulos para:

- autenticação
- mesas e membros
- categorias
- formas e tipos de pagamento
- bandeiras
- cartões
- receitas
- despesas
- faturas
- convites
- notificações
- dashboard
- conta
- IAn

---

## 🗄️ Banco de Dados

### Schema principal

O schema principal em `database/schema.sql` cria tabelas como:

| Tabela               | Descrição                                              |
| -------------------- | ------------------------------------------------------ |
| `users`              | Usuários do sistema                                    |
| `tokens_verificacao` | Tokens de verificação e recuperação                    |
| `mesas`              | Mesas de controle financeiro                           |
| `mesa_usuarios`      | Relação entre usuários e mesas                         |
| `categorias`         | Categorias de receitas e despesas                      |
| `bandeiras`          | Bandeiras de cartão                                    |
| `tipos_pagamento`    | Tipos de pagamento                                     |
| `cartoes`            | Cartões do usuário                                     |
| `faturas`            | Faturas mensais                                        |
| `receitas`           | Receitas financeiras                                   |
| `despesas`           | Despesas financeiras                                   |
| `convites`           | Convites de mesas                                      |
| `notificacoes`       | Notificações e alertas                                 |

### Tabelas extras do IAn

O IAn adiciona tabelas criadas automaticamente no primeiro uso:

| Tabela                  | Descrição                                                       |
| ----------------------- | --------------------------------------------------------------- |
| `ian_planos`            | Guarda o plano ativo, objetivo, estratégia e payload do IAn     |
| `ian_registros_mensais` | Guarda os fechamentos mensais informados pelo usuário           |

Essas tabelas são **auto provisionadas pelo backend** e não exigem migração manual separada.

---

## ⚙️ Instalação e Configuração

### Pré-requisitos

- Node.js 18+
- MySQL 8.0+
- Conta SMTP para envio de email

### Passo 1: Instale as dependências

```bash
cd backend
npm install
```

### Passo 2: Configure o ambiente

```bash
cp .env.example .env
```

Exemplo:

```env
PORT=3001
DB_HOST=localhost
DB_USER=seu_usuario_mysql
DB_PASSWORD=sua_senha_mysql
DB_NAME=controle_financeiro
JWT_SECRET=sua_chave_secreta_jwt

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu_email@gmail.com
EMAIL_PASSWORD=sua_senha_de_app_gmail
EMAIL_FROM=Controle Financeiro <seu_email@gmail.com>

APP_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000

# Opcional para sugestões com cotação
BRAPI_TOKEN=
```

### Passo 3: Crie o banco

```bash
mysql -u root -p < database/schema.sql
```

### Passo 4: Inicie a API

**Desenvolvimento:**

```bash
npm run dev
```

**Produção:**

```bash
npm start
```

API em: **http://localhost:3001**

---

## 📚 Documentação da API

A documentação interativa está disponível em:

- `http://localhost:3001/api-docs`
- `http://localhost:3001/api-docs-fancy`
- `http://localhost:3001/api-docs.json`

---

## 🔐 Autenticação

A API utiliza **JWT** para autenticação.

Fluxo básico:

1. O usuário faz cadastro
2. Verifica o email
3. Realiza login
4. Usa `Authorization: Bearer <token>` nas rotas protegidas

---

## 🎯 Funcionalidades Principais

### 1. 🔐 Autenticação e Conta

- ✅ Registro, login e verificação de email
- ✅ Recuperação e redefinição de senha
- ✅ Troca de senha e troca de email
- ✅ Perfil, foto, preferências e suporte

### 2. 👥 Mesas e Colaboração

- ✅ Criar, listar, editar e excluir mesas
- ✅ Gerenciar membros
- ✅ Enviar e responder convites
- ✅ Aplicar permissões por papel

### 3. 💰 Operações Financeiras

- ✅ Receitas com confirmação e recorrência
- ✅ Despesas com pagamento, recorrência e parcelamento
- ✅ Cartões, limites e vencimentos
- ✅ Faturas com pagamento consolidado
- ✅ Categorias e meios de pagamento

### 4. 🔔 Notificações e Alertas

- ✅ Sininho com contagem de não lidas
- ✅ Marcação individual e em lote
- ✅ Alertas financeiros automáticos

### 5. 🧠 IAn

- ✅ Geração de plano financeiro
- ✅ Estratégias por objetivo
- ✅ Acompanhamento diário, semanal e mensal
- ✅ Sugestões de aplicação para pesquisa
- ✅ Registro mensal da evolução da meta
- ✅ Cálculo de patrimônio acumulado, percentual concluído e valor faltante
- ✅ Projeção de prazo com base no histórico informado
- ✅ Resumo consolidado da carteira do usuário

---

## 📡 Principais Rotas

### Autenticação

```text
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/verificar-email/:token
POST   /api/auth/reenviar-verificacao
POST   /api/auth/solicitar-recuperacao-senha
POST   /api/auth/resetar-senha/:token
```

### Mesas

```text
GET    /api/mesa
POST   /api/mesa
GET    /api/mesa/:id
PUT    /api/mesa/:id
DELETE /api/mesa/:id
```

### Financeiro

```text
POST   /api/receitas
POST   /api/despesas
PATCH  /api/despesas/:id/pagar
PATCH  /api/faturas/:id/pagar
GET    /api/dashboard
```

### IAn

```text
GET    /api/ian/plano-ativo
POST   /api/ian/plano
POST   /api/ian/ativar
POST   /api/ian/registro-mensal
POST   /api/ian/sugestoes
```

---

## 🔒 Segurança

- ✅ JWT para autenticação
- ✅ bcrypt para senhas
- ✅ Prepared statements no MySQL
- ✅ Headers de segurança
- ✅ CORS por ambiente
- ✅ Rate limiting para autenticação, financeiro e convites
- ✅ Upload validado para comprovantes

---

## 🧪 Scripts Disponíveis

```bash
npm run dev
npm start
npm test
```

Observação:

- `npm test` ainda é apenas um placeholder.

---

## 🚀 Deploy

### Plataformas Recomendadas

- **Railway**
- **Render**
- **DigitalOcean**
- **AWS**

### Checklist de Produção

1. Configurar variáveis de ambiente
2. Ajustar CORS para os domínios oficiais
3. Configurar HTTPS
4. Validar envio de email
5. Configurar backup do banco
6. Monitorar logs, limites e erros

---

## 📝 Licença

Este módulo segue a licença MIT do projeto principal.
