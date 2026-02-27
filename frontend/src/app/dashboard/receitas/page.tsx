"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import authService from "@/services/authService";
import receitaService, {
   Receita,
   ReceitaCreate,
} from "@/services/receitaService";
import categoriaService, { Categoria } from "@/services/categoriaService";
import tipoPagamentoService, {
   TipoPagamento,
} from "@/services/tipoPagamentoService";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useMesa } from "@/contexts/MesaContext";
import { isApiError } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function gerarMeses() {
   const meses = [];
   const hoje = new Date();
   const nomes = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
   ];
   for (let i = -12; i <= 3; i++) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
      meses.push({
         valor: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
         label: `${nomes[d.getMonth()]}/${d.getFullYear()}`,
      });
   }
   return meses;
}

function mesAtual() {
   const d = new Date();
   return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatarValor(v: number | string) {
   return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
   }).format(parseFloat(String(v)));
}

function formatarData(data: string) {
   const [ano, mes, dia] = data.substring(0, 10).split("-");
   return `${dia}/${mes}/${ano}`;
}

// Receita está confirmada se status='recebida' OU se é confirmação de recorrente
function isConfirmada(r: Receita) {
   return r.status === "recebida" || r.origem_recorrente_id != null;
}

// ─── Badge de Status ──────────────────────────────────────────────────────────

