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

const ianService = {
   gerarPlano: async (payload: IAnPayload): Promise<IAnPlano> => {
      const response = await api.post("/ian/plano", payload);
      return response.data;
   },
};

export default ianService;
