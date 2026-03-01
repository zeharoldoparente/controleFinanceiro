import api from "./api";

export interface Fatura {
   id: number;
   cartao_id: number;
   mesa_id: number;
   mes_referencia: string; // "2026-03-01"
   data_fechamento: string; // "2026-03-02"
   data_vencimento: string; // "2026-03-09"
   valor_total: number;
   valor_real: number | null;
   data_pagamento: string | null;
   status: "aberta" | "fechada" | "paga";
   ativa: boolean;
   // Joins
   cartao_nome?: string;
   cartao_tipo?: string;
   cartao_cor?: string;
   bandeira_id?: number;
   total_lancamentos?: number;
   // Detalhamento
   lancamentos?: LancamentoFatura[];
}

export interface LancamentoFatura {
   id: number;
   descricao: string;
   valor_provisionado: number;
   valor_real: number | null;
   data_vencimento: string;
   data_pagamento: string | null;
   paga: boolean;
   parcelas: number;
   parcela_atual: number;
   parcela_grupo_id: string;
   categoria_id: number | null;
   categoria_nome: string | null;
   tipo_pagamento_nome: string | null;
}

const faturaService = {
   /**
    * Lista todas as faturas de um cartão específico.
    * Usado na aba Cartões para exibir o histórico de faturas.
    */
   listarPorCartao: async (
      cartaoId: number,
      mesaId: number,
   ): Promise<Fatura[]> => {
      const res = await api.get("/faturas", {
         params: { cartao_id: cartaoId, mesa_id: mesaId },
      });
      return res.data.faturas;
   },

   /**
    * Lista faturas de todos os cartões de uma mesa para um mês específico.
    * Usado na aba Despesas para mostrar a linha unificada de cada cartão.
    */
   listarPorMesa: async (mesaId: number, mes?: string): Promise<Fatura[]> => {
      const params: Record<string, string> = { mesa_id: String(mesaId) };
      if (mes) params.mes = mes;
      const res = await api.get("/faturas/mesa", { params });
      return res.data.faturas;
   },

   /**
    * Busca uma fatura com todos os lançamentos detalhados.
    * Usado na aba Cartões ao clicar em uma fatura para ver o extrato.
    */
   detalhar: async (faturaId: number, mesaId: number): Promise<Fatura> => {
      const res = await api.get(`/faturas/${faturaId}`, {
         params: { mesa_id: mesaId },
      });
      return res.data.fatura;
   },

   /**
    * Paga a fatura inteira de uma vez.
    * Quita automaticamente todas as despesas vinculadas.
    */
   pagar: async (
      faturaId: number,
      mesaId: number,
      valorReal?: number,
      dataPagamento?: string,
   ): Promise<void> => {
      await api.patch(`/faturas/${faturaId}/pagar`, {
         mesa_id: mesaId,
         ...(valorReal !== undefined && { valor_real: valorReal }),
         ...(dataPagamento && { data_pagamento: dataPagamento }),
      });
   },

   /**
    * Desfaz o pagamento de uma fatura.
    */
   desfazerPagamento: async (
      faturaId: number,
      mesaId: number,
   ): Promise<void> => {
      await api.patch(`/faturas/${faturaId}/desfazer-pagamento`, {
         mesa_id: mesaId,
      });
   },
};

export default faturaService;
