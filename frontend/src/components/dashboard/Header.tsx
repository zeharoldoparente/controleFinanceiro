"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import authService from "@/services/authService";
import notificacaoService, { Notificacao } from "@/services/notificacaoService";
import conviteService from "@/services/conviteService";
import { useMesa } from "@/contexts/MesaContext";
import type { User } from "@/types";
import contaService from "@/services/contaService";

interface HeaderProps {
   onMenuToggle: () => void;
   sidebarOpen: boolean;
}

function fmtTempo(iso: string) {
   const diff = Date.now() - new Date(iso).getTime();
   const m = Math.floor(diff / 60000);
   if (m < 1) return "agora";
   if (m < 60) return `${m}m atrás`;
   const h = Math.floor(m / 60);
   if (h < 24) return `${h}h atrás`;
   return `${Math.floor(h / 24)}d atrás`;
}

export default function Header({ onMenuToggle, sidebarOpen }: HeaderProps) {
   const [user, setUser] = useState<User | null>(null);
   const [fotoUrl, setFotoUrl] = useState<string | null>(null);
   const [isFirstVisit, setIsFirstVisit] = useState(true);
   const { mesaSelecionada, mesas, selecionarMesa, recarregarMesas } =
      useMesa();
   const [dropdownMesa, setDropdownMesa] = useState(false);

   // Notificações
   const [notifOpen, setNotifOpen] = useState(false);
   const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
   const [naoLidas, setNaoLidas] = useState(0);
   const [loadingNotif, setLoadingNotif] = useState(false);
   const [aceitandoConvite, setAceitandoConvite] = useState<number | null>(
      null,
   );
   const notifRef = useRef<HTMLDivElement>(null);
   const intervalRef = useRef<NodeJS.Timeout | null>(null);

   // useCallback garante referência estável para o useEffect e o setInterval
   const carregarContagemNaoLidas = useCallback(async () => {
      try {
         const { total } = await notificacaoService.countNaoLidas();
         setNaoLidas(total);
      } catch {
         // silencioso — não quebrar a UI se backend estiver offline
      }
   }, []);

   useEffect(() => {
      const userData = authService.getUser();
      // Carrega foto do perfil
      contaService
         .getPerfil()
         .then((p) => setFotoUrl(p.foto_url))
         .catch(() => {});
      setUser(userData);

      const hasVisited = localStorage.getItem("hasVisitedDashboard");
      if (hasVisited) setIsFirstVisit(false);
      else localStorage.setItem("hasVisitedDashboard", "true");

      // Carrega contagem inicial
      carregarContagemNaoLidas();

      // Polling a cada 60s — usando ref para garantir único interval ativo
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(carregarContagemNaoLidas, 60000);

      return () => {
         if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
         }
      };
   }, [carregarContagemNaoLidas]);

   // Fecha dropdown ao clicar fora
   useEffect(() => {
      function handleClick(e: MouseEvent) {
         if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
            setNotifOpen(false);
         }
      }
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
   }, []);

   const abrirNotificacoes = async () => {
      if (notifOpen) {
         setNotifOpen(false);
         return;
      }
      setNotifOpen(true);
      setLoadingNotif(true);
      try {
         const { notificacoes: lista, nao_lidas } =
            await notificacaoService.listar();
         setNotificacoes(lista);
         setNaoLidas(nao_lidas);
      } catch {
         setNotificacoes([]);
      } finally {
         setLoadingNotif(false);
      }
   };

   const marcarLida = async (notif: Notificacao) => {
      if (notif.lida) return;
      try {
         await notificacaoService.marcarLida(notif.id);
         setNotificacoes((prev) =>
            prev.map((n) => (n.id === notif.id ? { ...n, lida: true } : n)),
         );
         setNaoLidas((v) => Math.max(0, v - 1));
      } catch {}
   };

   const marcarTodasLidas = async () => {
      try {
         await notificacaoService.marcarTodasLidas();
         setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
         setNaoLidas(0);
      } catch {}
   };

   const aceitarConvite = async (notif: Notificacao) => {
      const token = notif.dados_extras?.token as string;
      if (!token) return;
      setAceitandoConvite(notif.id);
      try {
         await conviteService.aceitar(token);
         await marcarLida(notif);
         await recarregarMesas();
         setNotificacoes((prev) => prev.filter((n) => n.id !== notif.id));
      } catch {
         alert("Erro ao aceitar convite. Tente novamente.");
      } finally {
         setAceitandoConvite(null);
      }
   };

   const recusarConvite = async (notif: Notificacao) => {
      const token = notif.dados_extras?.token as string;
      if (!token) return;
      try {
         await conviteService.recusar(token);
         await marcarLida(notif);
         setNotificacoes((prev) => prev.filter((n) => n.id !== notif.id));
      } catch {
         alert("Erro ao recusar convite. Tente novamente.");
      }
   };

   const handleLogout = () => {
      authService.logout();
      window.location.href = "/login";
   };

   if (!user) return null;

   return (
      <header className="fixed top-0 right-0 left-0 lg:left-20 bg-white border-b border-gray-200 shadow-sm z-30">
         <div className="flex items-center justify-between h-16 px-4 md:px-6">
            {/* Esquerda */}
            <div className="flex items-center space-x-4">
               <button
                  onClick={onMenuToggle}
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
               >
                  <svg
                     className="w-5 h-5 text-gray-600"
                     fill="none"
                     stroke="currentColor"
                     viewBox="0 0 24 24"
                  >
                     <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                     />
                  </svg>
               </button>

               <div className="hidden sm:block">
                  <p className="text-xs md:text-sm text-gray-600">
                     {isFirstVisit ? "Bem-vindo" : "Bem-vindo de volta"},{" "}
                     <span className="font-semibold text-gray-800">
                        {user.nome.split(" ")[0]}!
                     </span>
                  </p>

                  {mesaSelecionada && (
                     <div className="relative">
                        <button
                           onClick={() => setDropdownMesa(!dropdownMesa)}
                           className="flex items-center space-x-1 text-[11px] text-gray-500 hover:text-green-600 transition-colors group"
                        >
                           <svg
                              className="w-3 h-3 text-green-500"
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
                           <span>
                              Você está na mesa:{" "}
                              <span className="font-semibold text-green-600">
                                 {mesaSelecionada.nome}
                              </span>
                           </span>
                           {mesas.length > 1 && (
                              <svg
                                 className={`w-3 h-3 transition-transform ${dropdownMesa ? "rotate-180" : ""}`}
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
                           )}
                        </button>

                        {dropdownMesa && mesas.length > 1 && (
                           <>
                              <div
                                 className="fixed inset-0 z-10"
                                 onClick={() => setDropdownMesa(false)}
                              />
                              <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[180px] z-20">
                                 <p className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                                    Trocar mesa
                                 </p>
                                 {mesas.map((mesa) => (
                                    <button
                                       key={mesa.id}
                                       onClick={() => {
                                          selecionarMesa(mesa);
                                          setDropdownMesa(false);
                                       }}
                                       className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center space-x-2 ${
                                          mesa.id === mesaSelecionada.id
                                             ? "bg-green-50 text-green-700 font-semibold"
                                             : "text-gray-700 hover:bg-gray-50"
                                       }`}
                                    >
                                       {mesa.id === mesaSelecionada.id && (
                                          <svg
                                             className="w-3 h-3 text-green-600"
                                             fill="currentColor"
                                             viewBox="0 0 20 20"
                                          >
                                             <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                             />
                                          </svg>
                                       )}
                                       <span>{mesa.nome}</span>
                                    </button>
                                 ))}
                              </div>
                           </>
                        )}
                     </div>
                  )}
               </div>
            </div>

            {/* Direita */}
            <div className="flex items-center space-x-2 md:space-x-4">
               {/* ── Sino de Notificações ── */}
               <div ref={notifRef} className="relative">
                  <button
                     onClick={abrirNotificacoes}
                     className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                     <svg
                        className="w-5 h-5 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                     >
                        <path
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           strokeWidth={2}
                           d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                     </svg>
                     {naoLidas > 0 && (
                        <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold px-0.5">
                           {naoLidas > 9 ? "9+" : naoLidas}
                        </span>
                     )}
                  </button>

                  {/* Dropdown de notificações */}
                  {notifOpen && (
                     <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                        {/* Header do dropdown */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                           <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-800">
                                 Notificações
                              </span>
                              {naoLidas > 0 && (
                                 <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                    {naoLidas}
                                 </span>
                              )}
                           </div>
                           {naoLidas > 0 && (
                              <button
                                 onClick={marcarTodasLidas}
                                 className="text-[11px] text-green-600 hover:text-green-700 font-medium"
                              >
                                 Marcar todas como lidas
                              </button>
                           )}
                        </div>

                        {/* Lista */}
                        <div className="max-h-96 overflow-y-auto">
                           {loadingNotif ? (
                              <div className="flex items-center justify-center py-8">
                                 <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                              </div>
                           ) : notificacoes.length === 0 ? (
                              <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                                 <svg
                                    className="w-10 h-10 text-gray-200 mb-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                 >
                                    <path
                                       strokeLinecap="round"
                                       strokeLinejoin="round"
                                       strokeWidth={1.5}
                                       d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5"
                                    />
                                 </svg>
                                 <p className="text-sm text-gray-400">
                                    Nenhuma notificação
                                 </p>
                              </div>
                           ) : (
                              notificacoes.map((notif) => (
                                 <div
                                    key={notif.id}
                                    className={`px-4 py-3 border-b border-gray-50 transition-colors ${
                                       notif.lida
                                          ? "bg-white"
                                          : "bg-green-50/40"
                                    }`}
                                 >
                                    <div className="flex items-start gap-3">
                                       {/* Ícone por tipo */}
                                       <div
                                          className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                             notif.tipo === "convite_mesa"
                                                ? "bg-blue-100"
                                                : "bg-gray-100"
                                          }`}
                                       >
                                          {notif.tipo === "convite_mesa" ? (
                                             <svg
                                                className="w-4 h-4 text-blue-600"
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
                                          ) : (
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
                                                   d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                             </svg>
                                          )}
                                       </div>

                                       <div className="flex-1 min-w-0">
                                          <div className="flex items-start justify-between gap-2">
                                             <p
                                                className={`text-xs font-semibold ${notif.lida ? "text-gray-700" : "text-gray-900"}`}
                                             >
                                                {notif.titulo}
                                             </p>
                                             <div className="flex items-center gap-1.5 shrink-0">
                                                <span className="text-[10px] text-gray-400">
                                                   {fmtTempo(notif.created_at)}
                                                </span>
                                                {!notif.lida && (
                                                   <span className="w-2 h-2 bg-green-500 rounded-full" />
                                                )}
                                             </div>
                                          </div>
                                          <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                                             {notif.mensagem}
                                          </p>

                                          {/* Botões de convite */}
                                          {notif.tipo === "convite_mesa" &&
                                             notif.dados_extras?.token &&
                                             !notif.lida && (
                                                <div className="flex gap-2 mt-2">
                                                   <button
                                                      onClick={() =>
                                                         aceitarConvite(notif)
                                                      }
                                                      disabled={
                                                         aceitandoConvite ===
                                                         notif.id
                                                      }
                                                      className="flex-1 py-1.5 bg-green-500 hover:bg-green-600 text-white text-[11px] font-semibold rounded-lg transition-colors disabled:opacity-50"
                                                   >
                                                      {aceitandoConvite ===
                                                      notif.id
                                                         ? "Aceitando..."
                                                         : "Aceitar"}
                                                   </button>
                                                   <button
                                                      onClick={() =>
                                                         recusarConvite(notif)
                                                      }
                                                      className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-semibold rounded-lg transition-colors"
                                                   >
                                                      Recusar
                                                   </button>
                                                </div>
                                             )}

                                          {/* Marcar como lida para notificações não de convite */}
                                          {!notif.lida &&
                                             notif.tipo !== "convite_mesa" && (
                                                <button
                                                   onClick={() =>
                                                      marcarLida(notif)
                                                   }
                                                   className="mt-1.5 text-[10px] text-gray-400 hover:text-green-600 transition-colors"
                                                >
                                                   Marcar como lida
                                                </button>
                                             )}
                                       </div>
                                    </div>
                                 </div>
                              ))
                           )}
                        </div>
                     </div>
                  )}
               </div>

               {/* Avatar */}
               {fotoUrl ? (
                  <img
                     src={fotoUrl}
                     alt={user.nome}
                     className="w-9 h-9 rounded-full object-cover ring-2 ring-white/30 shadow-sm"
                  />
               ) : (
                  <div className="w-9 h-9 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                     {user.nome.charAt(0).toUpperCase()}
                  </div>
               )}

               {/* Botão Sair - Desktop */}
               <button
                  onClick={handleLogout}
                  className="hidden sm:flex items-center space-x-2 px-3 py-2 text-xs md:text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 rounded-lg hover:from-red-600 hover:to-red-700 transition-all"
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
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                     />
                  </svg>
                  <span className="hidden md:inline">Sair</span>
               </button>

               {/* Botão Sair - Mobile */}
               <button
                  onClick={handleLogout}
                  className="sm:hidden p-2 rounded-lg bg-red-500 hover:bg-red-600 transition-colors"
               >
                  <svg
                     className="w-4 h-4 text-white"
                     fill="none"
                     stroke="currentColor"
                     viewBox="0 0 24 24"
                  >
                     <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                     />
                  </svg>
               </button>
            </div>
         </div>
      </header>
   );
}
