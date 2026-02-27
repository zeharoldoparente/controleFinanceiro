"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import authService from "@/services/authService";
import dashboardService, { DashboardData } from "@/services/dashboardService";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
   BarChart,
   Bar,
   LineChart,
   Line,
   XAxis,
   YAxis,
   CartesianGrid,
   Tooltip,
   ResponsiveContainer,
   Legend,
} from "recharts";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mesAtual() {
   const d = new Date();
   return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function gerarMeses() {
   const meses = [];
   const hoje = new Date();
   const nomes = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
   ];
   for (let i = -12; i <= 3; i++) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
      meses.push({
         valor: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
         label: `${nomes[d.getMonth()]} ${d.getFullYear()}`,
      });
   }
   return meses;
}

function fmtValor(v: number) {
   return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
   }).format(v);
}

function fmtValorCompacto(v: number) {
   if (Math.abs(v) >= 1000) {
      return `R$\u00a0${(v / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}k`;
   }
   return fmtValor(v);
}

function fmtData(data: string) {
   if (!data) return "—";
   const [ano, mes, dia] = data.substring(0, 10).split("-");
   return `${dia}/${mes}/${ano}`;
}

// ─── Ícones SVG (monocromáticos) ──────────────────────────────────────────────

const IconReceitas = () => (
   <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
   >
      <path
         strokeLinecap="round"
         strokeLinejoin="round"
         strokeWidth={1.5}
         d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
      />
   </svg>
);

const IconDespesas = () => (
   <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
   >
      <path
         strokeLinecap="round"
         strokeLinejoin="round"
         strokeWidth={1.5}
         d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
      />
   </svg>
);

const IconSaldo = () => (
   <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
   >
      <path
         strokeLinecap="round"
         strokeLinejoin="round"
         strokeWidth={1.5}
         d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
      />
   </svg>
);

const IconAlerta = () => (
   <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
   >
      <path
         strokeLinecap="round"
         strokeLinejoin="round"
         strokeWidth={1.5}
         d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
      />
   </svg>
);

const IconCartao = () => (
   <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
   >
      <path
         strokeLinecap="round"
         strokeLinejoin="round"
         strokeWidth={1.5}
         d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
      />
   </svg>
);

const IconCategoria = () => (
   <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
   >
      <path
         strokeLinecap="round"
         strokeLinejoin="round"
         strokeWidth={1.5}
         d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
      />
   </svg>
);

const IconFluxo = () => (
   <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
   >
      <path
         strokeLinecap="round"
         strokeLinejoin="round"
         strokeWidth={1.5}
         d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
   </svg>
);

// ─── Tooltip customizado dos gráficos ────────────────────────────────────────

function TooltipCustom({ active, payload, label }: any) {
   if (!active || !payload?.length) return null;
   return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs">
         <p className="font-semibold text-gray-700 mb-1">{label}</p>
         {payload.map((entry: any, i: number) => (
            <p key={i} style={{ color: entry.color }} className="font-medium">
               {entry.name}: {fmtValor(entry.value)}
            </p>
         ))}
      </div>
   );
}

// ─── Barra de progresso de cartão ────────────────────────────────────────────

function BarraLimite({ percentual, cor }: { percentual: number; cor: string }) {
   const p = Math.min(percentual, 100);
   const barColor = p >= 90 ? "#dc2626" : p >= 70 ? "#f59e0b" : "#16a34a";
   return (
      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
         <div
            className="h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${p}%`, backgroundColor: barColor }}
         />
      </div>
   );
}

// ─── Skeleton loader ─────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
   return (
      <div className={`animate-pulse bg-gray-100 rounded-lg ${className}`} />
   );
}

// ─── Cores de categoria (fallback palette) ────────────────────────────────────

