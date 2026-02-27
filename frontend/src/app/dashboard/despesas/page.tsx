"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import authService from "@/services/authService";
import despesaService, {
   Despesa,
   DespesaCreate,
   TipoDespesa,
} from "@/services/despesaService";
import categoriaService, { Categoria } from "@/services/categoriaService";
import tipoPagamentoService, {
   TipoPagamento,
} from "@/services/tipoPagamentoService";
import cartaoService, { Cartao } from "@/services/cartaoService";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useMesa } from "@/contexts/MesaContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function gerarMeses(): { valor: string; label: string }[] {
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

function mesAtual(): string {
   const d = new Date();
   return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function hoje(): string {
   const d = new Date();
   // Usar data LOCAL para evitar bug de fuso horário (toISOString usa UTC)
   return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type StatusDespesa = "paga" | "a_vencer" | "vencida";
type FiltroStatus = "todas" | StatusDespesa;
type FiltroTipo = "todas" | TipoDespesa;

function getStatus(d: Despesa): StatusDespesa {
   if (d.paga) return "paga";
   const venc = d.data_vencimento.substring(0, 10);
   return venc >= hoje() ? "a_vencer" : "vencida";
}

function formatarValor(v: number | string | null | undefined): string {
   return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
   }).format(parseFloat(String(v ?? 0)));
}

function formatarData(data: string): string {
   const d = data.substring(0, 10);
   const [ano, mes, dia] = d.split("-");
   return `${dia}/${mes}/${ano}`;
}

const LABEL_TIPO: Record<TipoDespesa, string> = {
   variavel: "Variável",
   fixa: "Fixa",
   assinatura: "Assinatura",
};

const COR_TIPO: Record<TipoDespesa, string> = {
   variavel: "bg-orange-100 text-orange-700",
   fixa: "bg-purple-100 text-purple-700",
   assinatura: "bg-blue-100 text-blue-700",
};

// ─── Componente ───────────────────────────────────────────────────────────────

