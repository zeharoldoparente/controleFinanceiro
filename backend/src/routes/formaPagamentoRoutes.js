const express = require("express");
const FormaPagamentoController = require("../controllers/formaPagamentoController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.post("/", FormaPagamentoController.create);
router.get("/", FormaPagamentoController.list);
router.get("/:id", FormaPagamentoController.show);
router.put("/:id", FormaPagamentoController.update);
router.delete("/:id", FormaPagamentoController.delete);

module.exports = router;
