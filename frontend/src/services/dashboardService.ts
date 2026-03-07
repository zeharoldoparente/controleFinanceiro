import api from "./api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DashboardMesa {
   id: number;
   nome: string;
}

export interface DashboardResumo {
   receitas: {
      confirmado: number;
      provisionado: number;
      qtd_confirmadas: number;
   };
   despesas: {
      pago: number;
      provisionado: number;
      pendente: number;
      qtd_pagas: number;
      qtd_pendentes: number;
   };
   saldo: {
      real: number;
      previsto: number;
   };
}

export interface DashboardAlerta {
   id: number;
   descricao: string;
   valor: number;
   data_vencimento: string;
   mesa_nome?: string;
   categoria_nome?: string;
}

export interface DashboardCartaoCritico {
   id: number;
   nome: string;
   limite: number;
   gasto: number;
   percentual: number;
}

export interface DashboardCartao {
   id: number;
   nome: string;
   tipo: "credito" | "debito";
   cor: string | null;
   bandeira: string | null;
   limite: number | null;
   gasto_mes: number;
   pendente_mes: number;
   percentual_usado: number | null;
}

export interface DashboardCategoria {
   categoria: string;
   categoria_id: number | null;
   total: number;
}

/** Item individual dentro de uma categoria — usado no dropdown do dashboard */
export interface DetalheCategoria {
   id: number;
   descricao: string;
   valor: number;
   data_vencimento: string;
   parcela_atual: number;
   parcelas: number;
   forma_pagamento: string;
   e_cartao: boolean;
   cartao_cor: string | null;
}

export interface DashboardEvolucao {
   mes: string;
   label: string;
   receitas: number;
   despesas: number;
   saldo: number;
}

export interface DashboardFluxo {
   dia: number;
   label: string;
   receitas: number;
   despesas: number;
   saldo_acumulado: number;
}

export interface DashboardMovimentacao {
   id: number;
   tipo: "receita" | "despesa";
   descricao: string;
   data: string;
   valor: number;
   status: string;
   categoria_nome: string | null;
   mesa_nome: string;
}

export interface DashboardData {
   mes: string;
   mesas: DashboardMesa[];
   resumo: DashboardResumo;
   alertas: {
      despesas_vencidas: DashboardAlerta[];
      despesas_hoje: DashboardAlerta[];
      cartoes_criticos: DashboardCartaoCritico[];
   };
   cartoes: DashboardCartao[];
   gastos_por_categoria: DashboardCategoria[];
   evolucao_mensal: DashboardEvolucao[];
   fluxo_caixa: DashboardFluxo[];
   ultimas_movimentacoes: DashboardMovimentacao[];
   vazio?: boolean;
}

// ─── Default / Normalizer ─────────────────────────────────────────────────────

const dashboardDataBase: DashboardData = {
   mes: "",
   mesas: [],
   resumo: {
      receitas: { confirmado: 0, provisionado: 0, qtd_confirmadas: 0 },
      despesas: {
         pago: 0,
         provisionado: 0,
         pendente: 0,
         qtd_pagas: 0,
         qtd_pendentes: 0,
      },
      saldo: { real: 0, previsto: 0 },
   },
   alertas: { despesas_vencidas: [], despesas_hoje: [], cartoes_criticos: [] },
   cartoes: [],
   gastos_por_categoria: [],
   evolucao_mensal: [],
   fluxo_caixa: [],
   ultimas_movimentacoes: [],
   vazio: false,
};

function normalizarDashboardData(
   data: Partial<DashboardData> | null | undefined,
): DashboardData {
   return {
      ...dashboardDataBase,
      ...data,
      resumo: {
         ...dashboardDataBase.resumo,
         ...data?.resumo,
         receitas: {
            ...dashboardDataBase.resumo.receitas,
            ...data?.resumo?.receitas,
         },
         despesas: {
            ...dashboardDataBase.resumo.despesas,
            ...data?.resumo?.despesas,
         },
         saldo: { ...dashboardDataBase.resumo.saldo, ...data?.resumo?.saldo },
      },
      alertas: { ...dashboardDataBase.alertas, ...data?.alertas },
   };
}

// ─── Service ──────────────────────────────────────────────────────────────────

const dashboardService = {
   /**
    * Busca todos os dados do dashboard em uma única requisição.
    */
   getDados: async (mes?: string, mesaId?: number): Promise<DashboardData> => {
      const params = new URLSearchParams();
      if (mes) params.append("mes", mes);
      if (mesaId) params.append("mesa_id", mesaId.toString());
      const query = params.toString();
      const response = await api.get(`/dashboard${query ? `?${query}` : ""}`);
      return normalizarDashboardData(response.data);
   },

   /**
    * Busca os lançamentos individuais de uma categoria para o dropdown do dashboard.
    * @param categoriaId  null = "Sem categoria"
    */
   getDetalhesCategoria: async (
      categoriaId: number | null,
      mes: string,
      mesaId?: number,
   ): Promise<DetalheCategoria[]> => {
      const params = new URLSearchParams();
      params.append("mes", mes);
      if (categoriaId !== null)
         params.append("categoria_id", String(categoriaId));
      if (mesaId) params.append("mesa_id", String(mesaId));
      const response = await api.get(
         `/dashboard/detalhes-categoria?${params.toString()}`,
      );
      return response.data.itens ?? [];
   },
};

export default dashboardService;
