const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./src/config/database");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

const app = express();

app.use(cors());
app.use(express.json());
app.use(
   "/api-docs",
   swaggerUi.serve,
   swaggerUi.setup(swaggerSpec, {
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "API Controle Financeiro - Documentação",
      swaggerOptions: {
         docExpansion: "none",
         defaultModelsExpandDepth: -1,
      },
   }),
);
db.getConnection()
   .then(() => console.log("✅ Conectado ao MySQL!"))
   .catch((err) => console.error("❌ Erro ao conectar:", err));

const authRoutes = require("./src/routes/authRoutes");
const mesaRoutes = require("./src/routes/mesaRoutes");
const categoriaRoutes = require("./src/routes/categoriaRoutes");
const formaPagamentoRoutes = require("./src/routes/formaPagamentoRoutes");
const cartaoRoutes = require("./src/routes/cartaoRoutes");
const receitaRoutes = require("./src/routes/receitaRoutes");
const despesaRoutes = require("./src/routes/despesaRoutes");
const conviteRoutes = require("./src/routes/conviteRoutes");
const notificacaoRoutes = require("./src/routes/notificacaoRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/mesas", mesaRoutes);
app.use("/api/categorias", categoriaRoutes);
app.use("/api/formas-pagamento", formaPagamentoRoutes);
app.use("/api/cartoes", cartaoRoutes);
app.use("/api/receitas", receitaRoutes);
app.use("/api/despesas", despesaRoutes);
app.use("/api/convites", conviteRoutes);
app.use("/api/notificacoes", notificacaoRoutes);

app.get("/", (req, res) => {
   res.json({ message: "API do Controle Financeiro funcionando!" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
   console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
