import api from "./api";

export interface Mesa {
   id: number;
   nome: string;
   descricao?: string;
   created_at?: string;
}

export interface MesaCreate {
   nome: string;
   descricao?: string;
}

const mesaService = {
   listar: async () => {
      const response = await api.get("/mesa");
      return response.data.mesas as Mesa[];
   },

   buscar: async (id: number) => {
      const response = await api.get(`/mesa/${id}`);
      return response.data.mesa as Mesa;
   },

   criar: async (data: MesaCreate) => {
      const response = await api.post("/mesa", data);
      return response.data;
   },

   atualizar: async (id: number, data: MesaCreate) => {
      const response = await api.put(`/mesa/${id}`, data);
      return response.data;
   },

   excluir: async (id: number) => {
      const response = await api.delete(`/mesa/${id}`);
      return response.data;
   },
};

export default mesaService;
