const express = require("express");
const MesaController = require("../controllers/mesaController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.post("/", MesaController.create);
router.get("/", MesaController.list);
router.get("/:id", MesaController.show);
router.put("/:id", MesaController.update);
router.delete("/:id", MesaController.delete);

module.exports = router;
