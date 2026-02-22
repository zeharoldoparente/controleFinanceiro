"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import authService from "@/services/authService";

export default function LoginPage() {
   const router = useRouter();
   const [email, setEmail] = useState("");
   const [senha, setSenha] = useState("");
   const [erro, setErro] = useState("");
   const [carregando, setCarregando] = useState(false);

   const handleSubmit = async (e: FormEvent) => {
      e.preventDefault();
      setErro("");
      setCarregando(true);

      try {
         const response = await authService.login({ email, senha });

         // Login bem-sucedido
         console.log("Login bem-sucedido:", response);

         // Redirecionar para dashboard
         router.push("/dashboard");
      } catch (error: any) {
         console.error("Erro no login:", error);

         // Tratar diferentes tipos de erro
         if (error.response?.data?.message) {
            setErro(error.response.data.message);
         } else if (error.response?.status === 401) {
            setErro("Email ou senha incorretos");
         } else {
            setErro("Erro ao fazer login. Tente novamente.");
         }
      } finally {
         setCarregando(false);
      }
   };

   return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50">
         {/* Card Principal */}
         <div className="bg-white/80 backdrop-blur-sm p-10 rounded-3xl shadow-2xl w-full max-w-md border border-green-100/50 pb-2">
            {/* Logo e Branding */}
            <div className="text-center mb-8">
               {/* Logo */}
               <div className="flex justify-center">
                  <div className="relative drop-shadow-lg">
                     <Image
                        src="/ControlFin_completo.png"
                        alt="ControlFin Logo"
                        width={180}
                        height={180}
                        className="object-contain"
                        priority
                     />
                  </div>
               </div>
               {/* Slogan */}
               <p className="text-sm text-gray-500 font-light mt-2">
                  Gerencie suas finanças com inteligência
               </p>
            </div>
            {/* Divisória sutil */}
            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-8" />
            {/* Mensagem de Erro */}
            {erro && (
               <div>
                  <p className="text-sm font-semibold text-red-700 text-center">
                     {erro}
                  </p>
               </div>
            )}
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
               {/* Email */}
               <div>
                  <label
                     htmlFor="email"
                     className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wider"
                  >
                     Email
                  </label>
                  <input
                     id="email"
                     type="email"
                     placeholder="seu@email.com"
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     required
                     disabled={carregando}
                     className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:bg-green-50/30 focus:ring-1 focus:ring-[green-500/80] focus:border-green-300 outline-none transition-all duration-300 shadow-sm disabled:cursor-not-allowed"
                  />
               </div>

               {/* Senha */}
               <div>
                  <label
                     htmlFor="password"
                     className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wider"
                  >
                     Senha
                  </label>
                  <input
                     id="password"
                     type="password"
                     placeholder="••••••••"
                     value={senha}
                     onChange={(e) => setSenha(e.target.value)}
                     required
                     disabled={carregando}
                     className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:bg-green-50/30 focus:ring-1 focus:ring-[green-500/80] focus:border-green-300 outline-none transition-all duration-300 shadow-sm"
                  />
               </div>
               {/* Botão */}
               <button
                  type="submit"
                  disabled={carregando}
                  className="w-full bg-gradient-to-r from-[#042126] to-[#1e8220] text-white py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl active:scale-[0.98] mt-6 cursor-pointer"
               >
                  {carregando ? "Entrando..." : "Entrar"}
               </button>
            </form>
            {/* Links */}
            <div className="pt-2 text-center space-y-2 mb-8">
               <a
                  href="/recuperar-senha"
                  className="block text-xs text-gray-500 hover:text-green-600 transition-colors duration-200"
               >
                  Esqueci minha senha
               </a>
               <p className="text-xs text-gray-500">
                  Não tem conta?{" "}
                  <a
                     href="/registro"
                     className="text-green-600 font-semibold hover:text-green-700 transition-colors duration-200"
                  >
                     Criar conta
                  </a>
               </p>
            </div>
            {/* Divisória sutil */}
            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
            {/* NASAMDev */}
            <div className="mt-8 text-center">
               <p className="text-[10px] text-gray-500 flex items-center justify-center gap-2">
                  Desenvolvido e mantido por{" "}
                  <Image
                     src="/NASAMDev.svg"
                     alt="NasamDev Logo"
                     width={100}
                     height={100}
                     className="object-contain"
                     priority
                  />
               </p>
            </div>
         </div>
         {/* Elemento decorativo de fundo */}
         <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-green-200 rounded-full blur-3xl opacity-20" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-200 rounded-full blur-3xl opacity-20" />
         </div>
      </div>
   );
}
