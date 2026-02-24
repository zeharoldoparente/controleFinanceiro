"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

interface SidebarProps {
   isOpen: boolean;
   onToggle: () => void;
   onHoverChange?: (isHovering: boolean) => void;
}

export default function Sidebar({
   isOpen,
   onToggle,
   onHoverChange,
}: SidebarProps) {
   const pathname = usePathname();
   const [isHovering, setIsHovering] = useState(false);
   const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

   const menuItems = [
      {
         icon: (
            <svg
               className="w-5 h-5"
               fill="none"
               stroke="currentColor"
               viewBox="0 0 24 24"
            >
               <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
               />
            </svg>
         ),
         label: "Dashboard",
         href: "/dashboard",
      },
      {
         icon: (
            <svg
               className="w-5 h-5"
               fill="none"
               stroke="currentColor"
               viewBox="0 0 24 24"
            >
               <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
               />
            </svg>
         ),
         label: "Mesas",
         href: "/dashboard/mesas",
      },
      {
         icon: (
            <svg
               className="w-5 h-5"
               fill="none"
               stroke="currentColor"
               viewBox="0 0 24 24"
            >
               <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
               />
            </svg>
         ),
         label: "Receitas",
         href: "/dashboard/receitas",
      },
      {
         icon: (
            <svg
               className="w-5 h-5"
               fill="none"
               stroke="currentColor"
               viewBox="0 0 24 24"
            >
               <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
               />
            </svg>
         ),
         label: "Despesas",
         href: "/dashboard/despesas",
      },
      {
         icon: (
            <svg
               className="w-5 h-5"
               fill="none"
               stroke="currentColor"
               viewBox="0 0 24 24"
            >
               <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
               />
            </svg>
         ),
         label: "Cartões",
         href: "/dashboard/cartoes",
      },
      {
         icon: (
            <svg
               className="w-5 h-5"
               fill="none"
               stroke="currentColor"
               viewBox="0 0 24 24"
            >
               <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
               />
            </svg>
         ),
         label: "Categorias",
         href: "/dashboard/categorias",
      },
      {
         icon: (
            <svg
               className="w-5 h-5"
               fill="none"
               stroke="currentColor"
               viewBox="0 0 24 24"
            >
               <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
               />
               <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
               />
            </svg>
         ),
         label: "Configurações",
         href: "/dashboard/configuracoes",
      },
   ];

   const isActive = (href: string) => pathname === href;

   // Hover handler com delay de 2 segundos (apenas desktop)
   const handleMouseEnter = () => {
      if (window.innerWidth >= 1024) {
         // lg breakpoint
         hoverTimeoutRef.current = setTimeout(() => {
            setIsHovering(true);
            onHoverChange?.(true);
         }, 2000); // 2 segundos
      }
   };

   const handleMouseLeave = () => {
      if (hoverTimeoutRef.current) {
         clearTimeout(hoverTimeoutRef.current);
      }
      setIsHovering(false);
      onHoverChange?.(false);
   };

   useEffect(() => {
      return () => {
         if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
         }
      };
   }, []);

   // Desktop: usa hover, Mobile: usa isOpen
   const shouldBeExpanded =
      typeof window !== "undefined" && window.innerWidth >= 1024
         ? isHovering
         : isOpen;

   return (
      <>
         {/* Overlay para mobile */}
         {isOpen && (
            <div
               className="fixed inset-0 bg-black/50 z-40 lg:hidden"
               onClick={onToggle}
            />
         )}

         {/* Sidebar */}
         <aside
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`
               fixed top-0 left-0 h-full bg-gradient-to-b from-[#035E3D] to-[#1E8449] 
               text-white shadow-xl z-50 transition-all duration-300 ease-in-out
               ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
               ${shouldBeExpanded ? "w-50" : "w-20"}
            `}
         >
            {/* Logo */}
            <div className="flex items-center justify-center p-4 border-b border-white/10">
               {shouldBeExpanded ? (
                  <Image
                     src="/logo_nome_branco2.png"
                     alt="ControlFin Logo"
                     width={140}
                     height={40}
                     className="object-contain"
                     priority
                  />
               ) : (
                  <Image
                     src="/logo_branco.png"
                     alt="ControlFin"
                     width={40}
                     height={40}
                     className="object-contain"
                     priority
                  />
               )}
            </div>

            {/* Menu Items */}
            <nav className="flex-1 py-6">
               <ul className="space-y-1 px-3">
                  {menuItems.map((item) => (
                     <li key={item.href}>
                        <Link
                           href={item.href}
                           onClick={() => {
                              // Fecha o menu no mobile ao clicar
                              if (window.innerWidth < 1024) {
                                 onToggle();
                              }
                           }}
                           className={`
                              flex items-center rounded-lg
                              transition-all duration-200 group relative py-3
                              ${shouldBeExpanded ? "space-x-3 px-3" : "justify-center"}
                              ${
                                 isActive(item.href)
                                    ? "bg-white/20 text-white"
                                    : "text-white/80 hover:bg-white/10 hover:text-white"
                              }
                           `}
                        >
                           <span className="flex-shrink-0">{item.icon}</span>

                           {shouldBeExpanded ? (
                              <span className="font-medium text-sm">
                                 {item.label}
                              </span>
                           ) : (
                              // Tooltip quando colapsado (só desktop)
                              <div className="hidden lg:block absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg">
                                 {item.label}
                              </div>
                           )}
                        </Link>
                     </li>
                  ))}
               </ul>
            </nav>
         </aside>
      </>
   );
}
