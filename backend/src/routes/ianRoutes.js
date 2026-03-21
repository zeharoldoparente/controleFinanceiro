const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const IAnController = require("../controllers/ianController");

const router = express.Router();

router.use(authMiddleware);

router.get("/plano-ativo", IAnController.getPlanoAtivo);
router.post("/plano", IAnController.gerarPlano);
router.post("/ativar", IAnController.salvarPlanoAtivo);

module.exports = router;
