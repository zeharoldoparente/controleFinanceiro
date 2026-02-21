import Image from "next/image";

export default function LoginPage() {
   return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50">
         {/* Card Principal */}
         <div className="bg-white/80 backdrop-blur-sm p-12 rounded-3xl shadow-2xl w-full max-w-md border border-green-100/50">
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

            {/* Form */}
            <form className="space-y-5">
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
                     className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:bg-green-50/30 focus:ring-2 focus:ring-green-500/50 focus:border-green-300 outline-none transition-all duration-300 shadow-sm"
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
                     className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:bg-green-50/30 focus:ring-2 focus:ring-green-500/50 focus:border-green-300 outline-none transition-all duration-300 shadow-sm"
                  />
               </div>

               {/* Botão */}
               <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3.5 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl active:scale-[0.98] mt-6 cursor-pointer"
               >
                  Entrar
               </button>
            </form>

            {/* Links - Discretos */}
            <div className="mt-8 pt-6 border-t border-gray-100 text-center space-y-2">
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
         </div>

         {/* Elemento decorativo de fundo (opcional) */}
         <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-green-200 rounded-full blur-3xl opacity-20" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-200 rounded-full blur-3xl opacity-20" />
         </div>
      </div>
   );
}
