import api from "./api";

export interface Despesa {
   id: number;
   mesa_id: number;
   mesa_nome?: string;
   descricao: string;
   valor_provisionado: number;
   valor_real?: number;
   data_vencimento: string;
   data_pagamento?: string;
   categoria_id?: number;
   categoria_nome?: string;
   tipo_pagamento_id?: number;
   tipo_pagamento_nome?: string;
   cartao_id?: number;
   cartao_nome?: string;
   paga: boolean;
   recorrente: boolean;
   parcelas: number;
   parcela_atual: number;
   parcela_grupo_id: string;
   comprovante?: string;
   ativa: boolean;
   created_at?: string;
}

export interface DespesaCreate {
   mesa_id: number;
   descricao: string;
   valor_provisionado: number;
   data_vencimento: string;
   categoria_id?: number;
   tipo_pagamento_id?: number;
   cartao_id?: number;
   recorrente?: boolean;
   parcelas?: number;
}

export interface MarcarPagaData {
   mesa_id: number;
   valor_real?: number;
   data_pagamento: string;
   comprovante?: File;
}

const despesaService = {
   listar: async (mesaId: number, incluirInativas: boolean = false) => {
      const params = new URLSearchParams();
      params.append("mesa_id", mesaId.toString());
      if (incluirInativas) params.append("incluirInativas", "true");

      const response = await api.get(`/despesas?${params.toString()}`);
      return response.data.despesas as Despesa[];
   },

   buscar: async (id: number, mesaId: number) => {
      const response = await api.get(`/despesas/${id}?mesa_id=${mesaId}`);
      return response.data.despesa as Despesa;
   },

   buscarPorGrupo: async (parcelaGrupoId: string, mesaId: number) => {
      const response = await api.get(
         `/despesas/grupo/${parcelaGrupoId}?mesa_id=${mesaId}`,
      );
      return response.data.despesas as Despesa[];
   },

   criar: async (despesa: DespesaCreate) => {
      const response = await api.post("/despesas", despesa);
      return response.data;
   },

   atualizar: async (id: number, despesa: Omit<DespesaCreate, "parcelas">) => {
      const response = await api.put(`/despesas/${id}`, despesa);
      return response.data;
   },

   marcarComoPaga: async (id: number, data: MarcarPagaData) => {
      const formData = new FormData();
      formData.append("mesa_id", data.mesa_id.toString());
      formData.append("data_pagamento", data.data_pagamento);
      if (data.valor_real)
         formData.append("valor_real", data.valor_real.toString());
      if (data.comprovante) formData.append("comprovante", data.comprovante);

      const response = await api.patch(`/despesas/${id}/pagar`, formData, {
         headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
   },

   inativar: async (id: number, mesaId: number) => {
      const response = await api.delete(`/despesas/${id}?mesa_id=${mesaId}`);
      return response.data;
   },

   inativarGrupo: async (parcelaGrupoId: string, mesaId: number) => {
      const response = await api.patch(
         `/despesas/grupo/${parcelaGrupoId}/inativar?mesa_id=${mesaId}`,
      );
      return response.data;
   },

   reativar: async (id: number, mesaId: number) => {
      const response = await api.patch(
         `/despesas/${id}/reativar?mesa_id=${mesaId}`,
      );
      return response.data;
   },

   uploadComprovante: async (id: number, mesaId: number, arquivo: File) => {
      const formData = new FormData();
      formData.append("mesa_id", mesaId.toString());
      formData.append("comprovante", arquivo);

      const response = await api.post(`/despesas/${id}/comprovante`, formData, {
         headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
   },

   baixarComprovante: async (id: number, mesaId: number) => {
      const response = await api.get(
         `/despesas/${id}/comprovante/download?mesa_id=${mesaId}`,
         {
            responseType: "blob",
         },
      );
      return response.data;
   },

   excluirComprovante: async (id: number, mesaId: number) => {
      const response = await api.delete(
         `/despesas/${id}/comprovante?mesa_id=${mesaId}`,
      );
      return response.data;
   },

   listarTodas: async (incluirInativas: boolean = false) => {
      // Importar mesaService no topo do arquivo
      const mesaService = (await import("./mesaService")).default;

      // Primeiro busca todas as mesas do usuário
      const mesas = await mesaService.listar();

      // Depois busca despesas de cada mesa
      const todasDespesas: Despesa[] = [];

      for (const mesa of mesas) {
         const params = new URLSearchParams();
         params.append("mesa_id", mesa.id.toString());
         if (incluirInativas) params.append("incluirInativas", "true");

         const response = await api.get(`/despesas?${params.toString()}`);

         // Adiciona o nome da mesa em cada despesa
         const despesasComMesa = response.data.despesas.map((d: Despesa) => ({
            ...d,
            mesa_nome: mesa.nome,
         }));

         todasDespesas.push(...despesasComMesa);
      }

      // Ordena por data de vencimento (mais recente primeiro)
      return todasDespesas.sort(
         (a, b) =>
            new Date(b.data_vencimento).getTime() -
            new Date(a.data_vencimento).getTime(),
      );
   },
};

export default despesaService;