const CATEGORY_COLORS = [
   "#16a34a",
   "#2563eb",
   "#7c3aed",
   "#db2777",
   "#d97706",
   "#0891b2",
   "#9333ea",
   "#65a30d",
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
   const router = useRouter();
   const [dados, setDados] = useState<DashboardData | null>(null);
   const [loading, setLoading] = useState(true);
   const [erro, setErro] = useState("");
   const [mes, setMes] = useState(mesAtual());
   const [mesaId, setMesaId] = useState<number | undefined>(undefined);

   const meses = useMemo(() => gerarMeses(), []);

   const carregarDados = useCallback(async () => {
      setLoading(true);
      setErro("");
      try {
         const data = await dashboardService.getDados(mes, mesaId);
         setDados(data);
      } catch {
         setErro("Erro ao carregar dados do dashboard");
      } finally {
         setLoading(false);
      }
   }, [mes, mesaId]);

   useEffect(() => {
      if (!authService.isAuthenticated()) {
         router.push("/login");
         return;
      }
      carregarDados();
   }, [carregarDados, router]);

   // ─── Computed ─────────────────────────────────────────────────────────────

   const totalAlertas = useMemo(() => {
      if (!dados) return 0;
      return (
         dados.alertas.despesas_vencidas.length +
         dados.alertas.despesas_hoje.length +
         dados.alertas.cartoes_criticos.length
      );
   }, [dados]);

   const categoriaMax = useMemo(() => {
      if (!dados?.gastos_por_categoria.length) return 1;
      return Math.max(...dados.gastos_por_categoria.map((g) => g.total));
   }, [dados]);

   // ─── Render ───────────────────────────────────────────────────────────────

   return (
      <DashboardLayout>
         <div className="space-y-5 md:space-y-6">
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
               <div className="flex-1">
                  <h1 className="text-xl md:text-2xl font-bold text-gray-800">
                     Dashboard
                  </h1>
                  {dados && !dados.vazio && (
                     <p className="text-xs text-gray-500 mt-0.5">
                        {mesaId
                           ? dados.mesas[0]?.nome
                           : `Consolidado · ${dados.mesas.length} mesa${dados.mesas.length !== 1 ? "s" : ""}`}
                     </p>
                  )}
               </div>

               {/* Filtros */}
               <div className="flex items-center gap-2">
                  <select
                     value={mes}
                     onChange={(e) => setMes(e.target.value)}
                     className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 bg-white"
                  >
                     {meses.map((m) => (
                        <option key={m.valor} value={m.valor}>
                           {m.label}
                        </option>
                     ))}
                  </select>

                  {dados && dados.mesas.length > 0 && (
                     <select
                        value={mesaId ?? ""}
                        onChange={(e) =>
                           setMesaId(
                              e.target.value
                                 ? Number(e.target.value)
                                 : undefined,
                           )
                        }
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 bg-white"
                     >
                        <option value="">Todas as mesas</option>
                        {dados.mesas.map((m) => (
                           <option key={m.id} value={m.id}>
                              {m.nome}
                           </option>
                        ))}
                     </select>
                  )}
               </div>
            </div>

            {erro && (
               <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {erro}
               </div>
            )}

            {/* ── Cards Principais ────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
               {/* Receitas */}
               <Link
                  href="/dashboard/receitas"
                  className="group bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5 hover:shadow-md hover:border-green-100 transition-all"
               >
                  <div className="flex items-center justify-between mb-3">
                     <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Receitas
                     </span>
                     <span className="text-green-500 group-hover:text-green-600 transition-colors">
                        <IconReceitas />
                     </span>
                  </div>
                  {loading ? (
                     <>
                        <Skeleton className="h-7 w-28 mb-1" />
                        <Skeleton className="h-3 w-20" />
                     </>
                  ) : (
                     <>
                        <p className="text-xl md:text-2xl font-bold text-green-600">
                           {fmtValorCompacto(
                              dados?.resumo.receitas.confirmado ?? 0,
                           )}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-1">
                           confirmado · previsto{" "}
                           {fmtValorCompacto(
                              dados?.resumo.receitas.provisionado ?? 0,
                           )}
                        </p>
                     </>
                  )}
               </Link>

               {/* Despesas */}
               <Link
                  href="/dashboard/despesas"
                  className="group bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5 hover:shadow-md hover:border-red-100 transition-all"
               >
                  <div className="flex items-center justify-between mb-3">
                     <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Despesas
                     </span>
                     <span className="text-red-500 group-hover:text-red-600 transition-colors">
                        <IconDespesas />
                     </span>
                  </div>
                  {loading ? (
                     <>
                        <Skeleton className="h-7 w-28 mb-1" />
                        <Skeleton className="h-3 w-20" />
                     </>
                  ) : (
                     <>
                        <p className="text-xl md:text-2xl font-bold text-red-600">
                           {fmtValorCompacto(dados?.resumo.despesas.pago ?? 0)}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-1">
                           pago · previsto{" "}
                           {fmtValorCompacto(
                              dados?.resumo.despesas.provisionado ?? 0,
                           )}
                        </p>
                     </>
                  )}
               </Link>

               {/* Saldo */}
               <div className="col-span-2 md:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5">
                  <div className="flex items-center justify-between mb-3">
                     <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Saldo
                     </span>
                     <span className="text-gray-400">
                        <IconSaldo />
                     </span>
                  </div>
                  {loading ? (
                     <>
                        <Skeleton className="h-7 w-28 mb-1" />
                        <Skeleton className="h-3 w-20" />
                     </>
                  ) : (
                     (() => {
                        const saldo = dados?.resumo.saldo.real ?? 0;
                        const previsto = dados?.resumo.saldo.previsto ?? 0;
                        const positivo = saldo >= 0;
                        return (
                           <>
                              <p
                                 className={`text-xl md:text-2xl font-bold ${positivo ? "text-blue-600" : "text-red-600"}`}
                              >
                                 {fmtValorCompacto(Math.abs(saldo))}
                              </p>
                              <p className="text-[11px] text-gray-400 mt-1">
                                 {positivo ? "positivo" : "negativo"} · previsto{" "}
                                 {fmtValorCompacto(previsto)}
                              </p>
                           </>
                        );
                     })()
                  )}
               </div>
            </div>

            {/* ── Segunda linha: Previsto vs Realizado | Alertas ──────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
               {/* Previsto vs Realizado */}
               <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">
                     Previsto × Realizado
                  </h3>
                  {loading ? (
                     <div className="space-y-3">
                        <Skeleton className="h-10" />
                        <Skeleton className="h-10" />
                     </div>
                  ) : (
                     <div className="space-y-3">
                        {/* Receitas */}
                        <div>
                           <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                              <span>Receitas</span>
                              <span className="font-medium text-gray-700">
                                 {fmtValorCompacto(
                                    dados?.resumo.receitas.confirmado ?? 0,
                                 )}
                                 <span className="text-gray-400 font-normal">
                                    {" "}
                                    /{" "}
                                    {fmtValorCompacto(
                                       dados?.resumo.receitas.provisionado ?? 0,
                                    )}
                                 </span>
                              </span>
                           </div>
                           <div className="w-full bg-gray-100 rounded-full h-2">
                              <div
                                 className="bg-green-500 h-2 rounded-full transition-all duration-700"
                                 style={{
                                    width: `${
                                       dados?.resumo.receitas.provisionado
                                          ? Math.min(
                                               (dados.resumo.receitas
                                                  .confirmado /
                                                  dados.resumo.receitas
                                                     .provisionado) *
                                                  100,
                                               100,
                                            )
                                          : 0
                                    }%`,
                                 }}
                              />
                           </div>
                        </div>
                        {/* Despesas */}
                        <div>
                           <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                              <span>Despesas</span>
                              <span className="font-medium text-gray-700">
                                 {fmtValorCompacto(
                                    dados?.resumo.despesas.pago ?? 0,
                                 )}
                                 <span className="text-gray-400 font-normal">
                                    {" "}
                                    /{" "}
                                    {fmtValorCompacto(
                                       dados?.resumo.despesas.provisionado ?? 0,
                                    )}
                                 </span>
                              </span>
                           </div>
                           <div className="w-full bg-gray-100 rounded-full h-2">
                              <div
                                 className="bg-red-500 h-2 rounded-full transition-all duration-700"
                                 style={{
                                    width: `${
                                       dados?.resumo.despesas.provisionado
                                          ? Math.min(
                                               (dados.resumo.despesas.pago /
                                                  dados.resumo.despesas
                                                     .provisionado) *
                                                  100,
                                               100,
                                            )
                                          : 0
                                    }%`,
                                 }}
                              />
                           </div>
                        </div>
                        {/* Resumo */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                           <div className="bg-gray-50 rounded-lg p-2.5">
                              <p className="text-[10px] text-gray-400 mb-0.5">
                                 Em aberto
                              </p>
                              <p className="text-sm font-semibold text-gray-700">
                                 {fmtValorCompacto(
                                    dados?.resumo.despesas.pendente ?? 0,
                                 )}
                              </p>
                           </div>
                           <div className="bg-gray-50 rounded-lg p-2.5">
                              <p className="text-[10px] text-gray-400 mb-0.5">
                                 Despesas pagas
                              </p>
                              <p className="text-sm font-semibold text-gray-700">
                                 {dados?.resumo.despesas.qtd_pagas ?? 0}{" "}
                                 lançamento
                                 {dados?.resumo.despesas.qtd_pagas !== 1
                                    ? "s"
                                    : ""}
                              </p>
                           </div>
                        </div>
                     </div>
                  )}
               </div>

               {/* Alertas */}
               <Link
                  href="/dashboard/despesas"
                  className="group block bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5 hover:shadow-md transition-all"
               >
                  <div className="flex items-center justify-between mb-4">
                     <h3 className="text-sm font-semibold text-gray-700">
                        Atenção
                     </h3>
                     {totalAlertas > 0 && (
                        <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                           {totalAlertas}
                        </span>
                     )}
                  </div>
                  {loading ? (
                     <div className="space-y-2">
                        <Skeleton className="h-8" />
                        <Skeleton className="h-8" />
                        <Skeleton className="h-8" />
                     </div>
                  ) : (
                     <div className="space-y-2">
                        {totalAlertas === 0 ? (
                           <div className="flex flex-col items-center justify-center py-4 text-center">
                              <svg
                                 className="w-8 h-8 text-green-300 mb-2"
                                 fill="none"
                                 stroke="currentColor"
                                 viewBox="0 0 24 24"
                              >
                                 <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                 />
                              </svg>
                              <p className="text-xs text-gray-400">
                                 Nenhuma pendência este mês
                              </p>
                           </div>
                        ) : (
                           <>
                              {dados?.alertas.despesas_vencidas
                                 .slice(0, 2)
                                 .map((d) => (
                                    <div
                                       key={d.id}
                                       className="flex items-center justify-between bg-red-50 rounded-lg px-3 py-2"
                                    >
                                       <div className="flex items-center gap-2 min-w-0">
                                          <span className="text-red-500 shrink-0">
                                             <IconAlerta />
                                          </span>
                                          <span className="text-xs text-gray-700 truncate">
                                             {d.descricao}
                                          </span>
                                       </div>
                                       <span className="text-xs font-semibold text-red-600 ml-2 shrink-0">
                                          {fmtValorCompacto(d.valor)}
                                       </span>
                                    </div>
                                 ))}
                              {dados?.alertas.despesas_hoje
                                 .slice(0, 2)
                                 .map((d) => (
                                    <div
                                       key={d.id}
                                       className="flex items-center justify-between bg-amber-50 rounded-lg px-3 py-2"
                                    >
                                       <div className="flex items-center gap-2 min-w-0">
                                          <span className="text-amber-500 shrink-0">
                                             <IconAlerta />
                                          </span>
                                          <span className="text-xs text-gray-700 truncate">
                                             {d.descricao} · vence hoje
                                          </span>
                                       </div>
                                       <span className="text-xs font-semibold text-amber-600 ml-2 shrink-0">
                                          {fmtValorCompacto(d.valor)}
                                       </span>
                                    </div>
                                 ))}
                              {dados?.alertas.cartoes_criticos.map((c) => (
                                 <div
                                    key={c.id}
                                    className="flex items-center justify-between bg-orange-50 rounded-lg px-3 py-2"
                                 >
                                    <div className="flex items-center gap-2 min-w-0">
                                       <span className="text-orange-500 shrink-0">
                                          <IconCartao />
                                       </span>
                                       <span className="text-xs text-gray-700 truncate">
                                          {c.nome} · {c.percentual}% usado
                                       </span>
                                    </div>
                                    <span className="text-xs font-semibold text-orange-600 ml-2 shrink-0">
                                       {fmtValorCompacto(c.gasto)}
                                    </span>
                                 </div>
                              ))}
                              {totalAlertas > 3 && (
                                 <p className="text-xs text-gray-400 text-center pt-1">
                                    + {totalAlertas - 3} mais →
                                 </p>
                              )}
                           </>
                        )}
                     </div>
                  )}
               </Link>
            </div>

            {/* ── Gráfico Evolução Mensal + Cartões ───────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
               {/* Evolução 6 meses */}
               <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">
                     Evolução dos últimos 6 meses
                  </h3>
                  {loading ? (
                     <Skeleton className="h-48" />
                  ) : (
                     <ResponsiveContainer width="100%" height={200}>
                        <BarChart
                           data={dados?.evolucao_mensal ?? []}
                           barCategoryGap="30%"
                           barGap={2}
                        >
                           <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#f1f5f9"
                           />
                           <XAxis
                              dataKey="label"
                              tick={{ fontSize: 11, fill: "#94a3b8" }}
                              axisLine={false}
                              tickLine={false}
                           />
                           <YAxis
                              tick={{ fontSize: 10, fill: "#94a3b8" }}
                              axisLine={false}
                              tickLine={false}
                              tickFormatter={(v) =>
                                 `R$${(v / 1000).toFixed(0)}k`
                              }
                              width={42}
                           />
                           <Tooltip content={<TooltipCustom />} />
                           <Legend
                              wrapperStyle={{
                                 fontSize: "11px",
                                 color: "#94a3b8",
                                 paddingTop: "8px",
                              }}
                           />
                           <Bar
                              dataKey="receitas"
                              name="Receitas"
                              fill="#16a34a"
                              radius={[3, 3, 0, 0]}
                              maxBarSize={32}
                           />
                           <Bar
                              dataKey="despesas"
                              name="Despesas"
                              fill="#dc2626"
                              radius={[3, 3, 0, 0]}
                              maxBarSize={32}
                           />
                        </BarChart>
                     </ResponsiveContainer>
                  )}
               </div>

               {/* Cartões */}
               <Link
                  href="/dashboard/cartoes"
                  className="group block bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5 hover:shadow-md transition-all"
               >
                  <div className="flex items-center justify-between mb-4">
                     <h3 className="text-sm font-semibold text-gray-700">
                        Cartões
                     </h3>
                     <span className="text-gray-400 group-hover:text-gray-600 transition-colors">
                        <IconCartao />
                     </span>
                  </div>
                  {loading ? (
                     <div className="space-y-4">
                        <Skeleton className="h-12" />
                        <Skeleton className="h-12" />
                        <Skeleton className="h-12" />
                     </div>
                  ) : dados?.cartoes.filter(
                       (c) => c.tipo === "credito" && c.limite,
                    ).length === 0 ? (
                     <p className="text-xs text-gray-400 text-center py-4">
                        Nenhum cartão de crédito cadastrado
                     </p>
                  ) : (
                     <div className="space-y-3 max-h-48 overflow-y-auto pr-0.5">
                        {dados?.cartoes
                           .filter((c) => c.tipo === "credito" && c.limite)
                           .map((cartao) => (
                              <div key={cartao.id}>
                                 <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2 min-w-0">
                                       {cartao.cor && (
                                          <span
                                             className="w-2 h-2 rounded-full shrink-0"
                                             style={{
                                                backgroundColor: cartao.cor,
                                             }}
                                          />
                                       )}
                                       <span className="text-xs text-gray-700 font-medium truncate">
                                          {cartao.nome}
                                       </span>
                                    </div>
                                    <span
                                       className={`text-xs font-semibold shrink-0 ml-2 ${
                                          (cartao.percentual_usado ?? 0) >= 90
                                             ? "text-red-600"
                                             : (cartao.percentual_usado ?? 0) >=
                                                 70
                                               ? "text-amber-600"
                                               : "text-gray-600"
                                       }`}
                                    >
                                       {cartao.percentual_usado ?? 0}%
                                    </span>
                                 </div>
                                 <BarraLimite
                                    percentual={cartao.percentual_usado ?? 0}
                                    cor={cartao.cor ?? "#16a34a"}
                                 />
                                 <p className="text-[10px] text-gray-400 mt-1">
                                    {fmtValorCompacto(
                                       cartao.gasto_mes + cartao.pendente_mes,
                                    )}{" "}
                                    de {fmtValorCompacto(cartao.limite!)}
                                 </p>
                              </div>
                           ))}
                     </div>
                  )}
               </Link>
            </div>

            {/* ── Maiores Gastos + Fluxo de Caixa ─────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
               {/* Maiores gastos por categoria */}
               <Link
                  href="/dashboard/despesas"
                  className="group block bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5 hover:shadow-md transition-all"
               >
                  <div className="flex items-center justify-between mb-4">
                     <h3 className="text-sm font-semibold text-gray-700">
                        Maiores gastos
                     </h3>
                     <span className="text-gray-400 group-hover:text-gray-600 transition-colors">
                        <IconCategoria />
                     </span>
                  </div>
                  {loading ? (
                     <div className="space-y-2">
                        {[1, 2, 3, 4].map((i) => (
                           <Skeleton key={i} className="h-8" />
                        ))}
                     </div>
                  ) : dados?.gastos_por_categoria.length === 0 ? (
                     <p className="text-xs text-gray-400 text-center py-4">
                        Nenhuma despesa paga neste mês
                     </p>
                  ) : (
                     <div className="space-y-2.5">
                        {dados?.gastos_por_categoria.map((cat, i) => (
                           <div key={cat.categoria}>
                              <div className="flex items-center justify-between mb-1">
                                 <div className="flex items-center gap-2 min-w-0">
                                    <span
                                       className="w-2 h-2 rounded-full shrink-0"
                                       style={{
                                          backgroundColor:
                                             cat.cor ||
                                             CATEGORY_COLORS[
                                                i % CATEGORY_COLORS.length
                                             ],
                                       }}
                                    />
                                    <span className="text-xs text-gray-600 truncate">
                                       {cat.categoria}
                                    </span>
                                 </div>
                                 <span className="text-xs font-semibold text-gray-700 ml-2 shrink-0">
                                    {fmtValorCompacto(cat.total)}
                                 </span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                 <div
                                    className="h-1.5 rounded-full transition-all duration-700"
                                    style={{
                                       width: `${Math.round((cat.total / categoriaMax) * 100)}%`,
                                       backgroundColor:
                                          cat.cor ||
                                          CATEGORY_COLORS[
                                             i % CATEGORY_COLORS.length
                                          ],
                                    }}
                                 />
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </Link>

               {/* Fluxo de caixa */}
               <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5">
                  <div className="flex items-center justify-between mb-4">
                     <h3 className="text-sm font-semibold text-gray-700">
                        Fluxo de caixa
                     </h3>
                     <span className="text-gray-400">
                        <IconFluxo />
                     </span>
                  </div>
                  {loading ? (
                     <Skeleton className="h-48" />
                  ) : (dados?.fluxo_caixa.filter(
                       (f) => f.receitas > 0 || f.despesas > 0,
                    ).length ?? 0) === 0 ? (
                     <div className="flex items-center justify-center h-40">
                        <p className="text-xs text-gray-400">
                           Sem movimentações no período
                        </p>
                     </div>
                  ) : (
                     <ResponsiveContainer width="100%" height={190}>
                        <LineChart
                           data={
                              dados?.fluxo_caixa.filter(
                                 (_, i) => i % 2 === 0,
                              ) ?? []
                           }
                        >
                           <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#f1f5f9"
                           />
                           <XAxis
                              dataKey="label"
                              tick={{ fontSize: 10, fill: "#94a3b8" }}
                              axisLine={false}
                              tickLine={false}
                           />
                           <YAxis
                              tick={{ fontSize: 10, fill: "#94a3b8" }}
                              axisLine={false}
                              tickLine={false}
                              tickFormatter={(v) =>
                                 `R$${(v / 1000).toFixed(0)}k`
                              }
                              width={42}
                           />
                           <Tooltip content={<TooltipCustom />} />
                           <Line
                              type="monotone"
                              dataKey="saldo_acumulado"
                              name="Saldo acumulado"
                              stroke="#2563eb"
                              strokeWidth={2}
                              dot={false}
                              activeDot={{ r: 4, fill: "#2563eb" }}
                           />
                        </LineChart>
                     </ResponsiveContainer>
                  )}
               </div>
            </div>

            {/* ── Últimas Movimentações ────────────────────────────────────── */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
               <div className="flex items-center justify-between px-4 md:px-5 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700">
                     Últimas movimentações
                  </h3>
                  <div className="flex items-center gap-3">
                     <Link
                        href="/dashboard/receitas"
                        className="text-xs text-green-600 hover:underline"
                     >
                        Receitas
                     </Link>
                     <Link
                        href="/dashboard/despesas"
                        className="text-xs text-red-600 hover:underline"
                     >
                        Despesas
                     </Link>
                  </div>
               </div>

               {loading ? (
                  <div className="p-4 space-y-3">
                     {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-10" />
                     ))}
                  </div>
               ) : (dados?.ultimas_movimentacoes.length ?? 0) === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-400 text-sm">
                     Nenhuma movimentação confirmada neste período
                  </div>
               ) : (
                  <>
                     {/* Mobile */}
                     <div className="sm:hidden divide-y divide-gray-50">
                        {dados?.ultimas_movimentacoes.map((mov, i) => (
                           <div
                              key={`${mov.tipo}-${mov.id}-${i}`}
                              className="flex items-center justify-between px-4 py-3"
                           >
                              <div className="flex items-center gap-3 min-w-0">
                                 <span
                                    className={`w-1.5 h-6 rounded-full shrink-0 ${mov.tipo === "receita" ? "bg-green-500" : "bg-red-500"}`}
                                 />
                                 <div className="min-w-0">
                                    <p className="text-sm text-gray-800 font-medium truncate">
                                       {mov.descricao}
                                    </p>
                                    <p className="text-[11px] text-gray-400">
                                       {mov.categoria_nome ?? "—"} ·{" "}
                                       {mov.mesa_nome}
                                    </p>
                                 </div>
                              </div>
                              <div className="text-right ml-3 shrink-0">
                                 <p
                                    className={`text-sm font-semibold ${mov.tipo === "receita" ? "text-green-600" : "text-red-600"}`}
                                 >
                                    {mov.tipo === "receita" ? "+" : "-"}
                                    {fmtValorCompacto(mov.valor)}
                                 </p>
                                 <p className="text-[11px] text-gray-400">
                                    {fmtData(mov.data)}
                                 </p>
                              </div>
                           </div>
                        ))}
                     </div>

                     {/* Desktop */}
                     <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full">
                           <thead className="bg-gray-50 border-b border-gray-100">
                              <tr>
                                 <th className="px-5 py-2.5 text-left text-[11px] font-medium text-gray-400 uppercase tracking-wide">
                                    Descrição
                                 </th>
                                 <th className="px-5 py-2.5 text-left text-[11px] font-medium text-gray-400 uppercase tracking-wide">
                                    Categoria
                                 </th>
                                 <th className="px-5 py-2.5 text-left text-[11px] font-medium text-gray-400 uppercase tracking-wide">
                                    Mesa
                                 </th>
                                 <th className="px-5 py-2.5 text-left text-[11px] font-medium text-gray-400 uppercase tracking-wide">
                                    Data
                                 </th>
                                 <th className="px-5 py-2.5 text-right text-[11px] font-medium text-gray-400 uppercase tracking-wide">
                                    Valor
                                 </th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-50">
                              {dados?.ultimas_movimentacoes.map((mov, i) => (
                                 <tr
                                    key={`${mov.tipo}-${mov.id}-${i}`}
                                    className="hover:bg-gray-50 transition-colors"
                                 >
                                    <td className="px-5 py-3">
                                       <div className="flex items-center gap-2">
                                          <span
                                             className={`w-1.5 h-5 rounded-full shrink-0 ${mov.tipo === "receita" ? "bg-green-500" : "bg-red-500"}`}
                                          />
                                          <span className="text-sm text-gray-800 font-medium">
                                             {mov.descricao}
                                          </span>
                                       </div>
                                    </td>
                                    <td className="px-5 py-3 text-sm text-gray-500">
                                       {mov.categoria_nome ?? "—"}
                                    </td>
                                    <td className="px-5 py-3 text-sm text-gray-500">
                                       {mov.mesa_nome}
                                    </td>
                                    <td className="px-5 py-3 text-sm text-gray-500">
                                       {fmtData(mov.data)}
                                    </td>
                                    <td
                                       className={`px-5 py-3 text-sm font-semibold text-right ${mov.tipo === "receita" ? "text-green-600" : "text-red-600"}`}
                                    >
                                       {mov.tipo === "receita" ? "+" : "-"}
                                       {fmtValorCompacto(mov.valor)}
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </>
               )}
            </div>
         </div>
      </DashboardLayout>
   );
}
