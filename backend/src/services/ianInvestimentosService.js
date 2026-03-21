const IAnPlano = require("../models/IAnPlano");

function safeNumber(value) {
   const parsed = Number.parseFloat(value ?? 0);
   return Number.isFinite(parsed) ? parsed : 0;
}

function withTimeout(ms = 5000) {
   const controller = new AbortController();
   const timeout = setTimeout(() => controller.abort(), ms);

   return {
      signal: controller.signal,
      clear: () => clearTimeout(timeout),
   };
}

function buildContext(plano) {
   const statusFinanceiro = plano?.diagnostico?.status_financeiro || "apertado";
   const objetivoTipo = plano?.objetivo?.tipo || "controle";
   const prazoMeses = Math.max(1, Number(plano?.objetivo?.prazo_meses || 1));
   const saldoMedio = safeNumber(plano?.diagnostico?.saldo_medio);
   const receitaMedia = safeNumber(plano?.diagnostico?.receita_media);
   const despesaMedia = safeNumber(plano?.diagnostico?.despesa_media);

   const rendaVariavelLiberada =
      (statusFinanceiro === "estavel" || statusFinanceiro === "com folga") &&
      objetivoTipo !== "recuperacao" &&
      prazoMeses >= 12 &&
      saldoMedio >= 0;

   const modoBase =
      statusFinanceiro === "no vermelho" || objetivoTipo === "recuperacao"
         ? "proteger_caixa"
         : statusFinanceiro === "apertado"
           ? "organizar_fluxo"
           : prazoMeses <= 12
             ? "meta_curta"
             : statusFinanceiro === "estavel"
               ? "transicao"
               : "expansao";

   const resumoMomento =
      modoBase === "proteger_caixa"
         ? "Seu momento pede primeiro caixa, liquidez e menos risco."
         : modoBase === "organizar_fluxo"
           ? "Ainda faz sentido priorizar previsibilidade antes de correr mais risco."
           : modoBase === "meta_curta"
             ? "Como o objetivo e de prazo menor, liquidez e disciplina valem mais do que buscar emocao."
             : modoBase === "transicao"
               ? "Voce ja pode estudar renda variavel com pequeno peso e muita cautela."
               : "Seu fluxo atual permite olhar diversificacao com mais liberdade, sem abandonar a reserva.";

   return {
      status_financeiro: statusFinanceiro,
      objetivo_tipo: objetivoTipo,
      prazo_meses: prazoMeses,
      saldo_medio: saldoMedio,
      receita_media: receitaMedia,
      despesa_media: despesaMedia,
      renda_variavel_liberada: rendaVariavelLiberada,
      modo_base: modoBase,
      resumo_momento: resumoMomento,
   };
}

async function fetchSelicContext() {
   const request = withTimeout(5000);

   try {
      const response = await fetch(
         "https://api.bcb.gov.br/dados/serie/bcdata.sgs.1178/dados/ultimos/1?formato=json",
         {
            headers: { Accept: "application/json" },
            signal: request.signal,
         },
      );

      if (!response.ok) {
         throw new Error(`BCB ${response.status}`);
      }

      const data = await response.json();
      const latest = Array.isArray(data) ? data[0] : null;
      const valor = safeNumber(
         String(latest?.valor || "0").replace(",", "."),
      );

      return {
         status: valor > 0 ? "ao_vivo" : "indisponivel",
         selic_anual: valor > 0 ? valor : null,
         atualizado_em: latest?.data || null,
         fonte: "Banco Central do Brasil",
      };
   } catch (_) {
      return {
         status: "indisponivel",
         selic_anual: null,
         atualizado_em: null,
         fonte: "Banco Central do Brasil",
      };
   } finally {
      request.clear();
   }
}

