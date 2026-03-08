const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./src/config/database");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

const app = express();

function normalizeOrigin(origin) {
   return typeof origin === "string" ? origin.replace(/\/+$/, "") : origin;
}

function parseOriginsFromEnv() {
   return [process.env.FRONTEND_URL, process.env.FRONTEND_URLS]
      .filter(Boolean)
      .flatMap((value) => value.split(","))
      .map((value) => normalizeOrigin(value.trim()))
      .filter(Boolean);
}

const allowedOriginStrings = Array.from(
   new Set([
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      ...parseOriginsFromEnv(),
   ]),
);

const allowedOriginPatterns = [
   /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:3000$/,
   /^https:\/\/(?:[a-z0-9-]+\.)?vercel\.app$/i,
];

const corsOptions = {
   origin(origin, callback) {
      if (!origin) return callback(null, true);

      const normalizedOrigin = normalizeOrigin(origin);
      const isAllowedByString = allowedOriginStrings.includes(normalizedOrigin);
      const isAllowedByPattern = allowedOriginPatterns.some((pattern) =>
         pattern.test(normalizedOrigin),
      );

      if (isAllowedByString || isAllowedByPattern) {
         return callback(null, true);
      }

      console.warn(`[CORS] blocked origin: ${origin}`);
      return callback(new Error("Not allowed by CORS"));
   },
   credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(
   "/api-docs",
   swaggerUi.serve,
   swaggerUi.setup(swaggerSpec, {
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "API Controle Financeiro - Documentacao",
      swaggerOptions: {
         docExpansion: "none",
         defaultModelsExpandDepth: -1,
      },
   }),
);

db.getConnection()
   .then(() => console.log("Conectado ao MySQL!"))
   .catch((err) => console.error("Erro ao conectar:", err));

const authRoutes = require("./src/routes/authRoutes");
const categoriaRoutes = require("./src/routes/categoriaRoutes");
const formaPagamentoRoutes = require("./src/routes/formaPagamentoRoutes");
const cartaoRoutes = require("./src/routes/cartaoRoutes");
const receitaRoutes = require("./src/routes/receitaRoutes");
const despesaRoutes = require("./src/routes/despesaRoutes");
const conviteRoutes = require("./src/routes/conviteRoutes");
const notificacaoRoutes = require("./src/routes/notificacaoRoutes");
const bandeiraRoutes = require("./src/routes/bandeiraRoutes");
const tipoPagamentoRoutes = require("./src/routes/tipoPagamentoRoutes");
const mesaRoutes = require("./src/routes/mesaRoutes");
const mesaMembroRoutes = require("./src/routes/mesaMembroRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");
const contaRoutes = require("./src/routes/contaRoutes");
const faturaRoutes = require("./src/routes/faturaRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/categorias", categoriaRoutes);
app.use("/api/formas-pagamento", formaPagamentoRoutes);
app.use("/api/cartoes", cartaoRoutes);
app.use("/api/receitas", receitaRoutes);
app.use("/api/despesas", despesaRoutes);
app.use("/api/convites", conviteRoutes);
app.use("/api/notificacoes", notificacaoRoutes);
app.use("/api/bandeiras", bandeiraRoutes);
app.use("/api/tipos-pagamento", tipoPagamentoRoutes);
app.use("/api/mesa/:mesa_id/membros", mesaMembroRoutes);
app.use("/api/mesa", mesaRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/conta", contaRoutes);
app.use("/api/faturas", faturaRoutes);

app.get("/", (req, res) => {
   res.json({ message: "API do Controle Financeiro funcionando!" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
   console.log(`Servidor rodando na porta ${PORT}`);
});
