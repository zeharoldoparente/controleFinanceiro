"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import authService from "@/services/authService";
import ianService, {
   type IAnAcompanhamento,
   type IAnEstrategia,
   type IAnPlano,
   type IAnSugestoesInvestimentoResponse,
} from "@/services/ianService";
import { useMesa } from "@/contexts/MesaContext";
import { isApiError } from "@/types";

function formatCurrency(value: number) {
   return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
   }).format(value || 0);
}

function plusMonths(months: number) {
   const date = new Date();
   date.setMonth(date.getMonth() + months);
   return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getStatusClass(status: IAnAcompanhamento["status_geral"]) {
   if (status === "fora_do_rumo") {
      return "bg-rose-50 text-rose-700 border-rose-200";
   }

   if (status === "atencao") {
      return "bg-amber-50 text-amber-700 border-amber-200";
   }

   return "bg-emerald-50 text-emerald-700 border-emerald-200";
}

function formatPercent(value?: number | null) {
   if (typeof value !== "number" || Number.isNaN(value)) return null;
   return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function getDisponibilidadeClass(disponibilidade: "agora" | "condicional") {
   return disponibilidade === "agora"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-amber-100 text-amber-700";
}

function getRiscoClass(risco: "baixo" | "medio" | "alto") {
   if (risco === "alto") {
      return "bg-rose-100 text-rose-700";
   }

   if (risco === "medio") {
      return "bg-amber-100 text-amber-700";
   }

   return "bg-sky-100 text-sky-700";
}

const sugestoes = [
   {
      label: "Sair do vermelho",
      objetivo:
         "Quero sair do vermelho e reorganizar meus gastos para voltar a ter folego no fim do mes.",
      prazo: plusMonths(4),
      valor: "",
   },
   {
      label: "Viajar no fim do ano",
      objetivo:
         "Quero viajar para o Nordeste no final do ano e juntar o dinheiro sem descontrolar meu mes.",
      prazo: plusMonths(9),
      valor: "7000",
   },
   {
      label: "Criar reserva",
      objetivo:
         "Quero montar uma reserva de emergencia que eu consiga manter de forma consistente.",
      prazo: plusMonths(6),
      valor: "5000",
   },
];

export default function IAnPage() {
   const router = useRouter();
   const { mesaSelecionada, carregando: mesaCarregando } = useMesa();

   const [objetivo, setObjetivo] = useState("");
   const [valorObjetivo, setValorObjetivo] = useState("");
   const [prazoFinal, setPrazoFinal] = useState(plusMonths(6));
   const [loading, setLoading] = useState(false);
   const [carregandoPlanoAtivo, setCarregandoPlanoAtivo] = useState(false);
   const [salvandoAcompanhamento, setSalvandoAcompanhamento] = useState(false);
   const [erro, setErro] = useState("");
   const [plano, setPlano] = useState<IAnPlano | null>(null);
   const [acompanhamento, setAcompanhamento] =
      useState<IAnAcompanhamento | null>(null);
   const [estrategiaId, setEstrategiaId] = useState<
      "suave" | "equilibrada" | "agressiva" | null
   >(null);
   const [abaAtiva, setAbaAtiva] = useState<"plano" | "sugestoes">("plano");
   const [carregandoSugestoes, setCarregandoSugestoes] = useState(false);
   const [erroSugestoes, setErroSugestoes] = useState("");
   const [sugestoesInvestimento, setSugestoesInvestimento] =
      useState<IAnSugestoesInvestimentoResponse | null>(null);
   const chaveSugestoes = useMemo(() => {
      if (!mesaSelecionada || !plano) return "";

      return [
         mesaSelecionada.id,
         plano.objetivo.descricao,
         plano.objetivo.tipo,
         plano.objetivo.prazo_meses,
         plano.objetivo.valor_objetivo,
         estrategiaId || "sem-estrategia",
      ].join(":");
   }, [mesaSelecionada, plano, estrategiaId]);

   useEffect(() => {
      if (!authService.isAuthenticated()) router.push("/login");
   }, [router]);

   useEffect(() => {
      if (!mesaSelecionada || mesaCarregando) return;

      const carregarPlanoAtivo = async () => {
         setCarregandoPlanoAtivo(true);
         try {
            const data = await ianService.buscarPlanoAtivo(mesaSelecionada.id);

            if (data.plano_ativo?.plano) {
               setPlano(data.plano_ativo.plano);
               setAcompanhamento(data.acompanhamento);
               setEstrategiaId(data.plano_ativo.estrategia_id);
               setObjetivo(data.plano_ativo.plano.objetivo.descricao);
               setPrazoFinal(data.plano_ativo.plano.objetivo.prazo_final || "");
               setValorObjetivo(
                  data.plano_ativo.plano.objetivo.valor_informado
                     ? String(data.plano_ativo.plano.objetivo.valor_objetivo)
                     : "",
               );
            } else {
               setPlano(null);
               setAcompanhamento(null);
               setEstrategiaId(null);
            }
         } catch (error) {
            console.warn("Falha ao carregar plano ativo do IAn:", error);
         } finally {
            setCarregandoPlanoAtivo(false);
         }
      };

      carregarPlanoAtivo();
   }, [mesaSelecionada, mesaCarregando]);

   useEffect(() => {
      if (!plano) {
         setSugestoesInvestimento(null);
         setErroSugestoes("");
         return;
      }

      if (abaAtiva !== "sugestoes" || !mesaSelecionada || !chaveSugestoes) {
         return;
      }

      let ativo = true;

      const carregarSugestoes = async () => {
         setCarregandoSugestoes(true);
         setErroSugestoes("");

         try {
            const data = await ianService.buscarSugestoes(
               mesaSelecionada.id,
               plano,
            );

            if (ativo) {
               setSugestoesInvestimento(data);
            }
         } catch (error) {
            if (!ativo) return;

            setErroSugestoes(
               isApiError(error)
                  ? error.response?.data?.error ||
                       error.response?.data?.message ||
                       "Nao foi possivel carregar as sugestoes agora."
                  : "Nao foi possivel carregar as sugestoes agora.",
            );
         } finally {
            if (ativo) {
               setCarregandoSugestoes(false);
            }
         }
      };

      carregarSugestoes();

      return () => {
         ativo = false;
      };
   }, [abaAtiva, mesaSelecionada, plano, chaveSugestoes]);

   const estrategia = useMemo<IAnEstrategia | null>(() => {
      if (!plano || !estrategiaId) return null;
      return plano.estrategias.find((item) => item.id === estrategiaId) || null;
   }, [plano, estrategiaId]);

   const gerarPlano = async () => {
      if (!mesaSelecionada) {
         setErro("Selecione uma mesa para o IAn analisar seus dados.");
         return;
      }

      if (objetivo.trim().length < 6) {
         setErro("Conte um objetivo um pouco melhor para o IAn te ajudar.");
         return;
      }

      setLoading(true);
      setErro("");

      try {
         const resposta = await ianService.gerarPlano({
            objetivo: objetivo.trim(),
            valor_objetivo: valorObjetivo ? Number(valorObjetivo) : undefined,
            prazo_final: prazoFinal || undefined,
            mesa_id: mesaSelecionada.id,
         });

         setPlano(resposta);
         setAcompanhamento(null);
         setEstrategiaId("equilibrada");
         setSugestoesInvestimento(null);
      } catch (error) {
         setErro(
            isApiError(error)
               ? error.response?.data?.error ||
                    error.response?.data?.message ||
                    "Nao foi possivel gerar o plano."
               : "Nao foi possivel gerar o plano.",
         );
      } finally {
         setLoading(false);
      }
   };

   const ativarAcompanhamento = async (
      novaEstrategiaId: "suave" | "equilibrada" | "agressiva",
   ) => {
      if (!plano || !mesaSelecionada) return;

      setEstrategiaId(novaEstrategiaId);
      setSalvandoAcompanhamento(true);
      setErro("");

      try {
         const data = await ianService.ativarPlano(
            mesaSelecionada.id,
            novaEstrategiaId,
            plano,
         );

         if (data.plano_ativo?.plano) {
            setPlano(data.plano_ativo.plano);
            setAcompanhamento(data.acompanhamento);
            setEstrategiaId(data.plano_ativo.estrategia_id);
            setSugestoesInvestimento(null);
         }
      } catch (error) {
         setErro(
            isApiError(error)
               ? error.response?.data?.error ||
                    error.response?.data?.message ||
                    "Nao foi possivel ativar o acompanhamento."
               : "Nao foi possivel ativar o acompanhamento.",
         );
      } finally {
         setSalvandoAcompanhamento(false);
      }
   };

   return (
      <DashboardLayout>
         <div className="space-y-6">
            <section className="rounded-[28px] border border-emerald-100 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.30),_transparent_34%),linear-gradient(135deg,_#032e22,_#0f5132_46%,_#dff6ea_140%)] p-6 text-white shadow-[0_28px_70px_-32px_rgba(5,80,55,0.85)] md:p-8">
               <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em]">
                     IAn
                  </span>
                  {acompanhamento && (
                     <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold">
                        acompanhamento ativo
                     </span>
                  )}
               </div>
               <h1 className="mt-4 max-w-3xl text-3xl font-black tracking-tight md:text-4xl">
                  Estrategia financeira com memoria, contexto e acompanhamento
                  vivo.
               </h1>
               <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/85 md:text-base">
                  O IAn nao fica mais so no plano. Agora ele pode manter uma
                  linha ativa por mesa e acompanhar desvios diarios, semanais e
                  mensais com base no seu objetivo.
               </p>
            </section>

            <section className="rounded-[22px] border border-gray-100 bg-white p-2 shadow-sm">
               <div className="grid gap-2 md:grid-cols-2">
                  {(
                     [
                        ["plano", "Plano e acompanhamento"],
                        ["sugestoes", "Sugestoes de aplicacao"],
                     ] as const
                  ).map(([aba, label]) => (
                     <button
                        key={aba}
                        onClick={() => setAbaAtiva(aba)}
                        className={`rounded-[18px] px-4 py-3 text-sm font-semibold transition ${
                           abaAtiva === aba
                              ? "bg-gray-900 text-white shadow-lg shadow-gray-900/10"
                              : "bg-gray-50 text-gray-600"
                        }`}
                     >
                        {label}
                     </button>
                  ))}
               </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
               <div className="rounded-[26px] border border-gray-100 bg-white p-5 shadow-sm md:p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
                     Defina a meta
                  </p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
                     Conte para o IAn onde voce quer chegar.
                  </h2>

                  <div className="mt-5 flex flex-wrap gap-2">
                     {sugestoes.map((sugestao) => (
                        <button
                           key={sugestao.label}
                           onClick={() => {
                              setObjetivo(sugestao.objetivo);
                              setPrazoFinal(sugestao.prazo);
                              setValorObjetivo(sugestao.valor);
                              setErro("");
                           }}
                           className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"
                        >
                           {sugestao.label}
                        </button>
                     ))}
                  </div>

                  <div className="mt-5 space-y-4">
                     <textarea
                        value={objetivo}
                        onChange={(event) => setObjetivo(event.target.value)}
                        rows={5}
                        placeholder="Ex: Quero sair do vermelho e juntar 7 mil reais para viajar no fim do ano sem estourar o cartao."
                        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-emerald-400 focus:bg-white"
                     />

                     <div className="grid gap-4 md:grid-cols-2">
                        <input
                           type="number"
                           min="0"
                           step="0.01"
                           value={valorObjetivo}
                           onChange={(event) =>
                              setValorObjetivo(event.target.value)
                           }
                           placeholder="Valor da meta (opcional)"
                           className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-emerald-400 focus:bg-white"
                        />
                        <input
                           type="date"
                           value={prazoFinal}
                           onChange={(event) => setPrazoFinal(event.target.value)}
                           className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-emerald-400 focus:bg-white"
                        />
                     </div>

                     {erro && (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                           {erro}
                        </div>
                     )}

                     <div className="flex flex-wrap gap-3">
                        <button
                           onClick={gerarPlano}
                           disabled={loading || mesaCarregando || !mesaSelecionada}
                           className="rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                           {loading
                              ? "IAn analisando seus dados..."
                              : "Gerar plano inteligente"}
                        </button>
                        {carregandoPlanoAtivo && (
                           <span className="self-center text-sm text-gray-500">
                              Recuperando acompanhamento salvo...
                           </span>
                        )}
                     </div>
                  </div>
               </div>

               <div className="rounded-[26px] border border-gray-100 bg-white p-5 shadow-sm md:p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                     Como ele pensa
                  </p>
                  <div className="mt-4 grid gap-3">
                     <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
                        Guarda uma estrategia ativa por mesa para nao resetar ao
                        sair da tela.
                     </div>
                     <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
                        Compara seu gasto atual com o ritmo ideal do mes e com
                        as categorias que voce precisava enxugar.
                     </div>
                     <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
                        Concentra o acompanhamento no que importa: cartao,
                        categorias que vazam e desvio do plano.
                     </div>
                     <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                        Mesa ativa:{" "}
                        {mesaCarregando
                           ? "Carregando..."
                           : mesaSelecionada?.nome || "Sem mesa selecionada"}
                     </div>
                  </div>
               </div>
            </section>

            {!plano ? (
               <section className="rounded-[26px] border border-dashed border-emerald-200 bg-emerald-50/60 p-8 text-center">
                  <h2 className="text-2xl font-bold tracking-tight text-emerald-950">
                     O plano do IAn aparece aqui.
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-emerald-900/70">
                     Assim que voce definir a meta, ele retorna diagnostico,
                     estrategias e, se voce ativar uma linha, guarda tudo para o
                     proximo acesso.
                  </p>
               </section>
            ) : abaAtiva === "sugestoes" ? (
               <section className="space-y-4">
                  <div className="grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
                     <div className="rounded-[26px] border border-gray-100 bg-white p-5 shadow-sm md:p-6">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                           Curadoria do IAn
                        </p>
                        <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
                           Sugestoes de aplicacao para pesquisar com calma.
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-gray-600">
                           O IAn nao empurra produto. Ele usa o seu momento
                           financeiro para dizer o que pode fazer sentido agora
                           e o que e melhor deixar so no radar.
                        </p>

                        <div className="mt-5 grid gap-3 md:grid-cols-3">
                           <div className="rounded-2xl bg-gray-50 p-4">
                              <p className="text-xs uppercase tracking-[0.14em] text-gray-400">
                                 Objetivo
                              </p>
                              <p className="mt-2 text-sm font-semibold text-gray-900">
                                 {plano.objetivo.descricao}
                              </p>
                           </div>
                           <div className="rounded-2xl bg-gray-50 p-4">
                              <p className="text-xs uppercase tracking-[0.14em] text-gray-400">
                                 Prazo
                              </p>
                              <p className="mt-2 text-sm font-semibold text-gray-900">
                                 {plano.objetivo.prazo_meses} meses
                              </p>
                           </div>
                           <div className="rounded-2xl bg-gray-50 p-4">
                              <p className="text-xs uppercase tracking-[0.14em] text-gray-400">
                                 Momento
                              </p>
                              <p className="mt-2 text-sm font-semibold text-gray-900">
                                 {plano.diagnostico.status_financeiro}
                              </p>
                           </div>
                        </div>
                     </div>

                     <div className="rounded-[26px] border border-emerald-100 bg-emerald-50/70 p-5 shadow-sm md:p-6">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                           Regra do produto
                        </p>
                        <div className="mt-4 space-y-3 text-sm leading-6 text-emerald-950/80">
                           <p>
                              Primeiro o IAn tenta proteger caixa, fluxo e
                              meta. So depois ele abre espaco para renda
                              variavel.
                           </p>
                           <p>
                              As sugestoes aqui sao educativas e servem como
                              ponto de partida para pesquisa na corretora ou
                              carteira que voce ja usa.
                           </p>
                           <p>
                              Se o seu contexto mudar, a ordem dessas sugestoes
                              muda junto.
                           </p>
                        </div>
                     </div>
                  </div>

                  {erroSugestoes && (
                     <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {erroSugestoes}
                     </div>
                  )}

                  {carregandoSugestoes ? (
                     <div className="rounded-[26px] border border-gray-100 bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
                        IAn montando sua vitrine de sugestoes...
                     </div>
                  ) : !sugestoesInvestimento ? (
                     <div className="rounded-[26px] border border-dashed border-gray-200 bg-white p-8 text-center shadow-sm">
                        <h3 className="text-xl font-bold text-gray-900">
                           Gere ou ative um plano primeiro.
                        </h3>
                        <p className="mt-3 text-sm leading-6 text-gray-600">
                           O IAn precisa do objetivo e do diagnostico da mesa
                           para sugerir opcoes com contexto.
                        </p>
                     </div>
                  ) : (
                     <>
                        <section className="grid gap-4 xl:grid-cols-[1.04fr_0.96fr]">
                           <div className="rounded-[26px] border border-gray-100 bg-white p-5 shadow-sm md:p-6">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                 <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                                       Leitura do momento
                                    </p>
                                    <h3 className="mt-2 text-2xl font-bold text-gray-900">
                                       {sugestoesInvestimento.contexto.recomendacao_base}
                                    </h3>
                                 </div>
                                 <span
                                    className={`rounded-full px-4 py-2 text-sm font-semibold ${
                                       sugestoesInvestimento.contexto.renda_variavel_liberada
                                          ? "bg-emerald-100 text-emerald-700"
                                          : "bg-amber-100 text-amber-700"
                                    }`}
                                 >
                                    {sugestoesInvestimento.contexto.renda_variavel_liberada
                                       ? "renda variavel liberada com cautela"
                                       : "renda variavel so no radar"}
                                 </span>
                              </div>

                              <p className="mt-3 text-sm leading-6 text-gray-600">
                                 {sugestoesInvestimento.contexto.resumo_momento}
                              </p>

                              <div className="mt-5 grid gap-3 md:grid-cols-3">
                                 <div className="rounded-2xl bg-gray-50 p-4">
                                    <p className="text-xs uppercase tracking-[0.14em] text-gray-400">
                                       Juros
                                    </p>
                                    <p className="mt-2 text-sm font-semibold text-gray-900">
                                       {sugestoesInvestimento.contexto.fontes.juros.status ===
                                       "ao_vivo"
                                          ? "Banco Central ao vivo"
                                          : "Banco Central indisponivel"}
                                    </p>
                                 </div>
                                 <div className="rounded-2xl bg-gray-50 p-4">
                                    <p className="text-xs uppercase tracking-[0.14em] text-gray-400">
                                       Mercado
                                    </p>
                                    <p className="mt-2 text-sm font-semibold text-gray-900">
                                       {sugestoesInvestimento.contexto.fontes.mercado.status ===
                                       "ao_vivo"
                                          ? "B3 com cotacao ao vivo"
                                          : "catalogo educativo"}
                                    </p>
                                 </div>
                                 <div className="rounded-2xl bg-gray-50 p-4">
                                    <p className="text-xs uppercase tracking-[0.14em] text-gray-400">
                                       Base
                                    </p>
                                    <p className="mt-2 text-sm font-semibold text-gray-900">
                                       {sugestoesInvestimento.contexto.modo_base.replaceAll(
                                          "_",
                                          " ",
                                       )}
                                    </p>
                                 </div>
                              </div>
                           </div>

                           <div className="rounded-[26px] border border-amber-200 bg-amber-50 p-5 shadow-sm md:p-6">
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                                 Aviso importante
                              </p>
                              <p className="mt-3 text-sm leading-6 text-amber-950/80">
                                 {sugestoesInvestimento.aviso_geral}
                              </p>
                              <p className="mt-4 rounded-2xl bg-white/80 p-4 text-sm leading-6 text-amber-950/80">
                                 {sugestoesInvestimento.disclaimer}
                              </p>
                           </div>
                        </section>

                        <section className="grid gap-4 xl:grid-cols-2">
                           {sugestoesInvestimento.sugestoes.map((sugestao) => (
                              <article
                                 key={sugestao.id}
                                 className="rounded-[26px] border border-gray-100 bg-white p-5 shadow-sm md:p-6"
                              >
                                 <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                       <div className="flex flex-wrap gap-2">
                                          <span
                                             className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${getDisponibilidadeClass(
                                                sugestao.disponibilidade,
                                             )}`}
                                          >
                                             {sugestao.disponibilidade === "agora"
                                                ? "faz sentido agora"
                                                : "melhor pesquisar para depois"}
                                          </span>
                                          <span
                                             className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${getRiscoClass(
                                                sugestao.risco,
                                             )}`}
                                          >
                                             risco {sugestao.risco}
                                          </span>
                                       </div>
                                       <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                                          {sugestao.categoria}
                                       </p>
                                       <h3 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
                                          {sugestao.titulo}
                                       </h3>
                                    </div>

                                    <div className="rounded-2xl bg-gray-50 px-4 py-3 text-right">
                                       <p className="text-xs uppercase tracking-[0.14em] text-gray-400">
                                          Liquidez
                                       </p>
                                       <p className="mt-2 text-sm font-semibold text-gray-900">
                                          {sugestao.liquidez}
                                       </p>
                                    </div>
                                 </div>

                                 <div className="mt-5 grid gap-3 md:grid-cols-2">
                                    <div className="rounded-2xl bg-gray-50 p-4">
                                       <p className="text-xs uppercase tracking-[0.14em] text-gray-400">
                                          Horizonte
                                       </p>
                                       <p className="mt-2 text-sm font-semibold text-gray-900">
                                          {sugestao.horizonte}
                                       </p>
                                    </div>
                                    <div className="rounded-2xl bg-gray-50 p-4">
                                       <p className="text-xs uppercase tracking-[0.14em] text-gray-400">
                                          Adequacao
                                       </p>
                                       <p className="mt-2 text-sm font-semibold text-gray-900">
                                          {sugestao.adequacao}
                                       </p>
                                    </div>
                                 </div>

                                 <div className="mt-5 space-y-4">
                                    <div>
                                       <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                                          Por que o IAn sugeriu
                                       </p>
                                       <p className="mt-2 text-sm leading-6 text-gray-600">
                                          {sugestao.motivo_ian}
                                       </p>
                                    </div>

                                    <div>
                                       <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                                          Como usar
                                       </p>
                                       <p className="mt-2 text-sm leading-6 text-gray-600">
                                          {sugestao.como_usar}
                                       </p>
                                    </div>

                                    <div>
                                       <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                                          Quando nao faz sentido
                                       </p>
                                       <p className="mt-2 text-sm leading-6 text-gray-600">
                                          {sugestao.quando_nao_faz_sentido}
                                       </p>
                                    </div>
                                 </div>

                                 <div className="mt-5">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                                       Exemplos para pesquisar
                                    </p>
                                    <div className="mt-3 grid gap-3">
                                       {sugestao.exemplos_pesquisa.map((item) => (
                                          <div
                                             key={`${sugestao.id}-${item.codigo || item.nome}`}
                                             className="rounded-2xl border border-gray-100 p-4"
                                          >
                                             <div className="flex flex-wrap items-center justify-between gap-3">
                                                <div>
                                                   <p className="text-sm font-semibold text-gray-900">
                                                      {item.codigo
                                                         ? `${item.codigo} · ${item.nome}`
                                                         : item.nome}
                                                   </p>
                                                   <p className="mt-1 text-xs text-gray-400">
                                                      {item.mercado} · fonte{" "}
                                                      {item.fonte}
                                                   </p>
                                                </div>

                                                {typeof item.preco_atual ===
                                                   "number" && (
                                                   <div className="text-right">
                                                      <p className="text-sm font-bold text-gray-900">
                                                         {formatCurrency(
                                                            item.preco_atual,
                                                         )}
                                                      </p>
                                                      {formatPercent(
                                                         item.variacao_dia,
                                                      ) && (
                                                         <p
                                                            className={`text-xs font-semibold ${
                                                               (item.variacao_dia ||
                                                                  0) >= 0
                                                                  ? "text-emerald-700"
                                                                  : "text-rose-700"
                                                            }`}
                                                         >
                                                            {formatPercent(
                                                               item.variacao_dia,
                                                            )}
                                                         </p>
                                                      )}
                                                   </div>
                                                )}
                                             </div>
                                          </div>
                                       ))}
                                    </div>
                                 </div>

                                 <div className="mt-5 space-y-2">
                                    {sugestao.observacoes.map((item) => (
                                       <p
                                          key={item}
                                          className="rounded-2xl bg-gray-50 px-4 py-3 text-sm leading-6 text-gray-600"
                                       >
                                          {item}
                                       </p>
                                    ))}
                                 </div>
                              </article>
                           ))}
                        </section>
                     </>
                  )}
               </section>
            ) : (
               <>
                  <section className="grid gap-4 xl:grid-cols-[1.06fr_0.94fr]">
                     <div className="rounded-[26px] border border-gray-100 bg-white p-5 shadow-sm md:p-6">
                        <div className="flex flex-wrap gap-2">
                           <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                              {plano.diagnostico.status_financeiro}
                           </span>
                           <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                              Meta mensal{" "}
                              {formatCurrency(
                                 plano.objetivo.meta_mensal_necessaria,
                              )}
                           </span>
                           <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                              {plano.objetivo.prazo_meses} meses
                           </span>
                        </div>

                        {plano.objetivo.usar_juros_compostos && (
                           <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                                 Efeito dos juros compostos
                              </p>
                              <p className="mt-2 text-sm leading-6 text-emerald-900">
                                 Sem rendimento, a meta pediria{" "}
                                 {formatCurrency(
                                    plano.objetivo.meta_mensal_sem_juros,
                                 )}{" "}
                                 por mes. Na linha equilibrada, o IAn estima{" "}
                                 {formatCurrency(
                                    plano.objetivo.meta_mensal_necessaria,
                                 )}{" "}
                                 por mes com aporte e rendimento trabalhando a
                                 seu favor.
                              </p>
                           </div>
                        )}

                        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                           <div className="rounded-2xl bg-gray-50 p-4">
                              <p className="text-xs uppercase tracking-[0.14em] text-gray-400">
                                 Receita media
                              </p>
                              <p className="mt-2 text-lg font-bold text-gray-900">
                                 {formatCurrency(
                                    plano.diagnostico.receita_media,
                                 )}
                              </p>
                           </div>
                           <div className="rounded-2xl bg-gray-50 p-4">
                              <p className="text-xs uppercase tracking-[0.14em] text-gray-400">
                                 Despesa media
                              </p>
                              <p className="mt-2 text-lg font-bold text-gray-900">
                                 {formatCurrency(
                                    plano.diagnostico.despesa_media,
                                 )}
                              </p>
                           </div>
                           <div className="rounded-2xl bg-gray-50 p-4">
                              <p className="text-xs uppercase tracking-[0.14em] text-gray-400">
                                 Saldo medio
                              </p>
                              <p className="mt-2 text-lg font-bold text-gray-900">
                                 {formatCurrency(plano.diagnostico.saldo_medio)}
                              </p>
                           </div>
                           <div className="rounded-2xl bg-gray-50 p-4">
                              <p className="text-xs uppercase tracking-[0.14em] text-gray-400">
                                 Potencial flexivel
                              </p>
                              <p className="mt-2 text-lg font-bold text-gray-900">
                                 {formatCurrency(
                                    plano.diagnostico.potencial_flexivel,
                                 )}
                              </p>
                           </div>
                        </div>
                     </div>

                     <div className="rounded-[26px] border border-gray-100 bg-white p-5 shadow-sm md:p-6">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                           Radar de vazamento
                        </p>
                        <div className="mt-4 space-y-3">
                           {plano.diagnostico.categorias_criticas
                              .slice(0, 4)
                              .map((categoria) => (
                                 <div
                                    key={categoria.categoria}
                                    className="rounded-2xl border border-gray-100 p-4"
                                 >
                                    <div className="flex items-center justify-between gap-3">
                                       <div>
                                          <p className="text-sm font-semibold text-gray-900">
                                             {categoria.categoria}
                                          </p>
                                          <p className="text-xs text-gray-400">
                                             Perfil {categoria.perfil}
                                          </p>
                                       </div>
                                       <p className="text-sm font-bold text-gray-700">
                                          {formatCurrency(categoria.total)}
                                       </p>
                                    </div>
                                 </div>
                              ))}
                        </div>
                     </div>
                  </section>

                  <section className="grid gap-4 xl:grid-cols-3">
                     {plano.estrategias.map((item) => {
                        const ativa = item.id === estrategiaId;

                        return (
                           <button
                              key={item.id}
                              onClick={() => ativarAcompanhamento(item.id)}
                              className={`rounded-[26px] border bg-white p-5 text-left shadow-sm transition-all ${
                                 ativa
                                    ? "border-gray-900 ring-2 ring-gray-900/10"
                                    : "border-gray-100"
                              }`}
                           >
                              <div className="flex items-center justify-between gap-3">
                                 <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                                       {item.intensidade}
                                    </p>
                                    <h3 className="mt-2 text-xl font-bold text-gray-900">
                                       {item.nome}
                                    </h3>
                                 </div>
                                 {ativa && (
                                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                                       ativa
                                    </span>
                                 )}
                              </div>
                              <div
                                 className="mt-4 rounded-[22px] p-4 text-white"
                                 style={{
                                    background: `linear-gradient(135deg, ${item.cor}, #111827)`,
                                 }}
                              >
                                 <p className="text-xs uppercase tracking-[0.18em] text-white/70">
                                    Aporte mensal sugerido
                                 </p>
                                 <p className="mt-2 text-3xl font-black tracking-tight">
                                    {formatCurrency(
                                       item.projecao_composta.aporte_mensal,
                                    )}
                                 </p>
                                 <p className="mt-2 text-sm text-white/80">
                                    {item.resumo_investimento}
                                 </p>
                              </div>
                              <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                                 <span>
                                    Juros estimados{" "}
                                    {formatCurrency(
                                       item.projecao_composta.juros_estimados,
                                    )}
                                 </span>
                                 <span>
                                    {salvandoAcompanhamento && ativa
                                       ? "salvando..."
                                       : item.viabilidade}
                                 </span>
                              </div>
                           </button>
                        );
                     })}
                  </section>

                  {acompanhamento && (
                     <section className="rounded-[26px] border border-gray-100 bg-white p-5 shadow-sm md:p-6">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                           <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                                 Acompanhamento ao vivo
                              </p>
                              <h3 className="mt-2 text-2xl font-bold text-gray-900">
                                 O IAn esta acompanhando seu comportamento agora.
                              </h3>
                           </div>
                           <div
                              className={`rounded-full border px-4 py-2 text-sm font-semibold ${getStatusClass(acompanhamento.status_geral)}`}
                           >
                              {acompanhamento.status_geral.replaceAll("_", " ")}
                           </div>
                        </div>

                        <p className="mt-3 text-sm leading-6 text-gray-600">
                           {acompanhamento.resumo}
                        </p>

                        <div className="mt-5 grid gap-3 md:grid-cols-4">
                           <div className="rounded-2xl bg-gray-50 p-4">
                              <p className="text-xs uppercase tracking-[0.14em] text-gray-400">
                                 Gasto do mes
                              </p>
                              <p className="mt-2 text-lg font-bold text-gray-900">
                                 {formatCurrency(
                                    acompanhamento.indicadores.gasto_mes_atual,
                                 )}
                              </p>
                           </div>
                           <div className="rounded-2xl bg-gray-50 p-4">
                              <p className="text-xs uppercase tracking-[0.14em] text-gray-400">
                                 Ritmo ideal
                              </p>
                              <p className="mt-2 text-lg font-bold text-gray-900">
                                 {formatCurrency(
                                    acompanhamento.indicadores.gasto_esperado_ate_agora,
                                 )}
                              </p>
                           </div>
                           <div className="rounded-2xl bg-gray-50 p-4">
                              <p className="text-xs uppercase tracking-[0.14em] text-gray-400">
                                 Desvio atual
                              </p>
                              <p className="mt-2 text-lg font-bold text-gray-900">
                                 {formatCurrency(
                                    acompanhamento.indicadores.desvio_atual,
                                 )}
                              </p>
                           </div>
                           <div className="rounded-2xl bg-gray-50 p-4">
                              <p className="text-xs uppercase tracking-[0.14em] text-gray-400">
                                 Cartao na semana
                              </p>
                              <p className="mt-2 text-lg font-bold text-gray-900">
                                 {formatCurrency(
                                    acompanhamento.indicadores.gasto_cartao_semana,
                                 )}
                              </p>
                           </div>
                        </div>

                        <div className="mt-6 grid gap-4 lg:grid-cols-3">
                           {(
                              [
                                 ["Diario", acompanhamento.alertas.diarios],
                                 ["Semanal", acompanhamento.alertas.semanais],
                                 ["Mensal", acompanhamento.alertas.mensais],
                              ] as const
                           ).map(([label, itens]) => (
                              <div
                                 key={label}
                                 className="rounded-2xl border border-gray-100 p-4"
                              >
                                 <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                                    {label}
                                 </p>
                                 <ul className="mt-3 space-y-2">
                                    {itens.map((item) => (
                                       <li
                                          key={item}
                                          className="text-sm leading-6 text-gray-600"
                                       >
                                          {item}
                                       </li>
                                    ))}
                                 </ul>
                              </div>
                           ))}
                        </div>

                        {acompanhamento.categorias_em_alerta.length > 0 && (
                           <div className="mt-6">
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                                 Categorias em alerta
                              </p>
                              <div className="mt-3 grid gap-3 md:grid-cols-3">
                                 {acompanhamento.categorias_em_alerta.map(
                                    (item) => (
                                       <div
                                          key={item.categoria}
                                          className="rounded-2xl border border-amber-200 bg-amber-50 p-4"
                                       >
                                          <p className="text-sm font-semibold text-amber-900">
                                             {item.categoria}
                                          </p>
                                          <p className="mt-2 text-xs text-amber-700">
                                             Atual {formatCurrency(item.atual)}
                                          </p>
                                          <p className="text-xs text-amber-700">
                                             Ritmo alvo{" "}
                                             {formatCurrency(item.alvo_categoria)}
                                          </p>
                                          <p className="mt-2 text-sm font-bold text-amber-900">
                                             Excesso {formatCurrency(item.excedente)}
                                          </p>
                                       </div>
                                    ),
                                 )}
                              </div>
                           </div>
                        )}
                     </section>
                  )}

                  {estrategia && (
                     <section className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
                        <div className="rounded-[26px] border border-gray-100 bg-white p-5 shadow-sm md:p-6">
                           <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                 <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                                    Linha ativa
                                 </p>
                                 <h3 className="mt-2 text-2xl font-bold text-gray-900">
                                    {estrategia.nome}
                                 </h3>
                              </div>
                              <div
                                 className="rounded-full px-4 py-2 text-sm font-semibold text-white"
                                 style={{ backgroundColor: estrategia.cor }}
                              >
                                 aporte mensal{" "}
                                 {formatCurrency(
                                    estrategia.projecao_composta.aporte_mensal,
                                 )}
                              </div>
                           </div>

                           <div className="mt-5 grid gap-4 md:grid-cols-4">
                              <div className="rounded-2xl bg-emerald-50 p-4">
                                 <p className="text-xs uppercase tracking-[0.14em] text-emerald-700">
                                    Taxa estimada
                                 </p>
                                 <p className="mt-2 text-lg font-bold text-emerald-950">
                                    {estrategia.projecao_composta.taxa_mensal.toFixed(
                                       2,
                                    )}
                                    % a.m.
                                 </p>
                              </div>
                              <div className="rounded-2xl bg-emerald-50 p-4">
                                 <p className="text-xs uppercase tracking-[0.14em] text-emerald-700">
                                    Total aportado
                                 </p>
                                 <p className="mt-2 text-lg font-bold text-emerald-950">
                                    {formatCurrency(
                                       estrategia.projecao_composta.total_aportado,
                                    )}
                                 </p>
                              </div>
                              <div className="rounded-2xl bg-emerald-50 p-4">
                                 <p className="text-xs uppercase tracking-[0.14em] text-emerald-700">
                                    Juros estimados
                                 </p>
                                 <p className="mt-2 text-lg font-bold text-emerald-950">
                                    {formatCurrency(
                                       estrategia.projecao_composta.juros_estimados,
                                    )}
                                 </p>
                              </div>
                              <div className="rounded-2xl bg-emerald-50 p-4">
                                 <p className="text-xs uppercase tracking-[0.14em] text-emerald-700">
                                    Sem juros
                                 </p>
                                 <p className="mt-2 text-lg font-bold text-emerald-950">
                                    {formatCurrency(
                                       estrategia.projecao_composta.aporte_sem_juros,
                                    )}
                                 </p>
                              </div>
                           </div>

                           <div className="mt-6 grid gap-4 lg:grid-cols-3">
                              {(
                                 ["diaria", "semanal", "mensal"] as const
                              ).map((frequencia) => (
                                 <div
                                    key={frequencia}
                                    className="rounded-2xl border border-gray-100 p-4"
                                 >
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                                       {frequencia}
                                    </p>
                                    <ul className="mt-3 space-y-2">
                                       {estrategia.rotinas[frequencia].map(
                                          (item) => (
                                             <li
                                                key={item}
                                                className="text-sm leading-6 text-gray-600"
                                             >
                                                {item}
                                             </li>
                                          ),
                                       )}
                                    </ul>
                                 </div>
                              ))}
                           </div>
                        </div>

                        <div className="rounded-[26px] border border-gray-100 bg-white p-5 shadow-sm md:p-6">
                           <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                              Ajustes sugeridos
                           </p>
                           <div className="mt-4 space-y-3">
                              {estrategia.ajustes.map((ajuste) => (
                                 <div
                                    key={`${ajuste.categoria}-${ajuste.percentual_corte}`}
                                    className="rounded-2xl border border-gray-100 p-4"
                                 >
                                    <div className="flex items-start justify-between gap-3">
                                       <div>
                                          <p className="text-sm font-semibold text-gray-900">
                                             {ajuste.categoria}
                                          </p>
                                          <p className="mt-1 text-xs text-gray-400">
                                             {ajuste.motivo}
                                          </p>
                                       </div>
                                       <div className="text-right">
                                          <p className="text-sm font-bold text-gray-900">
                                             {formatCurrency(
                                                ajuste.economia_sugerida,
                                             )}
                                          </p>
                                          <p className="text-xs text-gray-400">
                                             Corte de {ajuste.percentual_corte}%
                                          </p>
                                       </div>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>
                     </section>
                  )}
               </>
            )}
         </div>
      </DashboardLayout>
   );
}