async function fetchMarketSnapshots(symbols) {
   const token = String(process.env.BRAPI_TOKEN || "").trim();
   if (!token || !symbols.length) {
      return {
         status: token ? "sem_ativos" : "sem_token",
         snapshots: {},
         fonte: "brapi.dev",
      };
   }

   const request = withTimeout(7000);

   try {
      const url = new URL(
         `https://brapi.dev/api/quote/${encodeURIComponent(symbols.join(","))}`,
      );
      url.searchParams.set("token", token);

      const response = await fetch(url, {
         headers: { Accept: "application/json" },
         signal: request.signal,
      });

      if (!response.ok) {
         throw new Error(`BRAPI ${response.status}`);
      }

      const data = await response.json();
      const results = Array.isArray(data?.results) ? data.results : [];
      const snapshots = {};

      for (const item of results) {
         const symbol = item?.symbol;
         if (!symbol) continue;

         snapshots[symbol] = {
            codigo: symbol,
            nome: item?.longName || item?.shortName || symbol,
            preco_atual: safeNumber(item?.regularMarketPrice),
            variacao_dia: safeNumber(item?.regularMarketChangePercent),
            moeda: item?.currency || "BRL",
            atualizado_em: item?.regularMarketTime || null,
            fonte: "brapi.dev",
         };
      }

      return {
         status: Object.keys(snapshots).length ? "ao_vivo" : "indisponivel",
         snapshots,
         fonte: "brapi.dev",
      };
   } catch (_) {
      return {
         status: "indisponivel",
         snapshots: {},
         fonte: "brapi.dev",
      };
   } finally {
      request.clear();
   }
}

function buildExamples(items, snapshots) {
   return items.map((item) => {
      if (!item.codigo) {
         return {
            nome: item.nome,
            mercado: item.mercado,
            fonte: item.fonte || "catalogo",
         };
      }

      const snapshot = snapshots[item.codigo];

      return {
         codigo: item.codigo,
         nome: snapshot?.nome || item.nome,
         mercado: item.mercado,
         preco_atual: snapshot?.preco_atual ?? null,
         variacao_dia: snapshot?.variacao_dia ?? null,
         moeda: snapshot?.moeda || "BRL",
         atualizado_em: snapshot?.atualizado_em || null,
         fonte: snapshot ? "brapi.dev" : "catalogo",
      };
   });
}

function createSuggestion(definition, context, external) {
   const availability =
      typeof definition.availability === "function"
         ? definition.availability(context)
         : definition.availability;

   const score = definition.score(context);
   if (score <= 0) return null;

   return {
      id: definition.id,
      titulo: definition.titulo,
      categoria: definition.categoria,
      classe: definition.classe,
      disponibilidade: availability,
      prioridade: score,
      risco: definition.risco,
      liquidez: definition.liquidez,
      horizonte: definition.horizonte(context),
      adequacao: definition.adequacao(context, external),
      motivo_ian: definition.motivo(context, external),
      quando_nao_faz_sentido: definition.quandoNao(context),
      como_usar: definition.comoUsar(context, external),
      observacoes: definition.observacoes(context, external),
      exemplos_pesquisa: buildExamples(definition.examples, external.snapshots),
   };
}

