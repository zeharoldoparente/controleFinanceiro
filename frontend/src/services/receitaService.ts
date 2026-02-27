import api from "./api";

export interface Receita {
   id: number;
   mesa_id: number;
   mesa_nome?: string;
   descricao: string;
   valor: number;
   data_recebimento: string;
   categoria_id?: number;
   categoria_nome?: string;
   tipo_pagamento_id?: number;
   tipo_pagamento_nome?: string;
   recorrente: boolean;
   ativa: boolean;
   created_at?: string;
}

export interface ReceitaCreate {
   mesa_id: number;
   descricao: string;
   valor: number;
   data_recebimento: string;
   categoria_id?: number;
   tipo_pagamento_id?: number;
   recorrente?: boolean;
}

const receitaService = {
   /**
    * Lista receitas de uma mesa filtrando por mês.
    * Recorrentes aparecem automaticamente a partir do mês de criação.
    * @param mesaId ID da mesa
    * @param mes formato "YYYY-MM" (ex: "2026-03"). Se omitido, usa o mês atual.
    */
   listar: async (mesaId: number, mes?: string) => {
      const params = new URLSearchParams();
      params.append("mesa_id", mesaId.toString());
      if (mes) params.append("mes", mes);

      const response = await api.get(`/receitas?${params.toString()}`);
      return response.data.receitas as Receita[];
   },

   buscar: async (id: number, mesaId: number) => {
      const response = await api.get(`/receitas/${id}?mesa_id=${mesaId}`);
      return response.data.receita as Receita;
   },

   criar: async (receita: ReceitaCreate) => {
      const response = await api.post("/receitas", receita);
      return response.data;
   },

   atualizar: async (id: number, receita: ReceitaCreate) => {
      const response = await api.put(`/receitas/${id}`, receita);
      return response.data;
   },

   inativar: async (id: number, mesaId: number) => {
      const response = await api.delete(`/receitas/${id}?mesa_id=${mesaId}`);
      return response.data;
   },

   reativar: async (id: number, mesaId: number) => {
      const response = await api.patch(
         `/receitas/${id}/reativar?mesa_id=${mesaId}`,
      );
      return response.data;
   },

   /**
    * Lista receitas de todas as mesas do usuário, filtrando por mês.
    */
   listarTodas: async (mes?: string) => {
      const mesaService = (await import("./mesaService")).default;
      const mesas = await mesaService.listar();
      const todasReceitas: Receita[] = [];

      for (const mesa of mesas) {
         const params = new URLSearchParams();
         params.append("mesa_id", mesa.id.toString());
         if (mes) params.append("mes", mes);

         const response = await api.get(`/receitas?${params.toString()}`);

         const receitasComMesa = response.data.receitas.map((r: Receita) => ({
            ...r,
            mesa_nome: mesa.nome,
         }));

         todasReceitas.push(...receitasComMesa);
      }

      return todasReceitas.sort(
         (a, b) =>
            new Date(b.data_recebimento).getTime() -
            new Date(a.data_recebimento).getTime(),
      );
   },
};

export default receitaService;
