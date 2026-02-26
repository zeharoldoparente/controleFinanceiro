"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import authService from "@/services/authService";
import receitaService, {
   Receita,
   ReceitaCreate,
} from "@/services/receitaService";
import mesaService from "@/services/mesaService";
import categoriaService, { Categoria } from "@/services/categoriaService";
import tipoPagamentoService, {
   TipoPagamento,
} from "@/services/tipoPagamentoService";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { isApiError } from "@/types";

export default function ReceitasPage() {
   const router = useRouter();
   const [receitas, setReceitas] = useState<Receita[]>([]);
   const [categorias, setCategorias] = useState<Categoria[]>([]);
   const [tiposPagamento, setTiposPagamento] = useState<TipoPagamento[]>([]);
   const [mesas, setMesas] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [mostrarInativas, setMostrarInativas] = useState(false);
   const [modalAberto, setModalAberto] = useState(false);
   const [editando, setEditando] = useState<Receita | null>(null);

   // Campos do formulário
   const [mesaId, setMesaId] = useState<number | "">("");
   const [descricao, setDescricao] = useState("");
   const [valor, setValor] = useState("");
   const [dataRecebimento, setDataRecebimento] = useState("");
   const [categoriaId, setCategoriaId] = useState<number | "">("");
   const [tipoPagamentoId, setTipoPagamentoId] = useState<number | "">("");
   const [recorrente, setRecorrente] = useState(false);

   const [erro, setErro] = useState("");
   const [sucesso, setSucesso] = useState("");

   useEffect(() => {
      const checkAuth = () => {
         if (!authService.isAuthenticated()) {
            router.push("/login");
            return false;
         }
         return true;
      };

      if (checkAuth()) {
         carregarDados();
      }
   }, [router, mostrarInativas]);

   const carregarDados = async () => {
      try {
         setLoading(true);
         const [receitasData, categoriasData, tiposData, mesasData] =
            await Promise.all([
               receitaService.listarTodas(mostrarInativas),
               categoriaService.listar("receita", false),
               tipoPagamentoService.listar(false),
               mesaService.listar(),
            ]);

         setReceitas(receitasData);
         setCategorias(categoriasData);
         setTiposPagamento(tiposData);
         setMesas(mesasData);
      } catch (error) {
         console.error("Erro ao carregar dados:", error);
         setErro("Erro ao carregar dados");
      } finally {
         setLoading(false);
      }
   };

   const abrirModal = (receita?: Receita) => {
      if (receita) {
         setEditando(receita);
         setMesaId(receita.mesa_id);
         setDescricao(receita.descricao);
         setValor(receita.valor.toString());
         setDataRecebimento(receita.data_recebimento);
         setCategoriaId(receita.categoria_id || "");
         setTipoPagamentoId(receita.tipo_pagamento_id || "");
         setRecorrente(receita.recorrente);
      } else {
         setEditando(null);
         setMesaId(mesas.length === 1 ? mesas[0].id : "");
         setDescricao("");
         setValor("");
         setDataRecebimento("");
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
      setMesaId("");
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

      if (!mesaId) {
         setErro("Selecione uma mesa");
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
            mesa_id: Number(mesaId),
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

   const toggleAtiva = async (receita: Receita) => {
      try {
         if (receita.ativa) {
            await receitaService.inativar(receita.id, receita.mesa_id);
            setSucesso("Receita inativada com sucesso!");
         } else {
            await receitaService.reativar(receita.id, receita.mesa_id);
            setSucesso("Receita reativada com sucesso!");
         }

         carregarDados();
         setTimeout(() => setSucesso(""), 3000);
      } catch (error) {
         setErro("Erro ao alterar status da receita");
      }
   };

   const formatarValor = (valor: number): string => {
      return new Intl.NumberFormat("pt-BR", {
         style: "currency",
         currency: "BRL",
      }).format(valor);
   };

   const formatarData = (data: string): string => {
      return new Date(data + "T00:00:00").toLocaleDateString("pt-BR");
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
                     Gerencie suas receitas de todas as mesas
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

            {/* Toggle Inativas */}
            <div className="flex items-center justify-end">
               <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                     type="checkbox"
                     checked={mostrarInativas}
                     onChange={(e) => setMostrarInativas(e.target.checked)}
                     className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-600 whitespace-nowrap">
                     Mostrar inativas
                  </span>
               </label>
            </div>

            {/* Tabela de Receitas */}
            {receitas.length === 0 ? (
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
                  <p className="text-base md:text-lg font-medium">
                     Nenhuma receita encontrada
                  </p>
                  <p className="text-sm mt-1">
                     Adicione sua primeira receita para começar
                  </p>
               </div>
            ) : (
               <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                     <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                           <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                 Mesa
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                 Descrição
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                 Categoria
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                 Tipo Pgto
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                 Valor
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                 Data
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                 Status
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                 Ações
                              </th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                           {receitas.map((receita) => (
                              <tr
                                 key={receita.id}
                                 className={`hover:bg-gray-50 ${!receita.ativa && "opacity-50"}`}
                              >
                                 <td className="px-4 py-3 text-sm text-gray-900">
                                    {receita.mesa_nome}
                                 </td>
                                 <td className="px-4 py-3">
                                    <div className="text-sm font-medium text-gray-900">
                                       {receita.descricao}
                                    </div>
                                    {receita.recorrente && (
                                       <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                                          Recorrente
                                       </span>
                                    )}
                                 </td>
                                 <td className="px-4 py-3 text-sm text-gray-600">
                                    {receita.categoria_nome || "-"}
                                 </td>
                                 <td className="px-4 py-3 text-sm text-gray-600">
                                    {receita.tipo_pagamento_nome || "-"}
                                 </td>
                                 <td className="px-4 py-3 text-sm font-semibold text-green-600">
                                    {formatarValor(receita.valor)}
                                 </td>
                                 <td className="px-4 py-3 text-sm text-gray-600">
                                    {formatarData(receita.data_recebimento)}
                                 </td>
                                 <td className="px-4 py-3">
                                    <span
                                       className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                          receita.ativa
                                             ? "bg-green-100 text-green-800"
                                             : "bg-gray-100 text-gray-800"
                                       }`}
                                    >
                                       {receita.ativa ? "Ativa" : "Inativa"}
                                    </span>
                                 </td>
                                 <td className="px-4 py-3 text-right text-sm space-x-2">
                                    <button
                                       onClick={() => abrirModal(receita)}
                                       className="text-blue-600 hover:text-blue-900 font-medium"
                                    >
                                       Editar
                                    </button>
                                    <button
                                       onClick={() => toggleAtiva(receita)}
                                       className={`font-medium ${
                                          receita.ativa
                                             ? "text-red-600 hover:text-red-900"
                                             : "text-green-600 hover:text-green-900"
                                       }`}
                                    >
                                       {receita.ativa ? "Inativar" : "Reativar"}
                                    </button>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            )}
         </div>

         {/* Modal Criar/Editar */}
         {modalAberto && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                     <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4">
                        {editando ? "Editar Receita" : "Nova Receita"}
                     </h2>

                     {erro && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                           {erro}
                        </div>
                     )}

                     <form onSubmit={salvarReceita} className="space-y-4">
                        {/* Mesa */}
                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-2">
                              Mesa *
                           </label>
                           <select
                              value={mesaId}
                              onChange={(e) =>
                                 setMesaId(Number(e.target.value))
                              }
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              disabled={!!editando}
                           >
                              <option value="">Selecione...</option>
                              {mesas.map((mesa) => (
                                 <option key={mesa.id} value={mesa.id}>
                                    {mesa.nome}
                                 </option>
                              ))}
                           </select>
                        </div>

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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                 placeholder="0.00"
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <div className="flex items-center">
                           <input
                              type="checkbox"
                              checked={recorrente}
                              onChange={(e) => setRecorrente(e.target.checked)}
                              className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                           />
                           <label className="ml-2 text-sm text-gray-700">
                              Receita recorrente (mensal)
                           </label>
                        </div>

                        <div className="flex space-x-3 pt-4">
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