function getSuggestionDefinitions() {
   return [
      {
         id: "tesouro-selic",
         titulo: "Tesouro Selic",
         categoria: "Tesouro Direto",
         classe: "renda_fixa",
         risco: "baixo",
         liquidez: "alta",
         availability: () => "agora",
         score: (context) =>
            context.modo_base === "proteger_caixa"
               ? 100
               : context.modo_base === "organizar_fluxo"
                 ? 95
                 : 82,
         horizonte: () => "curto prazo, reserva e metas com liquidez",
         adequacao: (_, external) =>
            external.selic_anual
               ? `Hoje o contexto de juros segue alto, com Selic anual em torno de ${external.selic_anual.toFixed(2)}%.`
               : "Faz sentido quando voce quer previsibilidade e possibilidade de resgate com menos susto.",
         motivo: (context) =>
            context.status_financeiro === "no vermelho"
               ? "O IAn priorizou caixa e liquidez porque seu momento ainda pede organizacao antes de buscar mais risco."
               : "O IAn colocou esta opcao na frente porque ela conversa bem com metas de curto prazo e com aporte mensal disciplinado.",
         quandoNao: () =>
            "Nao e a melhor aposta para quem busca longo prazo com tolerancia alta a oscilacao e ja tem reserva montada.",
         comoUsar: (context) =>
            `Use como primeira camada do objetivo e tente concentrar o aporte mensal sugerido pelo IAn logo apos a entrada principal de renda${context.receita_media > 0 ? "." : ", sem depender do fim do mes."}`,
         observacoes: () => [
            "Sugestao educativa, nao recomendacao individual.",
            "Pesquise taxas, tributacao e o vencimento antes de investir.",
         ],
         examples: [
            {
               nome: "Tesouro Selic 2029",
               mercado: "Tesouro Direto",
               fonte: "catalogo",
            },
         ],
      },
      {
         id: "tesouro-ipca",
         titulo: "Tesouro IPCA+",
         categoria: "Tesouro Direto",
         classe: "renda_fixa",
         risco: "medio",
         liquidez: "media",
         availability: (context) =>
            context.prazo_meses >= 24 &&
            context.status_financeiro !== "no vermelho"
               ? "agora"
               : "condicional",
         score: (context) =>
            context.prazo_meses >= 24
               ? context.status_financeiro === "com folga"
                  ? 78
                  : context.status_financeiro === "estavel"
                    ? 66
                    : 40
               : 22,
         horizonte: () => "medio e longo prazo, com protecao contra inflacao",
         adequacao: (context) =>
            context.prazo_meses >= 24
               ? "Pode combinar com objetivos mais longos quando voce aceita carregar ate o vencimento."
               : "So vale pesquisar melhor se o objetivo conseguir esperar mais tempo sem saques no caminho.",
         motivo: (context) =>
            context.prazo_meses >= 24
               ? "O prazo da sua meta permite olhar algo que proteja melhor o poder de compra no tempo."
               : "O IAn deixou esta opcao como secundaria porque seu prazo atual ainda esta curto para esse tipo de titulo.",
         quandoNao: () =>
            "Nao faz sentido se existe chance real de resgate antes do vencimento ou se a meta ainda esta apertando seu fluxo.",
         comoUsar: () =>
            "Pense nele para a parte mais paciente da meta, nao para o dinheiro que pode precisar sair logo.",
         observacoes: () => [
            "O preco oscila antes do vencimento por marcacao a mercado.",
            "Sugestao educativa, nao substitui sua propria pesquisa.",
         ],
         examples: [
            {
               nome: "Tesouro IPCA+ 2035",
               mercado: "Tesouro Direto",
               fonte: "catalogo",
            },
         ],
      },
      {
         id: "fiis",
         titulo: "FIIs para renda e diversificacao",
         categoria: "Fundos Imobiliarios",
         classe: "renda_variavel",
         risco: "medio",
         liquidez: "media",
         availability: (context) =>
            context.renda_variavel_liberada ? "agora" : "condicional",
         score: (context) =>
            context.renda_variavel_liberada
               ? 72
               : context.status_financeiro === "estavel" &&
                   context.prazo_meses >= 12
                 ? 48
                 : 16,
         horizonte: () => "medio e longo prazo, com oscilacao no caminho",
         adequacao: (context) =>
            context.renda_variavel_liberada
               ? "Pode entrar em pequena proporcao para quem quer estudar renda mensal potencial sem abandonar a reserva."
               : "O IAn deixou os FIIs como observacao de pesquisa, nao como foco imediato.",
         motivo: (context) =>
            context.renda_variavel_liberada
               ? "Seu fluxo ja permite olhar um pouco alem do caixa imediato, desde que a exposicao seja pequena."
               : "No seu momento atual, correr para FII antes de organizar o basico tende a aumentar ansiedade e nao ajudar a meta.",
         quandoNao: () =>
            "Nao faz sentido como primeira camada para sair do vermelho, nem para objetivo curto que nao tolera oscilacao.",
         comoUsar: () =>
            "Se decidir estudar, trate como parte menor da carteira e pesquise vacancia, gestao, tipo de renda e historico.",
         observacoes: () => [
            "Rendimento passado nao garante renda futura.",
            "Sugestao educativa, com necessidade de pesquisa propria.",
         ],
         examples: [
            { codigo: "HGLG11", nome: "CSHG Logistica", mercado: "B3" },
            { codigo: "XPLG11", nome: "XP Log", mercado: "B3" },
            { codigo: "MXRF11", nome: "Maxi Renda", mercado: "B3" },
         ],
      },
      {
         id: "acoes",
         titulo: "Acoes para pesquisa gradual",
         categoria: "Acoes",
         classe: "renda_variavel",
         risco: "alto",
         liquidez: "alta",
         availability: (context) =>
            context.status_financeiro === "com folga" &&
            context.prazo_meses >= 24 &&
            context.objetivo_tipo !== "recuperacao"
               ? "agora"
               : "condicional",
         score: (context) =>
            context.status_financeiro === "com folga" &&
            context.prazo_meses >= 24
               ? 62
               : context.renda_variavel_liberada
                 ? 38
                 : 10,
         horizonte: () => "longo prazo, com oscilacao forte",
         adequacao: () =>
            "Entra mais como trilha de estudo e diversificacao futura do que como instrumento para salvar o mes.",
         motivo: (context) =>
            context.status_financeiro === "com folga"
               ? "O IAn entende que voce pode estudar bolsa com calma porque seu caixa ja nao depende tanto de cada oscilacao."
               : "No seu contexto atual, comprar acao para tentar acelerar a meta aumenta risco de frustracao e desvio do plano.",
         quandoNao: () =>
            "Nao faz sentido quando o dinheiro ainda tem funcao de curto prazo, reserva ou reorganizacao financeira.",
         comoUsar: () =>
            "Comece pesquisando empresas consolidadas e evitando concentracao. Se entrar, faca isso em valor pequeno e recorrente.",
         observacoes: () => [
            "Oscilacao diaria faz parte do jogo.",
            "Sugestao educativa, nao e chamada para compra.",
         ],
         examples: [
            { codigo: "ITUB4", nome: "Itau Unibanco PN", mercado: "B3" },
            { codigo: "VALE3", nome: "Vale ON", mercado: "B3" },
            { codigo: "WEGE3", nome: "WEG ON", mercado: "B3" },
         ],
      },
   ];
}

