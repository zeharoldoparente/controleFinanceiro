"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import authService from "@/services/authService";
import mesaService, { Mesa, MesaCreate } from "@/services/mesaService";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useMesa } from "@/contexts/MesaContext";
import { isApiError } from "@/types";

export default function MesasPage() {
   const router = useRouter();
   const { mesaSelecionada, selecionarMesa, recarregarMesas } = useMesa();
   const [mesas, setMesas] = useState<Mesa[]>([]);
   const [loading, setLoading] = useState(true);
   const [modalAberto, setModalAberto] = useState(false);
   const [editando, setEditando] = useState<Mesa | null>(null);
   const [confirmarExclusao, setConfirmarExclusao] = useState<Mesa | null>(
      null,
   );

   // Campos do formulário
   const [nome, setNome] = useState("");
   const [descricao, setDescricao] = useState("");

   const [erro, setErro] = useState("");
   const [sucesso, setSucesso] = useState("");

   useEffect(() => {
      if (!authService.isAuthenticated()) {
         router.push("/login");
         return;
      }
      carregarMesas();
   }, [router]);

   const carregarMesas = async () => {
      try {
         setLoading(true);
         const dados = await mesaService.listar();
         setMesas(dados);
      } catch (error) {
         console.error("Erro ao carregar mesas:", error);
         setErro("Erro ao carregar mesas");
      } finally {
         setLoading(false);
      }
   };

   const abrirModal = (mesa?: Mesa) => {
      if (mesa) {
         setEditando(mesa);
         setNome(mesa.nome);
         setDescricao(mesa.descricao || "");
      } else {
         setEditando(null);
         setNome("");
         setDescricao("");
      }
      setErro("");
      setModalAberto(true);
   };

   const fecharModal = () => {
      setModalAberto(false);
      setEditando(null);
      setNome("");
      setDescricao("");
      setErro("");
   };

   const salvarMesa = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!nome.trim()) {
         setErro("O nome da mesa é obrigatório");
         return;
      }

      if (nome.trim().length < 2) {
         setErro("O nome deve ter pelo menos 2 caracteres");
         return;
      }

      try {
         const data: MesaCreate = {
            nome: nome.trim(),
            descricao: descricao.trim() || undefined,
         };

         if (editando) {
            await mesaService.atualizar(editando.id, data);
            setSucesso("Mesa atualizada com sucesso!");
         } else {
            await mesaService.criar(data);
            setSucesso("Mesa criada com sucesso!");
         }

         fecharModal();
         await carregarMesas();
         await recarregarMesas(); // Atualiza o contexto global

         setTimeout(() => setSucesso(""), 3000);
      } catch (error) {
         if (isApiError(error)) {
            setErro(
               error.response?.data?.message ||
                  error.response?.data?.error ||
                  "Erro ao salvar mesa",
            );
         } else {
            setErro("Erro ao salvar mesa");
         }
      }
   };

   const excluirMesa = async (mesa: Mesa) => {
      try {
         await mesaService.excluir(mesa.id);

         // Se a mesa excluída era a selecionada, seleciona a primeira disponível
         if (mesaSelecionada?.id === mesa.id) {
            const restantes = mesas.filter((m) => m.id !== mesa.id);
            if (restantes.length > 0) {
               selecionarMesa(restantes[0]);
            }
         }

         setSucesso("Mesa excluída com sucesso!");
         setConfirmarExclusao(null);
         await carregarMesas();
         await recarregarMesas();

         setTimeout(() => setSucesso(""), 3000);
      } catch (error) {
         if (isApiError(error)) {
            setErro(
               error.response?.data?.message ||
                  "Erro ao excluir mesa. Ela pode ter dados vinculados.",
            );
         } else {
            setErro("Erro ao excluir mesa");
         }
         setConfirmarExclusao(null);
      }
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
            {/* Header da Página */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
               <div>
                  <h1 className="text-xl md:text-2xl font-bold text-gray-800">
                     Mesas
                  </h1>
                  <p className="text-xs md:text-sm text-gray-600 mt-1">
                     Organize suas finanças em mesas separadas
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
                  <span>Nova Mesa</span>
               </button>
            </div>

            {/* Mensagens */}
            {sucesso && (
               <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm">
                  {sucesso}
               </div>
            )}

            {erro && !modalAberto && !confirmarExclusao && (
               <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                  {erro}
               </div>
            )}

            {/* Info Box - O que são mesas */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
               <div className="flex items-start space-x-3">
                  <div className="text-2xl">💡</div>
                  <div>
                     <p className="text-sm font-semibold text-blue-900 mb-1">
                        O que são mesas?
                     </p>
                     <p className="text-xs text-blue-700">
                        Mesas são espaços de organização financeira
                        independentes. Você pode ter uma mesa pessoal, uma para
                        um negócio, ou para qualquer separação que desejar. Cada
                        mesa tem suas próprias receitas e despesas.
                     </p>
                  </div>
               </div>
            </div>

            {/* Grid de Mesas */}
            {mesas.length === 0 ? (
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
                        d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                     />
                  </svg>
                  <p className="text-base md:text-lg font-medium">
                     Nenhuma mesa criada
                  </p>
                  <p className="text-sm mt-1">
                     Crie sua primeira mesa para começar a organizar suas
                     finanças
                  </p>
               </div>
            ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {mesas.map((mesa) => {
                     const isAtual = mesaSelecionada?.id === mesa.id;

                     return (
                        <div
                           key={mesa.id}
                           className={`bg-white rounded-xl shadow-md border transition-all hover:shadow-lg ${
                              isAtual
                                 ? "border-green-400 ring-2 ring-green-200"
                                 : "border-gray-100"
                           }`}
                        >
                           <div className="p-5">
                              {/* Header do Card */}
                              <div className="flex items-start justify-between mb-3">
                                 <div className="flex items-center space-x-3">
                                    <div
                                       className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                          isAtual
                                             ? "bg-green-100"
                                             : "bg-gray-100"
                                       }`}
                                    >
                                       <svg
                                          className={`w-5 h-5 ${isAtual ? "text-green-600" : "text-gray-500"}`}
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                       >
                                          <path
                                             strokeLinecap="round"
                                             strokeLinejoin="round"
                                             strokeWidth={2}
                                             d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                                          />
                                       </svg>
                                    </div>
                                    <div>
                                       <h3 className="text-base font-semibold text-gray-800">
                                          {mesa.nome}
                                       </h3>
                                       {isAtual && (
                                          <span className="inline-flex items-center space-x-1 text-xs text-green-600 font-medium">
                                             <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                             <span>Mesa ativa</span>
                                          </span>
                                       )}
                                    </div>
                                 </div>
                              </div>

                              {/* Descrição */}
                              {mesa.descricao && (
                                 <p className="text-xs text-gray-500 mb-4 line-clamp-2">
                                    {mesa.descricao}
                                 </p>
                              )}

                              {/* Botões */}
                              <div className="flex space-x-2 mt-4">
                                 {!isAtual && (
                                    <button
                                       onClick={() => selecionarMesa(mesa)}
                                       className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-xs font-medium"
                                    >
                                       <svg
                                          className="w-3.5 h-3.5"
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
                                       <span>Usar esta</span>
                                    </button>
                                 )}

                                 <button
                                    onClick={() => abrirModal(mesa)}
                                    className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-xs font-medium"
                                 >
                                    <svg
                                       className="w-3.5 h-3.5"
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
                                    <span>Editar</span>
                                 </button>

                                 {mesas.length > 1 && (
                                    <button
                                       onClick={() =>
                                          setConfirmarExclusao(mesa)
                                       }
                                       className="flex items-center justify-center px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-xs font-medium"
                                       title="Excluir mesa"
                                    >
                                       <svg
                                          className="w-3.5 h-3.5"
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
                                 )}
                              </div>
                           </div>
                        </div>
                     );
                  })}
               </div>
            )}
         </div>

         {/* Modal Criar/Editar */}
         {modalAberto && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                  <div className="p-6">
                     <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4">
                        {editando ? "Editar Mesa" : "Nova Mesa"}
                     </h2>

                     {erro && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                           {erro}
                        </div>
                     )}

                     <form onSubmit={salvarMesa} className="space-y-4">
                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-2">
                              Nome da Mesa *
                           </label>
                           <input
                              type="text"
                              value={nome}
                              onChange={(e) => setNome(e.target.value)}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              placeholder="Ex: Pessoal, Negócio, Família..."
                              autoFocus
                              maxLength={50}
                           />
                        </div>

                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-2">
                              Descrição{" "}
                              <span className="text-gray-400 font-normal">
                                 (opcional)
                              </span>
                           </label>
                           <textarea
                              value={descricao}
                              onChange={(e) => setDescricao(e.target.value)}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                              placeholder="Uma breve descrição do propósito desta mesa..."
                              rows={3}
                              maxLength={200}
                           />
                           <p className="text-xs text-gray-400 mt-1 text-right">
                              {descricao.length}/200
                           </p>
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

         {/* Modal Confirmar Exclusão */}
         {confirmarExclusao && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full">
                  <div className="p-6">
                     <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                           <svg
                              className="w-5 h-5 text-red-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                           >
                              <path
                                 strokeLinecap="round"
                                 strokeLinejoin="round"
                                 strokeWidth={2}
                                 d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                              />
                           </svg>
                        </div>
                        <div>
                           <h3 className="text-base font-bold text-gray-800">
                              Excluir Mesa
                           </h3>
                           <p className="text-sm text-gray-500">
                              Esta ação não pode ser desfeita
                           </p>
                        </div>
                     </div>

                     <p className="text-sm text-gray-600 mb-2">
                        Tem certeza que deseja excluir a mesa{" "}
                        <span className="font-semibold text-gray-800">
                           &quot;{confirmarExclusao.nome}&quot;
                        </span>
                        ?
                     </p>
                     <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                        ⚠️ Todos os dados vinculados a esta mesa (receitas,
                        despesas) também serão excluídos.
                     </p>

                     {erro && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                           {erro}
                        </div>
                     )}

                     <div className="flex space-x-3">
                        <button
                           onClick={() => {
                              setConfirmarExclusao(null);
                              setErro("");
                           }}
                           className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm"
                        >
                           Cancelar
                        </button>
                        <button
                           onClick={() => excluirMesa(confirmarExclusao)}
                           className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                        >
                           Excluir
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         )}
      </DashboardLayout>
   );
}
