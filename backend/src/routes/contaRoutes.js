const express = require("express");
const router = express.Router();
const ContaController = require("../controllers/contaController");
const authMiddleware = require("../middlewares/authMiddleware");

// A maioria das rotas exige autenticação
router.use((req, res, next) => {
   // Rota pública: confirmação de troca de email (link clicado pelo usuário no email)
   if (req.path === "/confirmar-troca-email" && req.method === "GET")
      return next();
   authMiddleware(req, res, next);
});

// ──────────────────────────────────────────────────────────────────────────────
// PERFIL
// ──────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/conta/perfil:
 *   get:
 *     summary: Buscar perfil do usuário
 *     description: Retorna os dados do perfil do usuário logado, incluindo preferências e informações de plano
 *     tags: [Conta]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do perfil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 nome:
 *                   type: string
 *                   example: José Silva
 *                 email:
 *                   type: string
 *                   example: jose@example.com
 *                 telefone:
 *                   type: string
 *                   example: "(63) 9 9956-9407"
 *                 foto_url:
 *                   type: string
 *                   nullable: true
 *                   description: URL da foto em base64 ou null
 *                 tipo_plano:
 *                   type: string
 *                   enum: [free, premium]
 *                   example: free
 *                 preferencia_moeda:
 *                   type: string
 *                   example: BRL
 *                 preferencia_data:
 *                   type: string
 *                   example: DD/MM/YYYY
 *                 notificacoes_email:
 *                   type: boolean
 *                   example: true
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Usuário não encontrado
 */
router.get("/perfil", ContaController.getPerfil);

/**
 * @swagger
 * /api/conta/perfil:
 *   put:
 *     summary: Atualizar perfil
 *     description: Atualiza nome e telefone do usuário logado
 *     tags: [Conta]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *             properties:
 *               nome:
 *                 type: string
 *                 minLength: 2
 *                 description: Nome completo do usuário
 *                 example: José Aroldo Silva
 *               telefone:
 *                 type: string
 *                 nullable: true
 *                 description: Telefone com DDD (opcional)
 *                 example: "(63) 9 9956-9407"
 *     responses:
 *       200:
 *         description: Perfil atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Perfil atualizado com sucesso
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     nome:
 *                       type: string
 *                     email:
 *                       type: string
 *                     telefone:
 *                       type: string
 *       400:
 *         description: Nome inválido (mínimo 2 caracteres)
 *       401:
 *         description: Não autenticado
 */
router.put("/perfil", ContaController.atualizarPerfil);

// ──────────────────────────────────────────────────────────────────────────────
// FOTO DE PERFIL
// ──────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/conta/foto:
 *   post:
 *     summary: Atualizar foto de perfil
 *     description: Envia uma foto de perfil em base64. A imagem é armazenada como LONGTEXT no banco de dados.
 *     tags: [Conta]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - foto_url
 *             properties:
 *               foto_url:
 *                 type: string
 *                 description: Imagem em formato base64 (data:image/...)
 *                 example: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
 *     responses:
 *       200:
 *         description: Foto atualizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Foto atualizada com sucesso
 *                 foto_url:
 *                   type: string
 *       400:
 *         description: foto_url não fornecida
 *       401:
 *         description: Não autenticado
 */
router.post("/foto", ContaController.atualizarFoto);

/**
 * @swagger
 * /api/conta/foto:
 *   delete:
 *     summary: Remover foto de perfil
 *     description: Remove a foto de perfil do usuário, voltando ao avatar com inicial do nome
 *     tags: [Conta]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Foto removida com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Foto removida com sucesso
 *       401:
 *         description: Não autenticado
 */
router.delete("/foto", ContaController.removerFoto);

// ──────────────────────────────────────────────────────────────────────────────
// SEGURANÇA — TROCA DE SENHA
// ──────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/conta/solicitar-troca-senha:
 *   post:
 *     summary: Solicitar troca de senha
 *     description: Envia um email com link para confirmar a troca de senha. O link contém um token válido por tempo limitado.
 *     tags: [Conta]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Email de confirmação enviado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email de confirmação enviado. Verifique sua caixa de entrada.
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro ao enviar email
 */
router.post("/solicitar-troca-senha", ContaController.solicitarTrocaSenha);

