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

// Troca de email
router.post("/solicitar-troca-email", ContaController.solicitarTrocaEmail);
router.get("/confirmar-troca-email", ContaController.confirmarTrocaEmail); // chamado pelo link no email (sem auth)

// Suporte / SAC
router.post("/suporte", ContaController.enviarSuporte);

module.exports = router;
