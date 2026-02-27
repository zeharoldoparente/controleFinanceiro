"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { MesaProvider } from "@/contexts/MesaContext";

interface DashboardLayoutProps {
   children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
   const [sidebarOpen, setSidebarOpen] = useState(false);
   const [isHovering, setIsHovering] = useState(false);

   const toggleSidebar = () => {
      setSidebarOpen(!sidebarOpen);
   };

   const handleHoverChange = (hovering: boolean) => {
      setIsHovering(hovering);
   };

   return (
      <MesaProvider>
         <div className="min-h-screen bg-gray-50">
            {/* Sidebar */}
            <Sidebar
               isOpen={sidebarOpen}
               onToggle={toggleSidebar}
               onHoverChange={handleHoverChange}
            />
            {/* Main Content */}
            <div
               className={`transition-all duration-300 ${
                  isHovering ? "lg:ml-64" : "lg:ml-20"
               }`}
            >
               {/* Header */}
               <Header onMenuToggle={toggleSidebar} sidebarOpen={sidebarOpen} />

               {/* Page Content */}
               <main className="pt-16 px-4 md:px-6">{children}</main>
            </div>
         </div>
      </MesaProvider>
   );
}
