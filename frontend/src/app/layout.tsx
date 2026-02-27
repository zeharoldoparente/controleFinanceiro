import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { MesaProvider } from "@/contexts/MesaContext";

const poppins = Poppins({
   subsets: ["latin"],
   weight: ["300", "400", "500", "600", "700"],
   variable: "--font-poppins",
});

export const metadata: Metadata = {
   title: "Controle Financeiro",
   description: "Sistema de gestão financeira pessoal",
};

export default function RootLayout({
   children,
}: Readonly<{
   children: React.ReactNode;
}>) {
   return (
      <html lang="pt-BR">
         <body className={`${poppins.variable} antialiased font-sans`}>
            <MesaProvider>{children}</MesaProvider>
         </body>
      </html>
   );
}
