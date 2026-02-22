"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface DashboardLayoutProps {
   children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
   const [sidebarOpen, setSidebarOpen] = useState(false);

   const toggleSidebar = () => {
      setSidebarOpen(!sidebarOpen);
   };

   return (
      <div className="min-h-screen bg-gray-50">
         {/* Sidebar */}
         <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

         {/* Main Content */}
         <div
            className={`transition-all duration-300 ${
               sidebarOpen ? "lg:ml-64" : "lg:ml-20"
            }`}
         >
            {/* Header */}
            <Header onMenuToggle={toggleSidebar} sidebarOpen={sidebarOpen} />

            {/* Page Content */}
            <main className="pt-16">{children}</main>
         </div>
      </div>
   );
}
