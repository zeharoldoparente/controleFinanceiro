const express = require("express");
const ConviteController = require("../controllers/conviteController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.post("/", ConviteController.create);
router.get("/pendentes", ConviteController.listPendentes);
router.get("/enviados", ConviteController.listEnviados);
router.post("/:token/aceitar", ConviteController.aceitar);
router.post("/:token/recusar", ConviteController.recusar);

module.exports = router;
