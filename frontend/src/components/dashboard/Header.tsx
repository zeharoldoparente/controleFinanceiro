"use client";

import { useState, useEffect } from "react";
import authService from "@/services/authService";
import { useMesa } from "@/contexts/MesaContext";
import type { User } from "@/types";

interface HeaderProps {
   onMenuToggle: () => void;
   sidebarOpen: boolean;
}

export default function Header({ onMenuToggle, sidebarOpen }: HeaderProps) {
   const [user, setUser] = useState<User | null>(null);
   const [isFirstVisit, setIsFirstVisit] = useState(true);
   const { mesaSelecionada, mesas, selecionarMesa } = useMesa();
   const [dropdownAberto, setDropdownAberto] = useState(false);

   useEffect(() => {
      const userData = authService.getUser();
      setUser(userData);
      const hasVisited = localStorage.getItem("hasVisitedDashboard");
      if (hasVisited) {
         setIsFirstVisit(false);
      } else {
         localStorage.setItem("hasVisitedDashboard", "true");
      }
   }, []);

   const handleLogout = () => {
      authService.logout();
      window.location.href = "/login";
   };

   if (!user) return null;

   return (
      <header className="fixed top-0 right-0 left-0 lg:left-20 bg-white border-b border-gray-200 shadow-sm z-30">
         <div className="flex items-center justify-between h-16 px-4 md:px-6">
            {/* Lado Esquerdo */}
            <div className="flex items-center space-x-4">
               {/* Botão Hamburguer */}
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

               {/* Bem-vindo + Mesa */}
               <div className="hidden sm:block">
                  <p className="text-xs md:text-sm text-gray-600">
                     {isFirstVisit ? "Bem-vindo" : "Bem-vindo de volta"},{" "}
                     <span className="font-semibold text-gray-800">
                        {user.nome.split(" ")[0]}!
                     </span>
                  </p>

                  {/* Mesa Selecionada - com dropdown para troca */}
                  {mesaSelecionada && (
                     <div className="relative">
                        <button
                           onClick={() => setDropdownAberto(!dropdownAberto)}
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
                                 className={`w-3 h-3 transition-transform ${dropdownAberto ? "rotate-180" : ""}`}
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

                        {/* Dropdown de troca de mesa */}
                        {dropdownAberto && mesas.length > 1 && (
                           <>
                              {/* Overlay para fechar ao clicar fora */}
                              <div
                                 className="fixed inset-0 z-10"
                                 onClick={() => setDropdownAberto(false)}
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
                                          setDropdownAberto(false);
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
               {/* Notificações */}
               <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
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
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
               </button>

               {/* Avatar */}
               <div className="w-9 h-9 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {user.nome.charAt(0).toUpperCase()}
               </div>

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
