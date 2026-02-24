"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import authService from "@/services/authService";
import categoriaService, { Categoria } from "@/services/categoriaService";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { isApiError } from "@/types";

export default function CategoriasPage() {
   const router = useRouter();
   const [categorias, setCategorias] = useState<Categoria[]>([]);
   const [loading, setLoading] = useState(true);
   const [filtroTipo, setFiltroTipo] = useState<
      "todas" | "receita" | "despesa"
   >("todas");
   const [mostrarInativas, setMostrarInativas] = useState(false);
   const [modalAberto, setModalAberto] = useState(false);
   const [editando, setEditando] = useState<Categoria | null>(null);
   const [nome, setNome] = useState("");
   const [tipo, setTipo] = useState<"receita" | "despesa">("despesa");
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
         carregarCategorias();
      }
   }, [router, filtroTipo, mostrarInativas]);

   const carregarCategorias = async () => {
      try {
         setLoading(true);
         const tipoFiltro = filtroTipo === "todas" ? undefined : filtroTipo;
         const dados = await categoriaService.listar(
            tipoFiltro,
            mostrarInativas,
         );
         setCategorias(dados);
      } catch (error) {
         console.error("Erro ao carregar categorias:", error);
         setErro("Erro ao carregar categorias");
      } finally {
         setLoading(false);
      }
   };

   const abrirModal = (categoria?: Categoria) => {
      if (categoria) {
         setEditando(categoria);
         setNome(categoria.nome);
         setTipo(categoria.tipo);
      } else {
         setEditando(null);
         setNome("");
         setTipo("despesa");
      }
      setErro("");
      setModalAberto(true);
   };

   const fecharModal = () => {
      setModalAberto(false);
      setEditando(null);
      setNome("");
      setTipo("despesa");
      setErro("");
   };

   const salvarCategoria = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!nome.trim()) {
         setErro("O nome é obrigatório");
         return;
      }

      try {
         if (editando) {
            await categoriaService.atualizar(editando.id, nome, tipo);
            setSucesso("Categoria atualizada com sucesso!");
         } else {
            await categoriaService.criar(nome, tipo);
            setSucesso("Categoria criada com sucesso!");
         }

         fecharModal();
         carregarCategorias();

         setTimeout(() => setSucesso(""), 3000);
      } catch (error) {
         if (isApiError(error)) {
            setErro(
               error.response?.data?.message || "Erro ao salvar categoria",
            );
         } else {
            setErro("Erro ao salvar categoria");
         }
      }
   };

   const toggleAtiva = async (categoria: Categoria) => {
      try {
         if (categoria.ativa) {
            await categoriaService.inativar(categoria.id);
            setSucesso("Categoria inativada com sucesso!");
         } else {
            await categoriaService.reativar(categoria.id);
            setSucesso("Categoria reativada com sucesso!");
         }

         carregarCategorias();
         setTimeout(() => setSucesso(""), 3000);
      } catch (error) {
         setErro("Erro ao alterar status da categoria");
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
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
               <div>
                  <h1 className="text-xl md:text-2xl font-bold text-gray-800">
                     Categorias
                  </h1>
                  <p className="text-xs md:text-sm text-gray-600 mt-1">
                     Gerencie suas categorias de receitas e despesas
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
                  <span>Nova Categoria</span>
               </button>
            </div>

            {/* Mensagens */}
            {sucesso && (
               <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm">
                  {sucesso}
               </div>
            )}

            {erro && (
               <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                  {erro}
               </div>
            )}

            {/* Filtros */}
            <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
               <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  {/* Filtro por Tipo */}
                  <div className="flex items-center space-x-2 overflow-x-auto pb-2 sm:pb-0">
                     <button
                        onClick={() => setFiltroTipo("todas")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                           filtroTipo === "todas"
                              ? "bg-gray-800 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                     >
                        Todas
                     </button>
                     <button
                        onClick={() => setFiltroTipo("receita")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                           filtroTipo === "receita"
                              ? "bg-green-600 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                     >
                        Receitas
                     </button>
                     <button
                        onClick={() => setFiltroTipo("despesa")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                           filtroTipo === "despesa"
                              ? "bg-red-600 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                     >
                        Despesas
                     </button>
                  </div>

                  {/* Toggle Inativas */}
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
            </div>

            {/* Lista de Categorias */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
               {categorias.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
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
                           d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        />
                     </svg>
                     <p className="text-base md:text-lg font-medium">
                        Nenhuma categoria encontrada
                     </p>
                     <p className="text-sm mt-1">
                        Crie sua primeira categoria para começar
                     </p>
                  </div>
               ) : (
                  <>
                     {/* MOBILE: Cards */}
                     <div className="md:hidden divide-y divide-gray-200">
                        {categorias.map((categoria) => (
                           <div
                              key={categoria.id}
                              className={`p-4 ${!categoria.ativa && "opacity-50 bg-gray-50"}`}
                           >
                              <div className="flex items-start justify-between mb-3">
                                 <div className="flex-1">
                                    <h3 className="text-base font-semibold text-gray-800 mb-2">
                                       {categoria.nome}
                                    </h3>
                                    <div className="flex items-center space-x-2">
                                       <span
                                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                             categoria.tipo === "receita"
                                                ? "bg-green-100 text-green-800"
                                                : "bg-red-100 text-red-800"
                                          }`}
                                       >
                                          {categoria.tipo === "receita"
                                             ? "Receita"
                                             : "Despesa"}
                                       </span>
                                       <span
                                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                             categoria.ativa
                                                ? "bg-blue-100 text-blue-800"
                                                : "bg-gray-100 text-gray-600"
                                          }`}
                                       >
                                          {categoria.ativa
                                             ? "Ativa"
                                             : "Inativa"}
                                       </span>
                                    </div>
                                 </div>
                              </div>

                              <div className="flex space-x-2">
                                 <button
                                    onClick={() => abrirModal(categoria)}
                                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                 >
                                    <svg
                                       className="w-4 h-4"
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
                                    <span className="text-sm font-medium">
                                       Editar
                                    </span>
                                 </button>
                                 <button
                                    onClick={() => toggleAtiva(categoria)}
                                    className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg transition-colors ${
                                       categoria.ativa
                                          ? "bg-red-50 text-red-600 hover:bg-red-100"
                                          : "bg-green-50 text-green-600 hover:bg-green-100"
                                    }`}
                                 >
                                    {categoria.ativa ? (
                                       <>
                                          <svg
                                             className="w-4 h-4"
                                             fill="none"
                                             stroke="currentColor"
                                             viewBox="0 0 24 24"
                                          >
                                             <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                                             />
                                          </svg>
                                          <span className="text-sm font-medium">
                                             Inativar
                                          </span>
                                       </>
                                    ) : (
                                       <>
                                          <svg
                                             className="w-4 h-4"
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
                                          <span className="text-sm font-medium">
                                             Reativar
                                          </span>
                                       </>
                                    )}
                                 </button>
                              </div>
                           </div>
                        ))}
                     </div>

                     {/* DESKTOP: Tabela */}
                     <div className="hidden md:block overflow-x-auto">
                        <table className="w-full">
                           <thead className="bg-gray-50 border-b border-gray-200">
                              <tr>
                                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                                    Nome
                                 </th>
                                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                                    Tipo
                                 </th>
                                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                                    Status
                                 </th>
                                 <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                                    Ações
                                 </th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-200">
                              {categorias.map((categoria) => (
                                 <tr
                                    key={categoria.id}
                                    className={`hover:bg-gray-50 transition-colors ${!categoria.ativa && "opacity-50"}`}
                                 >
                                    <td className="px-6 py-4">
                                       <span className="text-sm font-medium text-gray-800">
                                          {categoria.nome}
                                       </span>
                                    </td>
                                    <td className="px-6 py-4">
                                       <span
                                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                             categoria.tipo === "receita"
                                                ? "bg-green-100 text-green-800"
                                                : "bg-red-100 text-red-800"
                                          }`}
                                       >
                                          {categoria.tipo === "receita"
                                             ? "Receita"
                                             : "Despesa"}
                                       </span>
                                    </td>
                                    <td className="px-6 py-4">
                                       <span
                                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                             categoria.ativa
                                                ? "bg-blue-100 text-blue-800"
                                                : "bg-gray-100 text-gray-600"
                                          }`}
                                       >
                                          {categoria.ativa
                                             ? "Ativa"
                                             : "Inativa"}
                                       </span>
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                       <button
                                          onClick={() => abrirModal(categoria)}
                                          className="inline-flex items-center p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                          title="Editar"
                                       >
                                          <svg
                                             className="w-4 h-4"
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
                                       <button
                                          onClick={() => toggleAtiva(categoria)}
                                          className={`inline-flex items-center p-2 rounded-lg transition-colors ${
                                             categoria.ativa
                                                ? "text-gray-600 hover:text-red-600 hover:bg-red-50"
                                                : "text-gray-600 hover:text-green-600 hover:bg-green-50"
                                          }`}
                                          title={
                                             categoria.ativa
                                                ? "Inativar"
                                                : "Reativar"
                                          }
                                       >
                                          {categoria.ativa ? (
                                             <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                             >
                                                <path
                                                   strokeLinecap="round"
                                                   strokeLinejoin="round"
                                                   strokeWidth={2}
                                                   d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                                                />
                                             </svg>
                                          ) : (
                                             <svg
                                                className="w-4 h-4"
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
                                          )}
                                       </button>
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </>
               )}
            </div>
         </div>

         {/* Modal Criar/Editar */}
         {modalAberto && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                     <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4">
                        {editando ? "Editar Categoria" : "Nova Categoria"}
                     </h2>

                     {erro && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                           {erro}
                        </div>
                     )}

                     <form onSubmit={salvarCategoria} className="space-y-4">
                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-2">
                              Nome da Categoria
                           </label>
                           <input
                              type="text"
                              value={nome}
                              onChange={(e) => setNome(e.target.value)}
                              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:bg-green-50/30 focus:ring-1 focus:ring-green-500/80 focus:border-green-300 outline-none transition-all duration-300 shadow-sm disabled:cursor-not-allowed"
                              placeholder="Ex: Alimentação"
                              autoFocus
                           />
                        </div>

                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-2">
                              Tipo
                           </label>
                           <div className="grid grid-cols-2 gap-3">
                              <button
                                 type="button"
                                 onClick={() => setTipo("receita")}
                                 className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                                    tipo === "receita"
                                       ? "bg-green-600 text-white"
                                       : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                 }`}
                              >
                                 Receita
                              </button>
                              <button
                                 type="button"
                                 onClick={() => setTipo("despesa")}
                                 className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                                    tipo === "despesa"
                                       ? "bg-red-600 text-white"
                                       : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                 }`}
                              >
                                 Despesa
                              </button>
                           </div>
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
