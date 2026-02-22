"use client";

import { useState, FormEvent, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import authService from "@/services/authService";
import { validarSenha } from "@/lib/senhaValidacao";
import IndicadorSenha from "@/components/IndicadorSenha";
import { isApiError } from "@/types";

export default function ResetarSenhaPage({
   params,
}: {
   params: Promise<{ token: string }>;
}) {
   const resolvedParams = use(params);
   const router = useRouter();
   const [novaSenha, setNovaSenha] = useState("");
   const [confirmarSenha, setConfirmarSenha] = useState("");
   const [erro, setErro] = useState("");
   const [errosSenha, setErrosSenha] = useState<string[]>([]);
   const [sucesso, setSucesso] = useState("");
   const [carregando, setCarregando] = useState(false);

   // Validar senha em tempo real
   const handleSenhaChange = (senha: string) => {
      setNovaSenha(senha);
      const resultado = validarSenha(senha);
      setErrosSenha(resultado.erros);
   };

   const handleSubmit = async (e: FormEvent) => {
      e.preventDefault();
      setErro("");
      setSucesso("");

      // Validar senha
      const validacao = validarSenha(novaSenha);
      if (!validacao.valida) {
         setErro("Senha não atende aos requisitos de segurança");
         return;
      }

      // Verificar se senhas coincidem
      if (novaSenha !== confirmarSenha) {
         setErro("As senhas não coincidem");
         return;
      }

      setCarregando(true);

      try {
         await authService.resetarSenha(resolvedParams.token, novaSenha);

         setSucesso(
            "Senha alterada com sucesso! Redirecionando para o login...",
         );

         setNovaSenha("");
         setConfirmarSenha("");
         setErrosSenha([]);

         setTimeout(() => {
            router.push("/login");
         }, 2000);
      } catch (error) {
         console.error("Erro ao resetar senha:", error);

         if (isApiError(error)) {
            if (error.response?.data?.message) {
               setErro(error.response.data.message);
            } else if (error.response?.status === 400) {
               setErro(
                  "Token inválido ou expirado. Solicite um novo link de recuperação.",
               );
            } else {
               setErro("Erro ao resetar senha. Tente novamente.");
            }
         } else {
            setErro("Erro inesperado. Tente novamente.");
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
               {/* Título */}
               <h2 className="text-xl font-bold text-gray-800 mt-4 mb-2">
                  Criar Nova Senha
               </h2>
               {/* Slogan */}
               <p className="text-sm text-gray-500 font-light">
                  Digite sua nova senha segura
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
               {/* Nova Senha */}
               <div>
                  <label
                     htmlFor="novaSenha"
                     className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wider"
                  >
                     Nova Senha
                  </label>
                  <input
                     id="novaSenha"
                     type="password"
                     placeholder="••••••••"
                     value={novaSenha}
                     onChange={(e) => handleSenhaChange(e.target.value)}
                     required
                     disabled={carregando}
                     className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:bg-green-50/30 focus:ring-1 focus:ring-green-500/80 focus:border-green-300 outline-none transition-all duration-300 shadow-sm disabled:cursor-not-allowed"
                  />

                  {/* Indicador de força */}
                  <IndicadorSenha senha={novaSenha} />

                  {/* Lista de requisitos */}
                  {novaSenha && errosSenha.length > 0 && (
                     <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs font-semibold text-red-700 mb-1">
                           Requisitos:
                        </p>
                        <ul className="space-y-1">
                           {errosSenha.map((erro, index) => (
                              <li
                                 key={index}
                                 className="text-xs text-red-600 flex items-start"
                              >
                                 <span className="mr-1">•</span>
                                 {erro}
                              </li>
                           ))}
                        </ul>
                     </div>
                  )}

                  {/* Senha válida */}
                  {novaSenha && errosSenha.length === 0 && (
                     <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-xs font-semibold text-green-700 flex items-center">
                           <span className="mr-1">✓</span>
                           Senha forte e segura!
                        </p>
                     </div>
                  )}
               </div>
               {/* Confirmar Senha */}
               <div>
                  <label
                     htmlFor="confirmarSenha"
                     className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wider"
                  >
                     Confirmar Nova Senha
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

                  {/* Validação em tempo real */}
                  {confirmarSenha && (
                     <div className="mt-2">
                        {novaSenha === confirmarSenha ? (
                           <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
                              <p className="text-xs font-semibold text-green-700 flex items-center">
                                 <span className="mr-1">✓</span>
                                 As senhas coincidem!
                              </p>
                           </div>
                        ) : (
                           <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                              <p className="text-xs font-semibold text-red-700 flex items-center">
                                 <span className="mr-1">✗</span>
                                 As senhas não coincidem
                              </p>
                           </div>
                        )}
                     </div>
                  )}
               </div>
               {/* Botão */}
               <button
                  type="submit"
                  disabled={
                     carregando ||
                     errosSenha.length > 0 ||
                     (confirmarSenha && novaSenha !== confirmarSenha) ||
                     !novaSenha ||
                     !confirmarSenha
                  }
                  className="w-full bg-gradient-to-r from-[#042126] to-[#1e8220] text-white py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl active:scale-[0.98] mt-6 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
               >
                  {carregando ? "Salvando..." : "Redefinir Senha"}
               </button>
            </form>

            {/* Links */}
            <div className="pt-6 text-center">
               <p className="text-xs text-gray-500">
                  Lembrou a senha?{" "}
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
