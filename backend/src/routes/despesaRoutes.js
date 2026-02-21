const express = require("express");
const DespesaController = require("../controllers/despesaController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.post("/", DespesaController.create);
router.get("/", DespesaController.list);
router.get("/:id", DespesaController.show);
router.put("/:id", DespesaController.update);
router.patch("/:id/pagar", DespesaController.marcarComoPaga);
router.delete("/:id", DespesaController.delete);

module.exports = router;
