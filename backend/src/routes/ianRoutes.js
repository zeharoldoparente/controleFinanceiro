const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const IAnController = require("../controllers/ianController");

const router = express.Router();

router.use(authMiddleware);

router.post("/plano", IAnController.gerarPlano);

module.exports = router;
