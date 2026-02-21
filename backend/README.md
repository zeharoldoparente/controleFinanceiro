# 💰 API de Controle Financeiro

> Sistema completo de gestão financeira pessoal com mesas colaborativas, categorias, receitas, despesas e muito mais.

![Node.js](https://img.shields.io/badge/Node.js-v20+-green)
![MySQL](https://img.shields.io/badge/MySQL-8.0-blue)
![Express](https://img.shields.io/badge/Express-4.x-lightgrey)
![JWT](https://img.shields.io/badge/JWT-Auth-orange)
![Swagger](https://img.shields.io/badge/Swagger-Docs-brightgreen)

---

## 📋 Sobre o Projeto

API RESTful desenvolvida em Node.js para gerenciamento completo de finanças pessoais, permitindo que usuários criem "mesas de controle" para organizar suas receitas e despesas, com possibilidade de compartilhamento colaborativo através de convites.

### ✨ Principais Diferenciais

- 🔐 **Autenticação completa** com verificação de email e recuperação de senha
- 👥 **Mesas colaborativas** - convide outras pessoas para gerenciar finanças juntos
- 📧 **Sistema de emails transacionais** - verificação, convites e recuperação
- 📸 **Upload de comprovantes** - anexe fotos dos pagamentos
- 🔔 **Notificações em tempo real** - sistema de "sininho" para avisos
- 📊 **Gestão detalhada** - categorias, formas de pagamento, cartões
- 💳 **Controle de parcelas** - acompanhe despesas parceladas
- 🔄 **Despesas recorrentes** - mensalidades automáticas
- 📝 **Documentação Swagger** - 49 endpoints totalmente documentados

---

## 🚀 Tecnologias Utilizadas

### Core

- **Node.js** - Ambiente de execução JavaScript
- **Express** - Framework web minimalista
- **MySQL** - Banco de dados relacional

### Autenticação & Segurança

- **JWT (jsonwebtoken)** - Autenticação stateless
- **bcryptjs** - Hash de senhas

### Upload & Email

- **Multer** - Upload de arquivos (comprovantes)
- **Nodemailer** - Envio de emails transacionais

### Documentação

- **Swagger UI Express** - Interface de documentação interativa
- **Swagger JSDoc** - Geração de documentação OpenAPI 3.0

### Utilidades

- **dotenv** - Gerenciamento de variáveis de ambiente
- **cors** - Habilitar Cross-Origin Resource Sharing

---

## 📁 Estrutura do Projeto

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # Configuração do MySQL
│   ├── controllers/              # Lógica de negócio
│   │   ├── authController.js
│   │   ├── mesaController.js
│   │   ├── categoriaController.js
│   │   ├── formaPagamentoController.js
│   │   ├── cartaoController.js
│   │   ├── receitaController.js
│   │   ├── despesaController.js
│   │   ├── conviteController.js
│   │   └── notificacaoController.js
│   ├── models/                   # Acesso ao banco de dados
│   │   ├── User.js
│   │   ├── Mesa.js
│   │   ├── Categoria.js
│   │   ├── FormaPagamento.js
│   │   ├── Cartao.js
│   │   ├── Receita.js
│   │   ├── Despesa.js
│   │   ├── Convite.js
│   │   ├── Notificacao.js
│   │   └── TokenVerificacao.js
│   ├── routes/                   # Definição das rotas
│   │   ├── authRoutes.js
│   │   ├── mesaRoutes.js
│   │   ├── categoriaRoutes.js
│   │   ├── formaPagamentoRoutes.js
│   │   ├── cartaoRoutes.js
│   │   ├── receitaRoutes.js
│   │   ├── despesaRoutes.js
│   │   ├── conviteRoutes.js
│   │   └── notificacaoRoutes.js
│   ├── middlewares/              # Middlewares customizados
│   │   ├── authMiddleware.js     # Verificação de JWT
│   │   └── uploadMiddleware.js   # Configuração Multer
│   └── services/                 # Serviços externos
│       └── emailService.js       # Envio de emails
├── uploads/                      # Comprovantes de pagamento
├── swagger.js                    # Configuração Swagger
├── server.js                     # Arquivo principal
├── .env                          # Variáveis de ambiente
├── .env.example                  # Exemplo de configuração
└── package.json
```

---

## 🗄️ Banco de Dados

### Tabelas (13)

| Tabela               | Descrição                                |
| -------------------- | ---------------------------------------- |
| `users`              | Usuários do sistema                      |
| `tokens_verificacao` | Tokens de email e recuperação de senha   |
| `mesas`              | Mesas de controle financeiro             |
| `mesa_usuarios`      | Relacionamento usuários ↔ mesas          |
| `categorias`         | Categorias de receitas/despesas          |
| `formas_pagamento`   | Formas de pagamento (PIX, Dinheiro, etc) |
| `cartoes`            | Cartões de crédito/débito dos usuários   |
| `receitas`           | Receitas financeiras                     |
| `despesas`           | Despesas financeiras                     |
| `convites`           | Convites para mesas                      |
| `notificacoes`       | Notificações do sistema                  |

### Diagrama ER Simplificado

```
users (1) ──→ (N) mesas
users (N) ──→ (N) mesas (através de mesa_usuarios)
mesas (1) ──→ (N) receitas
mesas (1) ──→ (N) despesas
users (1) ──→ (N) cartoes
categorias (1) ──→ (N) receitas/despesas
```

---

## ⚙️ Instalação e Configuração

### Pré-requisitos

- Node.js 18+ instalado
- MySQL 8.0+ instalado e rodando
- Conta de email (Gmail ou outro) para envio de emails

### Passo 1: Clone o repositório

```bash
git clone https://github.com/seu-usuario/controle-financeiro-api.git
cd controle-financeiro-api/backend
```

### Passo 2: Instale as dependências

```bash
npm install
```

### Passo 3: Configure as variáveis de ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Servidor
PORT=3001

# Banco de Dados
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=controle_financeiro

# Autenticação
JWT_SECRET=sua_chave_secreta_super_segura_aqui

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu_email@gmail.com
EMAIL_PASSWORD=sua_senha_de_app_do_gmail
EMAIL_FROM=Controle Financeiro <seu_email@gmail.com>

# URLs
APP_URL=http://localhost:3001
```

### Passo 4: Crie o banco de dados

Execute o script SQL localizado em `database/schema.sql`:

```bash
mysql -u root -p < database/schema.sql
```

Ou execute manualmente no MySQL:

```sql
CREATE DATABASE controle_financeiro;
-- Execute todos os CREATE TABLE...
```

### Passo 5: Inicie o servidor

**Desenvolvimento (com hot reload):**

```bash
npm run dev
```

**Produção:**

```bash
npm start
```

O servidor estará rodando em: **http://localhost:3001**

---

## 📚 Documentação da API

A documentação completa e interativa está disponível via **Swagger UI**.

### Acessar a documentação:

```
http://localhost:3001/api-docs
```

### Características da Documentação:

- ✅ **49 endpoints** completamente documentados
- ✅ Exemplos de request e response
- ✅ Schemas detalhados de todos os objetos
- ✅ Testes interativos direto no navegador
- ✅ Autenticação JWT integrada

---

## 🔐 Autenticação

A API utiliza **JWT (JSON Web Tokens)** para autenticação.

### Como autenticar:

1. **Registre-se:**

```bash
POST /api/auth/register
{
  "nome": "José Silva",
  "email": "jose@example.com",
  "senha": "senha123"
}
```

2. **Verifique seu email** (clique no link recebido)

3. **Faça login:**

```bash
POST /api/auth/login
{
  "email": "jose@example.com",
  "senha": "senha123"
}
```

4. **Use o token** nas próximas requisições:

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🎯 Funcionalidades Principais

### 1. 🔐 Autenticação Completa

- ✅ Registro de usuários com verificação de email
- ✅ Login com JWT
- ✅ Recuperação de senha por email
- ✅ Reenvio de email de verificação
- ✅ Tokens com expiração configurável

### 2. 📊 Gestão de Mesas

- ✅ Criar mesas de controle (limite: 2 no plano free)
- ✅ Listar, editar e deletar mesas
- ✅ Sistema de papéis (criador vs convidado)
- ✅ Apenas o criador pode editar/deletar

### 3. 👥 Sistema de Convites

- ✅ Convidar usuários por email
- ✅ Emails automáticos para cadastrados e não cadastrados
- ✅ Aceitar/recusar convites
- ✅ Limite de mesas compartilhadas (2 no plano free)
- ✅ Tokens de convite com expiração

### 4. 🔔 Notificações

- ✅ Sistema de notificações ("sininho")
- ✅ Contagem de não lidas
- ✅ Marcar como lida (individual ou todas)
- ✅ Integração com convites

### 5. 📁 Categorias

- ✅ CRUD completo
- ✅ Separação por tipo (receita/despesa)
- ✅ Filtros por tipo

### 6. 💳 Formas de Pagamento & Cartões

- ✅ Cadastro de formas de pagamento customizadas
- ✅ Gestão de cartões (crédito/débito)
- ✅ Informações de limite e vencimento
- ✅ Vinculação com despesas

### 7. 💰 Receitas

- ✅ CRUD completo
- ✅ Vinculação com mesas e categorias
- ✅ Data de recebimento
- ✅ Valores decimais precisos

### 8. 💸 Despesas (Funcionalidade Mais Completa)

- ✅ CRUD completo
- ✅ Valor provisionado vs valor real
- ✅ Marcar como paga
- ✅ Categorias e formas de pagamento
- ✅ Vinculação com cartões
- ✅ Sistema de parcelas
- ✅ Despesas recorrentes
- ✅ **Upload de comprovantes** (fotos)
- ✅ Visualizar, substituir e excluir comprovantes

### 9. 📸 Upload de Comprovantes

- ✅ Upload ao marcar despesa como paga
- ✅ Upload/atualização separada
- ✅ Visualização e download
- ✅ Exclusão de comprovantes
- ✅ Validação de tipo (apenas imagens)
- ✅ Limite de 5MB por arquivo
- ✅ Nomes únicos (hash) para evitar conflitos

### 10. 📧 Sistema de Emails

- ✅ Email de verificação ao cadastrar
- ✅ Email de convite para mesas
- ✅ Email de recuperação de senha
- ✅ Templates HTML profissionais
- ✅ Links com tokens seguros

---

## 📡 Principais Endpoints

### Autenticação

```
POST   /api/auth/register                    # Registrar usuário
POST   /api/auth/login                       # Fazer login
GET    /api/auth/verificar-email/:token      # Verificar email
POST   /api/auth/reenviar-verificacao        # Reenviar verificação
POST   /api/auth/solicitar-recuperacao-senha # Solicitar recuperação
POST   /api/auth/resetar-senha/:token        # Resetar senha
```

### Mesas

```
POST   /api/mesas           # Criar mesa
GET    /api/mesas           # Listar mesas
GET    /api/mesas/:id       # Buscar mesa
PUT    /api/mesas/:id       # Atualizar mesa
DELETE /api/mesas/:id       # Deletar mesa
```

### Despesas (com Comprovantes)

```
POST   /api/despesas                           # Criar despesa
GET    /api/despesas?mesa_id=X                 # Listar despesas
PATCH  /api/despesas/:id/pagar                 # Marcar como paga (com upload)
POST   /api/despesas/:id/comprovante           # Upload comprovante
GET    /api/despesas/:id/comprovante/download  # Baixar comprovante
DELETE /api/despesas/:id/comprovante           # Deletar comprovante
```

### Convites

```
POST   /api/convites                 # Enviar convite
GET    /api/convites/pendentes       # Listar convites recebidos
GET    /api/convites/enviados        # Listar convites enviados
POST   /api/convites/:token/aceitar  # Aceitar convite
POST   /api/convites/:token/recusar  # Recusar convite
```

### Notificações

```
GET    /api/notificacoes                    # Listar notificações
GET    /api/notificacoes/nao-lidas/count    # Contar não lidas
PATCH  /api/notificacoes/:id/marcar-lida    # Marcar como lida
PATCH  /api/notificacoes/marcar-todas-lidas # Marcar todas
DELETE /api/notificacoes/:id                # Deletar notificação
```

**Ver documentação completa:** http://localhost:3001/api-docs

---

## 🧪 Exemplos de Uso

### Criar uma despesa com comprovante

```bash
curl -X PATCH http://localhost:3001/api/despesas/1/pagar \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "mesa_id=2" \
  -F "valor_real=148.50" \
  -F "data_pagamento=2026-02-14" \
  -F "comprovante=@/caminho/para/foto.jpg"
```

### Listar despesas de uma mesa

```bash
curl -X GET "http://localhost:3001/api/despesas?mesa_id=2" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### Aceitar um convite

```bash
curl -X POST http://localhost:3001/api/convites/TOKEN_DO_CONVITE/aceitar \
  -H "Authorization: Bearer SEU_TOKEN"
```

---

## 📊 Estatísticas do Projeto

- **Linhas de Código:** ~3.500+
- **Endpoints:** 49
- **Tabelas no Banco:** 13
- **Models:** 11
- **Controllers:** 9
- **Rotas:** 9
- **Middlewares:** 3
- **Services:** 1

---

## 🔒 Segurança

- ✅ Senhas criptografadas com bcrypt (salt rounds: 10)
- ✅ Autenticação stateless com JWT
- ✅ Tokens com expiração configurável
- ✅ Validação de tipos de arquivo no upload
- ✅ Proteção contra SQL Injection (prepared statements)
- ✅ CORS configurado
- ✅ Validação de dados em todas as rotas
- ✅ Separação de permissões (criador vs convidado)

---

## 🚀 Deploy

### Preparação para Produção

1. **Configure variáveis de ambiente de produção**
2. **Use um serviço de email profissional** (SendGrid, Amazon SES)
3. **Configure SSL/HTTPS**
4. **Use PM2** para gerenciar o processo Node.js
5. **Configure backup automático do banco**

### Plataformas Recomendadas

- **Railway** - Deploy automático do GitHub
- **Render** - Free tier generoso
- **Heroku** - Clássico e confiável
- **Digital Ocean** - VPS com controle total

---

## 🤝 Contribuição

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

## 👨‍💻 Autor

**José Haroldo Parente**

- Email: joseharoldoparente@gmail.com
- LinkedIn: [José Aroldo Soares](https://www.linkedin.com/in/josearoldosoares/)
- GitHub: [@zeharoldoparente](https://github.com/zeharoldoparente)

---

## 🙏 Agradecimentos

- Anthropic Claude - Assistência no desenvolvimento
- Comunidade Node.js
- Documentação do Express.js
- Swagger/OpenAPI Initiative

---

<p align="center">
  Feito com ❤️ por José Aroldo
</p>
