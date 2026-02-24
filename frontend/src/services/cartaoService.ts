import api from "./api";

export interface Cartao {
   id: number;
   user_id: number;
   nome: string;
   tipo: "credito" | "debito";
   bandeira_id: number;
   bandeira_nome?: string;
   limite_real?: number;
   limite_pessoal?: number;
   dia_fechamento?: number;
   dia_vencimento?: number;
   cor?: string;
   ativa: boolean;
   created_at?: string;
   updated_at?: string;
}

export interface CartaoCreate {
   nome: string;
   tipo: "credito" | "debito";
   bandeira_id: number;
   limite_real?: number;
   limite_pessoal?: number;
   dia_fechamento?: number;
   dia_vencimento?: number;
   cor?: string;
}

const cartaoService = {
   listar: async (incluirInativas: boolean = false) => {
      const params = new URLSearchParams();
      if (incluirInativas) params.append("incluirInativas", "true");

      const response = await api.get(`/cartoes?${params.toString()}`);
      return response.data.cartoes as Cartao[];
   },

   buscar: async (id: number) => {
      const response = await api.get(`/cartoes/${id}`);
      return response.data.cartao as Cartao;
   },

   criar: async (cartao: CartaoCreate) => {
      const response = await api.post("/cartoes", cartao);
      return response.data;
   },

   atualizar: async (id: number, cartao: CartaoCreate) => {
      const response = await api.put(`/cartoes/${id}`, cartao);
      return response.data;
   },

   inativar: async (id: number) => {
      const response = await api.delete(`/cartoes/${id}`);
      return response.data;
   },

   reativar: async (id: number) => {
      const response = await api.patch(`/cartoes/${id}/reativar`);
      return response.data;
   },
};

export default cartaoService;
