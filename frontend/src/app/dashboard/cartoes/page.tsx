"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import authService from "@/services/authService";
import cartaoService, { Cartao, CartaoCreate } from "@/services/cartaoService";
import bandeiraService, { Bandeira } from "@/services/bandeiraService";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { isApiError } from "@/types";

const CORES_PADRAO = [
   "#8B5CF6", // Roxo
   "#3B82F6", // Azul
   "#10B981", // Verde
   "#F59E0B", // Amarelo
   "#EF4444", // Vermelho
   "#EC4899", // Rosa
   "#6366F1", // Indigo
   "#14B8A6", // Teal
   "#F97316", // Laranja
   "#6B7280", // Cinza
];

export default function CartoesPage() {
   const router = useRouter();
   const [cartoes, setCartoes] = useState<Cartao[]>([]);
   const [bandeiras, setBandeiras] = useState<Bandeira[]>([]);
   const [loading, setLoading] = useState(true);
   const [mostrarInativas, setMostrarInativas] = useState(false);
   const [modalAberto, setModalAberto] = useState(false);
   const [editando, setEditando] = useState<Cartao | null>(null);

   // Campos do formulário
   const [nome, setNome] = useState("");
   const [tipo, setTipo] = useState<"credito" | "debito">("credito");
   const [bandeiraId, setBandeiraId] = useState<number | "">("");
   const [limiteReal, setLimiteReal] = useState("");
   const [limitePessoal, setLimitePessoal] = useState("");
   const [diaFechamento, setDiaFechamento] = useState("");
   const [diaVencimento, setDiaVencimento] = useState("");
   const [cor, setCor] = useState("#8B5CF6");

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
         const [cartoesData, bandeirasData] = await Promise.all([
            cartaoService.listar(mostrarInativas),
            bandeiraService.listar(false),
         ]);

         setCartoes(cartoesData);
         setBandeiras(bandeirasData);
      } catch (error) {
         console.error("Erro ao carregar dados:", error);
         setErro("Erro ao carregar dados");
      } finally {
         setLoading(false);
      }
   };

   const abrirModal = (cartao?: Cartao) => {
      if (cartao) {
         setEditando(cartao);
         setNome(cartao.nome);
         setTipo(cartao.tipo);
         setBandeiraId(cartao.bandeira_id);
         setLimiteReal(cartao.limite_real?.toString() || "");
         setLimitePessoal(cartao.limite_pessoal?.toString() || "");
         setDiaFechamento(cartao.dia_fechamento?.toString() || "");
         setDiaVencimento(cartao.dia_vencimento?.toString() || "");
         setCor(cartao.cor || "#8B5CF6");
      } else {
         setEditando(null);
         setNome("");
         setTipo("credito");
         setBandeiraId("");
         setLimiteReal("");
         setLimitePessoal("");
         setDiaFechamento("");
         setDiaVencimento("");
         setCor("#8B5CF6");
      }
      setErro("");
      setModalAberto(true);
   };

   const fecharModal = () => {
      setModalAberto(false);
      setEditando(null);
      setNome("");
      setTipo("credito");
      setBandeiraId("");
      setLimiteReal("");
      setLimitePessoal("");
      setDiaFechamento("");
      setDiaVencimento("");
      setCor("#8B5CF6");
      setErro("");
   };

   const salvarCartao = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!nome.trim()) {
         setErro("O nome é obrigatório");
         return;
      }

      if (!bandeiraId) {
         setErro("Selecione uma bandeira");
         return;
      }

      try {
         const cartaoData: CartaoCreate = {
            nome,
            tipo,
            bandeira_id: Number(bandeiraId),
            limite_real: limiteReal ? Number(limiteReal) : undefined,
            limite_pessoal: limitePessoal ? Number(limitePessoal) : undefined,
            dia_fechamento: diaFechamento ? Number(diaFechamento) : undefined,
            dia_vencimento: diaVencimento ? Number(diaVencimento) : undefined,
            cor,
         };

         if (editando) {
            await cartaoService.atualizar(editando.id, cartaoData);
            setSucesso("Cartão atualizado com sucesso!");
         } else {
            await cartaoService.criar(cartaoData);
            setSucesso("Cartão criado com sucesso!");
         }

         fecharModal();
         carregarDados();

         setTimeout(() => setSucesso(""), 3000);
      } catch (error) {
         if (isApiError(error)) {
            setErro(error.response?.data?.error || "Erro ao salvar cartão");
         } else {
            setErro("Erro ao salvar cartão");
         }
      }
   };

   const toggleAtiva = async (cartao: Cartao) => {
      try {
         if (cartao.ativa) {
            await cartaoService.inativar(cartao.id);
            setSucesso("Cartão inativado com sucesso!");
         } else {
            await cartaoService.reativar(cartao.id);
            setSucesso("Cartão reativado com sucesso!");
         }

         carregarDados();
         setTimeout(() => setSucesso(""), 3000);
      } catch (error) {
         setErro("Erro ao alterar status do cartão");
      }
   };

   const calcularPercentualLimite = (cartao: Cartao): number => {
      // TODO: Calcular com base nas despesas reais
      // Por enquanto, valor mockado
      return 0;
   };

   const formatarTipo = (tipo: string): string => {
      return tipo === "credito" ? "Crédito" : "Débito";
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
                     Cartões
                  </h1>
                  <p className="text-xs md:text-sm text-gray-600 mt-1">
                     Gerencie seus cartões de crédito e débito
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
                  <span>Novo Cartão</span>
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
                     Mostrar inativos
                  </span>
               </label>
            </div>

            {/* Grid de Cartões */}
            {cartoes.length === 0 ? (
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
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                     />
                  </svg>
                  <p className="text-base md:text-lg font-medium">
                     Nenhum cartão encontrado
                  </p>
                  <p className="text-sm mt-1">
                     Adicione seu primeiro cartão para começar
                  </p>
               </div>
            ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {cartoes.map((cartao) => {
                     const percentualUsado = calcularPercentualLimite(cartao);
                     const limiteParaCalculo =
                        cartao.limite_pessoal || cartao.limite_real;

                     return (
                        <div
                           key={cartao.id}
                           className={`relative ${!cartao.ativa && "opacity-50"}`}
                        >
                           {/* Card do Cartão */}
                           <div
                              style={{
                                 backgroundColor: cartao.cor || "#8B5CF6",
                              }}
                              className="relative h-48 rounded-xl shadow-lg p-5 text-white overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                              onClick={() => {
                                 // TODO: Abrir detalhes do cartão
                              }}
                           >
                              {/* Padrão de fundo */}
                              <div className="absolute inset-0 opacity-10">
                                 <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -mr-20 -mt-20"></div>
                                 <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full -ml-16 -mb-16"></div>
                              </div>

                              {/* Conteúdo */}
                              <div className="relative h-full flex flex-col justify-between">
                                 {/* Header */}
                                 <div className="flex items-start justify-between">
                                    <div className="flex items-center space-x-2">
                                       <svg
                                          className="w-8 h-8"
                                          fill="currentColor"
                                          viewBox="0 0 24 24"
                                       >
                                          <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
                                       </svg>
                                       <span className="text-xs font-medium opacity-90">
                                          {cartao.bandeira_nome}
                                       </span>
                                    </div>
                                    {!cartao.ativa && (
                                       <span className="text-xs bg-white/20 px-2 py-1 rounded">
                                          Inativo
                                       </span>
                                    )}
                                 </div>

                                 {/* Nome do Cartão */}
                                 <div>
                                    <p className="text-lg font-bold">
                                       {cartao.nome}
                                    </p>
                                    <p className="text-xs opacity-75">
                                       {formatarTipo(cartao.tipo)}
                                    </p>
                                 </div>

                                 {/* Limite */}
                                 {limiteParaCalculo && (
                                    <div>
                                       <div className="flex items-center justify-between text-xs mb-1">
                                          <span className="opacity-75">
                                             Limite usado
                                          </span>
                                          <span className="font-medium">
                                             {percentualUsado}%
                                          </span>
                                       </div>
                                       <div className="w-full bg-white/30 rounded-full h-1.5">
                                          <div
                                             style={{
                                                width: `${percentualUsado}%`,
                                             }}
                                             className="bg-white h-1.5 rounded-full transition-all"
                                          ></div>
                                       </div>
                                    </div>
                                 )}
                              </div>
                           </div>

                           {/* Botões de Ação */}
                           <div className="mt-3 flex space-x-2">
                              <button
                                 onClick={() => abrirModal(cartao)}
                                 className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
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
                                 <span className="font-medium">Editar</span>
                              </button>
                              <button
                                 onClick={() => toggleAtiva(cartao)}
                                 className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                                    cartao.ativa
                                       ? "bg-red-50 text-red-600 hover:bg-red-100"
                                       : "bg-green-50 text-green-600 hover:bg-green-100"
                                 }`}
                              >
                                 {cartao.ativa ? (
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
                                       <span className="font-medium">
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
                                       <span className="font-medium">
                                          Reativar
                                       </span>
                                    </>
                                 )}
                              </button>
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
               <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                     <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4">
                        {editando ? "Editar Cartão" : "Novo Cartão"}
                     </h2>

                     {erro && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                           {erro}
                        </div>
                     )}

                     <form onSubmit={salvarCartao} className="space-y-4">
                        {/* Nome */}
                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-2">
                              Nome do Cartão *
                           </label>
                           <input
                              type="text"
                              value={nome}
                              onChange={(e) => setNome(e.target.value)}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              placeholder="Ex: Nubank Roxinho"
                              autoFocus
                           />
                        </div>

                        {/* Tipo e Bandeira */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                 Tipo *
                              </label>
                              <div className="grid grid-cols-2 gap-3">
                                 <button
                                    type="button"
                                    onClick={() => setTipo("credito")}
                                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                                       tipo === "credito"
                                          ? "bg-green-600 text-white"
                                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                                 >
                                    Crédito
                                 </button>
                                 <button
                                    type="button"
                                    onClick={() => setTipo("debito")}
                                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                                       tipo === "debito"
                                          ? "bg-blue-600 text-white"
                                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                                 >
                                    Débito
                                 </button>
                              </div>
                           </div>

                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                 Bandeira *
                              </label>
                              <select
                                 value={bandeiraId}
                                 onChange={(e) =>
                                    setBandeiraId(Number(e.target.value))
                                 }
                                 className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              >
                                 <option value="">Selecione...</option>
                                 {bandeiras.map((b) => (
                                    <option key={b.id} value={b.id}>
                                       {b.nome}
                                    </option>
                                 ))}
                              </select>
                           </div>
                        </div>

                        {/* Limites */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                 Limite Real (Banco)
                              </label>
                              <input
                                 type="number"
                                 step="0.01"
                                 value={limiteReal}
                                 onChange={(e) => setLimiteReal(e.target.value)}
                                 className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                 placeholder="5000.00"
                              />
                           </div>

                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                 Limite Pessoal (Meta)
                              </label>
                              <input
                                 type="number"
                                 step="0.01"
                                 value={limitePessoal}
                                 onChange={(e) =>
                                    setLimitePessoal(e.target.value)
                                 }
                                 className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                 placeholder="3000.00"
                              />
                           </div>
                        </div>

                        {/* Dias - Só para Crédito */}
                        {tipo === "credito" && (
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Dia de Fechamento
                                 </label>
                                 <input
                                    type="number"
                                    min="1"
                                    max="31"
                                    value={diaFechamento}
                                    onChange={(e) =>
                                       setDiaFechamento(e.target.value)
                                    }
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    placeholder="8"
                                 />
                              </div>

                              <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Dia de Vencimento
                                 </label>
                                 <input
                                    type="number"
                                    min="1"
                                    max="31"
                                    value={diaVencimento}
                                    onChange={(e) =>
                                       setDiaVencimento(e.target.value)
                                    }
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    placeholder="15"
                                 />
                              </div>
                           </div>
                        )}

                        {/* Cor */}
                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-2">
                              Cor do Cartão
                           </label>
                           <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                              {CORES_PADRAO.map((corOpcao) => (
                                 <button
                                    key={corOpcao}
                                    type="button"
                                    onClick={() => setCor(corOpcao)}
                                    style={{ backgroundColor: corOpcao }}
                                    className={`w-10 h-10 rounded-lg transition-all ${
                                       cor === corOpcao
                                          ? "ring-4 ring-offset-2 ring-gray-400 scale-110"
                                          : "hover:scale-105"
                                    }`}
                                 />
                              ))}
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
