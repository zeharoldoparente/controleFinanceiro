import api from "./api";

export interface Receita {
   id: number;
   mesa_id: number;
   mesa_nome?: string;
   descricao: string;
   valor: number;
   data_recebimento: string;
   status: "a_receber" | "recebida";
   valor_real: number | null;
   data_confirmacao: string | null;
   comprovante: string | null;
   parcelas: number;
   parcela_atual: number;
   grupo_parcela: string | null;
   recorrente: boolean;
   origem_recorrente_id: number | null;
   mes_referencia: string | null;
   categoria_id?: number;
   categoria_nome?: string;
   tipo_pagamento_id?: number;
   tipo_pagamento_nome?: string;
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
   parcelas?: number;
}

export interface ConfirmarReceitaOptions {
   valorReal?: number;
   arquivo?: File | null;
   ajusteRestante?: "desconto" | "redistribuir";
}

const receitaService = {
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

   confirmar: async (
      id: number,
      mesaId: number,
      mes: string,
      options?: ConfirmarReceitaOptions,
   ) => {
      const { valorReal, arquivo, ajusteRestante } = options || {};

      const response = arquivo
         ? await (() => {
              const form = new FormData();
              form.append("mesa_id", String(mesaId));
              form.append("mes", mes);
              if (valorReal !== undefined) {
                 form.append("valor_real", String(valorReal));
              }
              if (ajusteRestante) {
                 form.append("ajuste_restante", ajusteRestante);
              }
              form.append("comprovante", arquivo);
              return api.patch(`/receitas/${id}/confirmar`, form);
           })()
         : await api.patch(`/receitas/${id}/confirmar`, {
              mesa_id: mesaId,
              mes,
              valor_real: valorReal,
              ajuste_restante: ajusteRestante,
           });

      return response.data;
   },

   desfazerConfirmacao: async (id: number, mesaId: number) => {
      const response = await api.patch(`/receitas/${id}/desfazer-confirmacao`, {
         mesa_id: mesaId,
      });
      return response.data;
   },

   inativar: async (
      id: number,
      mesaId: number,
      options?: { escopo?: "apenas" | "posteriores"; mes?: string },
   ) => {
      const params = new URLSearchParams();
      params.append("mesa_id", mesaId.toString());
      if (options?.escopo) params.append("escopo", options.escopo);
      if (options?.mes) params.append("mes", options.mes);

      const response = await api.delete(`/receitas/${id}?${params.toString()}`);
      return response.data;
   },

   buscarParcelasGrupo: async (grupoParcela: string, mesaId: number) => {
      const params = new URLSearchParams();
      params.append("mesa_id", mesaId.toString());
      const response = await api.get(
         `/receitas/grupo/${grupoParcela}?${params.toString()}`,
      );
      return response.data.receitas as Receita[];
   },

   getComprovanteUrl: async (id: number, mesaId: number) => {
      const response = await api.get(`/receitas/${id}/comprovante/download`, {
         params: { mesa_id: mesaId },
         responseType: "blob",
      });
      return URL.createObjectURL(response.data);
   },

   reativar: async (id: number, mesaId: number) => {
      const response = await api.patch(
         `/receitas/${id}/reativar?mesa_id=${mesaId}`,
      );
      return response.data;
   },

   listarTodas: async (mes?: string) => {
      const mesaService = (await import("./mesaService")).default;
      const mesas = await mesaService.listar();
      const todasReceitas: Receita[] = [];

      for (const mesa of mesas) {
         const params = new URLSearchParams();
         params.append("mesa_id", mesa.id.toString());
         if (mes) params.append("mes", mes);

         const response = await api.get(`/receitas?${params.toString()}`);
         todasReceitas.push(
            ...response.data.receitas.map((r: Receita) => ({
               ...r,
               mesa_nome: mesa.nome,
            })),
         );
      }

      return todasReceitas.sort(
         (a, b) =>
            new Date(b.data_recebimento).getTime() -
            new Date(a.data_recebimento).getTime(),
      );
   },
};

export default receitaService;
