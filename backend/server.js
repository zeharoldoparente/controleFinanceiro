const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const db = require("./src/config/database");
const swaggerUi = require("swagger-ui-express");
const { createSwaggerSpec } = require("./swagger");
const {
   getSwaggerUiOptions,
   getSwaggerUiCssOnlyOptions,
} = require("./src/docs/swaggerTheme");
const securityHeadersMiddleware = require("./src/middlewares/securityHeadersMiddleware");
const { createRateLimiter } = require("./src/middlewares/rateLimitMiddleware");

const app = express();
const swaggerSpec = createSwaggerSpec();
const swaggerBasicUiOptions = getSwaggerUiCssOnlyOptions("/docs-assets");
const swaggerUiOptions = getSwaggerUiOptions("/docs-assets");

app.disable("x-powered-by");
app.set("trust proxy", 1);

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

const apiLimiter = createRateLimiter({
   windowMs: 60 * 1000,
   max: 240,
   message: "Muitas requisicoes para a API. Aguarde alguns segundos.",
});

const authLimiter = createRateLimiter({
   windowMs: 15 * 60 * 1000,
   max: 20,
   keyGenerator: (req) => `${req.ip}:${req.path}`,
   message:
      "Muitas tentativas de autenticacao. Aguarde alguns minutos para tentar novamente.",
});

const financeLimiter = createRateLimiter({
   windowMs: 60 * 1000,
   max: 180,
   message:
      "Volume alto de operacoes financeiras detectado. Tente novamente em instantes.",
});

const conviteLimiter = createRateLimiter({
   windowMs: 10 * 60 * 1000,
   max: 60,
   keyGenerator: (req) => req.ip,
   message: "Muitas tentativas em convites. Aguarde e tente novamente.",
});

app.use(securityHeadersMiddleware);
app.use(cors(corsOptions));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/docs-assets", express.static(path.join(__dirname, "public/docs")));

app.get("/api-docs.json", (req, res) => {
   res.json(swaggerSpec);
});

app.use(
   "/api-docs",
   swaggerUi.serveFiles(swaggerSpec, swaggerBasicUiOptions),
   swaggerUi.setup(swaggerSpec, swaggerBasicUiOptions),
);

app.use(
   "/api-docs-fancy",
   swaggerUi.serveFiles(swaggerSpec, swaggerUiOptions),
   swaggerUi.setup(swaggerSpec, swaggerUiOptions),
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
const ianRoutes = require("./src/routes/ianRoutes");

app.use("/api", apiLimiter);

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/reenviar-verificacao", authLimiter);
app.use("/api/auth/solicitar-recuperacao-senha", authLimiter);
app.use("/api/auth/resetar-senha", authLimiter);

app.use("/api/despesas", financeLimiter);
app.use("/api/receitas", financeLimiter);
app.use("/api/faturas", financeLimiter);
app.use("/api/dashboard", financeLimiter);
app.use("/api/ian", financeLimiter);
app.use("/api/convites", conviteLimiter);

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
app.use("/api/ian", ianRoutes);

app.get("/", (req, res) => {
   res.json({ message: "API do Controle Financeiro funcionando!" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
   console.log(`Servidor rodando na porta ${PORT}`);
});
