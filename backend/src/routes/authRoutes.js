const express = require("express");
const AuthController = require("../controllers/authController");

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar novo usuário
 *     description: Cria uma nova conta de usuário e envia email de verificação
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - email
 *               - senha
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Nome completo do usuário
 *                 example: José Silva
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email válido do usuário
 *                 example: jose@example.com
 *               senha:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 description: Senha com no mínimo 6 caracteres
 *                 example: senha123
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Usuário criado com sucesso! Verifique seu email para ativar a conta.
 *                 userId:
 *                   type: integer
 *                   example: 1
 *                 emailEnviado:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Dados inválidos ou email já cadastrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Email já cadastrado
 */
router.post("/register", AuthController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Fazer login
 *     description: Autentica usuário e retorna token JWT
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - senha
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jose@example.com
 *               senha:
 *                 type: string
 *                 format: password
 *                 example: senha123
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login realizado com sucesso!
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     nome:
 *                       type: string
 *                       example: José Silva
 *                     email:
 *                       type: string
 *                       example: jose@example.com
 *                     emailVerificado:
 *                       type: boolean
 *                       example: true
 *       401:
 *         description: Email ou senha inválidos / Email não verificado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Email não verificado. Por favor, verifique seu email antes de fazer login.
 *                 emailNaoVerificado:
 *                   type: boolean
 *                   example: true
 */
router.post("/login", AuthController.login);

/**
 * @swagger
 * /api/auth/verificar-email/{token}:
 *   get:
 *     summary: Verificar email
 *     description: Verifica o email do usuário através do token enviado por email
 *     tags: [Autenticação]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token de verificação recebido por email
 *         example: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
 *     responses:
 *       200:
 *         description: Email verificado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email verificado com sucesso! Você já pode fazer login.
 *       400:
 *         description: Token inválido, expirado ou já usado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Token expirado
 */
router.get("/verificar-email/:token", AuthController.verificarEmail);

/**
 * @swagger
 * /api/auth/reenviar-verificacao:
 *   post:
 *     summary: Reenviar email de verificação
 *     description: Reenvia o email de verificação para o usuário
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jose@example.com
 *     responses:
 *       200:
 *         description: Email reenviado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email de verificação reenviado com sucesso!
 *       400:
 *         description: Email já verificado
 *       404:
 *         description: Usuário não encontrado
 */
router.post("/reenviar-verificacao", AuthController.reenviarEmailVerificacao);

/**
 * @swagger
 * /api/auth/solicitar-recuperacao-senha:
 *   post:
 *     summary: Solicitar recuperação de senha
 *     description: Envia email com link para resetar a senha
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jose@example.com
 *     responses:
 *       200:
 *         description: Instruções enviadas por email (sempre retorna 200 por segurança)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Se o email existir em nossa base, você receberá instruções para recuperar sua senha.
 */
router.post(
   "/solicitar-recuperacao-senha",
   AuthController.solicitarRecuperacaoSenha,
);

/**
 * @swagger
 * /api/auth/resetar-senha/{token}:
 *   post:
 *     summary: Resetar senha
 *     description: Define uma nova senha usando o token de recuperação
 *     tags: [Autenticação]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token de recuperação recebido por email
 *         example: x1y2z3a4b5c6d7e8f9g0h1i2j3k4l5m6
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - novaSenha
 *             properties:
 *               novaSenha:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: novaSenha123
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
 *                   example: Senha alterada com sucesso! Você já pode fazer login com a nova senha.
 *       400:
 *         description: Token inválido, expirado ou senha muito curta
 */
router.post("/resetar-senha/:token", AuthController.resetarSenha);

module.exports = router;
