import api from "./api";

export interface IAnPayload {
   objetivo: string;
   valor_objetivo?: number;
   prazo_final?: string;
   mesa_id?: number;
}

export interface IAnCategoriaCritica {
   categoria: string;
   total: number;
   quantidade: number;
   perfil: "essencial" | "flexivel" | "misto";
}

export interface IAnJanelaGasto {
   bucket: "madrugada" | "manha" | "tarde" | "noite";
   label: string;
   total: number;
   quantidade: number;
}

export interface IAnCartaoCritico {
   id: number;
   nome: string;
   limite: number;
   gasto_mes: number;
   percentual: number;
}

export interface IAnAjuste {
   categoria: string;
   perfil: "essencial" | "flexivel" | "misto";
   percentual_corte: number;
   economia_sugerida: number;
   motivo: string;
}

export interface IAnRotinas {
   diaria: string[];
   semanal: string[];
   mensal: string[];
}

export interface IAnProjecaoComposta {
   taxa_mensal: number;
   taxa_anual: number;
   aporte_mensal: number;
   total_aportado: number;
   juros_estimados: number;
   patrimonio_final: number;
   aporte_sem_juros: number;
   economia_aporte: number;
}

export interface IAnEstrategia {
   id: "suave" | "equilibrada" | "agressiva";
   nome: string;
   intensidade: "suave" | "equilibrada" | "agressiva";
   cor: string;
   economia_mensal: number;
   economia_semanal: number;
   economia_diaria: number;
   impacto_na_despesa: number;
   prazo_estimado_meses: number;
   adequacao_meta: "forte" | "boa" | "apertada";
   resumo: string;
   resumo_investimento: string;
   ajustes: IAnAjuste[];
   projecao_composta: IAnProjecaoComposta;
   rotinas: IAnRotinas;
   viabilidade: "alta" | "media" | "desafiadora";
}

export interface IAnPlano {
   objetivo: {
      descricao: string;
      tipo: string;
      valor_objetivo: number;
      valor_informado: boolean;
      prazo_final: string | null;
      prazo_meses: number;
      meta_mensal_necessaria: number;
      meta_mensal_sem_juros: number;
      usar_juros_compostos: boolean;
   };
   diagnostico: {
      status_financeiro: string;
      receita_media: number;
      despesa_media: number;
      saldo_medio: number;
      receitas_mes_atual: number;
      despesas_mes_atual: number;
      pendente_mes_atual: number;
      potencial_flexivel: number;
      janelas_gasto: IAnJanelaGasto[];
      categorias_criticas: IAnCategoriaCritica[];
      cartoes_criticos: IAnCartaoCritico[];
   };
   sinais: string[];
   estrategias: IAnEstrategia[];
}

export interface IAnAcompanhamento {
   status_geral: "no_rumo" | "atencao" | "fora_do_rumo";
   resumo: string;
   indicadores: {
      gasto_mes_atual: number;
      gasto_esperado_ate_agora: number;
      desvio_atual: number;
      gasto_cartao_semana: number;
      gasto_hoje: number;
      restante_sugerido_mes: number;
   };
   categorias_em_alerta: Array<{
      categoria: string;
      atual: number;
      media: number;
      alvo_categoria: number;
      excedente: number;
   }>;
   alertas: {
      diarios: string[];
      semanais: string[];
      mensais: string[];
   };
}

export interface IAnPlanoAtivoResponse {
   plano_ativo: {
      id: number;
      mesa_id: number;
      estrategia_id: "suave" | "equilibrada" | "agressiva";
      objetivo_descricao: string;
      created_at: string;
      updated_at: string;
      plano: IAnPlano;
   } | null;
   acompanhamento: IAnAcompanhamento | null;
}

const ianService = {
   gerarPlano: async (payload: IAnPayload): Promise<IAnPlano> => {
      const response = await api.post("/ian/plano", payload);
      return response.data;
   },

   buscarPlanoAtivo: async (mesaId: number): Promise<IAnPlanoAtivoResponse> => {
      const response = await api.get("/ian/plano-ativo", {
         params: { mesa_id: mesaId },
      });
      return response.data;
   },

   ativarPlano: async (
      mesaId: number,
      estrategiaId: "suave" | "equilibrada" | "agressiva",
      plano: IAnPlano,
   ): Promise<IAnPlanoAtivoResponse> => {
      const response = await api.post("/ian/ativar", {
         mesa_id: mesaId,
         estrategia_id: estrategiaId,
         plano,
      });
      return response.data;
   },
};

export default ianService;
