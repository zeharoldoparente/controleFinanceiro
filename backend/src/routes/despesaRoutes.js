const express = require("express");
const DespesaController = require("../controllers/despesaController");
const authMiddleware = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/:id/comprovante/download", DespesaController.getComprovante);
router.post(
   "/:id/comprovante",
   upload.single("comprovante"),
   DespesaController.uploadComprovante,
);
router.delete("/:id/comprovante", DespesaController.deleteComprovante);
router.patch(
   "/:id/pagar",
   upload.single("comprovante"),
   DespesaController.marcarComoPaga,
);

router.post("/", DespesaController.create);
router.get("/", DespesaController.list);
router.get("/:id", DespesaController.show);
router.put("/:id", DespesaController.update);
router.delete("/:id", DespesaController.delete);

module.exports = router;
