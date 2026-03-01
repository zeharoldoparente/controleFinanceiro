import api from "./api";

export type TipoDespesa = "variavel" | "fixa" | "assinatura";

export interface Despesa {
   id: number;
   mesa_id: number;
   descricao: string;
   tipo: TipoDespesa;
   valor_provisionado: number | string;
   valor_real: number | string | null;
   data_vencimento: string;
   data_pagamento: string | null;
   data_cancelamento: string | null;
   paga: boolean | number;
   recorrente: boolean | number;
   parcelas: number;
   parcela_atual: number;
   parcela_grupo_id: string;
   fatura_id: number | null; // NOVO: se preenchido, é despesa de cartão de crédito
   categoria_id: number | null;
   categoria_nome: string | null;
   tipo_pagamento_id: number | null;
   tipo_pagamento_nome: string | null;
   cartao_id: number | null;
   cartao_nome: string | null;
   comprovante: string | null;
   ativa: boolean | number;
}

export interface DespesaCreate {
   mesa_id: number;
   descricao: string;
   tipo: TipoDespesa;
   valor_total: number; // NOVO: valor total (sistema divide por parcelas)
   data_vencimento: string;
   categoria_id?: number;
   tipo_pagamento_id?: number;
   cartao_id?: number;
   recorrente?: boolean;
   parcelas?: number;
}

const despesaService = {
   async listar(mesaId: number, mes?: string): Promise<Despesa[]> {
      const params: Record<string, string> = { mesa_id: String(mesaId) };
      if (mes) params.mes = mes;
      const res = await api.get("/despesas", { params });
      return res.data.despesas;
   },

   async buscar(id: number, mesaId: number): Promise<Despesa> {
      const res = await api.get(`/despesas/${id}`, {
         params: { mesa_id: mesaId },
      });
      return res.data.despesa;
   },

   async criar(
      data: DespesaCreate,
   ): Promise<{ ids: number[]; despesaId: number }> {
      const res = await api.post("/despesas", data);
      return res.data;
   },

   async atualizar(id: number, data: Partial<DespesaCreate>): Promise<void> {
      await api.put(`/despesas/${id}`, data);
   },

   async marcarComoPaga(
      id: number,
      mesaId: number,
      valorReal?: number,
      arquivo?: File | null,
   ): Promise<void> {
      const d = new Date();
      const hoje = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      if (arquivo) {
         const form = new FormData();
         form.append("mesa_id", String(mesaId));
         form.append("data_pagamento", hoje);
         if (valorReal !== undefined)
            form.append("valor_real", String(valorReal));
         form.append("comprovante", arquivo);
         await api.patch(`/despesas/${id}/pagar`, form, {
            headers: { "Content-Type": "multipart/form-data" },
         });
      } else {
         await api.patch(`/despesas/${id}/pagar`, {
            mesa_id: mesaId,
            data_pagamento: hoje,
            ...(valorReal !== undefined && { valor_real: valorReal }),
         });
      }
   },

   async desmarcarPagamento(id: number, mesaId: number): Promise<void> {
      await api.patch(`/despesas/${id}/desfazer-pagamento`, {
         mesa_id: mesaId,
      });
   },

   async getComprovanteUrl(id: number, mesaId: number): Promise<string> {
      const res = await api.get(`/despesas/${id}/comprovante/download`, {
         params: { mesa_id: mesaId },
         responseType: "blob",
      });
      return URL.createObjectURL(res.data);
   },

   async cancelarRecorrencia(
      id: number,
      mesaId: number,
      mes: string,
   ): Promise<void> {
      await api.patch(`/despesas/${id}/cancelar-recorrencia`, {
         mesa_id: mesaId,
         mes,
      });
   },

   async removerCancelamento(id: number, mesaId: number): Promise<void> {
      await api.patch(`/despesas/${id}/remover-cancelamento`, {
         mesa_id: mesaId,
      });
   },

   async inativar(id: number, mesaId: number): Promise<void> {
      await api.delete(`/despesas/${id}`, { params: { mesa_id: mesaId } });
   },

   async buscarParcelas(
      parcelaGrupoId: string,
      mesaId: number,
   ): Promise<Despesa[]> {
      const res = await api.get(`/despesas/grupo/${parcelaGrupoId}`, {
         params: { mesa_id: mesaId },
      });
      return res.data.despesas;
   },

   /** Lista todas as mesas (para relatórios) — exclui despesas de cartão (tratadas pelas faturas) */
   listarTodas: async (mes?: string): Promise<Despesa[]> => {
      const mesaService = (await import("./mesaService")).default;
      const mesas = await mesaService.listar();
      const todasDespesas: Despesa[] = [];
      for (const mesa of mesas) {
         const params: Record<string, string> = { mesa_id: String(mesa.id) };
         if (mes) params.mes = mes;
         const res = await api.get("/despesas", { params });
         todasDespesas.push(...res.data.despesas);
      }
      return todasDespesas.sort(
         (a, b) =>
            new Date(a.data_vencimento).getTime() -
            new Date(b.data_vencimento).getTime(),
      );
   },
};

export default despesaService;
