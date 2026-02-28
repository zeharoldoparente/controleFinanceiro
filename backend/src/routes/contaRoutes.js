const express = require("express");
const router = express.Router();
const ContaController = require("../controllers/contaController");
const authMiddleware = require("../middlewares/authMiddleware");

// Todas as rotas exigem autenticação
router.use(authMiddleware);

// Perfil
router.get("/perfil", ContaController.getPerfil);
router.put("/perfil", ContaController.atualizarPerfil);
router.post("/foto", ContaController.atualizarFoto);
router.delete("/foto", ContaController.removerFoto);

// Segurança — troca de senha via email
router.post("/solicitar-troca-senha", ContaController.solicitarTrocaSenha);
router.post("/confirmar-troca-senha", ContaController.confirmarTrocaSenha);

// Preferências
router.put("/preferencias", ContaController.atualizarPreferencias);

// Suporte / SAC
router.post("/suporte", ContaController.enviarSuporte);

module.exports = router;
