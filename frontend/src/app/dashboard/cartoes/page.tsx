"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import authService from "@/services/authService";
import cartaoService, { Cartao, CartaoCreate } from "@/services/cartaoService";
import bandeiraService, { Bandeira } from "@/services/bandeiraService";
import despesaService, { Despesa } from "@/services/despesaService";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useMesa } from "@/contexts/MesaContext";
import { isApiError } from "@/types";

const CORES_PADRAO = [
   "#8B5CF6",
   "#3B82F6",
   "#10B981",
   "#F59E0B",
   "#EF4444",
   "#EC4899",
   "#6366F1",
   "#14B8A6",
   "#F97316",
   "#6B7280",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
         label: `${nomes[d.getMonth()]}/${d.getFullYear()}`,
      });
   }
   return meses;
}

function mesAtual() {
   const d = new Date();
   return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatarValor(v: number | string | null | undefined) {
   return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
   }).format(parseFloat(String(v ?? 0)));
}

function formatarData(data: string) {
   const [ano, mes, dia] = data.substring(0, 10).split("-");
   return `${dia}/${mes}/${ano}`;
}

const MESES = gerarMeses();

// ─── Painel de Fatura / Transações ────────────────────────────────────────────

function InvoicePanel({
   cartao,
   mesaSelecionadaId,
}: {
   cartao: Cartao;
   mesaSelecionadaId: number;
}) {
   const [mesFatura, setMesFatura] = useState(mesAtual());
   const [despesas, setDespesas] = useState<Despesa[]>([]);
   const [loading, setLoading] = useState(false);
   const isCredito = cartao.tipo === "credito";

   const carregar = useCallback(async () => {
      setLoading(true);
      try {
         const todas = await despesaService.listar(
            mesaSelecionadaId,
            mesFatura,
         );
         setDespesas(todas.filter((d) => d.cartao_id === cartao.id));
      } catch {
         // silencioso
      } finally {
         setLoading(false);
      }
   }, [mesaSelecionadaId, mesFatura, cartao.id]);

   useEffect(() => {
      carregar();
   }, [carregar]);

   const totalPago = despesas
      .filter((d) => d.paga)
      .reduce(
         (s, d) => s + parseFloat(String(d.valor_real ?? d.valor_provisionado)),
         0,
      );

   const totalAberto = despesas
      .filter((d) => !d.paga)
      .reduce((s, d) => s + parseFloat(String(d.valor_provisionado)), 0);

   const idxAtual = MESES.findIndex((m) => m.valor === mesFatura);

   return (
      <div className="mt-3 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
         {/* Header do painel */}
         <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-2">
               <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: cartao.cor || "#8B5CF6" }}
               />
               <span className="text-sm font-semibold text-gray-700">
                  {isCredito ? "Fatura" : "Transações"} — {cartao.nome}
               </span>
            </div>
            {/* Navegador de mês */}
            <div className="flex items-center gap-1">
               <button
                  onClick={() =>
                     idxAtual > 0 && setMesFatura(MESES[idxAtual - 1].valor)
                  }
                  disabled={idxAtual <= 0}
                  className="p-1 rounded-md text-gray-400 hover:bg-gray-200 hover:text-gray-700 disabled:opacity-30 transition-colors"
               >
                  <svg
                     className="w-4 h-4"
                     fill="none"
                     stroke="currentColor"
                     viewBox="0 0 24 24"
                  >
                     <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                     />
                  </svg>
               </button>
               <select
                  value={mesFatura}
                  onChange={(e) => setMesFatura(e.target.value)}
                  className="text-xs font-medium text-gray-600 bg-transparent border-none focus:outline-none cursor-pointer"
               >
                  {MESES.map((m) => (
                     <option key={m.valor} value={m.valor}>
                        {m.label}
                     </option>
                  ))}
               </select>
               <button
                  onClick={() =>
                     idxAtual < MESES.length - 1 &&
                     setMesFatura(MESES[idxAtual + 1].valor)
                  }
                  disabled={idxAtual >= MESES.length - 1}
                  className="p-1 rounded-md text-gray-400 hover:bg-gray-200 hover:text-gray-700 disabled:opacity-30 transition-colors"
               >
                  <svg
                     className="w-4 h-4"
                     fill="none"
                     stroke="currentColor"
                     viewBox="0 0 24 24"
                  >
                     <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                     />
                  </svg>
               </button>
            </div>
         </div>

         {/* Resumo de totais */}
         {!loading && despesas.length > 0 && (
            <div className="flex border-b border-gray-100">
               <div className="flex-1 px-4 py-2.5 text-center border-r border-gray-100">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                     {isCredito ? "Fatura paga" : "Total debitado"}
                  </p>
                  <p className="text-sm font-bold text-green-600">
                     {formatarValor(totalPago)}
                  </p>
               </div>
               <div className="flex-1 px-4 py-2.5 text-center">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                     {isCredito ? "Em aberto" : "A vencer"}
                  </p>
                  <p
                     className={`text-sm font-bold ${totalAberto > 0 ? "text-orange-500" : "text-gray-400"}`}
                  >
                     {formatarValor(totalAberto)}
                  </p>
               </div>
            </div>
         )}

         {/* Lista de lançamentos */}
         <div className="divide-y divide-gray-50">
            {loading ? (
               <div className="flex items-center justify-center py-6 text-gray-400 text-sm gap-2">
                  <svg
                     className="w-4 h-4 animate-spin"
                     fill="none"
                     viewBox="0 0 24 24"
                  >
                     <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                     />
                     <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                     />
                  </svg>
                  Carregando...
               </div>
            ) : despesas.length === 0 ? (
               <div className="py-6 text-center text-gray-400 text-sm">
                  <svg
                     className="w-8 h-8 mx-auto mb-2 text-gray-200"
                     fill="none"
                     stroke="currentColor"
                     viewBox="0 0 24 24"
                  >
                     <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"
                     />
                  </svg>
                  Nenhum lançamento neste mês
               </div>
            ) : (
               despesas.map((d) => (
                  <div
                     key={d.id}
                     className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                     {/* Bullet status */}
                     <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
                           d.paga ? "bg-green-500" : "bg-orange-400"
                        }`}
                     />
                     {/* Info */}
                     <div className="flex-1 min-w-0">
                        <p
                           className={`text-sm font-medium truncate ${
                              d.paga
                                 ? "line-through text-gray-400"
                                 : "text-gray-800"
                           }`}
                        >
                           {d.descricao}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                           <span className="text-[10px] text-gray-400">
                              {formatarData(d.data_vencimento)}
                           </span>
                           {d.parcelas > 1 && (
                              <span className="text-[10px] text-blue-500 font-medium">
                                 {d.parcela_atual}/{d.parcelas}x
                              </span>
                           )}
                           {d.categoria_nome && (
                              <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                 {d.categoria_nome}
                              </span>
                           )}
                        </div>
                     </div>
                     {/* Valor */}
                     <div className="text-right shrink-0">
                        <p
                           className={`text-sm font-semibold ${
                              d.paga ? "text-green-600" : "text-gray-700"
                           }`}
                        >
                           {formatarValor(
                              d.paga
                                 ? (d.valor_real ?? d.valor_provisionado)
                                 : d.valor_provisionado,
                           )}
                        </p>
                        {d.paga &&
                           d.valor_real &&
                           parseFloat(String(d.valor_real)) !==
                              parseFloat(String(d.valor_provisionado)) && (
                              <p className="text-[10px] text-gray-400 line-through">
                                 {formatarValor(d.valor_provisionado)}
                              </p>
                           )}
                     </div>
                  </div>
               ))
            )}
         </div>

         {/* Rodapé com info de fechamento/vencimento (só crédito) */}
         {isCredito && (cartao.dia_fechamento || cartao.dia_vencimento) && (
            <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
               {cartao.dia_fechamento && (
                  <span>⏱ Fechamento: dia {cartao.dia_fechamento}</span>
               )}
               {cartao.dia_fechamento && cartao.dia_vencimento && (
                  <span className="text-gray-300">·</span>
               )}
               {cartao.dia_vencimento && (
                  <span>📅 Vencimento: dia {cartao.dia_vencimento}</span>
               )}
            </div>
         )}
      </div>
   );
}

// ─── Card Visual (reutilizado em mobile e desktop) ────────────────────────────
function CartaoVisual({
   cartao,
   isSelected,
   onClick,
}: {
   cartao: Cartao;
   isSelected?: boolean;
   onClick?: () => void;
}) {
   const limiteParaCalculo = cartao.limite_pessoal || cartao.limite_real;

   return (
      <div
         style={{ backgroundColor: cartao.cor || "#8B5CF6" }}
         className={`relative h-44 w-full rounded-2xl shadow-lg p-5 text-white overflow-hidden select-none cursor-pointer transition-all duration-200 ${
            isSelected
               ? "ring-4 ring-white/60 ring-offset-2 ring-offset-gray-100"
               : ""
         }`}
         onClick={onClick}
      >
         <div className="absolute top-0 right-0 w-44 h-44 bg-white/10 rounded-full -mr-16 -mt-16 pointer-events-none" />
         <div className="absolute bottom-0 left-0 w-36 h-36 bg-white/10 rounded-full -ml-14 -mb-14 pointer-events-none" />

         <div className="relative h-full flex flex-col justify-between">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <svg
                     className="w-7 h-7"
                     fill="currentColor"
                     viewBox="0 0 24 24"
                  >
                     <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
                  </svg>
                  <span className="text-xs font-medium opacity-90">
                     {cartao.bandeira_nome}
                  </span>
               </div>
               <div className="flex items-center gap-2">
                  {!cartao.ativa && (
                     <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                        Inativo
                     </span>
                  )}
                  {isSelected && (
                     <span className="text-[10px] bg-white/30 px-2 py-0.5 rounded-full font-medium">
                        ✓ selecionado
                     </span>
                  )}
               </div>
            </div>

            <div>
               <p className="text-lg font-bold leading-tight">{cartao.nome}</p>
               <p className="text-xs opacity-75 mt-0.5">
                  {cartao.tipo === "credito" ? "Crédito" : "Débito"}
               </p>
            </div>

            {limiteParaCalculo ? (
               <div>
                  <div className="flex justify-between text-xs mb-1">
                     <span className="opacity-75">Limite usado</span>
                     <span className="font-semibold">0%</span>
                  </div>
                  <div className="w-full bg-white/30 rounded-full h-1.5">
                     <div className="bg-white h-1.5 rounded-full w-0" />
                  </div>
               </div>
            ) : (
               <div className="text-xs opacity-50 italic">
                  Sem limite definido
               </div>
            )}
         </div>
      </div>
   );
}

// ─── Stack Mobile (Apple Wallet) ──────────────────────────────────────────────
function WalletStack({
   cartoes,
   onEditar,
   onToggle,
   mesaSelecionadaId,
}: {
   cartoes: Cartao[];
   onEditar: (c: Cartao) => void;
   onToggle: (c: Cartao) => void;
   mesaSelecionadaId: number | undefined;
}) {
   const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
   const [showInvoice, setShowInvoice] = useState(false);
   const PEEK = 56;

   const handleCardClick = (idx: number) => {
      if (idx === selectedIdx) {
         setSelectedIdx(null);
         setShowInvoice(false);
      } else {
         setSelectedIdx(idx);
         setShowInvoice(false);
      }
   };

   const stackHeight = 176 + PEEK * (cartoes.length - 1);

   return (
      <div
         className="relative w-full"
         style={{ height: selectedIdx !== null ? "auto" : stackHeight }}
      >
         {selectedIdx !== null ? (
            <div className="flex flex-col gap-3">
               <div
                  className={`transition-all ${!cartoes[selectedIdx].ativa ? "opacity-50" : ""}`}
               >
                  <CartaoVisual
                     cartao={cartoes[selectedIdx]}
                     isSelected
                     onClick={() => {
                        setSelectedIdx(null);
                        setShowInvoice(false);
                     }}
                  />
                  {/* Botões de ação */}
                  <div className="mt-2.5 flex gap-2">
                     <button
                        onClick={() => onEditar(cartoes[selectedIdx])}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors text-sm font-semibold"
                     >
                        <svg
                           className="w-4 h-4"
                           fill="none"
                           stroke="currentColor"
                           viewBox="0 0 24 24"
                        >
                           <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                           />
                        </svg>
                        Editar
                     </button>
                     <button
                        onClick={() => setShowInvoice(!showInvoice)}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl transition-colors text-sm font-semibold ${
                           showInvoice
                              ? "bg-purple-100 text-purple-700"
                              : "bg-purple-50 text-purple-600 hover:bg-purple-100"
                        }`}
                     >
                        <svg
                           className="w-4 h-4"
                           fill="none"
                           stroke="currentColor"
                           viewBox="0 0 24 24"
                        >
                           <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"
                           />
                        </svg>
                        {cartoes[selectedIdx].tipo === "credito"
                           ? "Fatura"
                           : "Transações"}
                     </button>
                     <button
                        onClick={() => onToggle(cartoes[selectedIdx])}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl transition-colors text-sm font-semibold ${
                           cartoes[selectedIdx].ativa
                              ? "bg-red-50 text-red-600 hover:bg-red-100"
                              : "bg-green-50 text-green-600 hover:bg-green-100"
                        }`}
                     >
                        {cartoes[selectedIdx].ativa ? (
                           <>
                              <svg
                                 className="w-4 h-4"
                                 fill="none"
                                 stroke="currentColor"
                                 viewBox="0 0 24 24"
                              >
                                 <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                                 />
                              </svg>
                              Inativar
                           </>
                        ) : (
                           <>
                              <svg
                                 className="w-4 h-4"
                                 fill="none"
                                 stroke="currentColor"
                                 viewBox="0 0 24 24"
                              >
                                 <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                 />
                              </svg>
                              Reativar
                           </>
                        )}
                     </button>
                  </div>

                  {/* Painel de fatura/transações */}
                  {showInvoice && mesaSelecionadaId && (
                     <InvoicePanel
                        cartao={cartoes[selectedIdx]}
                        mesaSelecionadaId={mesaSelecionadaId}
                     />
                  )}
               </div>

               {/* Outros cartões em lista compacta */}
               {cartoes.length > 1 && (
                  <div className="mt-1">
                     <p className="text-xs text-gray-400 font-medium mb-2 px-1">
                        Outros cartões
                     </p>
                     <div className="flex flex-col gap-2">
                        {cartoes.map((c, i) => {
                           if (i === selectedIdx) return null;
                           return (
                              <button
                                 key={c.id}
                                 onClick={() => {
                                    setSelectedIdx(i);
                                    setShowInvoice(false);
                                 }}
                                 className={`flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all text-left ${!c.ativa ? "opacity-50" : ""}`}
                              >
                                 <div
                                    className="w-10 h-7 rounded-lg shrink-0"
                                    style={{
                                       backgroundColor: c.cor || "#8B5CF6",
                                    }}
                                 />
                                 <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 truncate">
                                       {c.nome}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                       {c.bandeira_nome} ·{" "}
                                       {c.tipo === "credito"
                                          ? "Crédito"
                                          : "Débito"}
                                    </p>
                                 </div>
                                 <svg
                                    className="w-4 h-4 text-gray-300 shrink-0"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                 >
                                    <path
                                       strokeLinecap="round"
                                       strokeLinejoin="round"
                                       strokeWidth={2}
                                       d="M9 5l7 7-7 7"
                                    />
                                 </svg>
                              </button>
                           );
                        })}
                     </div>
                  </div>
               )}
            </div>
         ) : (
            /* ── Modo stack colapsado ── */
            <div className="relative" style={{ height: stackHeight }}>
               {cartoes.map((cartao, idx) => {
                  const isTop = idx === cartoes.length - 1;
                  const offsetY = idx * PEEK;
                  const scale = 1 - (cartoes.length - 1 - idx) * 0.03;

                  return (
                     <div
                        key={cartao.id}
                        className="absolute w-full cursor-pointer transition-all duration-300 ease-out"
                        style={{
                           top: offsetY,
                           zIndex: idx + 1,
                           transform: `scale(${scale})`,
                           transformOrigin: "top center",
                        }}
                        onClick={() => handleCardClick(idx)}
                     >
                        <div className={!cartao.ativa ? "opacity-50" : ""}>
                           <CartaoVisual cartao={cartao} />
                        </div>
                        {isTop && (
                           <div className="absolute bottom-3 right-4 flex items-center gap-1 pointer-events-none">
                              <span className="text-[10px] text-white/60">
                                 toque para selecionar
                              </span>
                           </div>
                        )}
                     </div>
                  );
               })}
            </div>
         )}
      </div>
   );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CartoesPage() {
   const router = useRouter();
   const { mesaSelecionada, carregando: mesaCarregando } = useMesa();

   const [cartoes, setCartoes] = useState<Cartao[]>([]);
   const [bandeiras, setBandeiras] = useState<Bandeira[]>([]);
   const [loading, setLoading] = useState(true);
   const [mostrarInativas, setMostrarInativas] = useState(false);
   const [modalAberto, setModalAberto] = useState(false);
   const [editando, setEditando] = useState<Cartao | null>(null);

   // Controle do painel expandido no desktop
   const [cartaoExpandidoId, setCartaoExpandidoId] = useState<number | null>(
      null,
   );

   const [nome, setNome] = useState("");
   const [tipo, setTipo] = useState<"credito" | "debito">("credito");
   const [bandeiraId, setBandeiraId] = useState<number | "">("");
   const [limiteReal, setLimiteReal] = useState("");
   const [limitePessoal, setLimitePessoal] = useState("");
   const [diaFechamento, setDiaFechamento] = useState("");
   const [diaVencimento, setDiaVencimento] = useState("");
   const [cor, setCor] = useState("#8B5CF6");
   const [erro, setErro] = useState("");
   const [sucesso, setSucesso] = useState("");

   useEffect(() => {
      if (!authService.isAuthenticated()) {
         router.push("/login");
         return;
      }
      if (mesaCarregando) return;
      carregarDados();
   }, [router, mostrarInativas, mesaCarregando]);

   const carregarDados = async () => {
      try {
         setLoading(true);
         const [cartoesData, bandeirasData] = await Promise.all([
            cartaoService.listar(mostrarInativas),
            bandeiraService.listar(false),
         ]);
         setCartoes(cartoesData);
         setBandeiras(bandeirasData);
      } catch {
         setErro("Erro ao carregar dados");
      } finally {
         setLoading(false);
      }
   };

   const abrirModal = (cartao?: Cartao) => {
      if (cartao) {
         setEditando(cartao);
         setNome(cartao.nome);
         setTipo(cartao.tipo);
         setBandeiraId(cartao.bandeira_id);
         setLimiteReal(cartao.limite_real?.toString() || "");
         setLimitePessoal(cartao.limite_pessoal?.toString() || "");
         setDiaFechamento(cartao.dia_fechamento?.toString() || "");
         setDiaVencimento(cartao.dia_vencimento?.toString() || "");
         setCor(cartao.cor || "#8B5CF6");
      } else {
         setEditando(null);
         setNome("");
         setTipo("credito");
         setBandeiraId("");
         setLimiteReal("");
         setLimitePessoal("");
         setDiaFechamento("");
         setDiaVencimento("");
         setCor("#8B5CF6");
      }
      setErro("");
      setModalAberto(true);
   };

   const fecharModal = () => {
      setModalAberto(false);
      setEditando(null);
      setNome("");
      setTipo("credito");
      setBandeiraId("");
      setLimiteReal("");
      setLimitePessoal("");
      setDiaFechamento("");
      setDiaVencimento("");
      setCor("#8B5CF6");
      setErro("");
   };

   const salvarCartao = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!nome.trim()) {
         setErro("O nome é obrigatório");
         return;
      }
      if (!bandeiraId) {
         setErro("Selecione uma bandeira");
         return;
      }

      try {
         const cartaoData: CartaoCreate = {
            nome,
            tipo,
            bandeira_id: Number(bandeiraId),
            limite_real: limiteReal ? Number(limiteReal) : undefined,
            limite_pessoal: limitePessoal ? Number(limitePessoal) : undefined,
            dia_fechamento: diaFechamento ? Number(diaFechamento) : undefined,
            dia_vencimento: diaVencimento ? Number(diaVencimento) : undefined,
            cor,
         };

         if (editando) {
            await cartaoService.atualizar(editando.id, cartaoData);
            setSucesso("Cartão atualizado com sucesso!");
         } else {
            await cartaoService.criar(cartaoData);
            setSucesso("Cartão criado com sucesso!");
         }

         fecharModal();
         carregarDados();
         setTimeout(() => setSucesso(""), 3000);
      } catch (error) {
         if (isApiError(error))
            setErro(error.response?.data?.error || "Erro ao salvar cartão");
         else setErro("Erro ao salvar cartão");
      }
   };

   const toggleAtiva = async (cartao: Cartao) => {
      try {
         if (cartao.ativa) {
            await cartaoService.inativar(cartao.id);
            setSucesso("Cartão inativado!");
         } else {
            await cartaoService.reativar(cartao.id);
            setSucesso("Cartão reativado!");
         }
         carregarDados();
         setTimeout(() => setSucesso(""), 3000);
      } catch {
         setErro("Erro ao alterar status");
      }
   };

   const toggleExpandido = (cartaoId: number) => {
      setCartaoExpandidoId((prev) => (prev === cartaoId ? null : cartaoId));
   };

   if (loading) {
      return (
         <DashboardLayout>
            <div className="flex items-center justify-center min-h-[60vh]">
               <div className="text-gray-500 text-sm">Carregando...</div>
            </div>
         </DashboardLayout>
      );
   }

   return (
      <DashboardLayout>
         <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
               <div>
                  <h1 className="text-xl md:text-2xl font-bold text-gray-800">
                     Cartões
                  </h1>
                  <p className="text-xs md:text-sm text-gray-600 mt-1">
                     Gerencie seus cartões de crédito e débito
                  </p>
               </div>
               <button
                  onClick={() => abrirModal()}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-md text-sm font-medium"
               >
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
                        d="M12 4v16m8-8H4"
                     />
                  </svg>
                  Novo Cartão
               </button>
            </div>

            {sucesso && (
               <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm">
                  {sucesso}
               </div>
            )}
            {erro && !modalAberto && (
               <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                  {erro}
               </div>
            )}

            {/* Toggle inativas */}
            <div className="flex items-center justify-end">
               <label className="flex items-center gap-2 cursor-pointer">
                  <input
                     type="checkbox"
                     checked={mostrarInativas}
                     onChange={(e) => setMostrarInativas(e.target.checked)}
                     className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-600">
                     Mostrar inativos
                  </span>
               </label>
            </div>

            {cartoes.length === 0 ? (
               <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8 text-center text-gray-500">
                  <svg
                     className="w-16 h-16 mx-auto mb-4 text-gray-300"
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
                  <p className="text-base font-medium">
                     Nenhum cartão encontrado
                  </p>
                  <p className="text-sm mt-1">
                     Adicione seu primeiro cartão para começar
                  </p>
               </div>
            ) : (
               <>
                  {/* ── MOBILE: Apple Wallet stack ── */}
                  <div className="sm:hidden px-1 pb-4">
                     <WalletStack
                        cartoes={cartoes}
                        onEditar={abrirModal}
                        onToggle={toggleAtiva}
                        mesaSelecionadaId={mesaSelecionada?.id}
                     />
                  </div>

                  {/* ── DESKTOP: flex wrap com painel dropdown ── */}
                  <div className="hidden sm:flex flex-wrap gap-5">
                     {cartoes.map((cartao) => {
                        const isExpandido = cartaoExpandidoId === cartao.id;
                        return (
                           <div
                              key={cartao.id}
                              className={`relative w-72 shrink-0 ${!cartao.ativa ? "opacity-50" : ""}`}
                           >
                              <CartaoVisual
                                 cartao={cartao}
                                 isSelected={isExpandido}
                                 onClick={() => toggleExpandido(cartao.id)}
                              />
                              <div className="mt-2.5 flex gap-2">
                                 <button
                                    onClick={() => abrirModal(cartao)}
                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                                 >
                                    <svg
                                       className="w-4 h-4"
                                       fill="none"
                                       stroke="currentColor"
                                       viewBox="0 0 24 24"
                                    >
                                       <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                       />
                                    </svg>
                                    Editar
                                 </button>
                                 <button
                                    onClick={() => toggleExpandido(cartao.id)}
                                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                                       isExpandido
                                          ? "bg-purple-100 text-purple-700"
                                          : "bg-purple-50 text-purple-600 hover:bg-purple-100"
                                    }`}
                                 >
                                    <svg
                                       className="w-4 h-4"
                                       fill="none"
                                       stroke="currentColor"
                                       viewBox="0 0 24 24"
                                    >
                                       <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"
                                       />
                                    </svg>
                                    {cartao.tipo === "credito"
                                       ? "Fatura"
                                       : "Transações"}
                                 </button>
                                 <button
                                    onClick={() => toggleAtiva(cartao)}
                                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                                       cartao.ativa
                                          ? "bg-red-50 text-red-600 hover:bg-red-100"
                                          : "bg-green-50 text-green-600 hover:bg-green-100"
                                    }`}
                                 >
                                    {cartao.ativa ? (
                                       <>
                                          <svg
                                             className="w-4 h-4"
                                             fill="none"
                                             stroke="currentColor"
                                             viewBox="0 0 24 24"
                                          >
                                             <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                                             />
                                          </svg>
                                          Inativar
                                       </>
                                    ) : (
                                       <>
                                          <svg
                                             className="w-4 h-4"
                                             fill="none"
                                             stroke="currentColor"
                                             viewBox="0 0 24 24"
                                          >
                                             <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                             />
                                          </svg>
                                          Reativar
                                       </>
                                    )}
                                 </button>
                              </div>

                              {/* Painel dropdown de fatura/transações */}
                              {isExpandido && mesaSelecionada && (
                                 <InvoicePanel
                                    cartao={cartao}
                                    mesaSelecionadaId={mesaSelecionada.id}
                                 />
                              )}
                           </div>
                        );
                     })}
                  </div>
               </>
            )}
         </div>

         {/* Modal Criar/Editar */}
         {modalAberto && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 sm:p-6">
               <div className="bg-white rounded-xl shadow-2xl w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
                  <div className="p-5 sm:p-6">
                     <h2 className="text-lg font-bold text-gray-800 mb-4">
                        {editando ? "Editar Cartão" : "Novo Cartão"}
                     </h2>

                     {erro && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                           {erro}
                        </div>
                     )}

                     <form onSubmit={salvarCartao} className="space-y-4">
                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-2">
                              Nome do Cartão *
                           </label>
                           <input
                              type="text"
                              value={nome}
                              onChange={(e) => setNome(e.target.value)}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              placeholder="Ex: Nubank Roxinho"
                              autoFocus
                           />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                 Tipo *
                              </label>
                              <div className="grid grid-cols-2 gap-2">
                                 <button
                                    type="button"
                                    onClick={() => setTipo("credito")}
                                    className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${tipo === "credito" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                                 >
                                    Crédito
                                 </button>
                                 <button
                                    type="button"
                                    onClick={() => setTipo("debito")}
                                    className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${tipo === "debito" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                                 >
                                    Débito
                                 </button>
                              </div>
                           </div>
                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                 Bandeira *
                              </label>
                              <select
                                 value={bandeiraId}
                                 onChange={(e) =>
                                    setBandeiraId(Number(e.target.value))
                                 }
                                 className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              >
                                 <option value="">Selecione...</option>
                                 {bandeiras.map((b) => (
                                    <option key={b.id} value={b.id}>
                                       {b.nome}
                                    </option>
                                 ))}
                              </select>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                 Limite Real (Banco)
                              </label>
                              <input
                                 type="number"
                                 step="0.01"
                                 value={limiteReal}
                                 onChange={(e) => setLimiteReal(e.target.value)}
                                 className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                 placeholder="5000.00"
                              />
                           </div>
                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                 Limite Pessoal (Meta)
                              </label>
                              <input
                                 type="number"
                                 step="0.01"
                                 value={limitePessoal}
                                 onChange={(e) =>
                                    setLimitePessoal(e.target.value)
                                 }
                                 className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                 placeholder="3000.00"
                              />
                           </div>
                        </div>

                        {tipo === "credito" && (
                           <div className="grid grid-cols-2 gap-3">
                              <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Dia de Fechamento
                                 </label>
                                 <input
                                    type="number"
                                    min="1"
                                    max="31"
                                    value={diaFechamento}
                                    onChange={(e) =>
                                       setDiaFechamento(e.target.value)
                                    }
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    placeholder="8"
                                 />
                              </div>
                              <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Dia de Vencimento
                                 </label>
                                 <input
                                    type="number"
                                    min="1"
                                    max="31"
                                    value={diaVencimento}
                                    onChange={(e) =>
                                       setDiaVencimento(e.target.value)
                                    }
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    placeholder="15"
                                 />
                              </div>
                           </div>
                        )}

                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-2">
                              Cor do Cartão
                           </label>
                           <div className="flex flex-wrap gap-2">
                              {CORES_PADRAO.map((corOpcao) => (
                                 <button
                                    key={corOpcao}
                                    type="button"
                                    onClick={() => setCor(corOpcao)}
                                    style={{ backgroundColor: corOpcao }}
                                    className={`w-9 h-9 rounded-lg transition-all ${cor === corOpcao ? "ring-4 ring-offset-2 ring-gray-400 scale-110" : "hover:scale-105"}`}
                                 />
                              ))}
                           </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                           <button
                              type="button"
                              onClick={fecharModal}
                              className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm"
                           >
                              Cancelar
                           </button>
                           <button
                              type="submit"
                              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all font-medium text-sm"
                           >
                              {editando ? "Atualizar" : "Criar"}
                           </button>
                        </div>
                     </form>
                  </div>
               </div>
            </div>
         )}
      </DashboardLayout>
   );
}
