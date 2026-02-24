"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import authService from "@/services/authService";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import type { User } from "@/types";

export default function DashboardPage() {
   const router = useRouter();
   const [user, setUser] = useState<User | null>(null);

   useEffect(() => {
      const checkAuth = () => {
         if (!authService.isAuthenticated()) {
            router.push("/login");
            return;
         }

         const userData = authService.getUser();
         setUser(userData);
      };

      checkAuth();
   }, [router]);

   if (!user) {
      return null;
   }

   return (
      <DashboardLayout>
         <div className="p-6">
            {/* Cards Principais */}
            <div className="space-y-4">
               {/* Receitas e Despesas - Lado a lado no mobile */}
               <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  {/* Receitas */}
                  <div className="bg-white rounded-xl shadow-md p-4 md:p-6 border border-gray-100 hover:shadow-lg transition-shadow">
                     <div className="flex items-center justify-between mb-3 md:mb-4">
                        <h3 className="text-xs md:text-sm font-medium text-gray-600">
                           Receitas
                        </h3>
                        <svg
                           className="w-5 h-5 md:w-6 md:h-6 text-green-600"
                           fill="none"
                           stroke="currentColor"
                           viewBox="0 0 24 24"
                        >
                           <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                           />
                        </svg>
                     </div>
                     <p className="text-xl md:text-3xl font-bold text-green-600">
                        R$ 5.000
                     </p>
                     <p className="text-[10px] md:text-xs text-gray-500 mt-1 md:mt-2">
                        Este mês
                     </p>
                  </div>

                  {/* Despesas */}
                  <div className="bg-white rounded-xl shadow-md p-4 md:p-6 border border-gray-100 hover:shadow-lg transition-shadow">
                     <div className="flex items-center justify-between mb-3 md:mb-4">
                        <h3 className="text-xs md:text-sm font-medium text-gray-600">
                           Despesas
                        </h3>
                        <svg
                           className="w-5 h-5 md:w-6 md:h-6 text-red-600"
                           fill="none"
                           stroke="currentColor"
                           viewBox="0 0 24 24"
                        >
                           <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                           />
                        </svg>
                     </div>
                     <p className="text-xl md:text-3xl font-bold text-red-600">
                        R$ 3.200
                     </p>
                     <p className="text-[10px] md:text-xs text-gray-500 mt-1 md:mt-2">
                        Este mês
                     </p>
                  </div>

                  {/* Saldo - Full width no mobile, 1/3 no desktop */}
                  <div className="col-span-2 md:col-span-1 bg-white rounded-xl shadow-md p-4 md:p-6 border border-gray-100 hover:shadow-lg transition-shadow">
                     <div className="flex items-center justify-between mb-3 md:mb-4">
                        <h3 className="text-xs md:text-sm font-medium text-gray-600">
                           Saldo
                        </h3>
                        <svg
                           className="w-5 h-5 md:w-6 md:h-6 text-gray-700"
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
                     </div>
                     {(() => {
                        const receitas = 5000;
                        const despesas = 3200;
                        const saldo = receitas - despesas;
                        const isPositivo = saldo >= 0;

                        return (
                           <>
                              <p
                                 className={`text-xl md:text-3xl font-bold ${isPositivo ? "text-blue-600" : "text-red-600"}`}
                              >
                                 R${" "}
                                 {Math.abs(saldo).toLocaleString("pt-BR", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                 })}
                              </p>
                              <p className="text-[10px] md:text-xs text-gray-500 mt-1 md:mt-2">
                                 {isPositivo ? "Positivo" : "Negativo"}
                              </p>
                           </>
                        );
                     })()}
                  </div>
               </div>
            </div>

            {/* Texto temporário */}
            <div className="bg-white rounded-xl shadow-md p-6 md:p-8 border border-gray-100 mt-4 md:mt-6">
               <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-4">
                  🚀 Dashboard em Construção
               </h3>
               <p className="text-sm md:text-base text-gray-600">
                  Testando o Header e Menu Lateral! Em breve adicionaremos os
                  outros cards.
               </p>
            </div>
         </div>
      </DashboardLayout>
   );
}
