import api from "./api";

export interface TipoPagamento {
   id: number;
   nome: string;
   ativa: boolean;
   created_at?: string;
}

const tipoPagamentoService = {
   listar: async (incluirInativas: boolean = false) => {
      const params = new URLSearchParams();
      if (incluirInativas) params.append("incluirInativas", "true");

      const response = await api.get(`/tipos-pagamento?${params.toString()}`);
      return response.data.tiposPagamento as TipoPagamento[];
   },

   criar: async (nome: string) => {
      const response = await api.post("/tipos-pagamento", { nome });
      return response.data;
   },

   atualizar: async (id: number, nome: string) => {
      const response = await api.put(`/tipos-pagamento/${id}`, { nome });
      return response.data;
   },

   inativar: async (id: number) => {
      const response = await api.delete(`/tipos-pagamento/${id}`);
      return response.data;
   },

   reativar: async (id: number) => {
      const response = await api.patch(`/tipos-pagamento/${id}/reativar`);
      return response.data;
   },
};

export default tipoPagamentoService;
