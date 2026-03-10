"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CadastroAliasPage() {
   const router = useRouter();

   useEffect(() => {
      const search = window.location.search || "";
      router.replace(`/registro${search}`);
   }, [router]);

   return (
      <div className="min-h-screen flex items-center justify-center bg-white text-gray-600 text-sm">
         Redirecionando para o cadastro...
      </div>
   );
}
