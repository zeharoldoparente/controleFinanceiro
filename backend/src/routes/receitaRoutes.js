const express = require("express");
const ReceitaController = require("../controllers/receitaController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.post("/", ReceitaController.create);
router.get("/", ReceitaController.list);
router.get("/:id", ReceitaController.show);
router.put("/:id", ReceitaController.update);
router.delete("/:id", ReceitaController.delete);

module.exports = router;
