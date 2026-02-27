"use client";

import {
   createContext,
   useContext,
   useState,
   useEffect,
   ReactNode,
} from "react";
import mesaService, { Mesa } from "@/services/mesaService";

interface MesaContextType {
   mesaSelecionada: Mesa | null;
   mesas: Mesa[];
   selecionarMesa: (mesa: Mesa) => void;
   recarregarMesas: () => Promise<void>;
   carregando: boolean;
}

const MesaContext = createContext<MesaContextType>({
   mesaSelecionada: null,
   mesas: [],
   selecionarMesa: () => {},
   recarregarMesas: async () => {},
   carregando: true,
});

export function MesaProvider({ children }: { children: ReactNode }) {
   const [mesas, setMesas] = useState<Mesa[]>([]);
   const [mesaSelecionada, setMesaSelecionada] = useState<Mesa | null>(null);
   const [carregando, setCarregando] = useState(true);

   const recarregarMesas = async () => {
      try {
         const lista = await mesaService.listar();
         setMesas(lista);

         // Recuperar mesa salva no localStorage
         const mesaSalvaId = localStorage.getItem("mesaSelecionadaId");
         if (mesaSalvaId) {
            const encontrada = lista.find((m) => m.id === Number(mesaSalvaId));
            if (encontrada) {
               setMesaSelecionada(encontrada);
               return;
            }
         }

         // Se não há mesa salva ou não foi encontrada, seleciona a primeira
         if (lista.length > 0) {
            setMesaSelecionada(lista[0]);
            localStorage.setItem("mesaSelecionadaId", lista[0].id.toString());
         }
      } catch (error) {
         console.error("Erro ao carregar mesas:", error);
      } finally {
         setCarregando(false);
      }
   };

   const selecionarMesa = (mesa: Mesa) => {
      setMesaSelecionada(mesa);
      localStorage.setItem("mesaSelecionadaId", mesa.id.toString());
   };

   useEffect(() => {
      // Só carrega se estiver autenticado
      const token = localStorage.getItem("token");
      if (token) {
         recarregarMesas();
      } else {
         setCarregando(false);
      }
   }, []);

   return (
      <MesaContext.Provider
         value={{
            mesaSelecionada,
            mesas,
            selecionarMesa,
            recarregarMesas,
            carregando,
         }}
      >
         {children}
      </MesaContext.Provider>
   );
}

export function useMesa() {
   return useContext(MesaContext);
}
