"use client";

import { useState, useEffect } from "react";
import authService from "@/services/authService";
import type { User } from "@/types";

interface HeaderProps {
   onMenuToggle: () => void;
   sidebarOpen: boolean;
}

export default function Header({ onMenuToggle, sidebarOpen }: HeaderProps) {
   const [user, setUser] = useState<User | null>(null);
   const [isFirstVisit, setIsFirstVisit] = useState(true);
   const [mesaSelecionada, setMesaSelecionada] = useState("Todas as Mesas");

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
      <header className="fixed top-0 right-0 left-0 bg-white border-b border-gray-200 shadow-sm z-30">
         <div className="flex items-center justify-between h-16 px-6">
            {/* Lado Esquerdo */}
            <div className="flex items-center space-x-6">
               {/* Toggle */}
               <button
                  onClick={onMenuToggle}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
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

               {/* Bem-vindo */}
               <div className="hidden md:block">
                  <p className="text-sm text-gray-600">
                     {isFirstVisit ? "Bem-vindo" : "Bem-vindo de volta"},{" "}
                     <span className="font-semibold text-gray-800">
                        {user.nome.split(" ")[0]}!
                     </span>
                  </p>
               </div>
            </div>

            {/* Centro: Seletor de Mesa */}
            <div className="hidden lg:flex items-center space-x-2">
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
                     d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                  />
               </svg>
               <select
                  value={mesaSelecionada}
                  onChange={(e) => setMesaSelecionada(e.target.value)}
                  className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
               >
                  <option>Todas as Mesas</option>
                  <option>Pessoal</option>
                  <option>Trabalho</option>
                  <option>Família</option>
               </select>
            </div>

            {/* Direita */}
            <div className="flex items-center space-x-4">
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

               {/* User Menu */}
               <div className="flex items-center space-x-3">
                  <div className="hidden md:block text-right">
                     <p className="text-sm font-medium text-gray-700">
                        {user.nome}
                     </p>
                     <p className="text-xs text-gray-500">{user.email}</p>
                  </div>

                  {/* Avatar */}
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                     {user.nome.charAt(0).toUpperCase()}
                  </div>

                  {/* Botão Sair */}
                  <button
                     onClick={handleLogout}
                     className="hidden md:flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 rounded-lg hover:from-red-600 hover:to-red-700 transition-all"
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
                     <span>Sair</span>
                  </button>
               </div>
            </div>
         </div>
      </header>
   );
}
