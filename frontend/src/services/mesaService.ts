import api from "./api";

export interface Mesa {
   id: number;
   nome: string;
   created_at?: string;
}

const mesaService = {
   listar: async () => {
      const response = await api.get("/mesa");
      return response.data.mesas as Mesa[];
   },
};

export default mesaService;
