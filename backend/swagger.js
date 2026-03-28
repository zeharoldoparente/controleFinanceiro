const swaggerJsdoc = require("swagger-jsdoc");

function normalizeUrl(url) {
   return String(url || "").trim().replace(/\/+$/, "");
}

function resolveServerUrl(serverUrl) {
   const explicitUrl = normalizeUrl(serverUrl);
   if (explicitUrl) return explicitUrl;

   const envUrl = normalizeUrl(
      process.env.SWAGGER_SERVER_URL || process.env.APP_URL,
   );
   if (envUrl) return envUrl;

   return `http://localhost:${process.env.PORT || 3001}`;
}

function createSwaggerSpec(serverUrl) {
   const resolvedServerUrl = resolveServerUrl(serverUrl);
   const isLocalhost = resolvedServerUrl.includes("localhost");

   return swaggerJsdoc({
      definition: {
         openapi: "3.0.0",
         info: {
            title: "API de Controle Financeiro",
            version: "1.1.0",
            description:
               "API completa para gerenciamento de financas pessoais, mesas compartilhadas, receitas, despesas, cartoes, dashboard, conta e IAn.",
            contact: {
               name: "Jose Aroldo",
               email: "joseharoldoparente@gmail.com",
            },
         },
         servers: [
            {
               url: resolvedServerUrl,
               description: isLocalhost ? "Servidor local" : "Servidor atual",
            },
         ],
         components: {
            securitySchemes: {
               bearerAuth: {
                  type: "http",
                  scheme: "bearer",
                  bearerFormat: "JWT",
                  description:
                     "Token JWT obtido no login. Use: Bearer {seu_token}",
               },
            },
         },
      },
      apis: ["./src/routes/*.js"],
   });
}

module.exports = {
   createSwaggerSpec,
   resolveServerUrl,
};
