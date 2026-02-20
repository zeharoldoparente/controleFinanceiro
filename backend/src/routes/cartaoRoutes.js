const express = require("express");
const CartaoController = require("../controllers/cartaoController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.post("/", CartaoController.create);
router.get("/", CartaoController.list);
router.get("/:id", CartaoController.show);
router.put("/:id", CartaoController.update);
router.delete("/:id", CartaoController.delete);

module.exports = router;
