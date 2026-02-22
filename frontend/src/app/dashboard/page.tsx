"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import authService from "@/services/authService";
import Image from "next/image";

export default function DashboardPage() {
   const router = useRouter();
   const [user, setUser] = useState<any>(null);

   useEffect(() => {
      // Verificar se está autenticado
      if (!authService.isAuthenticated()) {
         router.push("/login");
         return;
      }

      // Pegar dados do usuário
      const userData = authService.getUser();
      setUser(userData);
   }, [router]);

   const handleLogout = () => {
      authService.logout();
      router.push("/login");
   };

   if (!user) {
      return (
         <div className="min-h-screen flex items-center justify-center">
            <div className="text-lg text-gray-600">Carregando...</div>
         </div>
      );
   }

   return (
      <div className="min-h-screen bg-gray-50">
         {/* Header */}
         <header className="bg-gradient-to-r from-[#035E3D] to-[#1E8449] rounded=2xl shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
               <div className="flex justify-between items-center h-16">
                  {/* Logo */}
                  <div className="flex items-center space-x-3">
                     <Image
                        src="/logo_nome_branco2.png"
                        alt="Logo ControlFin"
                        width={150}
                        height={150}
                        className="object-contain"
                        priority
                     />
                  </div>
                  {/* User Menu */}
                  <div className="flex items-center space-x-8">
                     <span className="text-sm text-gray-600 text-white">
                        Olá,{" "}
                        <span className="text-lg font-semibold text-white">
                           {user.nome}
                        </span>
                     </span>
                     <button
                        onClick={handleLogout}
                        className="px-4 py-2 text-sm font-medium text-white hover:text-red-700 bg-[#d79c9c] rounded-lg transition cursor-pointer"
                     >
                        Sair
                     </button>
                  </div>
               </div>
            </div>
         </header>
         {/* Welcome Card */}
         <div className="">
            <h2 className="text-lg font-semibold text-black mb-2 pl-3">
               Bem-vindo de volta!
               <span className="text-xl">👋</span>
            </h2>
         </div>
         {/* Main Content */}
         <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
               {/* Card 1 - Receitas */}
               <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                     <h3 className="text-sm font-medium text-gray-600">
                        Receitas do Mês
                     </h3>
                     <div className="text-2xl">📈</div>
                  </div>
                  <p className="text-3xl font-bold text-green-600">R$ 0,00</p>
                  <p className="text-xs text-gray-500 mt-2">Em breve...</p>
               </div>
               {/* Card 2 - Despesas */}
               <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                     <h3 className="text-sm font-medium text-gray-600">
                        Despesas do Mês
                     </h3>
                     <div className="text-2xl">📉</div>
                  </div>
                  <p className="text-3xl font-bold text-red-600">R$ 0,00</p>
                  <p className="text-xs text-gray-500 mt-2">Em breve...</p>
               </div>
               {/* Card 3 - Saldo */}
               <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                     <h3 className="text-sm font-medium text-gray-600">
                        Saldo
                     </h3>
                     <div className="text-2xl">💰</div>
                  </div>
                  <p className="text-3xl font-bold text-gray-800">R$ 0,00</p>
                  <p className="text-xs text-gray-500 mt-2">Em breve...</p>
               </div>
            </div>
            {/* Info Card */}
            <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
               <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  🚀 Dashboard em Construção
               </h3>
               <p className="text-gray-600">
                  Estamos construindo o sistema completo de controle financeiro.
                  Em breve você terá acesso a:
               </p>
               <ul className="mt-4 space-y-2 text-gray-600">
                  <li className="flex items-center space-x-2">
                     <span className="text-green-500">✓</span>
                     <span>Gestão de Mesas Financeiras</span>
                  </li>
                  <li className="flex items-center space-x-2">
                     <span className="text-green-500">✓</span>
                     <span>Controle de Receitas e Despesas</span>
                  </li>
                  <li className="flex items-center space-x-2">
                     <span className="text-green-500">✓</span>
                     <span>Categorias Personalizadas</span>
                  </li>
                  <li className="flex items-center space-x-2">
                     <span className="text-green-500">✓</span>
                     <span>Relatórios e Gráficos</span>
                  </li>
                  <li className="flex items-center space-x-2">
                     <span className="text-green-500">✓</span>
                     <span>Compartilhamento de Mesas</span>
                  </li>
               </ul>
            </div>
         </main>
      </div>
   );
}
