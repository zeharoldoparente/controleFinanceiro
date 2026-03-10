"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import authService from "@/services/authService";
import { validarSenha } from "@/lib/senhaValidacao";
import IndicadorSenha from "@/components/IndicadorSenha";
import { isApiError } from "@/types";

export default function RegistroPage() {
   const router = useRouter();
   const [conviteToken, setConviteToken] = useState("");
   const [emailConvite, setEmailConvite] = useState("");
   const [nome, setNome] = useState("");
   const [email, setEmail] = useState("");
   const [senha, setSenha] = useState("");
   const [confirmarSenha, setConfirmarSenha] = useState("");
   const [erro, setErro] = useState("");
   const [errosSenha, setErrosSenha] = useState<string[]>([]);
   const [sucesso, setSucesso] = useState("");
   const [carregando, setCarregando] = useState(false);

   useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("convite") || "";
      const emailParam = params.get("email") || "";

      setConviteToken(token);
      setEmailConvite(emailParam);

      if (emailParam) {
         setEmail(emailParam);
      }
   }, []);

   const loginHref = conviteToken
      ? `/login?convite=${encodeURIComponent(conviteToken)}${emailConvite ? `&email=${encodeURIComponent(emailConvite)}` : ""}`
      : "/login";

   const handleSenhaChange = (novaSenha: string) => {
      setSenha(novaSenha);
      const resultado = validarSenha(novaSenha);
      setErrosSenha(resultado.erros);
   };

   const handleSubmit = async (e: FormEvent) => {
      e.preventDefault();
      setErro("");
      setSucesso("");

      const validacao = validarSenha(senha);
      if (!validacao.valida) {
         setErro("Senha nao atende aos requisitos de seguranca");
         return;
      }

      if (senha !== confirmarSenha) {
         setErro("As senhas nao coincidem");
         return;
      }

      setCarregando(true);

      try {
         const emailRegistrado = email;
         await authService.register({ nome, email, senha });

         setSucesso(
            "Conta criada com sucesso! Verifique seu email para ativar sua conta.",
         );

         setNome("");
         setEmail("");
         setSenha("");
         setConfirmarSenha("");
         setErrosSenha([]);

         const destinoLogin = conviteToken
            ? `/login?convite=${encodeURIComponent(conviteToken)}&email=${encodeURIComponent(emailRegistrado || emailConvite)}`
            : "/login";

         setTimeout(() => {
            router.push(destinoLogin);
         }, 3000);
      } catch (error) {
         console.error("Erro no registro:", error);

         if (isApiError(error)) {
            if (error.response?.data?.message) {
               setErro(error.response.data.message);
            } else if (error.response?.status === 400) {
               setErro("Email ja cadastrado ou dados invalidos");
            } else {
               setErro("Erro ao criar conta. Tente novamente.");
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
         <div className="bg-white/80 backdrop-blur-sm p-10 rounded-3xl shadow-2xl w-full max-w-md border border-green-100/50 pb-2">
            <div className="text-center mb-8">
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
               <p className="text-sm text-gray-500 font-light mt-2">
                  Crie sua conta e comece a gerenciar suas financas
               </p>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-8" />

            {erro && (
               <div className="mb-4">
                  <p className="text-sm font-semibold text-red-700 text-center">
                     {erro}
                  </p>
               </div>
            )}

            {sucesso && (
               <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-sm font-semibold text-green-700 text-center">
                     {sucesso}
                  </p>
               </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
                     placeholder="********"
                     value={senha}
                     onChange={(e) => handleSenhaChange(e.target.value)}
                     required
                     disabled={carregando}
                     className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:bg-green-50/30 focus:ring-1 focus:ring-green-500/80 focus:border-green-300 outline-none transition-all duration-300 shadow-sm disabled:cursor-not-allowed"
                  />

                  <IndicadorSenha senha={senha} />

                  {senha && errosSenha.length > 0 && (
                     <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs font-semibold text-red-700 mb-1">
                           Requisitos:
                        </p>
                        <ul className="space-y-1">
                           {errosSenha.map((erroSenha, index) => (
                              <li
                                 key={index}
                                 className="text-xs text-red-600 flex items-start"
                              >
                                 <span className="mr-1">-</span>
                                 {erroSenha}
                              </li>
                           ))}
                        </ul>
                     </div>
                  )}

                  {senha && errosSenha.length === 0 && (
                     <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-xs font-semibold text-green-700 flex items-center">
                           <span className="mr-1">OK</span>
                           Senha forte e segura!
                        </p>
                     </div>
                  )}
               </div>

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
                     placeholder="********"
                     value={confirmarSenha}
                     onChange={(e) => setConfirmarSenha(e.target.value)}
                     required
                     disabled={carregando}
                     className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:bg-green-50/30 focus:ring-1 focus:ring-green-500/80 focus:border-green-300 outline-none transition-all duration-300 shadow-sm disabled:cursor-not-allowed"
                  />

                  {confirmarSenha && (
                     <div className="mt-2">
                        {senha === confirmarSenha ? (
                           <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
                              <p className="text-xs font-semibold text-green-700 flex items-center">
                                 <span className="mr-1">OK</span>
                                 As senhas coincidem!
                              </p>
                           </div>
                        ) : (
                           <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                              <p className="text-xs font-semibold text-red-700 flex items-center">
                                 <span className="mr-1">X</span>
                                 As senhas nao coincidem
                              </p>
                           </div>
                        )}
                     </div>
                  )}
               </div>

               <button
                  type="submit"
                  disabled={
                     carregando ||
                     errosSenha.length > 0 ||
                     (confirmarSenha && senha !== confirmarSenha) ||
                     !senha ||
                     !confirmarSenha
                  }
                  className="w-full bg-gradient-to-r from-[#042126] to-[#1e8220] text-white py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl active:scale-[0.98] mt-6 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
               >
                  {carregando ? "Criando conta..." : "Criar Conta"}
               </button>
            </form>

            <div className="pt-4 text-center">
               <p className="text-xs text-gray-500">
                  Ja tem uma conta?{" "}
                  <a
                     href={loginHref}
                     className="text-green-600 font-semibold hover:text-green-700 transition-colors duration-200"
                  >
                     Fazer login
                  </a>
               </p>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mt-6" />

            <div className="mt-8 text-center">
               <p className="text-[10px] text-gray-500 flex items-center justify-center gap-2">
                  Desenvolvido e mantido por{" "}
                  <Image
                     src="/NASAMDev.png"
                     alt="NasamDev Logo"
                     width={100}
                     height={100}
                     className="object-contain"
                     priority
                  />
               </p>
            </div>
         </div>

         <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-green-200 rounded-full blur-3xl opacity-20" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-200 rounded-full blur-3xl opacity-20" />
         </div>
      </div>
   );
}
