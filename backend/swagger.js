const swaggerJsdoc = require("swagger-jsdoc");

const options = {
   definition: {
      openapi: "3.0.0",
      info: {
         title: "API de Controle Financeiro",
         version: "1.0.0",
         description:
            "API completa para gerenciamento de finanças pessoais com sistema de mesas compartilhadas, categorias, receitas, despesas e muito mais.",
         contact: {
            name: "José Aroldo",
            email: "joseharoldoparente@gmail.com",
         },
      },
      servers: [
         {
            url: "http://localhost:3001",
            description: "Servidor de Desenvolvimento",
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
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
