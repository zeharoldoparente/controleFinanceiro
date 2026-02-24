import api from "./api";

export interface Bandeira {
   id: number;
   nome: string;
   ativa: boolean;
   created_at?: string;
}

const bandeiraService = {
   listar: async (incluirInativas: boolean = false) => {
      const params = new URLSearchParams();
      if (incluirInativas) params.append("incluirInativas", "true");

      const response = await api.get(`/bandeiras?${params.toString()}`);
      return response.data.bandeiras as Bandeira[];
   },

   criar: async (nome: string) => {
      const response = await api.post("/bandeiras", { nome });
      return response.data;
   },

   atualizar: async (id: number, nome: string) => {
      const response = await api.put(`/bandeiras/${id}`, { nome });
      return response.data;
   },

   inativar: async (id: number) => {
      const response = await api.delete(`/bandeiras/${id}`);
      return response.data;
   },

   reativar: async (id: number) => {
      const response = await api.patch(`/bandeiras/${id}/reativar`);
      return response.data;
   },
};

export default bandeiraService;
