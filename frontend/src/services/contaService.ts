import api from "./api";

export interface PerfilUsuario {
   id: number;
   nome: string;
   email: string;
   telefone: string | null;
   foto_url: string | null;
   tipo_plano: string;
   created_at: string;
}

export interface PreferenciasUsuario {
   moeda: string;
   formato_data: string;
   notificacoes_email: boolean;
}

export type TipoSuporte = "sugestao" | "reclamacao" | "solicitacao" | "duvida";

const contaService = {
   // ── Perfil ────────────────────────────────────────────────
   async getPerfil(): Promise<PerfilUsuario> {
      const { data } = await api.get("/conta/perfil");
      return data;
   },

   async atualizarPerfil(payload: {
      nome: string;
      telefone?: string;
   }): Promise<{ message: string; usuario: PerfilUsuario }> {
      const { data } = await api.put("/conta/perfil", payload);
      return data;
   },

   async atualizarFoto(
      foto_base64: string,
   ): Promise<{ message: string; foto_url: string }> {
      const { data } = await api.post("/conta/foto", { foto_base64 });
      return data;
   },

   async removerFoto(): Promise<{ message: string }> {
      const { data } = await api.delete("/conta/foto");
      return data;
   },

   // ── Segurança ─────────────────────────────────────────────
   async solicitarTrocaSenha(): Promise<{ message: string }> {
      const { data } = await api.post("/conta/solicitar-troca-senha");
      return data;
   },

   async confirmarTrocaSenha(
      token: string,
      nova_senha: string,
   ): Promise<{ message: string }> {
      const { data } = await api.post("/conta/confirmar-troca-senha", {
         token,
         nova_senha,
      });
      return data;
   },

   // ── Preferências ──────────────────────────────────────────
   async atualizarPreferencias(
      prefs: PreferenciasUsuario,
   ): Promise<{ message: string }> {
      const { data } = await api.put("/conta/preferencias", prefs);
      return data;
   },

   // ── Troca de email ────────────────────────────────────────
   async solicitarTrocaEmail(novo_email: string): Promise<{ message: string }> {
      const { data } = await api.post("/conta/solicitar-troca-email", {
         novo_email,
      });
      return data;
   },

   // ── Suporte ───────────────────────────────────────────────
   async enviarSuporte(payload: {
      tipo: TipoSuporte;
      assunto: string;
      mensagem: string;
   }): Promise<{ message: string }> {
      const { data } = await api.post("/conta/suporte", payload);
      return data;
   },
};

export default contaService;
