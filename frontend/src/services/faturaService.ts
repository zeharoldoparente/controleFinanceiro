import api from "./api";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface Fatura {
   id: number;
   cartao_id: number;
   mesa_id: number;
   mes_referencia: string;
   data_fechamento: string;
   data_vencimento: string;
   valor_total: number | string;
   status: "aberta" | "fechada" | "paga";
   valor_real: number | string | null;
   data_pagamento: string | null;
   ativa: boolean | number;
   created_at: string;
   // Joins
   cartao_nome?: string;
   cartao_cor?: string;
   cartao_tipo?: string;
   bandeira_id?: number;
   total_lancamentos?: number;
   // Detalhes (quando busca com lançamentos)
   lancamentos?: FaturaLancamento[];
}

export interface FaturaLancamento {
   id: number;
   descricao: string;
   tipo: string;
   valor_provisionado: number | string;
   valor_real: number | string | null;
   data_vencimento: string;
   data_pagamento: string | null;
   paga: boolean | number;
   parcelas: number;
   parcela_atual: number;
   categoria_nome: string | null;
   tipo_pagamento_nome: string | null;
}

// ─── Service ──────────────────────────────────────────────────────────────────

const faturaService = {
   /** Lista todas as faturas de um cartão (para aba Cartões) */
   async listarPorCartao(cartaoId: number, mesaId: number): Promise<Fatura[]> {
      const res = await api.get("/faturas", {
         params: { cartao_id: cartaoId, mesa_id: mesaId },
      });
      return res.data.faturas;
   },

   /** Lista faturas de uma mesa para um mês (para aba Despesas) */
   async listarPorMesa(mesaId: number, mes?: string): Promise<Fatura[]> {
      const params: Record<string, string> = { mesa_id: String(mesaId) };
      if (mes) params.mes = mes;
      const res = await api.get("/faturas/mesa", { params });
      return res.data.faturas;
   },

   /** Detalha uma fatura com todos os lançamentos */
   async detalhar(faturaId: number, mesaId: number): Promise<Fatura> {
      const res = await api.get(`/faturas/${faturaId}`, {
         params: { mesa_id: mesaId },
      });
      return res.data.fatura;
   },

   /** Paga uma fatura inteira (quita todas as despesas vinculadas) */
   async pagar(
      faturaId: number,
      mesaId: number,
      valorReal?: number,
      dataPagamento?: string,
   ): Promise<void> {
      await api.patch(`/faturas/${faturaId}/pagar`, {
         mesa_id: mesaId,
         ...(valorReal !== undefined && { valor_real: valorReal }),
         ...(dataPagamento && { data_pagamento: dataPagamento }),
      });
   },

   /** Desfaz o pagamento de uma fatura */
   async desfazerPagamento(faturaId: number, mesaId: number): Promise<void> {
      await api.patch(`/faturas/${faturaId}/desfazer-pagamento`, {
         mesa_id: mesaId,
      });
   },
};

export default faturaService;
