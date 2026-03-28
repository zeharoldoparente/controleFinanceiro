function getSwaggerCustomCss(assetBaseUrl = "/docs-assets") {
   return `
      body {
         background:
            radial-gradient(circle at top left, rgba(16, 185, 129, 0.14), transparent 28%),
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.18), transparent 24%),
            #0b1220;
      }

      .swagger-ui {
         color: #e5e7eb;
         font-family: "Segoe UI", "Trebuchet MS", Arial, sans-serif;
      }

      .swagger-ui .topbar {
         display: none;
      }

      .swagger-ui .wrapper {
         max-width: 1220px;
      }

      .swagger-ui .information-container.wrapper {
         padding-top: 28px;
      }

      .swagger-ui .info {
         border: 1px solid rgba(148, 163, 184, 0.16);
         border-radius: 28px;
         padding: 32px 36px;
         background:
            linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(17, 24, 39, 0.92)),
            #111827;
         box-shadow: 0 26px 60px rgba(2, 6, 23, 0.35);
      }

      .swagger-ui .info .title {
         display: flex;
         align-items: center;
         gap: 18px;
         margin: 6px 0 14px;
         color: #f8fafc;
         font-size: 46px;
         line-height: 1.1;
      }

      .swagger-ui .info .title::before {
         content: "";
         width: 68px;
         height: 68px;
         border-radius: 20px;
         flex: 0 0 68px;
         background:
            linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.7)),
            url("${assetBaseUrl}/brand.svg") center center / 82% no-repeat;
         border: 1px solid rgba(255, 255, 255, 0.08);
         box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 12px 30px rgba(15, 23, 42, 0.4);
      }

      .swagger-ui .info p,
      .swagger-ui .info li,
      .swagger-ui .info table {
         color: #cbd5e1;
      }

      .swagger-ui .info a {
         color: #7dd3fc;
      }

      .swagger-ui .scheme-container {
         margin: 18px 0 10px;
         padding: 18px 20px;
         border: 1px solid rgba(148, 163, 184, 0.14);
         border-radius: 22px;
         background: rgba(15, 23, 42, 0.72);
         box-shadow: none;
      }

      .swagger-ui .scheme-container .schemes {
         align-items: center;
         gap: 16px;
      }

      .swagger-ui select {
         min-width: 360px;
         border-radius: 14px;
         border: 1px solid rgba(148, 163, 184, 0.22);
         background: #0f172a;
         color: #f8fafc;
      }

      .swagger-ui .btn.authorize {
         border-radius: 14px;
         border: 1px solid rgba(16, 185, 129, 0.55);
         background: linear-gradient(135deg, #059669, #10b981);
         color: #ecfdf5;
         box-shadow: 0 10px 24px rgba(5, 150, 105, 0.2);
      }

      .swagger-ui .btn.authorize svg {
         fill: currentColor;
      }

      .swagger-ui .opblock-tag-section {
         margin-bottom: 16px;
      }

      .swagger-ui .opblock-tag {
         padding: 18px 22px;
         border-top: 0;
         border-bottom: 1px solid rgba(148, 163, 184, 0.14);
         color: #f8fafc;
         font-weight: 700;
         background: transparent;
      }

      .swagger-ui .opblock-tag:hover {
         background: rgba(15, 23, 42, 0.6);
      }

      .swagger-ui .opblock {
         margin: 0 0 12px;
         border-width: 1px;
         border-radius: 18px;
         overflow: hidden;
         box-shadow: 0 16px 30px rgba(2, 6, 23, 0.18);
         backdrop-filter: blur(6px);
      }

      .swagger-ui .opblock .opblock-summary {
         padding: 8px 12px;
      }

      .swagger-ui .opblock .opblock-summary-path {
         color: #f8fafc;
         font-weight: 700;
      }

      .swagger-ui .opblock .opblock-summary-description {
         color: #dbeafe;
      }

      .swagger-ui .opblock.opblock-post {
         background: linear-gradient(180deg, rgba(5, 150, 105, 0.22), rgba(5, 150, 105, 0.14));
      }

      .swagger-ui .opblock.opblock-get {
         background: linear-gradient(180deg, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.12));
      }

      .swagger-ui .opblock.opblock-put {
         background: linear-gradient(180deg, rgba(245, 158, 11, 0.22), rgba(245, 158, 11, 0.12));
      }

      .swagger-ui .opblock.opblock-patch {
         background: linear-gradient(180deg, rgba(168, 85, 247, 0.2), rgba(168, 85, 247, 0.12));
      }

      .swagger-ui .opblock.opblock-delete {
         background: linear-gradient(180deg, rgba(239, 68, 68, 0.22), rgba(239, 68, 68, 0.12));
      }

      .swagger-ui .opblock .opblock-section-header,
      .swagger-ui .model-box,
      .swagger-ui .responses-inner h4,
      .swagger-ui .responses-inner h5 {
         background: rgba(15, 23, 42, 0.72);
         color: #f8fafc;
      }

      .swagger-ui .response-col_status,
      .swagger-ui .response-col_links,
      .swagger-ui .tab li button.tablinks,
      .swagger-ui .parameter__name,
      .swagger-ui .parameter__type,
      .swagger-ui .parameter__deprecated,
      .swagger-ui .prop-type,
      .swagger-ui .prop-format,
      .swagger-ui table thead tr td,
      .swagger-ui table thead tr th {
         color: #e2e8f0;
      }

      .swagger-ui textarea,
      .swagger-ui input[type=text],
      .swagger-ui input[type=password],
      .swagger-ui input[type=search],
      .swagger-ui input[type=email],
      .swagger-ui input[type=file] {
         border-radius: 12px;
         border: 1px solid rgba(148, 163, 184, 0.22);
         background: #0f172a;
         color: #f8fafc;
      }

      .swagger-ui .btn.execute {
         border-radius: 12px;
         border-color: #22c55e;
         background: linear-gradient(135deg, #16a34a, #22c55e);
      }

      .swagger-ui .btn.cancel {
         border-radius: 12px;
      }

      .cf-docs-kicker {
         display: inline-flex;
         align-items: center;
         gap: 10px;
         padding: 8px 14px;
         border: 1px solid rgba(125, 211, 252, 0.2);
         border-radius: 999px;
         background: rgba(14, 165, 233, 0.08);
         color: #bae6fd;
         font-size: 12px;
         font-weight: 700;
         letter-spacing: 0.08em;
         text-transform: uppercase;
      }

      .cf-docs-links {
         display: flex;
         flex-wrap: wrap;
         gap: 10px;
         margin: 18px 0 0;
      }

      .cf-docs-links a {
         display: inline-flex;
         align-items: center;
         gap: 8px;
         padding: 10px 14px;
         border-radius: 999px;
         border: 1px solid rgba(148, 163, 184, 0.18);
         background: rgba(15, 23, 42, 0.72);
         color: #f8fafc;
         font-size: 13px;
         font-weight: 600;
         text-decoration: none;
      }

      .cf-docs-links a:hover {
         border-color: rgba(125, 211, 252, 0.36);
         color: #7dd3fc;
      }

      .cf-tag-icon {
         display: inline-flex;
         align-items: center;
         justify-content: center;
         width: 28px;
         margin-right: 10px;
         font-size: 18px;
      }

      .cf-server-note {
         margin-top: 10px;
         color: #93c5fd;
         font-size: 13px;
      }

      @media (max-width: 900px) {
         .swagger-ui .info {
            padding: 24px 20px;
         }

         .swagger-ui .info .title {
            font-size: 34px;
         }

         .swagger-ui select {
            min-width: 100%;
         }

         .swagger-ui .scheme-container .schemes {
            align-items: stretch;
         }
      }
   `;
}

function createBaseSwaggerUiOptions() {
   return {
      customSiteTitle: "Controle Financeiro | API Docs",
      customfavIcon: "/docs-assets/brand.svg",
      swaggerOptions: {
         docExpansion: "list",
         defaultModelsExpandDepth: -1,
         displayRequestDuration: true,
         filter: true,
         persistAuthorization: true,
      },
   };
}

function getSwaggerUiOptions(assetBaseUrl = "/docs-assets") {
   return {
      ...createBaseSwaggerUiOptions(),
      customCss: getSwaggerCustomCss(assetBaseUrl),
      customJs: [`${assetBaseUrl}/swagger-custom.js`],
   };
}

function getSwaggerUiCssOnlyOptions(assetBaseUrl = "/docs-assets") {
   return {
      ...createBaseSwaggerUiOptions(),
      customCss: getSwaggerCustomCss(assetBaseUrl),
   };
}

module.exports = {
   getSwaggerUiOptions,
   getSwaggerUiCssOnlyOptions,
};
