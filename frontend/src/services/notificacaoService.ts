import api from "./api";

export interface Notificacao {
   id: number;
   tipo: string;
   titulo: string;
   mensagem: string;
   link: string | null;
   dados_extras: Record<string, unknown> | null;
   lida: boolean;
   created_at: string;
}

export interface NotificacoesResponse {
   notificacoes: Notificacao[];
   nao_lidas: number;
}

const notificacaoService = {
   // Lista todas (usada ao abrir o sino)
   async listar(apenasNaoLidas = false): Promise<NotificacoesResponse> {
      const { data } = await api.get("/notificacoes", {
         params: { apenas_nao_lidas: apenasNaoLidas },
      });
      return data;
   },

   // Contagem leve — usada no polling do sino (não carrega conteúdo)
   async countNaoLidas(): Promise<{ total: number }> {
      const { data } = await api.get("/notificacoes/nao-lidas/count");
      return data;
   },

   async marcarLida(id: number) {
      const { data } = await api.patch(`/notificacoes/${id}/marcar-lida`);
      return data;
   },

   async marcarTodasLidas() {
      const { data } = await api.patch("/notificacoes/marcar-todas-lidas");
      return data;
   },

   async deletar(id: number) {
      const { data } = await api.delete(`/notificacoes/${id}`);
      return data;
   },
};

export default notificacaoService;
