# 💸 Controle Financeiro (Projeto Completo)

> Plataforma full stack para gestão financeira pessoal e colaborativa, com autenticação completa, organização por mesas, dashboard analítico e controle detalhado de receitas, despesas e cartões.

![Status](https://img.shields.io/badge/Status-Em%20desenvolvimento-blue)
![Frontend](https://img.shields.io/badge/Frontend-Next.js%2016-black)
![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green)
![Database](https://img.shields.io/badge/Database-MySQL%208.0-blue)

---

## 📋 Sobre o Projeto

O **Controle Financeiro** é um sistema completo que ajuda usuários a organizar sua vida financeira, com recursos para controle de entradas e saídas, categorização inteligente e colaboração entre pessoas por meio de mesas compartilhadas.

O projeto está dividido em dois módulos principais:

- **Frontend (`frontend/`)**: aplicação web desenvolvida em Next.js
- **Backend (`backend/`)**: API RESTful em Node.js + Express + MySQL

---

## ✨ Principais Funcionalidades

### 🔐 Autenticação e Segurança

- Cadastro de usuários
- Login com JWT
- Verificação de email
- Recuperação e redefinição de senha

### 👥 Colaboração por Mesas

- Criação de mesas de controle financeiro
- Convite de outros usuários
- Aceite/recusa de convites
- Permissões entre criador e convidados

### 💰 Gestão Financeira

- CRUD de receitas
- CRUD de despesas
- Categorias por tipo
- Formas de pagamento
- Cartões com limite e vencimento
- Despesas parceladas e recorrentes

### 📊 Inteligência e Visualização

- Dashboard com indicadores financeiros
- Gráficos de evolução de receitas/despesas
- Filtros por período e mesa

### 📧 e 🔔 Comunicação

- Emails transacionais (verificação, convite, recuperação)
- Notificações in-app

---

## 🧱 Arquitetura do Repositório

```
controleFinanceiro/
├── backend/                  # API REST (Node.js + Express + MySQL)
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middlewares/
│   │   └── services/
│   ├── database/
│   ├── uploads/
│   └── README.md
├── frontend/                 # Web App (Next.js + React + TypeScript)
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── services/
│   │   ├── types/
│   │   └── lib/
│   ├── public/
│   └── README.md
└── README.md                 # (este arquivo)
```

---

## ⚙️ Como Rodar o Projeto Localmente

## 1) Backend

```bash
cd backend
npm install
cp .env.example .env
```

Configure o `.env` com banco, JWT e email, depois rode:

```bash
npm run dev
```

Backend em: **http://localhost:3001**
Swagger em: **http://localhost:3001/api-docs**

## 2) Frontend

Em outro terminal:

```bash
cd frontend
npm install
```

Crie `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

Rode:

```bash
npm run dev
```

Frontend em: **http://localhost:3000**

---

## 🔗 Relação entre Frontend e Backend

- O frontend consome endpoints da API via Axios.
- O token JWT é enviado automaticamente nas requisições autenticadas.
- A experiência de uso depende do backend ativo e banco configurado.

---

## 📚 Documentações Específicas

Para detalhes completos de cada módulo:

- **Backend:** [`backend/README.md`](backend/README.md)
- **Frontend:** [`frontend/README.md`](frontend/README.md)

---

## 🧪 Scripts Principais

### Backend

```bash
npm run dev
npm start
```

### Frontend

```bash
npm run dev
npm run build
npm start
npm run lint
```

---

## 🚀 Deploy (Visão Geral)

- **Frontend**: Vercel / Netlify / Render
- **Backend**: Railway / Render / VPS (DigitalOcean, AWS, etc.)
- **Banco MySQL**: serviço gerenciado ou instância própria

### Recomendações

1. Configurar variáveis de ambiente por ambiente (dev/staging/prod)
2. Habilitar HTTPS
3. Ajustar CORS no backend para domínio do frontend
4. Monitorar logs e erros de autenticação

---

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch (`git checkout -b feature/minha-feature`)
3. Faça commit das alterações (`git commit -m 'feat: descrição'`)
4. Envie para o repositório (`git push origin feature/minha-feature`)
5. Abra um Pull Request

---

## 📝 Licença

Este projeto está sob a licença MIT. Consulte o arquivo [`LICENSE`](LICENSE).
