# Controle Financeiro

Plataforma full stack para gestao financeira pessoal e colaborativa, com frontend em Next.js e backend em Node.js + Express + MySQL.

## Visao geral

O projeto e dividido em dois modulos:

- `backend/`: API REST, autenticacao, regras de negocio, integracoes de email e Swagger.
- `frontend/`: aplicacao web com App Router, dashboard, telas operacionais e experiencia do usuario.

Hoje o sistema cobre:

- autenticacao com JWT, verificacao de email e recuperacao de senha;
- mesas compartilhadas para organizacao colaborativa;
- receitas, despesas, cartoes, faturas e notificacoes;
- dashboard consolidado por mesa;
- IAn, um assistente financeiro que monta planos, acompanha desvios e agora registra evolucao mensal da meta.

## Destaque recente: IAn com memoria mensal

O IAn deixou de ser apenas informativo. Alem de gerar o plano e sugerir uma estrategia, ele agora permite:

- ativar uma linha de acompanhamento por mesa;
- registrar fechamento mensal da meta;
- informar quanto foi guardado no mes;
- informar investimentos realizados e dividendos recebidos;
- consolidar patrimonio acumulado, percentual da meta, valor faltante e previsao de conclusao;
- manter um historico mensal e um resumo da carteira que o usuario vem construindo.

Observacao importante:

- as tabelas do IAn (`ian_planos` e `ian_registros_mensais`) sao criadas sob demanda pelo backend no primeiro uso do recurso;
- elas nao dependem de migracao manual adicional para comecar a funcionar.

## Stack

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS 4, Recharts
- Backend: Node.js, Express 5, MySQL 8, JWT, bcrypt, Nodemailer, Multer
- Documentacao: Swagger UI + Swagger JSDoc

## Estrutura do repositorio

```text
controleFinanceiro/
|-- backend/
|   |-- database/
|   |-- public/
|   |-- src/
|   |   |-- config/
|   |   |-- controllers/
|   |   |-- docs/
|   |   |-- middlewares/
|   |   |-- models/
|   |   |-- routes/
|   |   |-- services/
|   |   `-- utils/
|   |-- .env.example
|   |-- package.json
|   |-- server.js
|   `-- swagger.js
|-- frontend/
|   |-- public/
|   |-- src/
|   |   |-- app/
|   |   |-- components/
|   |   |-- contexts/
|   |   |-- hooks/
|   |   |-- services/
|   |   `-- types/
|   |-- .env.local
|   `-- package.json
`-- README.md
```

## Como rodar

### 1. Banco de dados

Crie o schema principal:

```bash
mysql -u root -p < backend/database/schema.sql
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Variaveis importantes:

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
BRAPI_TOKEN=
```

Documentacao da API:

- Swagger padrao: `http://localhost:3001/api-docs`
- Swagger com tema alternativo: `http://localhost:3001/api-docs-fancy`

### 3. Frontend

```bash
cd frontend
npm install
```

Crie `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

Suba a aplicacao:

```bash
npm run dev
```

Frontend em `http://localhost:3000`.

## Modulos principais

- `Auth`: cadastro, login, verificacao de email, recuperacao e reset de senha.
- `Mesa`: contexto colaborativo para separar os dados financeiros.
- `Receitas` e `Despesas`: fluxo financeiro principal, com recorrencia, parcelamento e confirmacoes.
- `Cartoes` e `Faturas`: controle de limites, vencimentos e pagamento consolidado.
- `Dashboard`: indicadores e consolidacoes por periodo e por mesa.
- `Conta`: perfil, foto, preferencias, troca de senha, troca de email e suporte.
- `IAn`: plano financeiro, sugestoes de aplicacao e evolucao mensal da meta.

## Rotas de alto nivel

Algumas rotas importantes da API:

```text
POST   /api/auth/register
POST   /api/auth/login

GET    /api/mesa
POST   /api/mesa

GET    /api/dashboard

POST   /api/receitas
POST   /api/despesas
PATCH  /api/faturas/:id/pagar

GET    /api/ian/plano-ativo
POST   /api/ian/plano
POST   /api/ian/ativar
POST   /api/ian/registro-mensal
POST   /api/ian/sugestoes
```

Para a lista completa, use o Swagger.

## Estado atual da documentacao

Os READMEs foram alinhados com:

- estrutura real de pastas;
- Express 5 no backend;
- pagina do IAn no frontend;
- novo fluxo mensal do IAn;
- `BRAPI_TOKEN` opcional;
- script correto de desenvolvimento do backend (`nodemon server.js`).

## Documentacao por modulo

- Backend: [backend/README.md](backend/README.md)
- Frontend: [frontend/README.md](frontend/README.md)

## Licenca

MIT. Veja [LICENSE](LICENSE).
