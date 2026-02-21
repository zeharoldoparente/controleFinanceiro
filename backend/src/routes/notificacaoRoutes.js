const express = require("express");
const NotificacaoController = require("../controllers/notificacaoController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.get("/", NotificacaoController.list);
router.get("/nao-lidas/count", NotificacaoController.countNaoLidas);
router.patch("/:id/marcar-lida", NotificacaoController.marcarLida);
router.patch("/marcar-todas-lidas", NotificacaoController.marcarTodasLidas);
router.delete("/:id", NotificacaoController.delete);

module.exports = router;
