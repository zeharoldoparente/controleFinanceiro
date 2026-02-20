const express = require("express");
const CategoriaController = require("../controllers/categoriaController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.post("/", CategoriaController.create);
router.get("/", CategoriaController.list);
router.get("/:id", CategoriaController.show);
router.put("/:id", CategoriaController.update);
router.delete("/:id", CategoriaController.delete);

module.exports = router;