/**
 * @swagger
 * /api/conta/confirmar-troca-senha:
 *   post:
 *     summary: Confirmar troca de senha
 *     description: Define a nova senha usando o token recebido por email. Valida a senha atual antes de alterar.
 *     tags: [Conta]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - senha_atual
 *               - nova_senha
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token recebido por email
 *                 example: a1b2c3d4e5f6...
 *               senha_atual:
 *                 type: string
 *                 format: password
 *                 description: Senha atual para validação
 *                 example: senhaAtual123
 *               nova_senha:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 description: Nova senha (mínimo 6 caracteres)
 *                 example: novaSenha456
 *     responses:
 *       200:
 *         description: Senha alterada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Senha alterada com sucesso!
 *       400:
 *         description: Token inválido, expirado ou senha atual incorreta
 *       401:
 *         description: Não autenticado
 */
router.post("/confirmar-troca-senha", ContaController.confirmarTrocaSenha);

// ──────────────────────────────────────────────────────────────────────────────
// PREFERÊNCIAS
// ──────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/conta/preferencias:
 *   put:
 *     summary: Atualizar preferências
 *     description: Atualiza preferências de moeda, formato de data e notificações por email
 *     tags: [Conta]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               preferencia_moeda:
 *                 type: string
 *                 description: Código da moeda
 *                 example: BRL
 *               preferencia_data:
 *                 type: string
 *                 description: Formato de exibição de datas
 *                 example: DD/MM/YYYY
 *               notificacoes_email:
 *                 type: boolean
 *                 description: Receber notificações por email
 *                 example: true
 *     responses:
 *       200:
 *         description: Preferências atualizadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Preferências atualizadas
 *       401:
 *         description: Não autenticado
 */
router.put("/preferencias", ContaController.atualizarPreferencias);

// ──────────────────────────────────────────────────────────────────────────────
// TROCA DE EMAIL
// ──────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/conta/solicitar-troca-email:
 *   post:
 *     summary: Solicitar troca de email
 *     description: >
 *       Envia um email de confirmação para o NOVO endereço informado.
 *       O email atual só será alterado após o usuário confirmar clicando no link.
 *       Valida se o novo email já não está em uso.
 *     tags: [Conta]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - novo_email
 *             properties:
 *               novo_email:
 *                 type: string
 *                 format: email
 *                 description: Novo endereço de email
 *                 example: novo@example.com
 *     responses:
 *       200:
 *         description: Email de confirmação enviado para o novo endereço
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email de confirmação enviado para novo@example.com
 *       400:
 *         description: Email inválido ou já em uso
 *       401:
 *         description: Não autenticado
 */
router.post("/solicitar-troca-email", ContaController.solicitarTrocaEmail);

/**
 * @swagger
 * /api/conta/confirmar-troca-email:
 *   get:
 *     summary: Confirmar troca de email
 *     description: >
 *       Rota pública chamada pelo link no email de confirmação.
 *       Aplica a troca de email e redireciona para a página de conta.
 *       Não requer autenticação JWT.
 *     tags: [Conta]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token de confirmação recebido por email
 *         example: x1y2z3a4b5c6d7e8...
 *     responses:
 *       302:
 *         description: Redireciona para /dashboard/conta?email_atualizado=1
 *       400:
 *         description: Token inválido ou expirado
 */
router.get("/confirmar-troca-email", ContaController.confirmarTrocaEmail);

// ──────────────────────────────────────────────────────────────────────────────
// SUPORTE / SAC
// ──────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/conta/suporte:
 *   post:
 *     summary: Enviar mensagem de suporte
 *     description: Envia uma mensagem para o email de suporte da aplicação
 *     tags: [Conta]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assunto
 *               - mensagem
 *             properties:
 *               assunto:
 *                 type: string
 *                 description: Assunto da mensagem
 *                 example: Dúvida sobre funcionalidade
 *               mensagem:
 *                 type: string
 *                 description: Corpo da mensagem
 *                 example: Gostaria de saber como compartilhar uma mesa com outra pessoa.
 *     responses:
 *       200:
 *         description: Mensagem enviada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Mensagem enviada com sucesso!
 *       400:
 *         description: Assunto ou mensagem não informados
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro ao enviar mensagem
 */
router.post("/suporte", ContaController.enviarSuporte);

module.exports = router;
