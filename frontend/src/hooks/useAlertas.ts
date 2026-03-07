/**
 * useAlertas.ts
 * Hook que dispara a verificação de alertas financeiros ao montar o dashboard.
 * Coloque no DashboardLayout ou na página de Dashboard principal.
 *
 * Uso:
 *   import { useAlertas } from "@/hooks/useAlertas";
 *   // dentro do componente:
 *   useAlertas(recarregarNotificacoes); // passa a função de reload do Header
 */

import { useEffect, useRef } from "react";
import api from "@/services/api";

/**
 * @param onComplete - callback opcional chamado após a verificação.
 *                     Ideal para recarregar o contador do sininho.
 * @param intervaloMinutos - intervalo mínimo entre verificações (default: 10 min)
 *                           Evita chamadas desnecessárias em navegação rápida entre páginas.
 */
export function useAlertas(
   onComplete?: (naoLidas: number) => void,
   intervaloMinutos = 10,
) {
   const ultimaVerificacao = useRef<number>(0);

   useEffect(() => {
      const agora = Date.now();
      const intervaloMs = intervaloMinutos * 60 * 1000;

      // Só chama se passou o intervalo mínimo desde a última verificação
      if (agora - ultimaVerificacao.current < intervaloMs) return;

      ultimaVerificacao.current = agora;

      const verificar = async () => {
         try {
            const { data } = await api.post("/notificacoes/verificar-alertas");
            onComplete?.(data.nao_lidas ?? 0);
         } catch (err) {
            // Silencioso — alertas são secundários, não devem travar a UI
            console.warn("[useAlertas] Falha na verificação de alertas:", err);
         }
      };

      verificar();
   }, []); // roda uma vez ao montar
}
