# Frontend - Controle Financeiro

Aplicacao web do Controle Financeiro, feita com Next.js 16, React 19 e TypeScript.

## Objetivo

O frontend entrega a experiencia principal do usuario:

- autenticacao e area de conta;
- dashboard financeiro;
- operacao de mesas, receitas, despesas, cartoes e faturas;
- notificacoes;
- fluxo completo do IAn, incluindo plano, sugestoes e acompanhamento mensal da meta.

## Stack

- Next.js 16
- React 19
- TypeScript 5
- Tailwind CSS 4
- Axios
- Recharts
- ESLint 9

## Estrutura principal

```text
frontend/
|-- public/
|-- src/
|   |-- app/
|   |   |-- dashboard/
|   |   |   |-- cartoes/
|   |   |   |-- categorias/
|   |   |   |-- conta/
|   |   |   |-- despesas/
|   |   |   |-- ian/
|   |   |   |-- mesas/
|   |   |   `-- receitas/
|   |   |-- login/
|   |   |-- recuperar-senha/
|   |   |-- registro/
|   |   `-- resetar-senha/
|   |-- components/
|   |-- contexts/
|   |-- hooks/
|   |-- services/
|   `-- types/
|-- .env.local
`-- package.json
```

## Instalar e rodar

```bash
cd frontend
npm install
```

Crie o arquivo `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

Se a variavel nao for definida, o frontend usa `http://localhost:3001/api` como fallback.

Desenvolvimento:

```bash
npm run dev
```

Build de producao:

```bash
npm run build
npm start
```

Aplicacao em `http://localhost:3000`.

## Fluxo tecnico

- o token JWT fica no `localStorage`;
- `src/services/api.ts` injeta `Authorization: Bearer <token>` automaticamente;
- a area autenticada usa `MesaContext` para definir a mesa ativa;
- cada dominio possui um service dedicado em `src/services/`.

## Paginas principais

- `/login`
- `/registro`
- `/recuperar-senha`
- `/resetar-senha/[token]`
- `/dashboard`
- `/dashboard/mesas`
- `/dashboard/receitas`
- `/dashboard/despesas`
- `/dashboard/categorias`
- `/dashboard/cartoes`
- `/dashboard/conta`
- `/dashboard/ian`

## Services principais

O frontend consome a API por services, incluindo:

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

## IAn no frontend

A pagina `src/app/dashboard/ian/page.tsx` hoje suporta:

- gerar um plano financeiro com base no objetivo e na mesa ativa;
- ativar uma estrategia do IAn;
- buscar sugestoes de aplicacao para pesquisa;
- registrar fechamento mensal da meta;
- informar valor guardado, dividendos e investimentos do mes;
- visualizar progresso acumulado, percentual concluido e previsao de conclusao;
- navegar pelo historico mensal e pelo resumo da carteira consolidada.

O service `src/services/ianService.ts` cobre os fluxos:

```text
POST /ian/plano
GET  /ian/plano-ativo
POST /ian/ativar
POST /ian/registro-mensal
POST /ian/sugestoes
```

## Padroes importantes

### MesaContext

As telas operacionais dependem da mesa ativa. O contexto fica na area autenticada e define o escopo dos dados que a pagina deve carregar.

### Services

O padrao predominante e:

```text
Pagina -> service -> axios -> API
```

Isso concentra tipagem, payloads e chamadas HTTP em um ponto previsivel.

### Uploads

Quando a chamada usa `FormData`, o interceptor remove manualmente o `Content-Type` para o browser montar o boundary correto.

## Scripts

```bash
npm run dev
npm run build
npm start
npm run lint
```

## Observacao sobre validacao

O frontend compila com `npm run build`. O lint existe e deve continuar sendo usado, mas pode apontar pendencias antigas em telas fora do escopo de uma feature especifica.

## Licenca

Este modulo segue a licenca MIT do projeto principal.
