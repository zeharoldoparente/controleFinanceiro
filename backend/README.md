# Backend - Controle Financeiro

API REST do projeto Controle Financeiro. Ela centraliza autenticacao, regras de negocio, persistencia em MySQL, documentacao Swagger e o motor do IAn.

## Stack

- Node.js
- Express 5
- MySQL 8
- JWT
- bcryptjs
- Nodemailer
- Multer
- Swagger UI / Swagger JSDoc

## O que a API faz hoje

- autentica usuarios com JWT;
- valida email, recupera senha e suporta troca de email;
- gerencia mesas colaborativas e seus membros;
- controla receitas, despesas, cartoes, bandeiras, tipos e formas de pagamento;
- gera e paga faturas;
- dispara notificacoes e emails transacionais;
- entrega dashboard financeiro por mesa;
- executa o IAn, com plano, acompanhamento e historico mensal da meta.

## Estrutura principal

```text
backend/
|-- database/
|-- public/
|-- src/
|   |-- config/
|   |-- controllers/
|   |-- docs/
|   |-- middlewares/
|   |-- models/
|   |-- routes/
|   |-- services/
|   `-- utils/
|-- .env.example
|-- package.json
|-- server.js
`-- swagger.js
```

## Instalar e rodar

```bash
cd backend
npm install
cp .env.example .env
```

Depois configure o `.env`:

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
# ou varias URLs separadas por virgula
# FRONTEND_URLS=https://seu-front.vercel.app,https://outro-dominio.com

# opcional, usado pelo IAn para enriquecer sugestoes com cotacoes
BRAPI_TOKEN=
```

### Banco principal

```bash
mysql -u root -p < database/schema.sql
```

### Subir a API

Desenvolvimento:

```bash
npm run dev
```

Producao:

```bash
npm start
```

API em `http://localhost:3001`.

## Swagger

- `http://localhost:3001/api-docs`
- `http://localhost:3001/api-docs-fancy`
- spec JSON: `http://localhost:3001/api-docs.json`

## Banco de dados

O schema principal continua vindo de `database/schema.sql`, com tabelas como:

- `users`
- `tokens_verificacao`
- `mesas`
- `mesa_usuarios`
- `categorias`
- `cartoes`
- `faturas`
- `receitas`
- `despesas`
- `convites`
- `notificacoes`

O IAn adiciona tabelas extras sob demanda:

- `ian_planos`: guarda o plano ativo e seu payload consolidado;
- `ian_registros_mensais`: guarda a evolucao mensal da meta, com valor guardado, investimentos, dividendos e observacoes.

Essas tabelas sao criadas automaticamente na primeira utilizacao do IAn e nao exigem migracao manual separada.

## Modulos de rota

Os grupos principais de rota hoje sao:

- `/api/auth`
- `/api/mesa`
- `/api/mesa/:mesa_id/membros`
- `/api/categorias`
- `/api/formas-pagamento`
- `/api/tipos-pagamento`
- `/api/bandeiras`
- `/api/cartoes`
- `/api/receitas`
- `/api/despesas`
- `/api/faturas`
- `/api/convites`
- `/api/notificacoes`
- `/api/dashboard`
- `/api/conta`
- `/api/ian`

## IAn

O backend do IAn cobre cinco fluxos principais:

```text
GET    /api/ian/plano-ativo
POST   /api/ian/plano
POST   /api/ian/ativar
POST   /api/ian/registro-mensal
POST   /api/ian/sugestoes
```

Capacidades atuais do IAn:

- gerar plano financeiro com diagnostico e estrategias;
- salvar uma estrategia ativa por mesa;
- acompanhar o comportamento atual com alertas diarios, semanais e mensais;
- registrar o fechamento mensal da meta;
- calcular patrimonio acumulado, percentual concluido, valor faltante e previsao de conclusao;
- consolidar resumo da carteira com base no historico informado pelo usuario;
- sugerir ativos para pesquisa com contexto financeiro e, opcionalmente, cotacoes do mercado.

## Middlewares e seguranca

O backend aplica:

- autenticacao por JWT;
- headers de seguranca;
- CORS com `FRONTEND_URL` e `FRONTEND_URLS`;
- rate limit global, de autenticacao, financeiro e de convites;
- prepared statements no acesso ao banco;
- upload validado para comprovantes.

## Scripts

```bash
npm run dev
npm start
npm test
```

Observacao:

- `npm test` ainda e apenas um placeholder no `package.json`.

## Ponto de atencao

Se voce estiver documentando endpoints manualmente fora do Swagger, prefira sempre validar pelo codigo em `server.js` e pelos arquivos de `src/routes/`, porque os prefixos de algumas entidades usam singular (`/api/mesa`) e nao plural.

## Licenca

Este modulo segue a licenca MIT do projeto principal.
