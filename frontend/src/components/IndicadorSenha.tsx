"use client";

import { forcaSenha } from "@/lib/senhaValidacao";

interface IndicadorSenhaProps {
   senha: string;
}

export default function IndicadorSenha({ senha }: IndicadorSenhaProps) {
   if (!senha) return null;

   const forca = forcaSenha(senha);

   const cores = {
      fraca: "bg-red-500",
      media: "bg-yellow-500",
      forte: "bg-green-500",
   };

   const textos = {
      fraca: "Fraca",
      media: "Média",
      forte: "Forte",
   };

   const largura = {
      fraca: "w-1/3",
      media: "w-2/3",
      forte: "w-full",
   };

   return (
      <div className="mt-2">
         <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">Força da senha:</span>
            <span
               className={`text-xs font-semibold ${
                  forca === "fraca"
                     ? "text-red-600"
                     : forca === "media"
                       ? "text-yellow-600"
                       : "text-green-600"
               }`}
            >
               {textos[forca]}
            </span>
         </div>
         <div className="w-full bg-gray-200 rounded-full h-2">
            <div
               className={`h-2 rounded-full transition-all duration-300 ${cores[forca]} ${largura[forca]}`}
            />
         </div>
      </div>
   );
}
