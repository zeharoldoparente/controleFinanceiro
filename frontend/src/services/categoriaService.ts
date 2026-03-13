import api from "./api";

export interface Categoria {
   id: number;
   nome: string;
   tipo: "receita" | "despesa";
   ativa: boolean;
   created_at?: string;
   user_id?: number | null;
   is_padrao?: boolean;
   pertence_ao_usuario?: boolean;
}

const categoriaService = {
   listar: async (
      tipo?: string,
      incluirInativas: boolean = false,
      mesaId?: number,
   ) => {
      const params = new URLSearchParams();
      if (tipo) params.append("tipo", tipo);
      if (incluirInativas) params.append("incluirInativas", "true");
      if (mesaId) params.append("mesa_id", String(mesaId));

      const response = await api.get(`/categorias?${params.toString()}`);
      return response.data.categorias as Categoria[];
   },
   criar: async (nome: string, tipo: "receita" | "despesa") => {
      const response = await api.post("/categorias", { nome, tipo });
      return response.data;
   },
   atualizar: async (id: number, nome: string, tipo: "receita" | "despesa") => {
      const response = await api.put(`/categorias/${id}`, { nome, tipo });
      return response.data;
   },
   inativar: async (id: number) => {
      const response = await api.delete(`/categorias/${id}`);
      return response.data;
   },
   reativar: async (id: number) => {
      const response = await api.patch(`/categorias/${id}/reativar`);
      return response.data;
   },
};

export default categoriaService;
