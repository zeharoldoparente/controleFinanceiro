const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./src/config/database");

const app = express();

app.use(cors());
app.use(express.json());
db.getConnection()
   .then(() => console.log("✅ Conectado ao MySQL!"))
   .catch((err) => console.error("❌ Erro ao conectar:", err));

const authRoutes = require("./src/routes/authRoutes");
const mesaRoutes = require("./src/routes/mesaRoutes");
const categoriaRoutes = require("./src/routes/categoriaRoutes");
const formaPagamentoRoutes = require("./src/routes/formaPagamentoRoutes");
const cartaoRoutes = require("./src/routes/cartaoRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/mesas", mesaRoutes);
app.use("/api/categorias", categoriaRoutes);
app.use("/api/formas-pagamento", formaPagamentoRoutes);
app.use("/api/cartoes", cartaoRoutes);

app.get("/", (req, res) => {
   res.json({ message: "API do Controle Financeiro funcionando!" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
   console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
