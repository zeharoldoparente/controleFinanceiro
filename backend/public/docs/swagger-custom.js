(function () {
   const tagIcons = {
      autenticacao: "\uD83D\uDD10",
      bandeiras: "\uD83C\uDFF7\uFE0F",
      cartoes: "\uD83D\uDCB3",
      categorias: "\uD83D\uDDD2\uFE0F",
      conta: "\uD83D\uDC64",
      convites: "\u2709\uFE0F",
      dashboard: "\uD83D\uDCCA",
      despesas: "\uD83D\uDCB8",
      faturas: "\uD83E\uDDFE",
      "formas de pagamento": "\uD83D\uDCB5",
      ian: "\uD83E\uDDE0",
      mesas: "\uD83C\uDFE0",
      notificacoes: "\uD83D\uDD14",
      receitas: "\uD83D\uDCB0",
      "tipos de pagamento": "\uD83E\uDDE9",
   };

   function normalizeText(value) {
      return String(value || "")
         .normalize("NFD")
         .replace(/[\u0300-\u036f]/g, "")
         .toLowerCase()
         .trim();
   }

   function ensureKicker(info) {
      if (info.querySelector(".cf-docs-kicker")) return;

      const kicker = document.createElement("div");
      kicker.className = "cf-docs-kicker";
      kicker.textContent = "Swagger UI \u2022 contrato vivo da API";
      info.insertBefore(kicker, info.firstChild);
   }

   function ensureLinks(info) {
      if (info.querySelector(".cf-docs-links")) return;

      const links = document.createElement("div");
      links.className = "cf-docs-links";

      const docsJson = document.createElement("a");
      docsJson.href = "/api-docs.json";
      docsJson.target = "_blank";
      docsJson.rel = "noreferrer";
      docsJson.textContent = "OpenAPI JSON";

      const apiRoot = document.createElement("a");
      apiRoot.href = "/";
      apiRoot.target = "_blank";
      apiRoot.rel = "noreferrer";
      apiRoot.textContent = "Raiz da API";

      links.appendChild(docsJson);
      links.appendChild(apiRoot);
      info.appendChild(links);
   }

   function decorateTags() {
      document.querySelectorAll(".opblock-tag").forEach((button) => {
         if (button.dataset.iconReady === "true") return;

         const text = normalizeText(button.textContent);
         const matchedTag = Object.keys(tagIcons).find((tag) =>
            text.startsWith(tag),
         );
         if (!matchedTag) return;

         const icon = document.createElement("span");
         icon.className = "cf-tag-icon";
         icon.textContent = tagIcons[matchedTag];
         button.insertBefore(icon, button.firstChild);
         button.dataset.iconReady = "true";
      });
   }

   function decorateServerNote() {
      const schemes = document.querySelector(
         ".swagger-ui .scheme-container .schemes",
      );
      const select = schemes && schemes.querySelector("select");
      if (!schemes || !select) return;

      let note = schemes.querySelector(".cf-server-note");
      if (!note) {
         note = document.createElement("div");
         note.className = "cf-server-note";
         schemes.appendChild(note);
      }

      const selectedOption = select.options[select.selectedIndex];
      const value = selectedOption ? selectedOption.value : select.value;
      note.textContent = `Base atual para testes: ${value}`;
   }

   function hydrateDocsUi() {
      const info = document.querySelector(".swagger-ui .info");
      if (info) {
         ensureKicker(info);
         ensureLinks(info);
      }

      decorateTags();
      decorateServerNote();
   }

   document.addEventListener("DOMContentLoaded", hydrateDocsUi);

   new MutationObserver(hydrateDocsUi).observe(document.documentElement, {
      childList: true,
      subtree: true,
   });
})();
