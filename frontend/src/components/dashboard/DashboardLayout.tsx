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
         <div className="lg:ml-20">
            <Header onMenuToggle={toggleSidebar} sidebarOpen={sidebarOpen} />
            <main className="pt-16 px-4 md:px-6">{children}</main>
         </div>
      </div>
   );
}
