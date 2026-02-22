"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import authService from "@/services/authService";

export default function RegistroPage() {
   const router = useRouter();
   const [nome, setNome] = useState("");
   const [email, setEmail] = useState("");
   const [senha, setSenha] = useState("");
   const [confirmarSenha, setConfirmarSenha] = useState("");
   const [erro, setErro] = useState("");
   const [sucesso, setSucesso] = useState("");
   const [carregando, setCarregando] = useState(false);

   const handleSubmit = async (e: FormEvent) => {
      e.preventDefault();
      setErro("");
      setSucesso("");

      // Validações
      if (senha.length < 6) {
         setErro("A senha deve ter no mínimo 6 caracteres");
         return;
      }

      if (senha !== confirmarSenha) {
         setErro("As senhas não coincidem");
         return;
      }

      setCarregando(true);

      try {
         await authService.register({ nome, email, senha });

         // Registro bem-sucedido
         setSucesso(
            "Conta criada com sucesso! Verifique seu email para ativar sua conta.",
         );

         // Limpar campos
         setNome("");
         setEmail("");
         setSenha("");
         setConfirmarSenha("");

         // Redirecionar para login após 3 segundos
         setTimeout(() => {
            router.push("/login");
         }, 3000);
      } catch (error: any) {
         console.error("Erro no registro:", error);

         if (error.response?.data?.message) {
            setErro(error.response.data.message);
         } else if (error.response?.status === 400) {
            setErro("Email já cadastrado ou dados inválidos");
         } else {
            setErro("Erro ao criar conta. Tente novamente.");
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
                  Crie sua conta e comece a gerenciar suas finanças
               </p>
            </div>

            {/* Divisória sutil */}
            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-8" />

            {/* Mensagem de Erro */}
            {erro && (
               <div className="mb-4">
                  <p className="text-sm font-semibold text-red-700 text-center">
                     {erro}
                  </p>
               </div>
            )}

            {/* Mensagem de Sucesso */}
            {sucesso && (
               <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-sm font-semibold text-green-700 text-center">
                     {sucesso}
                  </p>
               </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
               {/* Nome */}
               <div>
                  <label
                     htmlFor="nome"
                     className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wider"
                  >
                     Nome Completo
                  </label>
                  <input
                     id="nome"
                     type="text"
                     placeholder="Seu nome completo"
                     value={nome}
                     onChange={(e) => setNome(e.target.value)}
                     required
                     disabled={carregando}
                     className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:bg-green-50/30 focus:ring-1 focus:ring-green-500/80 focus:border-green-300 outline-none transition-all duration-300 shadow-sm disabled:cursor-not-allowed"
                  />
               </div>

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
                     className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:bg-green-50/30 focus:ring-1 focus:ring-green-500/80 focus:border-green-300 outline-none transition-all duration-300 shadow-sm disabled:cursor-not-allowed"
                  />
               </div>

               {/* Senha */}
               <div>
                  <label
                     htmlFor="senha"
                     className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wider"
                  >
                     Senha
                  </label>
                  <input
                     id="senha"
                     type="password"
                     placeholder="••••••••"
                     value={senha}
                     onChange={(e) => setSenha(e.target.value)}
                     required
                     disabled={carregando}
                     className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:bg-green-50/30 focus:ring-1 focus:ring-green-500/80 focus:border-green-300 outline-none transition-all duration-300 shadow-sm disabled:cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                     Mínimo 6 caracteres
                  </p>
               </div>

               {/* Confirmar Senha */}
               <div>
                  <label
                     htmlFor="confirmarSenha"
                     className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wider"
                  >
                     Confirmar Senha
                  </label>
                  <input
                     id="confirmarSenha"
                     type="password"
                     placeholder="••••••••"
                     value={confirmarSenha}
                     onChange={(e) => setConfirmarSenha(e.target.value)}
                     required
                     disabled={carregando}
                     className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:bg-green-50/30 focus:ring-1 focus:ring-green-500/80 focus:border-green-300 outline-none transition-all duration-300 shadow-sm disabled:cursor-not-allowed"
                  />
               </div>

               {/* Botão */}
               <button
                  type="submit"
                  disabled={carregando}
                  className="w-full bg-gradient-to-r from-[#042126] to-[#1e8220] text-white py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl active:scale-[0.98] mt-6 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
               >
                  {carregando ? "Criando conta..." : "Criar Conta"}
               </button>
            </form>

            {/* Links */}
            <div className="pt-4 text-center">
               <p className="text-xs text-gray-500">
                  Já tem uma conta?{" "}
                  <a
                     href="/login"
                     className="text-green-600 font-semibold hover:text-green-700 transition-colors duration-200"
                  >
                     Fazer login
                  </a>
               </p>
            </div>

            {/* Divisória sutil */}
            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mt-6" />

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
