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

// Gera lista de meses (12 meses para trás + 3 para frente)
function gerarMeses(): { valor: string; label: string }[] {
   const meses = [];
   const hoje = new Date();
   for (let i = -12; i <= 3; i++) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
      const ano = d.getFullYear();
      const mes = String(d.getMonth() + 1).padStart(2, "0");
      const nomesMes = [
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
      meses.push({
         valor: `${ano}-${mes}`,
         label: `${nomesMes[d.getMonth()]}/${ano}`,
      });
   }
   return meses;
}

function mesAtual(): string {
   const d = new Date();
   return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

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

   // Modal
   const [modalAberto, setModalAberto] = useState(false);
   const [editando, setEditando] = useState<Receita | null>(null);

   // Campos do formulário
   const [descricao, setDescricao] = useState("");
   const [valor, setValor] = useState("");
   const [dataRecebimento, setDataRecebimento] = useState("");
   const [categoriaId, setCategoriaId] = useState<number | "">("");
   const [tipoPagamentoId, setTipoPagamentoId] = useState<number | "">("");
   const [recorrente, setRecorrente] = useState(false);

   const [erro, setErro] = useState("");
   const [sucesso, setSucesso] = useState("");

   const meses = useMemo(() => gerarMeses(), []);

   useEffect(() => {
      if (!authService.isAuthenticated()) {
         router.push("/login");
         return;
      }
      // Aguarda o MesaContext terminar de carregar antes de agir
      if (mesaCarregando) return;

      if (mesaSelecionada) {
         carregarDados();
      } else {
         setLoading(false);
      }
   }, [router, mesaSelecionada, mesaCarregando, mesSelecionado]);

   const carregarDados = async () => {
      if (!mesaSelecionada) {
         setLoading(false);
         return;
      }
      try {
         setLoading(true);
         const [receitasData, categoriasData, tiposData] = await Promise.all([
            receitaService.listar(mesaSelecionada.id, mesSelecionado),
            categoriaService.listar("receita", false),
            tipoPagamentoService.listar(false),
         ]);
         setReceitas(receitasData);
         setCategorias(categoriasData);
         setTiposPagamento(tiposData);
      } catch (error) {
         console.error("Erro ao carregar dados:", error);
         setErro("Erro ao carregar dados");
      } finally {
         setLoading(false);
      }
   };

   // Filtragem no frontend apenas por status + recorrente (mês já vem filtrado do backend)
   const receitasFiltradas = useMemo(() => {
      return receitas.filter((r) => {
         // Filtro por status
         const hoje = new Date().toISOString().split("T")[0];
         const dataStr = r.data_recebimento.substring(0, 10); // garante "YYYY-MM-DD"
         const recebida = dataStr <= hoje;
         if (filtroStatus === "recebida" && !recebida) return false;
         if (filtroStatus === "a_receber" && recebida) return false;

         // Filtro por recorrente
         if (filtroRecorrente === "sim" && !r.recorrente) return false;
         if (filtroRecorrente === "nao" && r.recorrente) return false;

         return true;
      });
   }, [receitas, filtroStatus, filtroRecorrente]);

   // Totais do mês filtrado
   const totalRecebido = useMemo(() => {
      const hoje = new Date().toISOString().split("T")[0];
      return receitasFiltradas
         .filter((r) => r.data_recebimento.substring(0, 10) <= hoje)
         .reduce((acc, r) => acc + parseFloat(String(r.valor)), 0);
   }, [receitasFiltradas]);

   const totalAReceber = useMemo(() => {
      const hoje = new Date().toISOString().split("T")[0];
      return receitasFiltradas
         .filter((r) => r.data_recebimento.substring(0, 10) > hoje)
         .reduce((acc, r) => acc + parseFloat(String(r.valor)), 0);
   }, [receitasFiltradas]);

   const abrirModal = (receita?: Receita) => {
      if (receita) {
         setEditando(receita);
         setDescricao(receita.descricao);
         setValor(receita.valor.toString());
         setDataRecebimento(receita.data_recebimento);
         setCategoriaId(receita.categoria_id || "");
         setTipoPagamentoId(receita.tipo_pagamento_id || "");
         setRecorrente(receita.recorrente);
      } else {
         setEditando(null);
         setDescricao("");
         setValor("");
         // Pré-preenche a data com o primeiro dia do mês selecionado
         setDataRecebimento(`${mesSelecionado}-01`);
         setCategoriaId("");
         setTipoPagamentoId("");
         setRecorrente(false);
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
         };

         if (editando) {
            await receitaService.atualizar(editando.id, receitaData);
            setSucesso("Receita atualizada com sucesso!");
         } else {
            await receitaService.criar(receitaData);
            setSucesso("Receita criada com sucesso!");
         }

         fecharModal();
         carregarDados();
         setTimeout(() => setSucesso(""), 3000);
      } catch (error) {
         if (isApiError(error)) {
            setErro(error.response?.data?.error || "Erro ao salvar receita");
         } else {
            setErro("Erro ao salvar receita");
         }
      }
   };

   const excluirReceita = async (receita: Receita) => {
      if (!confirm(`Deseja excluir a receita "${receita.descricao}"?`)) return;
      try {
         await receitaService.inativar(receita.id, receita.mesa_id);
         setSucesso("Receita excluída com sucesso!");
         carregarDados();
         setTimeout(() => setSucesso(""), 3000);
      } catch {
         setErro("Erro ao excluir receita");
      }
   };

   const formatarValor = (valor: number | string) =>
      new Intl.NumberFormat("pt-BR", {
         style: "currency",
         currency: "BRL",
      }).format(parseFloat(String(valor)));

   // MySQL pode retornar "2026-02-01T00:00:00.000Z" ou "2026-02-01"
   // substring(0,10) garante que pegamos sempre "YYYY-MM-DD"
   const formatarData = (data: string) => {
      const dataLimpa = data.substring(0, 10);
      const [ano, mes, dia] = dataLimpa.split("-");
      return `${dia}/${mes}/${ano}`;
   };

   const getStatusReceita = (receita: Receita) => {
      const hoje = new Date().toISOString().split("T")[0];
      return receita.data_recebimento <= hoje ? "recebida" : "a_receber";
   };

   if (loading) {
      return (
         <DashboardLayout>
            <div className="flex items-center justify-center min-h-screen">
               <div className="text-gray-600">Carregando...</div>
            </div>
         </DashboardLayout>
      );
   }

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
                  className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-md text-sm font-medium"
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
                  <span>Nova Receita</span>
               </button>
            </div>

            {/* Mensagens */}
            {sucesso && (
               <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm">
                  {sucesso}
               </div>
            )}
            {erro && !modalAberto && (
               <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                  {erro}
               </div>
            )}

            {/* Filtros — Desktop: colunas expandidas | Mobile: linha compacta */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-3 sm:p-4">
               {/* ── MOBILE ── */}
               <div className="flex items-center gap-2 sm:hidden">
                  {/* Mês compacto */}
                  <select
                     value={mesSelecionado}
                     onChange={(e) => setMesSelecionado(e.target.value)}
                     className="flex-1 min-w-0 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                     {meses.map((m) => (
                        <option key={m.valor} value={m.valor}>
                           {m.label}
                        </option>
                     ))}
                  </select>

                  {/* Status — bolinhas */}
                  <div className="flex items-center gap-1">
                     {[
                        { valor: "todas", cor: "bg-gray-400", titulo: "Todas" },
                        {
                           valor: "a_receber",
                           cor: "bg-blue-500",
                           titulo: "A receber",
                        },
                        {
                           valor: "recebida",
                           cor: "bg-green-500",
                           titulo: "Recebida",
                        },
                     ].map((op) => (
                        <button
                           key={op.valor}
                           title={op.titulo}
                           onClick={() =>
                              setFiltroStatus(op.valor as typeof filtroStatus)
                           }
                           className={`w-5 h-5 rounded-full transition-all ${op.cor} ${
                              filtroStatus === op.valor
                                 ? "ring-2 ring-offset-1 ring-gray-400 scale-110"
                                 : "opacity-30"
                           }`}
                        />
                     ))}
                  </div>

                  {/* Divisor */}
                  <span className="text-gray-300 text-xs">|</span>

                  {/* Recorrente — bolinhas */}
                  <div className="flex items-center gap-1">
                     {[
                        { valor: "todas", cor: "bg-gray-400", titulo: "Todas" },
                        {
                           valor: "sim",
                           cor: "bg-purple-500",
                           titulo: "Recorrente",
                        },
                        {
                           valor: "nao",
                           cor: "bg-orange-400",
                           titulo: "Não recorr.",
                        },
                     ].map((op) => (
                        <button
                           key={op.valor}
                           title={op.titulo}
                           onClick={() =>
                              setFiltroRecorrente(
                                 op.valor as typeof filtroRecorrente,
                              )
                           }
                           className={`w-5 h-5 rounded-full transition-all ${op.cor} ${
                              filtroRecorrente === op.valor
                                 ? "ring-2 ring-offset-1 ring-gray-400 scale-110"
                                 : "opacity-30"
                           }`}
                        />
                     ))}
                  </div>
               </div>

               {/* ── DESKTOP ── */}
               <div className="hidden sm:flex gap-3">
                  <div className="flex-1">
                     <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                        Mês
                     </label>
                     <select
                        value={mesSelecionado}
                        onChange={(e) => setMesSelecionado(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                           { valor: "todas", label: "Todas" },
                           { valor: "a_receber", label: "A receber" },
                           { valor: "recebida", label: "Recebida" },
                        ].map((op) => (
                           <button
                              key={op.valor}
                              onClick={() =>
                                 setFiltroStatus(
                                    op.valor as typeof filtroStatus,
                                 )
                              }
                              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                                 filtroStatus === op.valor
                                    ? "bg-green-600 text-white"
                                    : "bg-white text-gray-600 hover:bg-gray-50"
                              }`}
                           >
                              {op.label}
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
                           { valor: "todas", label: "Todas" },
                           { valor: "sim", label: "Sim" },
                           { valor: "nao", label: "Não" },
                        ].map((op) => (
                           <button
                              key={op.valor}
                              onClick={() =>
                                 setFiltroRecorrente(
                                    op.valor as typeof filtroRecorrente,
                                 )
                              }
                              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                                 filtroRecorrente === op.valor
                                    ? "bg-green-600 text-white"
                                    : "bg-white text-gray-600 hover:bg-gray-50"
                              }`}
                           >
                              {op.label}
                           </button>
                        ))}
                     </div>
                  </div>
               </div>
            </div>

            {/* Cards de Resumo */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
               <div className="bg-white rounded-xl shadow-md border border-gray-100 p-2.5 sm:p-4">
                  <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1 truncate">
                     <span className="sm:hidden">Recebido</span>
                     <span className="hidden sm:inline">Recebido no mês</span>
                  </p>
                  <p className="text-sm sm:text-lg font-bold text-green-600 truncate">
                     {formatarValor(totalRecebido)}
                  </p>
               </div>
               <div className="bg-white rounded-xl shadow-md border border-gray-100 p-2.5 sm:p-4">
                  <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1 truncate">
                     A receber
                  </p>
                  <p className="text-sm sm:text-lg font-bold text-blue-600 truncate">
                     {formatarValor(totalAReceber)}
                  </p>
               </div>
               <div className="bg-white rounded-xl shadow-md border border-gray-100 p-2.5 sm:p-4">
                  <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1 truncate">
                     <span className="sm:hidden">Total</span>
                     <span className="hidden sm:inline">Total previsto</span>
                  </p>
                  <p className="text-sm sm:text-lg font-bold text-gray-700 truncate">
                     {formatarValor(totalRecebido + totalAReceber)}
                  </p>
               </div>
            </div>

            {/* Lista de Receitas */}
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
                  {/* ── MOBILE: cards ── */}
                  <div className="flex flex-col gap-3 sm:hidden">
                     {receitasFiltradas.map((receita) => {
                        const status = getStatusReceita(receita);
                        return (
                           <div
                              key={receita.id}
                              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
                           >
                              {/* Linha 1: descrição + valor */}
                              <div className="flex items-start justify-between mb-2">
                                 <div className="flex-1 min-w-0 pr-2">
                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                       {receita.descricao}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                       {formatarData(receita.data_recebimento)}
                                    </p>
                                 </div>
                                 <p className="text-base font-bold text-green-600 whitespace-nowrap">
                                    {formatarValor(receita.valor)}
                                 </p>
                              </div>

                              {/* Linha 2: badges + ações */}
                              <div className="flex items-center justify-between mt-1">
                                 <div className="flex items-center gap-1.5 flex-wrap">
                                    {/* Status */}
                                    {status === "recebida" ? (
                                       <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                          Recebida
                                       </span>
                                    ) : (
                                       <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                          A receber
                                       </span>
                                    )}
                                    {/* Recorrente */}
                                    {receita.recorrente && (
                                       <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                          🔄 Recorrente
                                       </span>
                                    )}
                                    {/* Categoria */}
                                    {receita.categoria_nome && (
                                       <span className="text-xs text-gray-400">
                                          {receita.categoria_nome}
                                       </span>
                                    )}
                                 </div>

                                 {/* Ações */}
                                 <div className="flex gap-3 ml-2">
                                    <button
                                       onClick={() => abrirModal(receita)}
                                       className="text-blue-600 text-xs font-medium"
                                    >
                                       Editar
                                    </button>
                                    <button
                                       onClick={() => excluirReceita(receita)}
                                       className="text-red-500 text-xs font-medium"
                                    >
                                       Excluir
                                    </button>
                                 </div>
                              </div>
                           </div>
                        );
                     })}
                  </div>

                  {/* ── DESKTOP: tabela ── */}
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
                                    Valor
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
                                 const status = getStatusReceita(receita);
                                 return (
                                    <tr
                                       key={receita.id}
                                       className="hover:bg-gray-50 transition-colors"
                                    >
                                       <td className="px-4 py-3">
                                          <div className="text-sm font-medium text-gray-900">
                                             {receita.descricao}
                                          </div>
                                          {receita.recorrente && (
                                             <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 mt-0.5">
                                                🔄 Recorrente
                                             </span>
                                          )}
                                       </td>
                                       <td className="px-4 py-3 text-sm text-gray-600">
                                          {receita.categoria_nome || "—"}
                                       </td>
                                       <td className="px-4 py-3 text-sm text-gray-600">
                                          {receita.tipo_pagamento_nome || "—"}
                                       </td>
                                       <td className="px-4 py-3 text-sm font-semibold text-green-600">
                                          {formatarValor(receita.valor)}
                                       </td>
                                       <td className="px-4 py-3 text-sm text-gray-600">
                                          {formatarData(
                                             receita.data_recebimento,
                                          )}
                                       </td>
                                       <td className="px-4 py-3">
                                          {status === "recebida" ? (
                                             <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                                <span>Recebida</span>
                                             </span>
                                          ) : (
                                             <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                                <span>A receber</span>
                                             </span>
                                          )}
                                       </td>
                                       <td className="px-4 py-3 text-right space-x-2">
                                          <button
                                             onClick={() => abrirModal(receita)}
                                             className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                          >
                                             Editar
                                          </button>
                                          <button
                                             onClick={() =>
                                                excluirReceita(receita)
                                             }
                                             className="text-red-500 hover:text-red-700 text-sm font-medium"
                                          >
                                             Excluir
                                          </button>
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

         {/* Modal Criar/Editar */}
         {modalAberto && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
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

                     <form onSubmit={salvarReceita} className="space-y-4">
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

                        {/* Valor e Data */}
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                 Valor *
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
                                 Data de Recebimento *
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

                        {/* Categoria e Tipo de Pagamento */}
                        <div className="grid grid-cols-2 gap-4">
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
                                 Tipo de Pagamento
                              </label>
                              <select
                                 value={tipoPagamentoId}
                                 onChange={(e) =>
                                    setTipoPagamentoId(Number(e.target.value))
                                 }
                                 className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              >
                                 <option value="">Selecione...</option>
                                 {tiposPagamento.map((tipo) => (
                                    <option key={tipo.id} value={tipo.id}>
                                       {tipo.nome}
                                    </option>
                                 ))}
                              </select>
                           </div>
                        </div>

                        {/* Recorrente */}
                        <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                           <input
                              type="checkbox"
                              id="recorrente"
                              checked={recorrente}
                              onChange={(e) => setRecorrente(e.target.checked)}
                              className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                           />
                           <label
                              htmlFor="recorrente"
                              className="text-sm text-gray-700 cursor-pointer"
                           >
                              Receita recorrente{" "}
                              <span className="text-gray-400 text-xs">
                                 (se repete todo mês)
                              </span>
                           </label>
                        </div>

                        <div className="flex space-x-3 pt-2">
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
                              {editando ? "Atualizar" : "Criar"}
                           </button>
                        </div>
                     </form>
                  </div>
               </div>
            </div>
         )}
      </DashboardLayout>
   );
}
