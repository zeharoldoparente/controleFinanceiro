"use client";

import { MesaProvider } from "@/contexts/MesaContext";

export default function DashboardRootLayout({
   children,
}: {
   children: React.ReactNode;
}) {
   return <MesaProvider>{children}</MesaProvider>;
}
