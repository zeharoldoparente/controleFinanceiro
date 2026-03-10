"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import conviteService from "@/services/conviteService";
import authService from "@/services/authService";
import { isApiError } from "@/types";

type Status = "loading" | "success" | "error";

export default function ConviteTokenPage() {
   const router = useRouter();
   const params = useParams<{ token: string }>();
   const token = useMemo(() => String(params?.token || ""), [params]);

   const [status, setStatus] = useState<Status>("loading");
   const [mensagem, setMensagem] = useState("Processando convite...");

   useEffect(() => {
      const processarConvite = async () => {
         if (!token) {
            setStatus("error");
            setMensagem("Token de convite invalido.");
            return;
         }

         if (!authService.isAuthenticated()) {
            router.replace(`/login?convite=${token}`);
            return;
         }

         try {
            const data = await conviteService.aceitar(token);

            if (typeof data?.mesa_id === "number") {
               localStorage.setItem("mesaSelecionadaId", String(data.mesa_id));
            }

            setStatus("success");
            setMensagem("Convite aceito com sucesso! Redirecionando...");

            setTimeout(() => {
               router.replace("/dashboard/mesas");
            }, 1200);
         } catch (error) {
            if (isApiError(error) && error.response?.status === 401) {
               router.replace(`/login?convite=${token}`);
               return;
            }

            const apiMessage =
               isApiError(error) &&
               (error.response?.data?.error || error.response?.data?.message);

            setStatus("error");
            setMensagem(apiMessage || "Nao foi possivel processar o convite.");
         }
      };

      processarConvite();
   }, [router, token]);

   return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4">
         <div className="w-full max-w-md rounded-2xl border border-green-100 bg-white p-6 shadow-xl">
            <h1 className="text-xl font-bold text-gray-800">Convite de mesa</h1>
            <p
               className={`mt-3 text-sm ${
                  status === "error"
                     ? "text-red-600"
                     : status === "success"
                       ? "text-green-700"
                       : "text-gray-600"
               }`}
            >
               {mensagem}
            </p>

            {status === "error" && (
               <div className="mt-5 flex gap-2">
                  <button
                     onClick={() => router.push(`/login?convite=${token}`)}
                     className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                  >
                     Ir para login
                  </button>
                  <button
                     onClick={() => router.push(`/registro?convite=${token}`)}
                     className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                  >
                     Criar conta
                  </button>
               </div>
            )}
         </div>
      </div>
   );
}