function BadgeStatus({ receita }: { receita: Receita }) {
   if (isConfirmada(receita)) {
      return (
         <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            Recebida
         </span>
      );
   }
   return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
         <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />A receber
      </span>
   );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReceitasPage() {
   const router = useRouter();
   const { mesaSelecionada, carregando: mesaCarregando } = useMesa();

   const [receitas, setReceitas] = useState<Receita[]>([]);
   const [categorias, setCategorias] = useState<Categoria[]>([]);
   const [tiposPagamento, setTiposPagamento] = useState<TipoPagamento[]>([]);
   const [loading, setLoading] = useState(true);

   // Filtros
   const [mesSelecionado, setMesSelecionado] = useState(mesAtual());
   const [filtroStatus, setFiltroStatus] = useState<
      "todas" | "a_receber" | "recebida"
   >("todas");
   const [filtroRecorrente, setFiltroRecorrente] = useState<
      "todas" | "sim" | "nao"
   >("todas");

   // Modal criar/editar
   const [modalAberto, setModalAberto] = useState(false);
   const [editando, setEditando] = useState<Receita | null>(null);

   // Modal confirmar recebimento
   const [modalConfirmar, setModalConfirmar] = useState<Receita | null>(null);
   const [valorReal, setValorReal] = useState("");
   const [loadingConfirmar, setLoadingConfirmar] = useState(false);

   // Modal excluir
   const [modalExcluir, setModalExcluir] = useState<Receita | null>(null);
   const [loadingExcluir, setLoadingExcluir] = useState(false);

   // Campos formulário
   const [descricao, setDescricao] = useState("");
   const [valor, setValor] = useState("");
   const [dataRecebimento, setDataRecebimento] = useState("");
   const [categoriaId, setCategoriaId] = useState<number | "">("");
   const [tipoPagamentoId, setTipoPagamentoId] = useState<number | "">("");
   const [recorrente, setRecorrente] = useState(false);
   const [parcelas, setParcelas] = useState(1);

   const [erro, setErro] = useState("");
   const [sucesso, setSucesso] = useState("");

   const meses = useMemo(() => gerarMeses(), []);

   // Parcelas só aparecem se NÃO for recorrente
   const mostrarParcelas = !recorrente;
   // Recorrente só aparece se parcelas == 1
   const mostrarRecorrente = parcelas === 1;

   useEffect(() => {
      if (!authService.isAuthenticated()) {
         router.push("/login");
         return;
      }
      if (mesaCarregando) return;
      if (mesaSelecionada) carregarDados();
      else setLoading(false);
   }, [router, mesaSelecionada, mesaCarregando, mesSelecionado]);

   // ─── Carregamento ─────────────────────────────────────────────────────────

   const carregarDados = async () => {
      if (!mesaSelecionada) {
         setLoading(false);
         return;
      }
      setLoading(true);

      try {
         const [categoriasData, tiposData] = await Promise.all([
            categoriaService.listar("receita", false),
            tipoPagamentoService.listar(false),
         ]);
         setCategorias(categoriasData);
         setTiposPagamento(tiposData);
      } catch (err) {
         console.error("Erro ao carregar dados base:", err);
      }

      try {
         const receitasData = await receitaService.listar(
            mesaSelecionada.id,
            mesSelecionado,
         );
         setReceitas(receitasData);
      } catch (err) {
         console.error("Erro ao carregar receitas:", err);
         setErro("Erro ao carregar receitas");
      } finally {
         setLoading(false);
      }
   };

   // ─── Filtragem ────────────────────────────────────────────────────────────

   const receitasFiltradas = useMemo(() => {
      return receitas.filter((r) => {
         if (filtroStatus === "recebida" && !isConfirmada(r)) return false;
         if (filtroStatus === "a_receber" && isConfirmada(r)) return false;
         // Para filtro recorrente: confirmações de recorrentes contam como recorrentes
         const ehRecorrente = !!r.recorrente || r.origem_recorrente_id != null;
         if (filtroRecorrente === "sim" && !ehRecorrente) return false;
         if (filtroRecorrente === "nao" && ehRecorrente) return false;
         return true;
      });
   }, [receitas, filtroStatus, filtroRecorrente]);

   // ─── Totais (só confirmadas contam pro saldo real) ────────────────────────

   const { totalConfirmado, totalAReceber, totalProvisionado } = useMemo(() => {
      let confirmado = 0,
         aReceber = 0;
      receitasFiltradas.forEach((r) => {
         if (isConfirmada(r)) {
            // Usa valor_real se disponível, senão valor provisionado
            confirmado += parseFloat(String(r.valor_real ?? r.valor));
         } else {
            aReceber += parseFloat(String(r.valor));
         }
      });
      return {
         totalConfirmado: confirmado,
         totalAReceber: aReceber,
         totalProvisionado: confirmado + aReceber,
      };
   }, [receitasFiltradas]);

   // ─── Modal criar/editar ───────────────────────────────────────────────────

   const abrirModal = (receita?: Receita) => {
      if (receita) {
         setEditando(receita);
         setDescricao(receita.descricao);
         setValor(receita.valor.toString());
         setDataRecebimento(receita.data_recebimento.substring(0, 10));
         setCategoriaId(receita.categoria_id || "");
         setTipoPagamentoId(receita.tipo_pagamento_id || "");
         setRecorrente(!!receita.recorrente);
         setParcelas(receita.parcelas || 1);
      } else {
         setEditando(null);
         setDescricao("");
         setValor("");
         setDataRecebimento(`${mesSelecionado}-01`);
         setCategoriaId("");
         setTipoPagamentoId("");
         setRecorrente(false);
         setParcelas(1);
      }
      setErro("");
      setModalAberto(true);
   };

   const fecharModal = () => {
      setModalAberto(false);
      setEditando(null);
      setDescricao("");
      setValor("");
      setDataRecebimento("");
      setCategoriaId("");
      setTipoPagamentoId("");
      setRecorrente(false);
      setParcelas(1);
      setErro("");
   };

   const salvarReceita = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!mesaSelecionada) {
         setErro("Nenhuma mesa selecionada");
         return;
      }
      if (!descricao.trim()) {
         setErro("A descrição é obrigatória");
         return;
      }
      if (!valor || parseFloat(valor) <= 0) {
         setErro("O valor deve ser maior que zero");
         return;
      }
      if (!dataRecebimento) {
         setErro("A data de recebimento é obrigatória");
         return;
      }

      try {
         const receitaData: ReceitaCreate = {
            mesa_id: mesaSelecionada.id,
            descricao,
            valor: parseFloat(valor),
            data_recebimento: dataRecebimento,
            categoria_id: categoriaId ? Number(categoriaId) : undefined,
            tipo_pagamento_id: tipoPagamentoId
               ? Number(tipoPagamentoId)
               : undefined,
            recorrente,
            parcelas: recorrente ? 1 : parcelas,
         };

         if (editando) {
            await receitaService.atualizar(editando.id, receitaData);
            setSucesso("Receita atualizada!");
         } else {
            const res = await receitaService.criar(receitaData);
            const qtd = res.ids?.length || 1;
            setSucesso(
               qtd > 1
                  ? `${qtd} parcelas criadas com sucesso!`
                  : "Receita criada!",
            );
         }

         fecharModal();
         carregarDados();
         setTimeout(() => setSucesso(""), 3000);
      } catch (error) {
         if (isApiError(error))
            setErro(error.response?.data?.error || "Erro ao salvar receita");
         else setErro("Erro ao salvar receita");
      }
   };

   // ─── Confirmar recebimento ────────────────────────────────────────────────

   const abrirConfirmar = (receita: Receita) => {
      setModalConfirmar(receita);
      setValorReal(receita.valor.toString());
      setErro("");
   };

   const confirmarRecebimento = async () => {
      if (!modalConfirmar || !mesaSelecionada) return;
      if (!valorReal || parseFloat(valorReal) < 0) {
         setErro("Informe o valor recebido");
         return;
      }
      setLoadingConfirmar(true);
      try {
         await receitaService.confirmar(
            modalConfirmar.id,
            mesaSelecionada.id,
            mesSelecionado,
            parseFloat(valorReal),
         );
         setSucesso("Recebimento confirmado!");
         setModalConfirmar(null);
         carregarDados();
         setTimeout(() => setSucesso(""), 3000);
      } catch (error) {
         if (isApiError(error))
            setErro(error.response?.data?.error || "Erro ao confirmar");
         else setErro("Erro ao confirmar recebimento");
      } finally {
         setLoadingConfirmar(false);
      }
   };

   const desfazerConfirmacao = async (receita: Receita) => {
      if (!mesaSelecionada) return;
      try {
         await receitaService.desfazerConfirmacao(
            receita.id,
            mesaSelecionada.id,
         );
         setSucesso("Confirmação desfeita!");
         carregarDados();
         setTimeout(() => setSucesso(""), 3000);
      } catch {
         setErro("Erro ao desfazer confirmação");
      }
   };

   // ─── Excluir ──────────────────────────────────────────────────────────────

   const confirmarExclusao = async () => {
      if (!modalExcluir) return;
      setLoadingExcluir(true);
      try {
         await receitaService.inativar(modalExcluir.id, modalExcluir.mesa_id);
         setSucesso("Receita excluída!");
         setModalExcluir(null);
         carregarDados();
         setTimeout(() => setSucesso(""), 3000);
      } catch {
         setErro("Erro ao excluir receita");
      } finally {
         setLoadingExcluir(false);
      }
   };

   // ─── Loading ──────────────────────────────────────────────────────────────

   if (loading) {
      return (
         <DashboardLayout>
            <div className="flex items-center justify-center min-h-[60vh]">
               <div className="text-gray-500 text-sm">Carregando...</div>
            </div>
         </DashboardLayout>
      );
   }

   // ─── Render ───────────────────────────────────────────────────────────────

   return (
      <DashboardLayout>
         <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
               <div>
                  <h1 className="text-xl md:text-2xl font-bold text-gray-800">
                     Receitas
                  </h1>
                  <p className="text-xs md:text-sm text-gray-600 mt-1">
                     Mesa:{" "}
                     <span className="font-semibold text-green-600">
                        {mesaSelecionada?.nome}
                     </span>
                  </p>
               </div>
               <button
                  onClick={() => abrirModal()}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-md text-sm font-medium"
               >
                  <svg
                     className="w-5 h-5"
                     fill="none"
                     stroke="currentColor"
                     viewBox="0 0 24 24"
                  >
                     <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                     />
                  </svg>
                  Nova Receita
               </button>
            </div>

            {/* Mensagens */}
            {sucesso && (
               <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm">
                  {sucesso}
               </div>
            )}
            {erro && !modalAberto && !modalConfirmar && (
               <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                  {erro}
               </div>
            )}

            {/* Filtros */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-3 sm:p-4">
               {/* Mobile: bolinhas */}
               <div className="flex items-center gap-2 sm:hidden">
                  <select
                     value={mesSelecionado}
                     onChange={(e) => setMesSelecionado(e.target.value)}
                     className="flex-1 min-w-0 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-green-500"
                  >
                     {meses.map((m) => (
                        <option key={m.valor} value={m.valor}>
                           {m.label}
                        </option>
                     ))}
                  </select>
                  <div className="flex gap-1">
                     {[
                        { v: "todas", cor: "bg-gray-400", t: "Todas" },
                        { v: "a_receber", cor: "bg-blue-500", t: "A receber" },
                        { v: "recebida", cor: "bg-green-500", t: "Recebida" },
                     ].map((op) => (
                        <button
                           key={op.v}
                           title={op.t}
                           onClick={() =>
                              setFiltroStatus(op.v as typeof filtroStatus)
                           }
                           className={`w-5 h-5 rounded-full transition-all ${op.cor} ${filtroStatus === op.v ? "ring-2 ring-offset-1 ring-gray-400 scale-110" : "opacity-30"}`}
                        />
                     ))}
                  </div>
                  <span className="text-gray-300 text-xs">|</span>
                  <div className="flex gap-1">
                     {[
                        { v: "todas", cor: "bg-gray-400", t: "Todas" },
                        { v: "sim", cor: "bg-purple-500", t: "Recorrente" },
                        { v: "nao", cor: "bg-orange-400", t: "Não recorr." },
                     ].map((op) => (
                        <button
                           key={op.v}
                           title={op.t}
                           onClick={() =>
                              setFiltroRecorrente(
                                 op.v as typeof filtroRecorrente,
                              )
                           }
                           className={`w-5 h-5 rounded-full transition-all ${op.cor} ${filtroRecorrente === op.v ? "ring-2 ring-offset-1 ring-gray-400 scale-110" : "opacity-30"}`}
                        />
                     ))}
                  </div>
               </div>

               {/* Desktop */}
               <div className="hidden sm:flex gap-3">
                  <div className="flex-1">
                     <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                        Mês
                     </label>
                     <select
                        value={mesSelecionado}
                        onChange={(e) => setMesSelecionado(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                     >
                        {meses.map((m) => (
                           <option key={m.valor} value={m.valor}>
                              {m.label}
                           </option>
                        ))}
                     </select>
                  </div>
                  <div className="flex-1">
                     <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                        Status
                     </label>
                     <div className="flex rounded-lg overflow-hidden border border-gray-200">
                        {[
                           { v: "todas", l: "Todas" },
                           { v: "a_receber", l: "A receber" },
                           { v: "recebida", l: "Recebida" },
                        ].map((op) => (
                           <button
                              key={op.v}
                              onClick={() =>
                                 setFiltroStatus(op.v as typeof filtroStatus)
                              }
                              className={`flex-1 py-2 text-xs font-medium transition-colors ${filtroStatus === op.v ? "bg-green-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                           >
                              {op.l}
                           </button>
                        ))}
                     </div>
                  </div>
                  <div className="flex-1">
                     <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                        Recorrente
                     </label>
                     <div className="flex rounded-lg overflow-hidden border border-gray-200">
                        {[
                           { v: "todas", l: "Todas" },
                           { v: "sim", l: "Sim" },
                           { v: "nao", l: "Não" },
                        ].map((op) => (
                           <button
                              key={op.v}
                              onClick={() =>
                                 setFiltroRecorrente(
                                    op.v as typeof filtroRecorrente,
                                 )
                              }
                              className={`flex-1 py-2 text-xs font-medium transition-colors ${filtroRecorrente === op.v ? "bg-green-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                           >
                              {op.l}
                           </button>
                        ))}
                     </div>
                  </div>
               </div>
            </div>

            {/* Cards de Resumo */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
               <div className="bg-white rounded-xl shadow-md border border-gray-100 p-2.5 sm:p-4">
                  <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5">
                     <span className="sm:hidden">Confirmado</span>
                     <span className="hidden sm:inline">Confirmado no mês</span>
                  </p>
                  <p className="text-sm sm:text-lg font-bold text-green-600 truncate">
                     {formatarValor(totalConfirmado)}
                  </p>
               </div>
               <div className="bg-white rounded-xl shadow-md border border-gray-100 p-2.5 sm:p-4">
                  <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5">
                     A receber
                  </p>
                  <p className="text-sm sm:text-lg font-bold text-blue-600 truncate">
                     {formatarValor(totalAReceber)}
                  </p>
               </div>
               <div className="bg-white rounded-xl shadow-md border border-gray-100 p-2.5 sm:p-4">
                  <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5">
                     <span className="sm:hidden">Previsto</span>
                     <span className="hidden sm:inline">Total previsto</span>
                  </p>
                  <p className="text-sm sm:text-lg font-bold text-gray-700 truncate">
                     {formatarValor(totalProvisionado)}
                  </p>
               </div>
            </div>

            {/* Lista */}
            {receitasFiltradas.length === 0 ? (
               <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8 text-center text-gray-500">
                  <svg
                     className="w-16 h-16 mx-auto mb-4 text-gray-300"
                     fill="none"
                     stroke="currentColor"
                     viewBox="0 0 24 24"
                  >
                     <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                     />
                  </svg>
                  <p className="text-base font-medium">
                     Nenhuma receita encontrada
                  </p>
                  <p className="text-sm mt-1 text-gray-400">
                     Tente outro mês ou adicione uma nova receita
                  </p>
               </div>
            ) : (
               <>
                  {/* MOBILE: cards */}
                  <div className="flex flex-col gap-3 sm:hidden">
                     {receitasFiltradas.map((receita) => {
                        const confirmada = isConfirmada(receita);
                        const isConfirmacaoRecorrente =
                           receita.origem_recorrente_id != null;
                        const ehRecorrente =
                           !!receita.recorrente || isConfirmacaoRecorrente;

                        return (
                           <div
                              key={receita.id}
                              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
                           >
                              <div className="flex items-start justify-between mb-2">
                                 <div className="flex-1 min-w-0 pr-2">
                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                       {receita.descricao}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                       {formatarData(receita.data_recebimento)}
                                    </p>
                                 </div>
                                 <div className="text-right">
                                    {confirmada &&
                                    receita.valor_real != null &&
                                    parseFloat(String(receita.valor_real)) !==
                                       parseFloat(String(receita.valor)) ? (
                                       <div>
                                          <p className="text-base font-bold text-green-600">
                                             {formatarValor(receita.valor_real)}
                                          </p>
                                          <p className="text-xs text-gray-400 line-through">
                                             {formatarValor(receita.valor)}
                                          </p>
                                       </div>
                                    ) : (
                                       <p
                                          className={`text-base font-bold ${confirmada ? "text-green-600" : "text-gray-700"}`}
                                       >
                                          {formatarValor(receita.valor)}
                                       </p>
                                    )}
                                 </div>
                              </div>
                              <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-1.5 flex-wrap">
                                    <BadgeStatus receita={receita} />
                                    {ehRecorrente && (
                                       <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                          {isConfirmacaoRecorrente
                                             ? "Recorrente ✓"
                                             : "Recorrente"}
                                       </span>
                                    )}
                                    {receita.parcelas > 1 && (
                                       <span className="text-xs text-gray-400">
                                          {receita.parcela_atual}/
                                          {receita.parcelas}
                                       </span>
                                    )}
                                 </div>
                                 <div className="flex items-center gap-1 ml-2 shrink-0">
                                    {/* Confirmar / Desfazer */}
                                    {confirmada ? (
                                       <button
                                          title="Desfazer confirmação"
                                          onClick={() =>
                                             desfazerConfirmacao(receita)
                                          }
                                          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                                       >
                                          <svg
                                             className="w-[18px] h-[18px]"
                                             fill="none"
                                             stroke="currentColor"
                                             viewBox="0 0 24 24"
                                          >
                                             <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                                             />
                                          </svg>
                                       </button>
                                    ) : (
                                       <button
                                          title="Confirmar recebimento"
                                          onClick={() =>
                                             abrirConfirmar(receita)
                                          }
                                          className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 hover:text-green-700 transition-colors"
                                       >
                                          <svg
                                             className="w-[18px] h-[18px]"
                                             fill="none"
                                             stroke="currentColor"
                                             viewBox="0 0 24 24"
                                          >
                                             <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                             />
                                          </svg>
                                       </button>
                                    )}
                                    {/* Editar (não mostra para confirmações de recorrente) */}
                                    {!isConfirmacaoRecorrente && (
                                       <button
                                          title="Editar"
                                          onClick={() => abrirModal(receita)}
                                          className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                       >
                                          <svg
                                             className="w-[18px] h-[18px]"
                                             fill="none"
                                             stroke="currentColor"
                                             viewBox="0 0 24 24"
                                          >
                                             <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                             />
                                          </svg>
                                       </button>
                                    )}
                                    <button
                                       title="Excluir"
                                       onClick={() => setModalExcluir(receita)}
                                       className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                    >
                                       <svg
                                          className="w-[18px] h-[18px]"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                       >
                                          <path
                                             strokeLinecap="round"
                                             strokeLinejoin="round"
                                             strokeWidth={2}
                                             d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                          />
                                       </svg>
                                    </button>
                                 </div>
                              </div>
                           </div>
                        );
                     })}
                  </div>

                  {/* DESKTOP: tabela */}
                  <div className="hidden sm:block bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                     <div className="overflow-x-auto">
                        <table className="w-full">
                           <thead className="bg-gray-50 border-b border-gray-200">
                              <tr>
                                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Descrição
                                 </th>
                                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Categoria
                                 </th>
                                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Tipo Pgto
                                 </th>
                                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Provisionado
                                 </th>
                                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Confirmado
                                 </th>
                                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Data
                                 </th>
                                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Status
                                 </th>
                                 <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    Ações
                                 </th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-100">
                              {receitasFiltradas.map((receita) => {
                                 const confirmada = isConfirmada(receita);
                                 const isConfirmacaoRecorrente =
                                    receita.origem_recorrente_id != null;
                                 const ehRecorrente =
                                    !!receita.recorrente ||
                                    isConfirmacaoRecorrente;

                                 return (
                                    <tr
                                       key={receita.id}
                                       className="hover:bg-gray-50 transition-colors"
                                    >
                                       <td className="px-4 py-3">
                                          <div className="text-sm font-medium text-gray-900">
                                             {receita.descricao}
                                          </div>
                                          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                             {ehRecorrente && (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                                                   {isConfirmacaoRecorrente
                                                      ? "Recorrente ✓"
                                                      : "Recorrente"}
                                                </span>
                                             )}
                                             {receita.parcelas > 1 && (
                                                <span className="text-xs text-gray-400">
                                                   {receita.parcela_atual}/
                                                   {receita.parcelas}
                                                </span>
                                             )}
                                          </div>
                                       </td>
                                       <td className="px-4 py-3 text-sm text-gray-600">
                                          {receita.categoria_nome || "—"}
                                       </td>
                                       <td className="px-4 py-3 text-sm text-gray-600">
                                          {receita.tipo_pagamento_nome || "—"}
                                       </td>
                                       <td className="px-4 py-3 text-sm text-gray-500">
                                          {formatarValor(receita.valor)}
                                       </td>
                                       <td className="px-4 py-3 text-sm font-semibold">
                                          {confirmada ? (
                                             <span className="text-green-600">
                                                {formatarValor(
                                                   receita.valor_real ??
                                                      receita.valor,
                                                )}
                                             </span>
                                          ) : (
                                             <span className="text-gray-300">
                                                —
                                             </span>
                                          )}
                                       </td>
                                       <td className="px-4 py-3 text-sm text-gray-600">
                                          {formatarData(
                                             receita.data_recebimento,
                                          )}
                                       </td>
                                       <td className="px-4 py-3">
                                          <BadgeStatus receita={receita} />
                                       </td>
                                       <td className="px-4 py-3 text-right">
                                          <div className="flex items-center justify-end gap-1">
                                             {confirmada ? (
                                                <button
                                                   title="Desfazer confirmação"
                                                   onClick={() =>
                                                      desfazerConfirmacao(
                                                         receita,
                                                      )
                                                   }
                                                   className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                                                >
                                                   <svg
                                                      className="w-[18px] h-[18px]"
                                                      fill="none"
                                                      stroke="currentColor"
                                                      viewBox="0 0 24 24"
                                                   >
                                                      <path
                                                         strokeLinecap="round"
                                                         strokeLinejoin="round"
                                                         strokeWidth={2}
                                                         d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                                                      />
                                                   </svg>
                                                </button>
                                             ) : (
                                                <button
                                                   title="Confirmar recebimento"
                                                   onClick={() =>
                                                      abrirConfirmar(receita)
                                                   }
                                                   className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 hover:text-green-700 transition-colors"
                                                >
                                                   <svg
                                                      className="w-[18px] h-[18px]"
                                                      fill="none"
                                                      stroke="currentColor"
                                                      viewBox="0 0 24 24"
                                                   >
                                                      <path
                                                         strokeLinecap="round"
                                                         strokeLinejoin="round"
                                                         strokeWidth={2}
                                                         d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                      />
                                                   </svg>
                                                </button>
                                             )}
                                             {!isConfirmacaoRecorrente && (
                                                <button
                                                   title="Editar"
                                                   onClick={() =>
                                                      abrirModal(receita)
                                                   }
                                                   className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                                >
                                                   <svg
                                                      className="w-[18px] h-[18px]"
                                                      fill="none"
                                                      stroke="currentColor"
                                                      viewBox="0 0 24 24"
                                                   >
                                                      <path
                                                         strokeLinecap="round"
                                                         strokeLinejoin="round"
                                                         strokeWidth={2}
                                                         d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                      />
                                                   </svg>
                                                </button>
                                             )}
                                             <button
                                                title="Excluir"
                                                onClick={() =>
                                                   setModalExcluir(receita)
                                                }
                                                className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                             >
                                                <svg
                                                   className="w-[18px] h-[18px]"
                                                   fill="none"
                                                   stroke="currentColor"
                                                   viewBox="0 0 24 24"
                                                >
                                                   <path
                                                      strokeLinecap="round"
                                                      strokeLinejoin="round"
                                                      strokeWidth={2}
                                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                   />
                                                </svg>
                                             </button>
                                          </div>
                                       </td>
                                    </tr>
                                 );
                              })}
                           </tbody>
                        </table>
                     </div>
                  </div>
               </>
            )}
         </div>

         {/* ══════════════════════════════════════════════════════════════
             Modal Criar / Editar
         ══════════════════════════════════════════════════════════════ */}
         {modalAberto && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 sm:p-6">
               <div className="bg-white rounded-xl shadow-2xl w-full max-w-md sm:max-w-lg max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
                  <div className="p-4 sm:p-6">
                     <h2 className="text-lg font-bold text-gray-800 mb-1">
                        {editando ? "Editar Receita" : "Nova Receita"}
                     </h2>
                     <p className="text-xs text-gray-500 mb-4">
                        Mesa:{" "}
                        <span className="font-semibold text-green-600">
                           {mesaSelecionada?.nome}
                        </span>
                     </p>

                     {erro && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                           {erro}
                        </div>
                     )}

                     <form
                        onSubmit={salvarReceita}
                        className="space-y-3 sm:space-y-4"
                     >
                        {/* Descrição */}
                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-2">
                              Descrição *
                           </label>
                           <input
                              type="text"
                              value={descricao}
                              onChange={(e) => setDescricao(e.target.value)}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              placeholder="Ex: Salário de Fevereiro"
                              autoFocus
                           />
                        </div>

                        {/* Valor + Data */}
                        <div className="grid grid-cols-2 gap-3">
                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                 {parcelas > 1
                                    ? "Valor por parcela *"
                                    : "Valor provisionado *"}
                              </label>
                              <input
                                 type="number"
                                 step="0.01"
                                 value={valor}
                                 onChange={(e) => setValor(e.target.value)}
                                 className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                 placeholder="0,00"
                              />
                           </div>
                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                 {parcelas > 1
                                    ? "Data da 1ª parcela *"
                                    : "Data de recebimento *"}
                              </label>
                              <input
                                 type="date"
                                 value={dataRecebimento}
                                 onChange={(e) =>
                                    setDataRecebimento(e.target.value)
                                 }
                                 className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              />
                           </div>
                        </div>

                        {/* Categoria + Tipo */}
                        <div className="grid grid-cols-2 gap-3">
                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                 Categoria
                              </label>
                              <select
                                 value={categoriaId}
                                 onChange={(e) =>
                                    setCategoriaId(Number(e.target.value))
                                 }
                                 className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              >
                                 <option value="">Sem categoria</option>
                                 {categorias.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                       {cat.nome}
                                    </option>
                                 ))}
                              </select>
                           </div>
                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                 Tipo de pagamento
                              </label>
                              <select
                                 value={tipoPagamentoId}
                                 onChange={(e) =>
                                    setTipoPagamentoId(Number(e.target.value))
                                 }
                                 className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              >
                                 <option value="">Selecione...</option>
                                 {tiposPagamento.map((tp) => (
                                    <option key={tp.id} value={tp.id}>
                                       {tp.nome}
                                    </option>
                                 ))}
                              </select>
                           </div>
                        </div>

                        {/* Recorrente — só aparece se parcelas == 1 */}
                        {mostrarRecorrente && (
                           <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg border border-purple-100">
                              <input
                                 type="checkbox"
                                 id="recorrente"
                                 checked={recorrente}
                                 onChange={(e) => {
                                    setRecorrente(e.target.checked);
                                    if (e.target.checked) setParcelas(1);
                                 }}
                                 className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                              />
                              <label
                                 htmlFor="recorrente"
                                 className="text-sm text-gray-700 cursor-pointer"
                              >
                                 Receita recorrente
                                 <span className="text-gray-400 text-xs ml-1">
                                    (se repete todo mês)
                                 </span>
                              </label>
                           </div>
                        )}

                        {/* Parcelas — só aparece se NÃO recorrente e NÃO editando */}
                        {mostrarParcelas && !editando && (
                           <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                              <div className="flex items-center justify-between mb-2">
                                 <label className="text-sm font-medium text-green-800">
                                    💵 Parcelar recebimento
                                 </label>
                                 {parcelas > 1 && (
                                    <span className="text-xs text-green-600 font-semibold bg-green-100 px-2 py-0.5 rounded-full">
                                       {parcelas}x de{" "}
                                       {valor
                                          ? formatarValor(parseFloat(valor))
                                          : "R$ 0,00"}
                                    </span>
                                 )}
                              </div>
                              <div className="flex items-center gap-3">
                                 <input
                                    type="range"
                                    min={1}
                                    max={24}
                                    value={parcelas}
                                    onChange={(e) =>
                                       setParcelas(parseInt(e.target.value))
                                    }
                                    className="flex-1 h-2 bg-green-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                                 />
                                 <div className="flex items-center gap-1 bg-white border border-green-200 rounded-lg px-2 py-1">
                                    <button
                                       type="button"
                                       onClick={() =>
                                          setParcelas(Math.max(1, parcelas - 1))
                                       }
                                       className="w-5 h-5 flex items-center justify-center text-green-600 hover:bg-green-50 rounded font-bold text-lg"
                                    >
                                       -
                                    </button>
                                    <span className="w-6 text-center text-sm font-bold text-green-700">
                                       {parcelas}
                                    </span>
                                    <button
                                       type="button"
                                       onClick={() =>
                                          setParcelas(
                                             Math.min(24, parcelas + 1),
                                          )
                                       }
                                       className="w-5 h-5 flex items-center justify-center text-green-600 hover:bg-green-50 rounded font-bold text-lg"
                                    >
                                       +
                                    </button>
                                 </div>
                              </div>
                              {parcelas > 1 && (
                                 <p className="text-xs text-green-600 mt-2">
                                    {parcelas} lançamentos de{" "}
                                    {valor
                                       ? formatarValor(parseFloat(valor))
                                       : "R$ 0,00"}{" "}
                                    — 1 por mês a partir de{" "}
                                    {dataRecebimento
                                       ? formatarData(`${dataRecebimento}`)
                                       : "..."}
                                 </p>
                              )}
                           </div>
                        )}

                        <div className="flex gap-3 pt-1">
                           <button
                              type="button"
                              onClick={fecharModal}
                              className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm"
                           >
                              Cancelar
                           </button>
                           <button
                              type="submit"
                              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all font-medium text-sm"
                           >
                              {editando
                                 ? "Atualizar"
                                 : parcelas > 1
                                   ? `Criar ${parcelas} parcelas`
                                   : "Criar"}
                           </button>
                        </div>
                     </form>
                  </div>
               </div>
            </div>
         )}

         {/* ══════════════════════════════════════════════════════════════
             Modal Confirmar Recebimento
         ══════════════════════════════════════════════════════════════ */}
         {modalConfirmar && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
                  <div className="p-6">
                     {/* Ícone + título */}
                     <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                           <svg
                              className="w-6 h-6 text-green-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                           >
                              <path
                                 strokeLinecap="round"
                                 strokeLinejoin="round"
                                 strokeWidth={2}
                                 d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                           </svg>
                        </div>
                        <div>
                           <h2 className="text-base font-bold text-gray-800">
                              Confirmar recebimento
                           </h2>
                           <p className="text-xs text-gray-500 truncate max-w-[200px]">
                              {modalConfirmar.descricao}
                           </p>
                        </div>
                     </div>

                     {/* Valor provisionado (referência) */}
                     <div className="bg-gray-50 rounded-lg px-3 py-2 mb-4 flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                           Valor provisionado
                        </span>
                        <span className="text-sm font-semibold text-gray-700">
                           {formatarValor(modalConfirmar.valor)}
                        </span>
                     </div>

                     {erro && (
                        <div className="mb-3 bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-lg text-xs">
                           {erro}
                        </div>
                     )}

                     {/* Valor real */}
                     <div className="mb-5">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                           Valor efetivamente recebido
                        </label>
                        <input
                           type="number"
                           step="0.01"
                           value={valorReal}
                           onChange={(e) => setValorReal(e.target.value)}
                           className="w-full px-4 py-2.5 border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg font-semibold text-green-700"
                           placeholder="0,00"
                           autoFocus
                        />
                        {valorReal &&
                           parseFloat(valorReal) !==
                              parseFloat(String(modalConfirmar.valor)) && (
                              <p className="text-xs mt-1.5 text-orange-500">
                                 {parseFloat(valorReal) >
                                 parseFloat(String(modalConfirmar.valor))
                                    ? `▲ +${formatarValor(parseFloat(valorReal) - parseFloat(String(modalConfirmar.valor)))} acima do previsto`
                                    : `▼ ${formatarValor(parseFloat(String(modalConfirmar.valor)) - parseFloat(valorReal))} abaixo do previsto`}
                              </p>
                           )}
                     </div>

                     <div className="flex gap-3">
                        <button
                           onClick={() => {
                              setModalConfirmar(null);
                              setErro("");
                           }}
                           className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
                        >
                           Cancelar
                        </button>
                        <button
                           onClick={confirmarRecebimento}
                           disabled={loadingConfirmar}
                           className="flex-1 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold text-sm hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50"
                        >
                           {loadingConfirmar ? "Confirmando..." : "Confirmar"}
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* ══════════════════════════════════════════════════════════════
             Modal Excluir
         ══════════════════════════════════════════════════════════════ */}
         {modalExcluir && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
                  <div className="p-6 text-center">
                     <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg
                           className="w-7 h-7 text-red-600"
                           fill="none"
                           stroke="currentColor"
                           viewBox="0 0 24 24"
                        >
                           <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                           />
                        </svg>
                     </div>
                     <h2 className="text-base font-bold text-gray-800 mb-1">
                        Excluir receita
                     </h2>
                     <p className="text-sm text-gray-500 mb-1 font-medium truncate px-2">
                        {modalExcluir.descricao}
                     </p>
                     <p className="text-xs text-gray-400 mb-5">
                        Esta ação não pode ser desfeita.
                     </p>
                     <div className="flex gap-3">
                        <button
                           onClick={() => setModalExcluir(null)}
                           className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
                        >
                           Cancelar
                        </button>
                        <button
                           onClick={confirmarExclusao}
                           disabled={loadingExcluir}
                           className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                           {loadingExcluir ? "Excluindo..." : "Excluir"}
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         )}
      </DashboardLayout>
   );
}