export default function DespesasPage() {
   const router = useRouter();
   const { mesaSelecionada, carregando: mesaCarregando } = useMesa();

   const [despesas, setDespesas] = useState<Despesa[]>([]);
   const [categorias, setCategorias] = useState<Categoria[]>([]);
   const [tiposPagamento, setTiposPagamento] = useState<TipoPagamento[]>([]);
   const [cartoes, setCartoes] = useState<Cartao[]>([]);
   const [loading, setLoading] = useState(true);

   // Filtros
   const [mesSelecionado, setMesSelecionado] = useState(mesAtual());
   const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todas");
   const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("todas");

   // Modal criar/editar
   const [modalAberto, setModalAberto] = useState(false);
   const [editando, setEditando] = useState<Despesa | null>(null);

   // Campos do formulário
   const [descricao, setDescricao] = useState("");
   const [tipo, setTipo] = useState<TipoDespesa>("variavel");
   const [valorProvisionado, setValorProvisionado] = useState("");
   const [dataVencimento, setDataVencimento] = useState("");
   const [categoriaId, setCategoriaId] = useState<number | "">("");
   const [tipoPagamentoId, setTipoPagamentoId] = useState<number | "">("");
   const [cartaoId, setCartaoId] = useState<number | "">("");
   const [recorrente, setRecorrente] = useState(false);
   const [parcelas, setParcelas] = useState<number>(1);

   // Modal marcar como paga
   const [modalPagamento, setModalPagamento] = useState<Despesa | null>(null);
   const [valorRealInput, setValorRealInput] = useState("");
   const [arquivoComprovante, setArquivoComprovante] = useState<File | null>(
      null,
   );
   const [loadingPagamento, setLoadingPagamento] = useState(false);

   // Modal exclusão customizado
   const [modalExcluir, setModalExcluir] = useState<Despesa | null>(null);
   const [loadingExcluir, setLoadingExcluir] = useState(false);

   // Modal bloqueio exclusão (despesa paga)
   const [modalBloqueioExclusao, setModalBloqueioExclusao] = useState(false);

   // Modal desfazer pagamento
   const [modalDesfazer, setModalDesfazer] = useState<Despesa | null>(null);
   const [loadingDesfazer, setLoadingDesfazer] = useState(false);

   // Modal cancelar recorrência
   const [modalCancelar, setModalCancelar] = useState<Despesa | null>(null);
   const [loadingCancelar, setLoadingCancelar] = useState(false);

   // Modal detalhe / comprovante
   const [modalDetalhe, setModalDetalhe] = useState<Despesa | null>(null);
   const [comprovanteUrl, setComprovanteUrl] = useState<string | null>(null);
   const [loadingComprovante, setLoadingComprovante] = useState(false);

   const [erro, setErro] = useState("");
   const [sucesso, setSucesso] = useState("");

   const meses = useMemo(() => gerarMeses(), []);

   useEffect(() => {
      if (!authService.isAuthenticated()) {
         router.push("/login");
         return;
      }
      if (mesaCarregando) return;
      if (mesaSelecionada) {
         carregarDados();
      } else {
         setLoading(false);
      }
   }, [router, mesaSelecionada, mesaCarregando, mesSelecionado]);

   const carregarDados = async () => {
      if (!mesaSelecionada) {
         setLoading(false);
         return;
      }
      setLoading(true);

      // Dados base (selects do modal) — independentes, não bloqueiam entre si
      try {
         const [categoriasData, tiposData, cartoesData] = await Promise.all([
            categoriaService.listar("despesa", false),
            tipoPagamentoService.listar(false),
            cartaoService.listar(false),
         ]);
         setCategorias(categoriasData);
         setTiposPagamento(tiposData);
         setCartoes(cartoesData);
      } catch (err) {
         console.error("Erro ao carregar dados base:", err);
      }

      // Despesas do mês — separado para não bloquear os selects acima
      try {
         const despesasData = await despesaService.listar(
            mesaSelecionada.id,
            mesSelecionado,
         );
         setDespesas(despesasData);
      } catch (err) {
         console.error("Erro ao carregar despesas:", err);
         setErro("Erro ao carregar despesas");
      } finally {
         setLoading(false);
      }
   };

   // Filtragem frontend
   const despesasFiltradas = useMemo(() => {
      return despesas.filter((d) => {
         const status = getStatus(d);
         if (filtroStatus !== "todas" && status !== filtroStatus) return false;
         if (filtroTipo !== "todas" && d.tipo !== filtroTipo) return false;
         return true;
      });
   }, [despesas, filtroStatus, filtroTipo]);

   // Totais
   const totais = useMemo(() => {
      let pago = 0,
         aVencer = 0,
         vencido = 0;
      despesasFiltradas.forEach((d) => {
         const status = getStatus(d);
         const val = parseFloat(
            String(
               status === "paga"
                  ? (d.valor_real ?? d.valor_provisionado)
                  : d.valor_provisionado,
            ),
         );
         if (status === "paga") pago += val;
         else if (status === "a_vencer") aVencer += val;
         else vencido += val;
      });
      return { pago, aVencer, vencido };
   }, [despesasFiltradas]);

   // ── Modal criar/editar ────────────────────────────────────────────────────

   const abrirModal = (despesa?: Despesa) => {
      if (despesa) {
         setEditando(despesa);
         setDescricao(despesa.descricao);
         setTipo(despesa.tipo || "variavel");
         setValorProvisionado(String(despesa.valor_provisionado));
         setDataVencimento(despesa.data_vencimento.substring(0, 10));
         setCategoriaId(despesa.categoria_id || "");
         setTipoPagamentoId(despesa.tipo_pagamento_id || "");
         setCartaoId(despesa.cartao_id || "");
         setRecorrente(Boolean(despesa.recorrente));
         setParcelas(1);
      } else {
         setEditando(null);
         setDescricao("");
         setTipo("variavel");
         setValorProvisionado("");
         setDataVencimento(`${mesSelecionado}-01`);
         setCategoriaId("");
         setTipoPagamentoId("");
         setCartaoId("");
         setRecorrente(false);
         setParcelas(1);
      }
      setErro("");
      setModalAberto(true);
   };

   const fecharModal = () => {
      setModalAberto(false);
      setEditando(null);
      setErro("");
   };

   const salvarDespesa = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!mesaSelecionada) {
         setErro("Nenhuma mesa selecionada");
         return;
      }
      if (!descricao.trim()) {
         setErro("A descrição é obrigatória");
         return;
      }
      if (!valorProvisionado || parseFloat(valorProvisionado) <= 0) {
         setErro("O valor deve ser maior que zero");
         return;
      }
      if (!dataVencimento) {
         setErro("A data de vencimento é obrigatória");
         return;
      }

      // Validação de cartão
      const tipoPagamentoSelecionado = tiposPagamento.find(
         (tp) => tp.id === Number(tipoPagamentoId),
      );
      const nomeTP = tipoPagamentoSelecionado?.nome?.toLowerCase() ?? "";
      const isCartaoCredito =
         nomeTP.includes("crédito") || nomeTP.includes("credito");
      const isCartaoDebito =
         nomeTP.includes("débito") || nomeTP.includes("debito");
      const precisaCartao = isCartaoCredito || isCartaoDebito;

      if (precisaCartao && !cartaoId) {
         setErro(
            `Selecione um cartão de ${isCartaoCredito ? "crédito" : "débito"}`,
         );
         return;
      }
      if (isCartaoDebito) {
         const cartoesDebito = cartoes.filter((c) => c.tipo === "debito");
         if (cartoesDebito.length === 0) {
            setErro(
               "Nenhum cartão de débito cadastrado. Cadastre um cartão antes de continuar.",
            );
            return;
         }
      }

      try {
         const data: DespesaCreate = {
            mesa_id: mesaSelecionada.id,
            descricao,
            tipo,
            valor_provisionado: parseFloat(valorProvisionado),
            data_vencimento: dataVencimento,
            categoria_id: categoriaId ? Number(categoriaId) : undefined,
            tipo_pagamento_id: tipoPagamentoId
               ? Number(tipoPagamentoId)
               : undefined,
            cartao_id: cartaoId ? Number(cartaoId) : undefined,
            recorrente:
               tipo === "fixa" || tipo === "assinatura" ? true : recorrente,
            parcelas:
               precisaCartao && isCartaoCredito && parcelas > 1
                  ? parcelas
                  : tipo === "variavel" && parcelas > 1
                    ? parcelas
                    : undefined,
         };

         if (editando) {
            await despesaService.atualizar(editando.id, data);
            setSucesso("Despesa atualizada com sucesso!");
         } else {
            await despesaService.criar(data);
            setSucesso(
               parcelas > 1
                  ? `${parcelas} parcelas criadas!`
                  : "Despesa criada com sucesso!",
            );
         }

         fecharModal();
         carregarDados();
         setTimeout(() => setSucesso(""), 3000);
      } catch (error: unknown) {
         const msg = (error as { response?: { data?: { error?: string } } })
            ?.response?.data?.error;
         setErro(msg || "Erro ao salvar despesa");
      }
   };

   const excluirDespesa = async (despesa: Despesa) => {
      if (despesa.paga) {
         setModalBloqueioExclusao(true);
         return;
      }
      setModalExcluir(despesa);
   };

   const confirmarExclusao = async () => {
      if (!modalExcluir) return;
      setLoadingExcluir(true);
      try {
         await despesaService.inativar(modalExcluir.id, modalExcluir.mesa_id);
         setSucesso("Despesa excluída com sucesso!");
         setModalExcluir(null);
         carregarDados();
         setTimeout(() => setSucesso(""), 3000);
      } catch {
         setErro("Erro ao excluir despesa");
      } finally {
         setLoadingExcluir(false);
      }
   };

   // ── Modal marcar como paga ────────────────────────────────────────────────

   const abrirModalPagamento = (despesa: Despesa) => {
      setModalPagamento(despesa);
      setValorRealInput(String(despesa.valor_provisionado));
      setArquivoComprovante(null);
      setErro("");
   };

   const fecharModalPagamento = () => {
      setModalPagamento(null);
      setValorRealInput("");
      setArquivoComprovante(null);
   };

   const confirmarPagamento = async () => {
      if (!modalPagamento || !mesaSelecionada) return;
      const val = parseFloat(valorRealInput);
      if (!val || val <= 0) {
         setErro("Informe um valor válido");
         return;
      }
      setLoadingPagamento(true);
      try {
         await despesaService.marcarComoPaga(
            modalPagamento.id,
            mesaSelecionada.id,
            val,
            arquivoComprovante,
         );
         setSucesso("Despesa marcada como paga!");
         fecharModalPagamento();
         carregarDados();
         setTimeout(() => setSucesso(""), 3000);
      } catch {
         setErro("Erro ao marcar como paga");
      } finally {
         setLoadingPagamento(false);
      }
   };

   // ── Modal desfazer pagamento ──────────────────────────────────────────────

   const confirmarDesfazer = async () => {
      if (!modalDesfazer || !mesaSelecionada) return;
      setLoadingDesfazer(true);
      try {
         await despesaService.desmarcarPagamento(
            modalDesfazer.id,
            mesaSelecionada.id,
         );
         setSucesso("Pagamento desfeito com sucesso!");
         setModalDesfazer(null);
         carregarDados();
         setTimeout(() => setSucesso(""), 3000);
      } catch {
         setErro("Erro ao desfazer pagamento");
      } finally {
         setLoadingDesfazer(false);
      }
   };

   // ── Modal cancelar recorrência ────────────────────────────────────────────

   const confirmarCancelamento = async () => {
      if (!modalCancelar || !mesaSelecionada) return;
      setLoadingCancelar(true);
      try {
         await despesaService.cancelarRecorrencia(
            modalCancelar.id,
            mesaSelecionada.id,
            mesSelecionado,
         );
         setSucesso(
            `"${modalCancelar.descricao}" não aparecerá mais a partir de ${mesSelecionado}`,
         );
         setModalCancelar(null);
         carregarDados();
         setTimeout(() => setSucesso(""), 4000);
      } catch {
         setErro("Erro ao cancelar recorrência");
      } finally {
         setLoadingCancelar(false);
      }
   };

   const abrirDetalhe = async (despesa: Despesa) => {
      setModalDetalhe(despesa);
      setComprovanteUrl(null);
      if (despesa.comprovante && mesaSelecionada) {
         setLoadingComprovante(true);
         try {
            const url = await despesaService.getComprovanteUrl(
               despesa.id,
               mesaSelecionada.id,
            );
            setComprovanteUrl(url);
         } catch {
            // comprovante não disponível
         } finally {
            setLoadingComprovante(false);
         }
      }
   };

   const fecharDetalhe = () => {
      // revogar blob URL para liberar memória
      if (comprovanteUrl) URL.revokeObjectURL(comprovanteUrl);
      setModalDetalhe(null);
      setComprovanteUrl(null);
   };

   const BadgeStatus = ({ despesa }: { despesa: Despesa }) => {
      const s = getStatus(despesa);
      if (s === "paga")
         return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
               <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
               Paga
            </span>
         );
      if (s === "vencida")
         return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
               <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
               Vencida
            </span>
         );
      return (
         <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />A vencer
         </span>
      );
   };

   if (loading) {
      return (
         <DashboardLayout>
            <div className="flex items-center justify-center min-h-screen">
               <div className="text-gray-600">Carregando...</div>
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
                     Despesas
                  </h1>
                  <p className="text-xs md:text-sm text-gray-600 mt-1">
                     Mesa:{" "}
                     <span className="font-semibold text-red-600">
                        {mesaSelecionada?.nome}
                     </span>
                  </p>
               </div>
               <button
                  onClick={() => abrirModal()}
                  className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg hover:from-red-600 hover:to-rose-700 transition-all shadow-md text-sm font-medium"
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
                  <span>Nova Despesa</span>
               </button>
            </div>

            {/* Mensagens */}
            {sucesso && (
               <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm">
                  {sucesso}
               </div>
            )}
            {erro && !modalAberto && !modalPagamento && (
               <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                  {erro}
               </div>
            )}

            {/* ── Filtros ── */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-3 sm:p-4">
               {/* Mobile */}
               <div className="flex items-center gap-2 sm:hidden">
                  <select
                     value={mesSelecionado}
                     onChange={(e) => setMesSelecionado(e.target.value)}
                     className="flex-1 min-w-0 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                     {meses.map((m) => (
                        <option key={m.valor} value={m.valor}>
                           {m.label}
                        </option>
                     ))}
                  </select>

                  {/* Status bolinhas */}
                  <div className="flex items-center gap-1">
                     {[
                        { v: "todas", cor: "bg-gray-400", t: "Todas" },
                        { v: "a_vencer", cor: "bg-blue-500", t: "A vencer" },
                        { v: "paga", cor: "bg-green-500", t: "Paga" },
                        { v: "vencida", cor: "bg-red-500", t: "Vencida" },
                     ].map((op) => (
                        <button
                           key={op.v}
                           title={op.t}
                           onClick={() => setFiltroStatus(op.v as FiltroStatus)}
                           className={`w-5 h-5 rounded-full transition-all ${op.cor} ${
                              filtroStatus === op.v
                                 ? "ring-2 ring-offset-1 ring-gray-400 scale-110"
                                 : "opacity-30"
                           }`}
                        />
                     ))}
                  </div>

                  <span className="text-gray-300 text-xs">|</span>

                  {/* Tipo bolinhas */}
                  <div className="flex items-center gap-1">
                     {[
                        { v: "todas", cor: "bg-gray-400", t: "Todas" },
                        { v: "variavel", cor: "bg-orange-400", t: "Variável" },
                        { v: "fixa", cor: "bg-purple-500", t: "Fixa" },
                        { v: "assinatura", cor: "bg-sky-500", t: "Assinatura" },
                     ].map((op) => (
                        <button
                           key={op.v}
                           title={op.t}
                           onClick={() => setFiltroTipo(op.v as FiltroTipo)}
                           className={`w-5 h-5 rounded-full transition-all ${op.cor} ${
                              filtroTipo === op.v
                                 ? "ring-2 ring-offset-1 ring-gray-400 scale-110"
                                 : "opacity-30"
                           }`}
                        />
                     ))}
                  </div>
               </div>

               {/* Desktop */}
               <div className="hidden sm:flex gap-3">
                  <div className="flex-1">
                     <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                        Mês
                     </label>
                     <select
                        value={mesSelecionado}
                        onChange={(e) => setMesSelecionado(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                     >
                        {meses.map((m) => (
                           <option key={m.valor} value={m.valor}>
                              {m.label}
                           </option>
                        ))}
                     </select>
                  </div>

                  <div className="flex-1">
                     <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                        Status
                     </label>
                     <div className="flex rounded-lg overflow-hidden border border-gray-200">
                        {[
                           { v: "todas", l: "Todas" },
                           { v: "a_vencer", l: "A vencer" },
                           { v: "paga", l: "Paga" },
                           { v: "vencida", l: "Vencida" },
                        ].map((op) => (
                           <button
                              key={op.v}
                              onClick={() =>
                                 setFiltroStatus(op.v as FiltroStatus)
                              }
                              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                                 filtroStatus === op.v
                                    ? "bg-red-600 text-white"
                                    : "bg-white text-gray-600 hover:bg-gray-50"
                              }`}
                           >
                              {op.l}
                           </button>
                        ))}
                     </div>
                  </div>

                  <div className="flex-1">
                     <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                        Tipo
                     </label>
                     <div className="flex rounded-lg overflow-hidden border border-gray-200">
                        {[
                           { v: "todas", l: "Todas" },
                           { v: "variavel", l: "Variável" },
                           { v: "fixa", l: "Fixa" },
                           { v: "assinatura", l: "Assinatura" },
                        ].map((op) => (
                           <button
                              key={op.v}
                              onClick={() => setFiltroTipo(op.v as FiltroTipo)}
                              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                                 filtroTipo === op.v
                                    ? "bg-red-600 text-white"
                                    : "bg-white text-gray-600 hover:bg-gray-50"
                              }`}
                           >
                              {op.l}
                           </button>
                        ))}
                     </div>
                  </div>
               </div>
            </div>

            {/* ── Cards resumo ── */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
               <div className="bg-white rounded-xl shadow-md border border-gray-100 p-2.5 sm:p-4">
                  <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1 truncate">
                     <span className="sm:hidden">Pago</span>
                     <span className="hidden sm:inline">Total pago</span>
                  </p>
                  <p className="text-sm sm:text-lg font-bold text-green-600 truncate">
                     {formatarValor(totais.pago)}
                  </p>
               </div>
               <div className="bg-white rounded-xl shadow-md border border-gray-100 p-2.5 sm:p-4">
                  <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1 truncate">
                     A vencer
                  </p>
                  <p className="text-sm sm:text-lg font-bold text-blue-600 truncate">
                     {formatarValor(totais.aVencer)}
                  </p>
               </div>
               <div className="bg-white rounded-xl shadow-md border border-gray-100 p-2.5 sm:p-4">
                  <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1 truncate">
                     Vencido
                  </p>
                  <p className="text-sm sm:text-lg font-bold text-red-600 truncate">
                     {formatarValor(totais.vencido)}
                  </p>
               </div>
            </div>

            {/* ── Lista ── */}
            {despesasFiltradas.length === 0 ? (
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
                        d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"
                     />
                  </svg>
                  <p className="text-base font-medium">
                     Nenhuma despesa encontrada
                  </p>
                  <p className="text-sm mt-1 text-gray-400">
                     Tente outro mês ou adicione uma nova despesa
                  </p>
               </div>
            ) : (
               <>
                  {/* Mobile: cards */}
                  <div className="flex flex-col gap-3 sm:hidden">
                     {despesasFiltradas.map((d) => {
                        const status = getStatus(d);
                        const isPaga = status === "paga";
                        const isRecorrente = !!d.recorrente;
                        const isCancelada = !!d.data_cancelamento;
                        return (
                           <div
                              key={d.id}
                              className={`bg-white rounded-xl shadow-sm border p-4 ${
                                 isCancelada
                                    ? "border-gray-300 opacity-75"
                                    : status === "vencida"
                                      ? "border-red-200"
                                      : "border-gray-100"
                              }`}
                           >
                              {/* Linha 1: descrição + valor — clicável para detalhe */}
                              <div
                                 className="flex items-start justify-between mb-2 cursor-pointer"
                                 onClick={() => abrirDetalhe(d)}
                              >
                                 <div className="flex-1 min-w-0 pr-2">
                                    <div className="flex items-center gap-1.5">
                                       <p
                                          className={`text-sm font-semibold truncate transition-all ${
                                             isPaga
                                                ? "line-through text-gray-400"
                                                : "text-gray-900"
                                          }`}
                                       >
                                          {d.descricao}
                                       </p>
                                       {d.comprovante && (
                                          <svg
                                             className="w-3.5 h-3.5 text-green-500 shrink-0"
                                             fill="none"
                                             stroke="currentColor"
                                             viewBox="0 0 24 24"
                                          >
                                             <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                             />
                                          </svg>
                                       )}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                       Vence: {formatarData(d.data_vencimento)}
                                    </p>
                                 </div>
                                 <div className="text-right">
                                    <p
                                       className={`text-base font-bold whitespace-nowrap ${isPaga ? "text-green-600" : status === "vencida" ? "text-red-600" : "text-gray-700"}`}
                                    >
                                       {formatarValor(
                                          isPaga
                                             ? (d.valor_real ??
                                                  d.valor_provisionado)
                                             : d.valor_provisionado,
                                       )}
                                    </p>
                                    {isPaga &&
                                       d.valor_real &&
                                       parseFloat(String(d.valor_real)) !==
                                          parseFloat(
                                             String(d.valor_provisionado),
                                          ) && (
                                          <p className="text-[10px] text-gray-400 line-through">
                                             {formatarValor(
                                                d.valor_provisionado,
                                             )}
                                          </p>
                                       )}
                                 </div>
                              </div>

                              {/* Linha 2: badges + ações */}
                              <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-1.5 flex-wrap">
                                    <BadgeStatus despesa={d} />
                                    <span
                                       className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${COR_TIPO[d.tipo]}`}
                                    >
                                       {LABEL_TIPO[d.tipo]}
                                    </span>
                                    {isRecorrente && !isCancelada && (
                                       <span className="text-xs text-gray-400">
                                          🔄
                                       </span>
                                    )}
                                    {isCancelada && (
                                       <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                          ⛔ Cancelada
                                       </span>
                                    )}
                                    {d.parcelas > 1 && (
                                       <span className="text-xs text-gray-400">
                                          {d.parcela_atual}/{d.parcelas}x
                                       </span>
                                    )}
                                 </div>

                                 {/* Ações com ícones */}
                                 <div className="flex items-center gap-3 ml-2 shrink-0">
                                    {!isPaga ? (
                                       <button
                                          title="Marcar como paga"
                                          onClick={() => abrirModalPagamento(d)}
                                          className="text-green-600 hover:text-green-700 transition-colors"
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
                                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                             />
                                          </svg>
                                       </button>
                                    ) : (
                                       <button
                                          title="Desfazer pagamento"
                                          onClick={() => setModalDesfazer(d)}
                                          className="text-amber-500 hover:text-amber-600 transition-colors"
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
                                                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                                             />
                                          </svg>
                                       </button>
                                    )}
                                    {/* Cancelar/reativar recorrência — só para recorrentes */}
                                    {isRecorrente && (
                                       <button
                                          title={
                                             isCancelada
                                                ? "Reativar recorrência"
                                                : "Cancelar recorrência a partir deste mês"
                                          }
                                          onClick={() =>
                                             isCancelada
                                                ? despesaService
                                                     .removerCancelamento(
                                                        d.id,
                                                        d.mesa_id,
                                                     )
                                                     .then(carregarDados)
                                                : setModalCancelar(d)
                                          }
                                          className={`transition-colors ${isCancelada ? "text-green-500 hover:text-green-600" : "text-gray-400 hover:text-orange-500"}`}
                                       >
                                          {isCancelada ? (
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
                                                   d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                                />
                                             </svg>
                                          ) : (
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
                                                   d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                                                />
                                             </svg>
                                          )}
                                       </button>
                                    )}
                                    {/* Editar: pencil */}
                                    <button
                                       title="Editar"
                                       onClick={() => abrirModal(d)}
                                       className="text-blue-500 hover:text-blue-600 transition-colors"
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
                                             d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                          />
                                       </svg>
                                    </button>
                                    {/* Excluir: trash */}
                                    <button
                                       title={
                                          isPaga
                                             ? "Desfaça o pagamento para excluir"
                                             : "Excluir"
                                       }
                                       onClick={() => excluirDespesa(d)}
                                       className={`transition-colors ${
                                          isPaga
                                             ? "text-gray-300 cursor-not-allowed"
                                             : "text-red-400 hover:text-red-600"
                                       }`}
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
                                             d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                          />
                                       </svg>
                                    </button>
                                 </div>
                              </div>
                           </div>
                        );
                     })}
                  </div>

                  {/* Desktop: tabela */}
                  <div className="hidden sm:block bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                     <div className="overflow-x-auto">
                        <table className="w-full">
                           <thead className="bg-gray-50 border-b border-gray-200">
                              <tr>
                                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Descrição
                                 </th>
                                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Tipo
                                 </th>
                                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Categoria
                                 </th>
                                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Valor Prev.
                                 </th>
                                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Valor Real
                                 </th>
                                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Vencimento
                                 </th>
                                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Status
                                 </th>
                                 <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    Ações
                                 </th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-100">
                              {despesasFiltradas.map((d) => {
                                 const isPaga = getStatus(d) === "paga";
                                 const isRecorrente = !!d.recorrente;
                                 const isCancelada = !!d.data_cancelamento;
                                 return (
                                    <tr
                                       key={d.id}
                                       className={`hover:bg-gray-50 transition-colors group ${isCancelada ? "opacity-75" : ""}`}
                                    >
                                       {/* Células clicáveis para abrir detalhe */}
                                       <td
                                          className="px-4 py-3 cursor-pointer"
                                          onClick={() => abrirDetalhe(d)}
                                       >
                                          <div className="flex items-center gap-1.5">
                                             <div
                                                className={`text-sm font-medium transition-all ${
                                                   isPaga
                                                      ? "line-through text-gray-400"
                                                      : "text-gray-900"
                                                }`}
                                             >
                                                {d.descricao}
                                             </div>
                                             {d.comprovante && (
                                                <svg
                                                   className="w-3.5 h-3.5 text-green-500 shrink-0"
                                                   fill="none"
                                                   stroke="currentColor"
                                                   viewBox="0 0 24 24"
                                                >
                                                   <path
                                                      strokeLinecap="round"
                                                      strokeLinejoin="round"
                                                      strokeWidth={2}
                                                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                                   />
                                                </svg>
                                             )}
                                          </div>
                                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                             {isRecorrente && !isCancelada && (
                                                <span className="text-xs text-gray-400">
                                                   🔄 Recorrente
                                                </span>
                                             )}
                                             {isCancelada && (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500">
                                                   ⛔ Cancelada em{" "}
                                                   {formatarData(
                                                      d.data_cancelamento!,
                                                   )}
                                                </span>
                                             )}
                                             {d.parcelas > 1 && (
                                                <span className="text-xs text-gray-400">
                                                   {d.parcela_atual}/
                                                   {d.parcelas}x
                                                </span>
                                             )}
                                          </div>
                                       </td>
                                       <td
                                          className="px-4 py-3 cursor-pointer"
                                          onClick={() => abrirDetalhe(d)}
                                       >
                                          <span
                                             className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${COR_TIPO[d.tipo]}`}
                                          >
                                             {LABEL_TIPO[d.tipo]}
                                          </span>
                                       </td>
                                       <td
                                          className="px-4 py-3 text-sm text-gray-600 cursor-pointer"
                                          onClick={() => abrirDetalhe(d)}
                                       >
                                          {d.categoria_nome || "—"}
                                       </td>
                                       <td
                                          className="px-4 py-3 text-sm text-gray-600 cursor-pointer"
                                          onClick={() => abrirDetalhe(d)}
                                       >
                                          {formatarValor(d.valor_provisionado)}
                                       </td>
                                       <td
                                          className="px-4 py-3 text-sm font-semibold text-red-600 cursor-pointer"
                                          onClick={() => abrirDetalhe(d)}
                                       >
                                          {isPaga
                                             ? formatarValor(
                                                  d.valor_real ??
                                                     d.valor_provisionado,
                                               )
                                             : "—"}
                                       </td>
                                       <td
                                          className="px-4 py-3 text-sm text-gray-600 cursor-pointer"
                                          onClick={() => abrirDetalhe(d)}
                                       >
                                          {formatarData(d.data_vencimento)}
                                       </td>
                                       <td
                                          className="px-4 py-3 cursor-pointer"
                                          onClick={() => abrirDetalhe(d)}
                                       >
                                          <BadgeStatus despesa={d} />
                                       </td>
                                       {/* Ações com ícones */}
                                       <td className="px-4 py-3 text-right">
                                          <div className="flex items-center justify-end gap-1">
                                             {!isPaga ? (
                                                <button
                                                   title="Marcar como paga"
                                                   onClick={() =>
                                                      abrirModalPagamento(d)
                                                   }
                                                   className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 hover:text-green-700 transition-colors"
                                                >
                                                   <svg
                                                      className="w-[18px] h-[18px]"
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
                                                </button>
                                             ) : (
                                                <button
                                                   title="Desfazer pagamento"
                                                   onClick={() =>
                                                      setModalDesfazer(d)
                                                   }
                                                   className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                                                >
                                                   <svg
                                                      className="w-[18px] h-[18px]"
                                                      fill="none"
                                                      stroke="currentColor"
                                                      viewBox="0 0 24 24"
                                                   >
                                                      <path
                                                         strokeLinecap="round"
                                                         strokeLinejoin="round"
                                                         strokeWidth={2}
                                                         d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                                                      />
                                                   </svg>
                                                </button>
                                             )}
                                             {/* Cancelar/reativar recorrência */}
                                             {isRecorrente && (
                                                <button
                                                   title={
                                                      isCancelada
                                                         ? "Reativar recorrência"
                                                         : "Cancelar recorrência a partir deste mês"
                                                   }
                                                   onClick={() =>
                                                      isCancelada
                                                         ? despesaService
                                                              .removerCancelamento(
                                                                 d.id,
                                                                 d.mesa_id,
                                                              )
                                                              .then(
                                                                 carregarDados,
                                                              )
                                                         : setModalCancelar(d)
                                                   }
                                                   className={`p-1.5 rounded-lg transition-colors ${
                                                      isCancelada
                                                         ? "text-green-500 hover:bg-green-50 hover:text-green-600"
                                                         : "text-gray-400 hover:bg-orange-50 hover:text-orange-500"
                                                   }`}
                                                >
                                                   {isCancelada ? (
                                                      <svg
                                                         className="w-[18px] h-[18px]"
                                                         fill="none"
                                                         stroke="currentColor"
                                                         viewBox="0 0 24 24"
                                                      >
                                                         <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                                         />
                                                      </svg>
                                                   ) : (
                                                      <svg
                                                         className="w-[18px] h-[18px]"
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
                                                   )}
                                                </button>
                                             )}
                                             <button
                                                title="Editar"
                                                onClick={() => abrirModal(d)}
                                                className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                             >
                                                <svg
                                                   className="w-[18px] h-[18px]"
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
                                             </button>
                                             <button
                                                title={
                                                   isPaga
                                                      ? "Desfaça o pagamento para excluir"
                                                      : "Excluir"
                                                }
                                                onClick={() =>
                                                   excluirDespesa(d)
                                                }
                                                className={`p-1.5 rounded-lg transition-colors ${
                                                   isPaga
                                                      ? "text-gray-300 cursor-not-allowed"
                                                      : "text-red-400 hover:bg-red-50 hover:text-red-600"
                                                }`}
                                             >
                                                <svg
                                                   className="w-[18px] h-[18px]"
                                                   fill="none"
                                                   stroke="currentColor"
                                                   viewBox="0 0 24 24"
                                                >
                                                   <path
                                                      strokeLinecap="round"
                                                      strokeLinejoin="round"
                                                      strokeWidth={2}
                                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                   />
                                                </svg>
                                             </button>
                                          </div>
                                       </td>
                                    </tr>
                                 );
                              })}
                           </tbody>
                        </table>
                     </div>
                  </div>
               </>
            )}
         </div>

         {/* ════════════════════════════════════════════════════════════════
             Modal Criar / Editar
         ════════════════════════════════════════════════════════════════ */}
         {modalAberto &&
            (() => {
               // Detectar se é cartão pelo nome do tipo de pagamento
               const tpSelecionado = tiposPagamento.find(
                  (tp) => tp.id === Number(tipoPagamentoId),
               );
               const nomeTP = tpSelecionado?.nome?.toLowerCase() ?? "";
               const isCartaoCredito =
                  nomeTP.includes("crédito") || nomeTP.includes("credito");
               const isCartaoDebito =
                  nomeTP.includes("débito") || nomeTP.includes("debito");
               const precisaCartao = isCartaoCredito || isCartaoDebito;

               // Filtrar cartões pelo tipo quando selecionado
               const cartoesFiltrados = precisaCartao
                  ? cartoes.filter((c) =>
                       isCartaoCredito
                          ? c.tipo === "credito"
                          : c.tipo === "debito",
                    )
                  : cartoes;

               // Parcelamento disponível para: variável (qualquer) ou cartão crédito
               const podeParcelar =
                  (tipo === "variavel" || isCartaoCredito) && !editando;

               return (
                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 sm:p-6">
                     <div className="bg-white rounded-xl shadow-2xl w-full max-w-md sm:max-w-lg max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
                        <div className="p-4 sm:p-6">
                           <h2 className="text-lg font-bold text-gray-800 mb-1">
                              {editando ? "Editar Despesa" : "Nova Despesa"}
                           </h2>
                           <p className="text-xs text-gray-500 mb-4">
                              Mesa:{" "}
                              <span className="font-semibold text-red-600">
                                 {mesaSelecionada?.nome}
                              </span>
                           </p>

                           {erro && (
                              <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                                 {erro}
                              </div>
                           )}

                           <form
                              onSubmit={salvarDespesa}
                              className="space-y-3 sm:space-y-4"
                           >
                              {/* Descrição */}
                              <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Descrição *
                                 </label>
                                 <input
                                    type="text"
                                    value={descricao}
                                    onChange={(e) =>
                                       setDescricao(e.target.value)
                                    }
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    placeholder="Ex: Conta de luz"
                                    autoFocus
                                 />
                              </div>

                              {/* Tipo */}
                              <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tipo de despesa *
                                 </label>
                                 <div className="grid grid-cols-3 gap-2">
                                    {(
                                       [
                                          "variavel",
                                          "fixa",
                                          "assinatura",
                                       ] as TipoDespesa[]
                                    ).map((t) => (
                                       <button
                                          key={t}
                                          type="button"
                                          onClick={() => {
                                             setTipo(t);
                                             if (
                                                t === "fixa" ||
                                                t === "assinatura"
                                             ) {
                                                setRecorrente(true);
                                                setParcelas(1);
                                             }
                                          }}
                                          className={`py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg text-xs font-semibold border-2 transition-all ${
                                             tipo === t
                                                ? t === "variavel"
                                                   ? "border-orange-500 bg-orange-50 text-orange-700"
                                                   : t === "fixa"
                                                     ? "border-purple-500 bg-purple-50 text-purple-700"
                                                     : "border-sky-500 bg-sky-50 text-sky-700"
                                                : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                                          }`}
                                       >
                                          {t === "variavel"
                                             ? "📊 Variável"
                                             : t === "fixa"
                                               ? "📌 Fixa"
                                               : "🔔 Assinatura"}
                                       </button>
                                    ))}
                                 </div>
                                 <p className="text-xs text-gray-400 mt-1.5">
                                    {tipo === "variavel" &&
                                       "Gasto pontual cujo valor pode variar (ex: mercado, farmácia)"}
                                    {tipo === "fixa" &&
                                       "Valor fixo todo mês (ex: aluguel, financiamento) — recorrente automático"}
                                    {tipo === "assinatura" &&
                                       "Serviço de assinatura mensal (ex: Netflix, academia) — recorrente automático"}
                                 </p>
                              </div>

                              {/* Valor + Data */}
                              <div className="grid grid-cols-2 gap-4">
                                 <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                       Valor provisionado *
                                    </label>
                                    <input
                                       type="number"
                                       step="0.01"
                                       value={valorProvisionado}
                                       onChange={(e) =>
                                          setValorProvisionado(e.target.value)
                                       }
                                       className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                       placeholder="0,00"
                                    />
                                 </div>
                                 <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                       {isCartaoCredito
                                          ? "Data da 1ª parcela *"
                                          : "Data de vencimento *"}
                                    </label>
                                    <input
                                       type="date"
                                       value={dataVencimento}
                                       onChange={(e) =>
                                          setDataVencimento(e.target.value)
                                       }
                                       className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    />
                                 </div>
                              </div>

                              {/* Categoria + Tipo pagamento */}
                              <div className="grid grid-cols-2 gap-4">
                                 <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                       Categoria
                                    </label>
                                    <select
                                       value={categoriaId}
                                       onChange={(e) =>
                                          setCategoriaId(Number(e.target.value))
                                       }
                                       className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    >
                                       <option value="">Sem categoria</option>
                                       {categorias.map((cat) => (
                                          <option key={cat.id} value={cat.id}>
                                             {cat.nome}
                                          </option>
                                       ))}
                                    </select>
                                 </div>
                                 <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                       Tipo de pagamento
                                    </label>
                                    <select
                                       value={tipoPagamentoId}
                                       onChange={(e) => {
                                          const newId = Number(e.target.value);
                                          setTipoPagamentoId(newId);
                                          setCartaoId(""); // limpa cartão ao trocar tipo
                                          // Se não for mais crédito, reseta parcelas
                                          const tp = tiposPagamento.find(
                                             (t) => t.id === newId,
                                          );
                                          const nome =
                                             tp?.nome?.toLowerCase() ?? "";
                                          if (
                                             !nome.includes("crédito") &&
                                             !nome.includes("credito")
                                          ) {
                                             setParcelas(1);
                                          }
                                       }}
                                       className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    >
                                       <option value="">Selecione...</option>
                                       {tiposPagamento.map((tp) => (
                                          <option key={tp.id} value={tp.id}>
                                             {tp.nome}
                                          </option>
                                       ))}
                                    </select>
                                 </div>
                              </div>

                              {/* Seletor de cartão — aparece somente quando tipo é cartão */}
                              {precisaCartao && (
                                 <div
                                    className={`rounded-xl p-4 border-2 ${
                                       isCartaoCredito
                                          ? "border-purple-200 bg-purple-50"
                                          : "border-blue-200 bg-blue-50"
                                    }`}
                                 >
                                    <label className="block text-sm font-medium mb-2 ${isCartaoCredito ? 'text-purple-700' : 'text-blue-700'}">
                                       {isCartaoCredito
                                          ? "💳 Cartão de crédito *"
                                          : "💳 Cartão de débito *"}
                                    </label>
                                    {cartoesFiltrados.length === 0 ? (
                                       <div className="flex items-center gap-3 bg-white border border-dashed border-gray-300 rounded-lg px-4 py-3">
                                          <svg
                                             className="w-5 h-5 text-gray-400 shrink-0"
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
                                          <p className="text-sm text-gray-500">
                                             Nenhum cartão de{" "}
                                             {isCartaoCredito
                                                ? "crédito"
                                                : "débito"}{" "}
                                             cadastrado.{" "}
                                             <a
                                                href="/dashboard/cartoes"
                                                className="text-red-600 font-medium hover:underline"
                                             >
                                                Cadastrar agora →
                                             </a>
                                          </p>
                                       </div>
                                    ) : (
                                       <div className="grid grid-cols-2 gap-2">
                                          {cartoesFiltrados.map((c) => (
                                             <button
                                                key={c.id}
                                                type="button"
                                                onClick={() =>
                                                   setCartaoId(c.id)
                                                }
                                                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all text-left ${
                                                   cartaoId === c.id
                                                      ? isCartaoCredito
                                                         ? "border-purple-500 bg-purple-100 text-purple-800"
                                                         : "border-blue-500 bg-blue-100 text-blue-800"
                                                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                                                }`}
                                             >
                                                <svg
                                                   className="w-4 h-4 shrink-0"
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
                                                <span className="truncate">
                                                   {c.nome}
                                                </span>
                                                {cartaoId === c.id && (
                                                   <svg
                                                      className="w-4 h-4 ml-auto shrink-0"
                                                      fill="currentColor"
                                                      viewBox="0 0 24 24"
                                                   >
                                                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                   </svg>
                                                )}
                                             </button>
                                          ))}
                                       </div>
                                    )}
                                 </div>
                              )}

                              {/* Parcelamento — só variável com cartão de crédito selecionado */}
                              {tipo === "variavel" &&
                                 isCartaoCredito &&
                                 !editando && (
                                    <div
                                       className={`flex items-center gap-3 p-3 rounded-lg ${
                                          isCartaoCredito
                                             ? "bg-purple-50 border border-purple-200"
                                             : "bg-gray-50"
                                       }`}
                                    >
                                       <svg
                                          className="w-4 h-4 text-gray-500 shrink-0"
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
                                       <label className="text-sm text-gray-700 whitespace-nowrap">
                                          Parcelar em
                                       </label>
                                       <input
                                          type="number"
                                          min={1}
                                          max={60}
                                          value={parcelas}
                                          onChange={(e) =>
                                             setParcelas(
                                                Math.max(
                                                   1,
                                                   Number(e.target.value),
                                                ),
                                             )
                                          }
                                          className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-red-500"
                                       />
                                       <span className="text-sm text-gray-500">
                                          vez{parcelas > 1 ? "es" : ""}
                                       </span>
                                       {parcelas > 1 && isCartaoCredito && (
                                          <span className="text-xs text-purple-600 font-medium">
                                             1 lançamento por mês no cartão
                                          </span>
                                       )}
                                    </div>
                                 )}

                              {/* Recorrente — só variável E sem parcelamento no crédito */}
                              {tipo === "variavel" &&
                                 !(isCartaoCredito && parcelas > 1) && (
                                    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                                       <input
                                          type="checkbox"
                                          id="recorrente"
                                          checked={recorrente}
                                          onChange={(e) =>
                                             setRecorrente(e.target.checked)
                                          }
                                          className="w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500"
                                       />
                                       <label
                                          htmlFor="recorrente"
                                          className="text-sm text-gray-700 cursor-pointer"
                                       >
                                          Recorrente{" "}
                                          <span className="text-gray-400 text-xs">
                                             (se repete todo mês)
                                          </span>
                                       </label>
                                    </div>
                                 )}

                              <div className="flex space-x-3 pt-2">
                                 <button
                                    type="button"
                                    onClick={fecharModal}
                                    className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm"
                                 >
                                    Cancelar
                                 </button>
                                 <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg hover:from-red-600 hover:to-rose-700 transition-all font-medium text-sm"
                                 >
                                    {editando
                                       ? "Atualizar"
                                       : parcelas > 1
                                         ? `Criar ${parcelas}x`
                                         : "Criar"}
                                 </button>
                              </div>
                           </form>
                        </div>
                     </div>
                  </div>
               );
            })()}

         {/* ════════════════════════════════════════════════════════════════
             Modal Detalhe / Comprovante
         ════════════════════════════════════════════════════════════════ */}
         {modalDetalhe && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
               <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[80vh] sm:max-h-[90vh] overflow-y-auto">
                  {/* Header */}
                  <div className="flex items-start justify-between p-4 sm:p-5 border-b border-gray-100">
                     <div className="flex-1 min-w-0 pr-3">
                        <h2
                           className={`text-base font-bold ${getStatus(modalDetalhe) === "paga" ? "line-through text-gray-400" : "text-gray-800"}`}
                        >
                           {modalDetalhe.descricao}
                        </h2>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                           <BadgeStatus despesa={modalDetalhe} />
                           <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${COR_TIPO[modalDetalhe.tipo]}`}
                           >
                              {LABEL_TIPO[modalDetalhe.tipo]}
                           </span>
                           {!!modalDetalhe.recorrente && (
                              <span className="text-xs text-gray-400">
                                 🔄 Recorrente
                              </span>
                           )}
                        </div>
                     </div>
                     <button
                        onClick={fecharDetalhe}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors shrink-0"
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
                              d="M6 18L18 6M6 6l12 12"
                           />
                        </svg>
                     </button>
                  </div>

                  {/* Corpo */}
                  <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">
                     {/* Valores */}
                     <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 rounded-xl p-3">
                           <p className="text-xs text-gray-400 mb-0.5">
                              Valor previsto
                           </p>
                           <p className="text-base font-bold text-gray-700">
                              {formatarValor(modalDetalhe.valor_provisionado)}
                           </p>
                        </div>
                        <div
                           className={`rounded-xl p-3 ${modalDetalhe.paga ? "bg-green-50" : "bg-gray-50"}`}
                        >
                           <p className="text-xs text-gray-400 mb-0.5">
                              Valor pago
                           </p>
                           <p
                              className={`text-base font-bold ${modalDetalhe.paga ? "text-green-600" : "text-gray-400"}`}
                           >
                              {modalDetalhe.paga
                                 ? formatarValor(
                                      modalDetalhe.valor_real ??
                                         modalDetalhe.valor_provisionado,
                                   )
                                 : "—"}
                           </p>
                        </div>
                     </div>

                     {/* Datas */}
                     <div className="grid grid-cols-2 gap-3">
                        <div>
                           <p className="text-xs text-gray-400 mb-0.5">
                              Vencimento
                           </p>
                           <p className="text-sm font-semibold text-gray-700">
                              {formatarData(modalDetalhe.data_vencimento)}
                           </p>
                        </div>
                        {modalDetalhe.data_pagamento && (
                           <div>
                              <p className="text-xs text-gray-400 mb-0.5">
                                 Data do pagamento
                              </p>
                              <p className="text-sm font-semibold text-green-700">
                                 {formatarData(modalDetalhe.data_pagamento)}
                              </p>
                           </div>
                        )}
                     </div>

                     {/* Categoria / Pagamento */}
                     {(modalDetalhe.categoria_nome ||
                        modalDetalhe.tipo_pagamento_nome) && (
                        <div className="grid grid-cols-2 gap-3">
                           {modalDetalhe.categoria_nome && (
                              <div>
                                 <p className="text-xs text-gray-400 mb-0.5">
                                    Categoria
                                 </p>
                                 <p className="text-sm font-semibold text-gray-700">
                                    {modalDetalhe.categoria_nome}
                                 </p>
                              </div>
                           )}
                           {modalDetalhe.tipo_pagamento_nome && (
                              <div>
                                 <p className="text-xs text-gray-400 mb-0.5">
                                    Forma de pagamento
                                 </p>
                                 <p className="text-sm font-semibold text-gray-700">
                                    {modalDetalhe.tipo_pagamento_nome}
                                 </p>
                              </div>
                           )}
                        </div>
                     )}

                     {/* Parcelas */}
                     {modalDetalhe.parcelas > 1 && (
                        <div className="bg-blue-50 rounded-xl p-3 flex items-center gap-2">
                           <svg
                              className="w-4 h-4 text-blue-500 shrink-0"
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
                           <p className="text-sm text-blue-700 font-medium">
                              Parcela {modalDetalhe.parcela_atual} de{" "}
                              {modalDetalhe.parcelas}
                           </p>
                        </div>
                     )}

                     {/* Cartão vinculado */}
                     {modalDetalhe.cartao_nome && (
                        <div className="bg-purple-50 rounded-xl p-3 flex items-center gap-2">
                           <svg
                              className="w-4 h-4 text-purple-500 shrink-0"
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
                           <p className="text-sm text-purple-700 font-medium">
                              💳 {modalDetalhe.cartao_nome}
                           </p>
                        </div>
                     )}

                     {/* Recorrência / Cancelamento */}
                     {!!modalDetalhe.recorrente && (
                        <div
                           className={`rounded-xl p-3 flex items-center justify-between gap-2 ${
                              modalDetalhe.data_cancelamento
                                 ? "bg-gray-100"
                                 : "bg-green-50"
                           }`}
                        >
                           <div className="flex items-center gap-2">
                              <span className="text-sm">
                                 {modalDetalhe.data_cancelamento ? "⛔" : "🔄"}
                              </span>
                              <div>
                                 <p
                                    className={`text-sm font-semibold ${modalDetalhe.data_cancelamento ? "text-gray-600" : "text-green-700"}`}
                                 >
                                    {modalDetalhe.data_cancelamento
                                       ? "Recorrência cancelada"
                                       : "Recorrência ativa"}
                                 </p>
                                 {modalDetalhe.data_cancelamento && (
                                    <p className="text-xs text-gray-400">
                                       Parou em{" "}
                                       {formatarData(
                                          modalDetalhe.data_cancelamento,
                                       )}
                                    </p>
                                 )}
                              </div>
                           </div>
                           {modalDetalhe.data_cancelamento ? (
                              <button
                                 onClick={() => {
                                    if (!mesaSelecionada) return;
                                    despesaService
                                       .removerCancelamento(
                                          modalDetalhe.id,
                                          mesaSelecionada.id,
                                       )
                                       .then(() => {
                                          carregarDados();
                                          fecharDetalhe();
                                          setSucesso("Recorrência reativada!");
                                          setTimeout(
                                             () => setSucesso(""),
                                             3000,
                                          );
                                       });
                                 }}
                                 className="text-xs font-semibold text-green-600 hover:text-green-700 underline whitespace-nowrap"
                              >
                                 Reativar
                              </button>
                           ) : (
                              <button
                                 onClick={() => {
                                    fecharDetalhe();
                                    setModalCancelar(modalDetalhe);
                                 }}
                                 className="text-xs font-semibold text-orange-500 hover:text-orange-600 underline whitespace-nowrap"
                              >
                                 Cancelar
                              </button>
                           )}
                        </div>
                     )}

                     {/* Comprovante */}
                     <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                           Comprovante
                        </p>
                        {loadingComprovante ? (
                           <div className="flex items-center justify-center py-8">
                              <svg
                                 className="w-6 h-6 animate-spin text-gray-400"
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
                           </div>
                        ) : comprovanteUrl ? (
                           <div className="rounded-xl overflow-hidden border border-gray-200">
                              {comprovanteUrl.includes("pdf") ||
                              modalDetalhe.comprovante?.endsWith(".pdf") ? (
                                 <a
                                    href={comprovanteUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
                                 >
                                    <svg
                                       className="w-8 h-8 text-red-500"
                                       fill="currentColor"
                                       viewBox="0 0 24 24"
                                    >
                                       <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                                    </svg>
                                    <div>
                                       <p className="text-sm font-semibold text-gray-700">
                                          Visualizar PDF
                                       </p>
                                       <p className="text-xs text-gray-400">
                                          Clique para abrir
                                       </p>
                                    </div>
                                    <svg
                                       className="w-4 h-4 text-gray-400 ml-auto"
                                       fill="none"
                                       stroke="currentColor"
                                       viewBox="0 0 24 24"
                                    >
                                       <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                       />
                                    </svg>
                                 </a>
                              ) : (
                                 <a
                                    href={comprovanteUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                 >
                                    <img
                                       src={comprovanteUrl}
                                       alt="Comprovante"
                                       className="w-full max-h-64 object-contain bg-gray-50"
                                    />
                                 </a>
                              )}
                           </div>
                        ) : (
                           <div className="flex flex-col items-center justify-center py-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                              <svg
                                 className="w-8 h-8 text-gray-300 mb-2"
                                 fill="none"
                                 stroke="currentColor"
                                 viewBox="0 0 24 24"
                              >
                                 <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                 />
                              </svg>
                              <p className="text-xs text-gray-400">
                                 {modalDetalhe.paga
                                    ? "Nenhum comprovante anexado"
                                    : "Comprovante disponível após o pagamento"}
                              </p>
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Footer */}
                  <div className="px-5 pb-5">
                     <button
                        onClick={fecharDetalhe}
                        className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
                     >
                        Fechar
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* ════════════════════════════════════════════════════════════════
             Modal Marcar como Paga
         ════════════════════════════════════════════════════════════════ */}
         {modalPagamento && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 sm:p-6">
               <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
                  <div className="p-6">
                     {/* Cabeçalho */}
                     <div className="text-center mb-5">
                        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                           <svg
                              className="w-7 h-7 text-green-600"
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
                        </div>
                        <h2 className="text-base font-bold text-gray-800">
                           Marcar como paga
                        </h2>
                        <p className="text-sm text-gray-500 mt-0.5 font-medium truncate px-4">
                           {modalPagamento.descricao}
                        </p>
                     </div>

                     {erro && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                           {erro}
                        </div>
                     )}

                     <div className="space-y-4">
                        {/* Valor pago */}
                        <div>
                           <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                              Valor pago
                           </label>
                           <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-green-500 transition-colors">
                              <span className="pl-4 pr-2 text-gray-500 font-semibold text-sm shrink-0">
                                 R$
                              </span>
                              <input
                                 type="number"
                                 step="0.01"
                                 value={valorRealInput}
                                 onChange={(e) =>
                                    setValorRealInput(e.target.value)
                                 }
                                 onKeyDown={(e) =>
                                    e.key === "Enter" && confirmarPagamento()
                                 }
                                 className="flex-1 py-3 text-base font-semibold text-gray-800 focus:outline-none"
                                 placeholder="0,00"
                                 autoFocus
                              />
                           </div>
                           {parseFloat(valorRealInput) !==
                              parseFloat(
                                 String(modalPagamento.valor_provisionado),
                              ) && (
                              <p className="text-xs text-amber-600 mt-1">
                                 Previsto:{" "}
                                 {formatarValor(
                                    modalPagamento.valor_provisionado,
                                 )}
                              </p>
                           )}
                        </div>

                        {/* Upload comprovante */}
                        <div>
                           <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                              Comprovante{" "}
                              <span className="text-gray-400 font-normal">
                                 (opcional)
                              </span>
                           </label>
                           <label
                              className={`flex items-center gap-3 px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                                 arquivoComprovante
                                    ? "border-green-400 bg-green-50"
                                    : "border-gray-200 hover:border-gray-300 bg-gray-50"
                              }`}
                           >
                              <input
                                 type="file"
                                 accept="image/*,.pdf"
                                 className="hidden"
                                 onChange={(e) =>
                                    setArquivoComprovante(
                                       e.target.files?.[0] ?? null,
                                    )
                                 }
                              />
                              {arquivoComprovante ? (
                                 <>
                                    <svg
                                       className="w-5 h-5 text-green-600 shrink-0"
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
                                    <div className="flex-1 min-w-0">
                                       <p className="text-xs font-semibold text-green-700 truncate">
                                          {arquivoComprovante.name}
                                       </p>
                                       <p className="text-[10px] text-green-500">
                                          {(
                                             arquivoComprovante.size / 1024
                                          ).toFixed(1)}{" "}
                                          KB
                                       </p>
                                    </div>
                                    <button
                                       type="button"
                                       onClick={(e) => {
                                          e.preventDefault();
                                          setArquivoComprovante(null);
                                       }}
                                       className="text-gray-400 hover:text-red-500 transition-colors"
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
                                             d="M6 18L18 6M6 6l12 12"
                                          />
                                       </svg>
                                    </button>
                                 </>
                              ) : (
                                 <>
                                    <svg
                                       className="w-5 h-5 text-gray-400 shrink-0"
                                       fill="none"
                                       stroke="currentColor"
                                       viewBox="0 0 24 24"
                                    >
                                       <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                       />
                                    </svg>
                                    <p className="text-xs text-gray-400">
                                       Clique para anexar imagem ou PDF
                                    </p>
                                 </>
                              )}
                           </label>
                        </div>
                     </div>

                     {/* Botões */}
                     <div className="flex gap-3 mt-5">
                        <button
                           onClick={fecharModalPagamento}
                           className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
                        >
                           Cancelar
                        </button>
                        <button
                           onClick={confirmarPagamento}
                           disabled={loadingPagamento}
                           className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                           {loadingPagamento ? (
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
                           ) : (
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
                           )}
                           Confirmar pagamento
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* ════════════════════════════════════════════════════════════════
             Modal Desfazer Pagamento
         ════════════════════════════════════════════════════════════════ */}
         {modalDesfazer && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 sm:p-6">
               <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
                  <div className="p-6 text-center">
                     <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg
                           className="w-7 h-7 text-amber-600"
                           fill="none"
                           stroke="currentColor"
                           viewBox="0 0 24 24"
                        >
                           <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                           />
                        </svg>
                     </div>
                     <h2 className="text-base font-bold text-gray-800 mb-1">
                        Desfazer pagamento
                     </h2>
                     <p className="text-sm text-gray-500 mb-1 font-medium truncate px-2">
                        {modalDesfazer.descricao}
                     </p>
                     <p className="text-xs text-gray-400 mb-5">
                        O valor real e comprovante serão removidos e a despesa
                        voltará ao status anterior.
                     </p>
                     <div className="flex gap-3">
                        <button
                           onClick={() => setModalDesfazer(null)}
                           className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
                        >
                           Cancelar
                        </button>
                        <button
                           onClick={confirmarDesfazer}
                           disabled={loadingDesfazer}
                           className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl font-semibold text-sm hover:bg-amber-600 transition-colors disabled:opacity-50"
                        >
                           {loadingDesfazer ? "Desfazendo..." : "Desfazer"}
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* ════════════════════════════════════════════════════════════════
             Modal Cancelar Recorrência
         ════════════════════════════════════════════════════════════════ */}
         {modalCancelar && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 sm:p-6">
               <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
                  <div className="p-6 text-center">
                     <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg
                           className="w-7 h-7 text-orange-500"
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
                     </div>
                     <h2 className="text-base font-bold text-gray-800 mb-1">
                        Cancelar recorrência
                     </h2>
                     <p className="text-sm text-gray-500 mb-1 font-medium truncate px-2">
                        {modalCancelar.descricao}
                     </p>
                     <p className="text-xs text-gray-400 mb-1">
                        A despesa deixará de aparecer a partir de
                     </p>
                     <p className="text-sm font-bold text-orange-600 mb-4">
                        {meses.find((m) => m.valor === mesSelecionado)?.label ??
                           mesSelecionado}
                     </p>
                     <p className="text-xs text-gray-400 mb-5">
                        Os meses anteriores não são afetados. Você pode reativar
                        a qualquer momento.
                     </p>
                     <div className="flex gap-3">
                        <button
                           onClick={() => setModalCancelar(null)}
                           className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
                        >
                           Manter
                        </button>
                        <button
                           onClick={confirmarCancelamento}
                           disabled={loadingCancelar}
                           className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl font-semibold text-sm hover:bg-orange-600 transition-colors disabled:opacity-50"
                        >
                           {loadingCancelar
                              ? "Cancelando..."
                              : "Cancelar recorrência"}
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* ════════════════════════════════════════════════════════════════
             Modal Bloqueio Exclusão (despesa paga)
         ════════════════════════════════════════════════════════════════ */}
         {modalBloqueioExclusao && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 sm:p-6">
               <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
                  <div className="p-6 text-center">
                     <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg
                           className="w-7 h-7 text-red-600"
                           fill="none"
                           stroke="currentColor"
                           viewBox="0 0 24 24"
                        >
                           <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                           />
                        </svg>
                     </div>
                     <h2 className="text-base font-bold text-gray-800 mb-2">
                        Não é possível excluir
                     </h2>
                     <p className="text-sm text-gray-500 mb-1">
                        Esta despesa está marcada como{" "}
                        <span className="font-semibold text-green-600">
                           paga
                        </span>
                        .
                     </p>
                     <p className="text-xs text-gray-400 mb-5">
                        Para excluí-la, primeiro use o botão{" "}
                        <span className="font-medium text-amber-600">
                           ↩ Desfazer pagamento
                        </span>
                        . Isso também removerá o comprovante. Depois a exclusão
                        será liberada.
                     </p>
                     <button
                        onClick={() => setModalBloqueioExclusao(false)}
                        className="w-full py-2.5 bg-gray-800 text-white rounded-xl font-semibold text-sm hover:bg-gray-900 transition-colors"
                     >
                        Entendido
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* ════════════════════════════════════════════════════════════════
             Modal Confirmar Exclusão
         ════════════════════════════════════════════════════════════════ */}
         {modalExcluir && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 sm:p-6">
               <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
                  <div className="p-6 text-center">
                     <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg
                           className="w-7 h-7 text-red-600"
                           fill="none"
                           stroke="currentColor"
                           viewBox="0 0 24 24"
                        >
                           <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                           />
                        </svg>
                     </div>
                     <h2 className="text-base font-bold text-gray-800 mb-1">
                        Excluir despesa
                     </h2>
                     <p className="text-sm text-gray-500 mb-1 font-medium truncate px-2">
                        {modalExcluir.descricao}
                     </p>
                     <p className="text-xs text-gray-400 mb-5">
                        Esta ação não pode ser desfeita. A despesa será removida
                        permanentemente.
                     </p>
                     <div className="flex gap-3">
                        <button
                           onClick={() => setModalExcluir(null)}
                           className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
                        >
                           Cancelar
                        </button>
                        <button
                           onClick={confirmarExclusao}
                           disabled={loadingExcluir}
                           className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                           {loadingExcluir ? "Excluindo..." : "Excluir"}
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         )}
      </DashboardLayout>
   );
}
