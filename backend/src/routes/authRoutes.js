const express = require("express");
const AuthController = require("../controllers/authController");

const router = express.Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.get("/verificar-email/:token", AuthController.verificarEmail);
router.post("/reenviar-verificacao", AuthController.reenviarEmailVerificacao);
router.post(
   "/solicitar-recuperacao-senha",
   AuthController.solicitarRecuperacaoSenha,
);
router.post("/resetar-senha/:token", AuthController.resetarSenha);

module.exports = router;
