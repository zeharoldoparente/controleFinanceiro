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
   mesa: string;
   limite: number | null;
   gasto_mes: number;
   pendente_mes: number;
   percentual_usado: number | null;
}

export interface DashboardCategoria {
   categoria: string;
   cor: string | null;
   total: number;
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

// ─── Service ──────────────────────────────────────────────────────────────────

const dashboardService = {
   /**
    * Busca todos os dados do dashboard em uma única requisição.
    * @param mes    Formato "YYYY-MM" (opcional, padrão = mês atual)
    * @param mesaId ID da mesa (opcional — omitir para consolidado)
    */
   getDados: async (mes?: string, mesaId?: number): Promise<DashboardData> => {
      const params = new URLSearchParams();
      if (mes) params.append("mes", mes);
      if (mesaId) params.append("mesa_id", mesaId.toString());

      const query = params.toString();
      const response = await api.get(`/dashboard${query ? `?${query}` : ""}`);
      return response.data as DashboardData;
   },
};

export default dashboardService;
