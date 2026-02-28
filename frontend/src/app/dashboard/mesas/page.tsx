"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import authService from "@/services/authService";
import mesaService, { Mesa, MesaCreate } from "@/services/mesaService";
import conviteService, { MesaMembros } from "@/services/conviteService";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useMesa } from "@/contexts/MesaContext";
import { isApiError } from "@/types";

interface MesaComMembros extends Mesa {
   membrosAberto?: boolean;
}

export default function MesasPage() {
   const router = useRouter();
   const { mesaSelecionada, selecionarMesa, recarregarMesas } = useMesa();
   const [mesas, setMesas] = useState<MesaComMembros[]>([]);
   const [loading, setLoading] = useState(true);
   const [modalAberto, setModalAberto] = useState(false);
   const [editando, setEditando] = useState<Mesa | null>(null);
   const [confirmarExclusao, setConfirmarExclusao] = useState<Mesa | null>(
      null,
   );
   const [currentUserId, setCurrentUserId] = useState<number | null>(null);

   // Campos do form
   const [nome, setNome] = useState("");
   const [descricao, setDescricao] = useState("");
   const [erro, setErro] = useState("");
   const [sucesso, setSucesso] = useState("");

   // Membros por mesa
   const [membrosMap, setMembrosMap] = useState<Record<number, MesaMembros>>(
      {},
   );
   const [membrosAbertos, setMembrosAbertos] = useState<Set<number>>(new Set());
   const [loadingMembros, setLoadingMembros] = useState<Set<number>>(new Set());
   const [erroMembros, setErroMembros] = useState<Record<number, string>>({});

   // Modal de convidar
   const [convidandoMesa, setConvidandoMesa] = useState<Mesa | null>(null);
   const [emailConvite, setEmailConvite] = useState("");
   const [enviandoConvite, setEnviandoConvite] = useState(false);
   const [erroConvite, setErroConvite] = useState("");
   const [sucessoConvite, setSucessoConvite] = useState("");
   const [erroRemover, setErroRemover] = useState("");
   const [erroCancelar, setErroCancelar] = useState<Record<number, string>>({});
   const [cancelandoConvite, setCancelando] = useState<Set<number>>(new Set());
   const [confirmarCancelamento, setConfirmarCancelamento] = useState<{
      mesaId: number;
      conviteId: number;
      email: string;
   } | null>(null);

   // Confirmar remoção de membro
   const [removendoMembro, setRemovendoMembro] = useState<{
      mesaId: number;
      userId: number;
      nome: string;
   } | null>(null);

   useEffect(() => {
      if (!authService.isAuthenticated()) {
         router.push("/login");
         return;
      }
      const user = authService.getUser();
      setCurrentUserId(user?.id ?? null);
      carregarMesas();
   }, [router]);

   const carregarMesas = async () => {
      try {
         setLoading(true);
         const dados = await mesaService.listar();
         setMesas(dados);
      } catch {
         setErro("Erro ao carregar mesas");
      } finally {
         setLoading(false);
      }
   };

   const toggleMembros = async (mesa: Mesa) => {
      const abertos = new Set(membrosAbertos);
      if (abertos.has(mesa.id)) {
         abertos.delete(mesa.id);
         setMembrosAbertos(new Set(abertos));
         return;
      }
      // Abre o painel ANTES de buscar — não fecha se der erro
      abertos.add(mesa.id);
      setMembrosAbertos(new Set(abertos));

      if (membrosMap[mesa.id]) return; // já carregado, não recarrega

      setLoadingMembros((prev) => new Set(prev).add(mesa.id));
      setErroMembros((prev) => {
         const n = { ...prev };
         delete n[mesa.id];
         return n;
      });

      try {
         const dados = await conviteService.listarMembros(mesa.id);
         setMembrosMap((prev) => ({ ...prev, [mesa.id]: dados }));
      } catch {
         // Mantém o painel aberto, mas mostra mensagem de erro dentro dele
         setErroMembros((prev) => ({
            ...prev,
            [mesa.id]: "Erro ao carregar membros. Tente novamente.",
         }));
      } finally {
         setLoadingMembros((prev) => {
            const n = new Set(prev);
            n.delete(mesa.id);
            return n;
         });
      }
   };

   const recarregarMembros = async (mesaId: number) => {
      try {
         const dados = await conviteService.listarMembros(mesaId);
         setMembrosMap((prev) => ({ ...prev, [mesaId]: dados }));
      } catch {}
   };

   const abrirModalConvite = (mesa: Mesa) => {
      setConvidandoMesa(mesa);
      setEmailConvite("");
      setErroConvite("");
      setSucessoConvite("");
   };

   const enviarConvite = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!convidandoMesa || !emailConvite.trim()) return;
      setEnviandoConvite(true);
      setErroConvite("");
      setSucessoConvite("");
      try {
         const mesaId = convidandoMesa.id;
         await conviteService.enviar(mesaId, emailConvite.trim());
         await recarregarMembros(mesaId);
         // Fecha o modal imediatamente e exibe sucesso na página
         setConvidandoMesa(null);
         setEmailConvite("");
         setSucessoConvite("");
         setSucesso(
            "✅ Convite enviado! O convidado receberá um email em breve.",
         );
         setTimeout(() => setSucesso(""), 4000);
      } catch (error) {
         if (isApiError(error)) {
            setErroConvite(
               error.response?.data?.error || "Erro ao enviar convite",
            );
         } else {
            setErroConvite("Erro ao enviar convite");
         }
      } finally {
         setEnviandoConvite(false);
      }
   };

   const removerMembro = async () => {
      if (!removendoMembro) return;
      setErroRemover("");
      try {
         await conviteService.removerMembro(
            removendoMembro.mesaId,
            removendoMembro.userId,
         );
         await recarregarMembros(removendoMembro.mesaId);
         setRemovendoMembro(null);
         setErroRemover("");
      } catch {
         setErroRemover("Não foi possível remover o membro. Tente novamente.");
      }
   };

   const abrirConfirmarCancelamento = (
      mesaId: number,
      conviteId: number,
      email: string,
   ) => {
      setErroCancelar((prev) => {
         const n = { ...prev };
         delete n[conviteId];
         return n;
      });
      setConfirmarCancelamento({ mesaId, conviteId, email });
   };

   const executarCancelamento = async () => {
      if (!confirmarCancelamento) return;
      const { mesaId, conviteId } = confirmarCancelamento;
      setCancelando((prev) => new Set(prev).add(conviteId));
      try {
         await conviteService.cancelarConvite(mesaId, conviteId);
         setConfirmarCancelamento(null);
         await recarregarMembros(mesaId);
      } catch {
         setErroCancelar((prev) => ({
            ...prev,
            [conviteId]: "Não foi possível cancelar. Tente novamente.",
         }));
         setConfirmarCancelamento(null);
      } finally {
         setCancelando((prev) => {
            const n = new Set(prev);
            n.delete(conviteId);
            return n;
         });
      }
   };

   // ── CRUD de Mesas ──

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
            setSucesso("Mesa atualizada!");
         } else {
            await mesaService.criar(data);
            setSucesso("Mesa criada!");
         }
         fecharModal();
         await carregarMesas();
         await recarregarMesas();
         setTimeout(() => setSucesso(""), 3000);
      } catch (error) {
         if (isApiError(error))
            setErro(error.response?.data?.error || "Erro ao salvar mesa");
         else setErro("Erro ao salvar mesa");
      }
   };

   const excluirMesa = async (mesa: Mesa) => {
      try {
         await mesaService.excluir(mesa.id);
         if (mesaSelecionada?.id === mesa.id) {
            const restantes = mesas.filter((m) => m.id !== mesa.id);
            if (restantes.length > 0) selecionarMesa(restantes[0]);
         }
         setSucesso("Mesa excluída!");
         setConfirmarExclusao(null);
         await carregarMesas();
         await recarregarMesas();
         setTimeout(() => setSucesso(""), 3000);
      } catch (error) {
         if (isApiError(error))
            setErro(error.response?.data?.message || "Erro ao excluir mesa");
         else setErro("Erro ao excluir mesa");
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
         <div className="space-y-4 md:space-y-6 pb-10">
            {/* Header */}
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
            {erro && (
               <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                  {erro}
               </div>
            )}
            {sucesso && (
               <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm">
                  {sucesso}
               </div>
            )}

            {/* Lista de mesas */}
            {mesas.length === 0 ? (
               <div className="text-center py-12 text-gray-500">
                  Nenhuma mesa cadastrada
               </div>
            ) : (
               <div className="space-y-4">
                  {mesas.map((mesa) => {
                     const ehDono = mesa.criador_id === currentUserId;
                     const membrosDados = membrosMap[mesa.id];
                     const aberto = membrosAbertos.has(mesa.id);
                     const carregandoMembros = loadingMembros.has(mesa.id);
                     const erroCarregarMembros = erroMembros[mesa.id];
                     const totalMembros = membrosDados
                        ? 1 + membrosDados.membros.length
                        : null;

                     return (
                        <div
                           key={mesa.id}
                           className={`bg-white rounded-xl shadow-sm border transition-all ${
                              mesaSelecionada?.id === mesa.id
                                 ? "border-green-300 ring-1 ring-green-200"
                                 : "border-gray-100"
                           }`}
                        >
                           {/* Cabeçalho da mesa */}
                           <div className="p-4 md:p-5">
                              <div className="flex items-start justify-between gap-3">
                                 <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                       <h3 className="text-base font-semibold text-gray-800 truncate">
                                          {mesa.nome}
                                       </h3>
                                       {mesaSelecionada?.id === mesa.id && (
                                          <span className="bg-green-100 text-green-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                             Ativa
                                          </span>
                                       )}
                                       {!ehDono && (
                                          <span className="bg-blue-100 text-blue-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                             Convidado
                                          </span>
                                       )}
                                    </div>
                                    {mesa.descricao && (
                                       <p className="text-xs text-gray-500 mt-0.5">
                                          {mesa.descricao}
                                       </p>
                                    )}
                                 </div>

                                 {/* Ações */}
                                 <div className="flex items-center gap-2 shrink-0">
                                    {mesaSelecionada?.id !== mesa.id && (
                                       <button
                                          onClick={() => selecionarMesa(mesa)}
                                          className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-xs font-medium"
                                       >
                                          Usar
                                       </button>
                                    )}

                                    {/* Membros toggle */}
                                    <button
                                       onClick={() => toggleMembros(mesa)}
                                       className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors text-xs font-medium ${
                                          aberto
                                             ? "bg-gray-100 text-gray-800"
                                             : "text-gray-500"
                                       }`}
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
                                             d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                                          />
                                       </svg>
                                       <span>
                                          Membros
                                          {totalMembros
                                             ? ` (${totalMembros})`
                                             : ""}
                                       </span>
                                       <svg
                                          className={`w-3 h-3 transition-transform ${aberto ? "rotate-180" : ""}`}
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                       >
                                          <path
                                             strokeLinecap="round"
                                             strokeLinejoin="round"
                                             strokeWidth={2}
                                             d="M19 9l-7 7-7-7"
                                          />
                                       </svg>
                                    </button>

                                    {ehDono && (
                                       <>
                                          <button
                                             onClick={() => abrirModal(mesa)}
                                             className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
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
                                          {mesas.length > 1 && (
                                             <button
                                                onClick={() =>
                                                   setConfirmarExclusao(mesa)
                                                }
                                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Excluir"
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
                                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                   />
                                                </svg>
                                             </button>
                                          )}
                                       </>
                                    )}
                                 </div>
                              </div>
                           </div>

                           {/* Painel de Membros */}
                           {aberto && (
                              <div className="border-t border-gray-100 px-4 md:px-5 py-4 bg-gray-50/50 rounded-b-xl">
                                 {carregandoMembros ? (
                                    <div className="flex items-center gap-2 py-2">
                                       <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                                       <span className="text-xs text-gray-500">
                                          Carregando membros...
                                       </span>
                                    </div>
                                 ) : erroCarregarMembros ? (
                                    <div className="flex items-center gap-2 py-2 px-3 bg-red-50 rounded-lg border border-red-100">
                                       <svg
                                          className="w-4 h-4 text-red-500 shrink-0"
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
                                       <span className="text-xs text-red-600">
                                          {erroCarregarMembros}
                                       </span>
                                       <button
                                          onClick={() => {
                                             setMembrosMap((prev) => {
                                                const n = { ...prev };
                                                delete n[mesa.id];
                                                return n;
                                             });
                                             toggleMembros(mesa);
                                          }}
                                          className="ml-auto text-[11px] text-red-500 hover:text-red-700 font-medium underline"
                                       >
                                          Tentar novamente
                                       </button>
                                    </div>
                                 ) : membrosDados ? (
                                    <div className="space-y-4">
                                       {/* Membros atuais */}
                                       <div>
                                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                             Membros
                                          </p>
                                          <div className="space-y-2">
                                             {/* Dono */}
                                             <div className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-gray-100">
                                                <div className="flex items-center gap-2.5">
                                                   <div className="w-7 h-7 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-[11px]">
                                                      {membrosDados.dono.nome
                                                         .charAt(0)
                                                         .toUpperCase()}
                                                   </div>
                                                   <div>
                                                      <p className="text-xs font-semibold text-gray-800">
                                                         {
                                                            membrosDados.dono
                                                               .nome
                                                         }
                                                         {membrosDados.dono
                                                            .id ===
                                                            currentUserId && (
                                                            <span className="text-gray-400 font-normal ml-1">
                                                               (você)
                                                            </span>
                                                         )}
                                                      </p>
                                                      <p className="text-[10px] text-gray-400">
                                                         {
                                                            membrosDados.dono
                                                               .email
                                                         }
                                                      </p>
                                                   </div>
                                                </div>
                                                <span className="bg-green-100 text-green-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                                   Dono
                                                </span>
                                             </div>

                                             {/* Convidados */}
                                             {membrosDados.membros.map(
                                                (membro) => (
                                                   <div
                                                      key={membro.id}
                                                      className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-gray-100"
                                                   >
                                                      <div className="flex items-center gap-2.5">
                                                         <div className="w-7 h-7 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-[11px]">
                                                            {membro.nome
                                                               .charAt(0)
                                                               .toUpperCase()}
                                                         </div>
                                                         <div>
                                                            <p className="text-xs font-semibold text-gray-800">
                                                               {membro.nome}
                                                               {membro.id ===
                                                                  currentUserId && (
                                                                  <span className="text-gray-400 font-normal ml-1">
                                                                     (você)
                                                                  </span>
                                                               )}
                                                            </p>
                                                            <p className="text-[10px] text-gray-400">
                                                               {membro.email}
                                                            </p>
                                                         </div>
                                                      </div>
                                                      <div className="flex items-center gap-2">
                                                         <span className="bg-blue-100 text-blue-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                                            Convidado
                                                         </span>
                                                         {ehDono &&
                                                            membro.id !==
                                                               currentUserId && (
                                                               <button
                                                                  onClick={() =>
                                                                     setRemovendoMembro(
                                                                        {
                                                                           mesaId:
                                                                              mesa.id,
                                                                           userId:
                                                                              membro.id,
                                                                           nome: membro.nome,
                                                                        },
                                                                     )
                                                                  }
                                                                  className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                                  title="Remover membro"
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
                                                                        strokeWidth={
                                                                           2
                                                                        }
                                                                        d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6"
                                                                     />
                                                                  </svg>
                                                               </button>
                                                            )}
                                                      </div>
                                                   </div>
                                                ),
                                             )}

                                             {membrosDados.membros.length ===
                                                0 && (
                                                <p className="text-xs text-gray-400 px-3 py-2">
                                                   Nenhum convidado nesta mesa
                                                   ainda
                                                </p>
                                             )}
                                          </div>
                                       </div>

                                       {/* Convites Pendentes */}
                                       {ehDono &&
                                          membrosDados.convites_pendentes
                                             .length > 0 && (
                                             <div>
                                                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                                   Convites pendentes
                                                </p>
                                                <div className="space-y-2">
                                                   {membrosDados.convites_pendentes.map(
                                                      (convite) => (
                                                         <div
                                                            key={convite.id}
                                                            className="flex flex-col gap-1"
                                                         >
                                                            <div className="flex items-center justify-between py-2 px-3 bg-amber-50 rounded-lg border border-amber-100">
                                                               <div className="flex items-center gap-2">
                                                                  <svg
                                                                     className="w-4 h-4 text-amber-500 shrink-0"
                                                                     fill="none"
                                                                     stroke="currentColor"
                                                                     viewBox="0 0 24 24"
                                                                  >
                                                                     <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={
                                                                           2
                                                                        }
                                                                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                                                     />
                                                                  </svg>
                                                                  <div>
                                                                     <p className="text-xs text-gray-700">
                                                                        {
                                                                           convite.email_convidado
                                                                        }
                                                                     </p>
                                                                     <p className="text-[10px] text-amber-600">
                                                                        Aguardando
                                                                        resposta
                                                                     </p>
                                                                  </div>
                                                               </div>
                                                               <button
                                                                  onClick={() =>
                                                                     abrirConfirmarCancelamento(
                                                                        mesa.id,
                                                                        convite.id,
                                                                        convite.email_convidado,
                                                                     )
                                                                  }
                                                                  disabled={cancelandoConvite.has(
                                                                     convite.id,
                                                                  )}
                                                                  className="text-[10px] text-red-500 hover:text-red-700 font-medium disabled:opacity-40 flex items-center gap-1"
                                                               >
                                                                  {cancelandoConvite.has(
                                                                     convite.id,
                                                                  ) ? (
                                                                     <>
                                                                        <div className="w-2.5 h-2.5 border border-red-400 border-t-transparent rounded-full animate-spin" />
                                                                        Cancelando...
                                                                     </>
                                                                  ) : (
                                                                     "Cancelar"
                                                                  )}
                                                               </button>
                                                            </div>
                                                            {erroCancelar[
                                                               convite.id
                                                            ] && (
                                                               <p className="text-[10px] text-red-600 px-1">
                                                                  {
                                                                     erroCancelar[
                                                                        convite
                                                                           .id
                                                                     ]
                                                                  }
                                                               </p>
                                                            )}
                                                         </div>
                                                      ),
                                                   )}
                                                </div>
                                             </div>
                                          )}

                                       {/* Botão de convidar */}
                                       {ehDono && (
                                          <button
                                             onClick={() =>
                                                abrirModalConvite(mesa)
                                             }
                                             className="flex items-center gap-2 w-full px-3 py-2.5 border border-dashed border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors text-xs font-medium"
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
                                                   d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                                                />
                                             </svg>
                                             Convidar pessoa
                                          </button>
                                       )}
                                    </div>
                                 ) : null}
                              </div>
                           )}
                        </div>
                     );
                  })}
               </div>
            )}
         </div>

         {/* ── Modal Criar/Editar Mesa ── */}
         {modalAberto && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                  <div className="p-6">
                     <h2 className="text-lg font-bold text-gray-800 mb-4">
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
                              placeholder="Uma breve descrição..."
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

         {/* ── Modal Confirmar Exclusão ── */}
         {confirmarExclusao && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
                  <div className="flex items-center space-x-3 mb-4">
                     <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
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
                     <span className="font-semibold">
                        "{confirmarExclusao.nome}"
                     </span>
                     ?
                  </p>
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                     ⚠️ Todos os dados vinculados (receitas, despesas) também
                     serão excluídos.
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
         )}

         {/* ── Modal Convidar Pessoa ── */}
         {convidandoMesa && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                  <div className="p-6">
                     <div className="flex items-center justify-between mb-4">
                        <div>
                           <h2 className="text-lg font-bold text-gray-800">
                              Convidar para a mesa
                           </h2>
                           <p className="text-xs text-gray-500 mt-0.5">
                              "{convidandoMesa.nome}"
                           </p>
                        </div>
                        <button
                           onClick={() => setConvidandoMesa(null)}
                           className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                           <svg
                              className="w-4 h-4 text-gray-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                           >
                              <path
                                 strokeLinecap="round"
                                 strokeLinejoin="round"
                                 strokeWidth={2}
                                 d="M6 18L18 6M6 6l12 12"
                              />
                           </svg>
                        </button>
                     </div>

                     {erroConvite && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                           {erroConvite}
                        </div>
                     )}
                     {sucessoConvite && (
                        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm">
                           {sucessoConvite}
                        </div>
                     )}

                     <form onSubmit={enviarConvite} className="space-y-4">
                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-2">
                              Email do convidado
                           </label>
                           <input
                              type="email"
                              value={emailConvite}
                              onChange={(e) => setEmailConvite(e.target.value)}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              placeholder="email@exemplo.com"
                              autoFocus
                           />
                        </div>

                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700 space-y-1">
                           <p className="font-semibold">Como funciona:</p>
                           <p>
                              • Se a pessoa já tem cadastro, receberá uma
                              notificação e email.
                           </p>
                           <p>
                              • Se não tem cadastro, receberá um email de
                              convite para se registrar.
                           </p>
                        </div>

                        <div className="flex space-x-3 pt-2">
                           <button
                              type="button"
                              onClick={() => setConvidandoMesa(null)}
                              className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm"
                           >
                              Fechar
                           </button>
                           <button
                              type="submit"
                              disabled={enviandoConvite || !emailConvite.trim()}
                              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all font-medium text-sm disabled:opacity-50"
                           >
                              {enviandoConvite
                                 ? "Enviando..."
                                 : "Enviar convite"}
                           </button>
                        </div>
                     </form>
                  </div>
               </div>
            </div>
         )}

         {/* ── Modal Confirmar Cancelamento de Convite ── */}
         {confirmarCancelamento && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
                  <div className="flex items-center space-x-3 mb-4">
                     <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                        <svg
                           className="w-5 h-5 text-orange-600"
                           fill="none"
                           stroke="currentColor"
                           viewBox="0 0 24 24"
                        >
                           <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                           />
                        </svg>
                     </div>
                     <div>
                        <h3 className="text-base font-bold text-gray-800">
                           Cancelar convite
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                           Esta ação não pode ser desfeita
                        </p>
                     </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                     Tem certeza que deseja cancelar o convite enviado para{" "}
                     <span className="font-semibold">
                        {confirmarCancelamento.email}
                     </span>
                     ?
                  </p>
                  <p className="text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-lg p-3 mb-5">
                     ⚠️ O convite será removido permanentemente. A pessoa não
                     conseguirá mais usar o link enviado por email.
                  </p>
                  <div className="flex space-x-3">
                     <button
                        onClick={() => setConfirmarCancelamento(null)}
                        className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm"
                     >
                        Voltar
                     </button>
                     <button
                        onClick={executarCancelamento}
                        disabled={cancelandoConvite.has(
                           confirmarCancelamento.conviteId,
                        )}
                        className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm disabled:opacity-60 flex items-center justify-center gap-2"
                     >
                        {cancelandoConvite.has(
                           confirmarCancelamento.conviteId,
                        ) ? (
                           <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Cancelando...
                           </>
                        ) : (
                           "Sim, cancelar convite"
                        )}
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* ── Modal Confirmar Remoção de Membro ── */}
         {removendoMembro && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
                  <h3 className="text-base font-bold text-gray-800 mb-2">
                     Remover membro
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                     Tem certeza que deseja remover{" "}
                     <span className="font-semibold">
                        {removendoMembro.nome}
                     </span>{" "}
                     desta mesa?
                  </p>
                  {erroRemover && (
                     <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                        <svg
                           className="w-4 h-4 shrink-0"
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
                        {erroRemover}
                     </div>
                  )}
                  <div className="flex space-x-3">
                     <button
                        onClick={() => {
                           setRemovendoMembro(null);
                           setErroRemover("");
                        }}
                        className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm"
                     >
                        Cancelar
                     </button>
                     <button
                        onClick={removerMembro}
                        className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                     >
                        Remover
                     </button>
                  </div>
               </div>
            </div>
         )}
      </DashboardLayout>
   );
}
