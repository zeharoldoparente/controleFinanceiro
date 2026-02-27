import api from "./api";

export interface Convite {
   id: number;
   mesa_id: number;
   mesa_nome: string;
   email_convidado: string;
   convidado_por_nome: string;
   status: "pendente" | "aceito" | "recusado" | "cancelado";
   token: string;
   created_at: string;
   expira_em: string;
}

export interface MesaMembros {
   dono: {
      id: number;
      nome: string;
      email: string;
      papel: "dono";
   };
   membros: {
      id: number;
      nome: string;
      email: string;
      papel: "convidado";
      membro_desde: string;
   }[];
   convites_pendentes: {
      id: number;
      email_convidado: string;
      created_at: string;
      expira_em: string;
   }[];
}

const conviteService = {
   async enviar(mesaId: number, emailConvidado: string) {
      const { data } = await api.post("/convites", {
         mesa_id: mesaId,
         email_convidado: emailConvidado,
      });
      return data;
   },

   async listarPendentes(): Promise<Convite[]> {
      const { data } = await api.get("/convites/pendentes");
      return data.convites;
   },

   async listarEnviados(): Promise<Convite[]> {
      const { data } = await api.get("/convites/enviados");
      return data.convites;
   },

   async aceitar(token: string) {
      const { data } = await api.post(`/convites/${token}/aceitar`);
      return data;
   },

   async recusar(token: string) {
      const { data } = await api.post(`/convites/${token}/recusar`);
      return data;
   },

   async listarMembros(mesaId: number): Promise<MesaMembros> {
      const { data } = await api.get(`/mesa/${mesaId}/membros`);
      return data;
   },

   async removerMembro(mesaId: number, userId: number) {
      const { data } = await api.delete(`/mesa/${mesaId}/membros/${userId}`);
      return data;
   },

   async cancelarConvite(mesaId: number, conviteId: number) {
      const { data } = await api.delete(
         `/mesa/${mesaId}/membros/convites/${conviteId}`,
      );
      return data;
   },
};

export default conviteService;