async function getBasePlan(mesaId, planoInput) {
   if (planoInput?.objetivo?.descricao && planoInput?.diagnostico) {
      return planoInput;
   }

   const planoSalvo = await IAnPlano.findActiveByMesa(mesaId);
   return planoSalvo?.plano || null;
}

async function getSugestoesInvestimento({ mesaId, planoInput }) {
   const plano = await getBasePlan(mesaId, planoInput);
   if (!plano) {
      return null;
   }

   const context = buildContext(plano);
   const definitions = getSuggestionDefinitions();
   const marketSymbols = definitions.flatMap((definition) =>
      definition.examples
         .map((item) => item.codigo)
         .filter((codigo) => typeof codigo === "string" && codigo.length > 0),
   );

   const [macro, market] = await Promise.all([
      fetchSelicContext(),
      fetchMarketSnapshots(Array.from(new Set(marketSymbols))),
   ]);

   const external = {
      ...macro,
      snapshots: market.snapshots,
      mercado_status: market.status,
      mercado_fonte: market.fonte,
   };

   const sugestoes = definitions
      .map((definition) => createSuggestion(definition, context, external))
      .filter(Boolean)
      .sort((a, b) => {
         if (a.disponibilidade !== b.disponibilidade) {
            return a.disponibilidade === "agora" ? -1 : 1;
         }

         return b.prioridade - a.prioridade;
      });

   const avisoGeral =
      context.renda_variavel_liberada
         ? "O IAn liberou opcoes de renda variavel, mas ainda mantendo caixa e horizonte como filtros principais."
         : "O IAn manteve o foco em caixa e previsibilidade. Renda variavel aparece so como trilha de pesquisa para depois.";

   const recomendacaoBase =
      context.modo_base === "proteger_caixa"
         ? "Primeiro estabilize o fluxo e monte folego."
         : context.modo_base === "organizar_fluxo"
           ? "Primeiro traga previsibilidade para o mes."
           : context.modo_base === "meta_curta"
             ? "Priorize liquidez e constancia."
             : "Diversifique com prudencia, sem perder a reserva.";

   return {
      contexto: {
         ...context,
         recomendacao_base: recomendacaoBase,
         fontes: {
            juros: {
               nome: "Banco Central do Brasil",
               status: macro.status,
            },
            mercado: {
               nome: "brapi.dev",
               status: market.status,
            },
         },
      },
      aviso_geral: avisoGeral,
      disclaimer:
         "As sugestoes do IAn sao educativas e nao substituem sua propria pesquisa. Antes de investir, confirme risco, liquidez, custos e adequacao ao seu perfil.",
      sugestoes,
   };
}

module.exports = {
   getSugestoesInvestimento,
};
