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
   progresso_meta: {
      valor_objetivo: number;
      patrimonio_acumulado: number;
      total_guardado: number;
      total_investido: number;
      total_dividendos: number;
      percentual_concluido: number;
      valor_faltante: number;
      aporte_real_medio: number;
      ritmo_medio_mensal: number;
      ritmo_planejado_mensal: number;
      dividendos_estimados_mensais: number;
      proximo_mes_projetado: number;
      prazo_restante_meses: number;
      conclusao_prevista_em: string | null;
      meses_com_historico: number;
      registros: IAnRegistroMensal[];
      carteira_resumo: IAnCarteiraResumo[];
   };
}

export interface IAnRegistroInvestimento {
   nome: string;
   codigo: string | null;
   quantidade: number;
   valor_unitario: number;
   valor_total: number;
   dividendos_estimados_mensais: number;
}

export interface IAnRegistroMensal {
   id: number;
   plano_id: number;
   user_id: number;
   mesa_id: number;
   referencia_mes: string;
   valor_guardado: number;
   valor_investido: number;
   dividendos_recebidos: number;
   investimentos: IAnRegistroInvestimento[];
   observacoes: string;
   total_mes: number;
   created_at: string;
   updated_at: string;
}

export interface IAnCarteiraResumo {
   nome: string;
   codigo: string | null;
   quantidade_total: number;
   total_investido: number;
   dividendos_estimados_mensais: number;
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

export interface IAnSugestaoPesquisa {
   codigo?: string;
   nome: string;
   mercado: string;
   preco_atual?: number | null;
   variacao_dia?: number | null;
   moeda?: string | null;
   atualizado_em?: string | null;
   fonte: string;
}

export interface IAnSugestaoInvestimento {
   id: string;
   titulo: string;
   categoria: string;
   classe: "renda_fixa" | "renda_variavel";
   disponibilidade: "agora" | "condicional";
   prioridade: number;
   risco: "baixo" | "medio" | "alto";
   liquidez: "alta" | "media";
   horizonte: string;
   adequacao: string;
   motivo_ian: string;
   quando_nao_faz_sentido: string;
   como_usar: string;
   observacoes: string[];
   exemplos_pesquisa: IAnSugestaoPesquisa[];
}

export interface IAnSugestoesInvestimentoResponse {
   contexto: {
      status_financeiro: string;
      objetivo_tipo: string;
      prazo_meses: number;
      saldo_medio: number;
      receita_media: number;
      despesa_media: number;
      renda_variavel_liberada: boolean;
      modo_base: string;
      resumo_momento: string;
      recomendacao_base: string;
      fontes: {
         juros: {
            nome: string;
            status: "ao_vivo" | "indisponivel";
         };
         mercado: {
            nome: string;
            status: "ao_vivo" | "indisponivel" | "sem_token" | "sem_ativos";
         };
      };
   };
   aviso_geral: string;
   disclaimer: string;
   sugestoes: IAnSugestaoInvestimento[];
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

   buscarSugestoes: async (
      mesaId: number,
      plano?: IAnPlano | null,
   ): Promise<IAnSugestoesInvestimentoResponse> => {
      const response = await api.post("/ian/sugestoes", {
         mesa_id: mesaId,
         plano,
      });
      return response.data;
   },

   salvarRegistroMensal: async (
      mesaId: number,
      payload: {
         referencia_mes: string;
         valor_guardado?: number;
         valor_investido?: number;
         dividendos_recebidos?: number;
         observacoes?: string;
         investimentos?: Array<{
            nome: string;
            codigo?: string | null;
            quantidade?: number;
            valor_unitario?: number;
            valor_total?: number;
            dividendos_estimados_mensais?: number;
         }>;
      },
   ): Promise<IAnPlanoAtivoResponse> => {
      const response = await api.post("/ian/registro-mensal", {
         mesa_id: mesaId,
         ...payload,
      });
      return response.data;
   },
};

export default ianService;
