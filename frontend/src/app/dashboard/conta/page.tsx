"use client";

import {
   useState,
   useRef,
   useEffect,
   useCallback,
   MouseEvent,
   WheelEvent,
   TouchEvent,
} from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import contaService, {
   PerfilUsuario,
   TipoSuporte,
} from "@/services/contaService";

// ── Helpers ───────────────────────────────────────────────────────────────
function Avatar({
   foto_url,
   nome,
   size = "lg",
}: {
   foto_url?: string | null;
   nome: string;
   size?: "sm" | "lg";
}) {
   const sz = size === "lg" ? "w-24 h-24 text-3xl" : "w-10 h-10 text-base";
   if (foto_url) {
      return (
         <img
            src={foto_url}
            alt={nome}
            className={`${sz} rounded-full object-cover ring-4 ring-white shadow-lg`}
         />
      );
   }
   return (
      <div
         className={`${sz} rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold ring-4 ring-white shadow-lg`}
      >
         {nome.charAt(0).toUpperCase()}
      </div>
   );
}

// ── Avatar Cropper Modal ──────────────────────────────────────────────────
interface CropperProps {
   imageSrc: string;
   onConfirm: (croppedBase64: string) => void;
   onCancel: () => void;
}

function AvatarCropper({ imageSrc, onConfirm, onCancel }: CropperProps) {
   const canvasRef = useRef<HTMLCanvasElement>(null);
   const previewRef = useRef<HTMLCanvasElement>(null);
   const imgRef = useRef<HTMLImageElement | null>(null);

   const SIZE = 300; // tamanho do canvas de edição
   const PREVIEW = 96; // tamanho do preview circular

   const [zoom, setZoom] = useState(1);
   const [offset, setOffset] = useState({ x: 0, y: 0 });
   const [dragging, setDragging] = useState(false);
   const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
   const stateRef = useRef({ zoom: 1, offset: { x: 0, y: 0 } });
   const [salvando, setSalvando] = useState(false);

   // Mantém stateRef sincronizado para usar dentro dos event listeners
   useEffect(() => {
      stateRef.current = { zoom, offset };
   }, [zoom, offset]);

   // Carrega a imagem e centraliza
   useEffect(() => {
      const img = new Image();
      img.onload = () => {
         imgRef.current = img;
         // Zoom inicial para cobrir o círculo
         const minZoom = Math.max(SIZE / img.width, SIZE / img.height);
         setZoom(Math.max(1, minZoom));
         setOffset({ x: 0, y: 0 });
      };
      img.src = imageSrc;
   }, [imageSrc]);

   // Redraw do canvas principal
   const draw = useCallback(() => {
      const canvas = canvasRef.current;
      const img = imgRef.current;
      if (!canvas || !img) return;
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, SIZE, SIZE);

      const { zoom: z, offset: o } = stateRef.current;
      const w = img.width * z;
      const h = img.height * z;
      const x = SIZE / 2 - w / 2 + o.x;
      const y = SIZE / 2 - h / 2 + o.y;

      // Fundo escuro
      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, SIZE, SIZE);

      // Imagem
      ctx.drawImage(img, x, y, w, h);

      // Overlay escuro fora do círculo
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, 0, SIZE, SIZE);
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Borda do círculo
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 2, 0, Math.PI * 2);
      ctx.stroke();

      // Atualiza preview
      drawPreview(img, z, o);
   }, []);

   const drawPreview = (
      img: HTMLImageElement,
      z: number,
      o: { x: number; y: number },
   ) => {
      const pc = previewRef.current;
      if (!pc) return;
      const ctx = pc.getContext("2d")!;
      ctx.clearRect(0, 0, PREVIEW, PREVIEW);
      const scale = PREVIEW / SIZE;
      const w = img.width * z * scale;
      const h = img.height * z * scale;
      const x = PREVIEW / 2 - w / 2 + o.x * scale;
      const y = PREVIEW / 2 - h / 2 + o.y * scale;
      ctx.save();
      ctx.beginPath();
      ctx.arc(PREVIEW / 2, PREVIEW / 2, PREVIEW / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, x, y, w, h);
      ctx.restore();
   };

   // Re-draw ao mudar zoom/offset
   useEffect(() => {
      draw();
   }, [zoom, offset, draw]);

   // Drag — mouse
   const onMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
      setDragging(true);
      dragStart.current = {
         x: e.clientX,
         y: e.clientY,
         ox: offset.x,
         oy: offset.y,
      };
   };
   const onMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
      if (!dragging) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setOffset({ x: dragStart.current.ox + dx, y: dragStart.current.oy + dy });
   };
   const onMouseUp = () => setDragging(false);

   // Drag — touch
   const onTouchStart = (e: TouchEvent<HTMLCanvasElement>) => {
      const t = e.touches[0];
      setDragging(true);
      dragStart.current = {
         x: t.clientX,
         y: t.clientY,
         ox: offset.x,
         oy: offset.y,
      };
   };
   const onTouchMove = (e: TouchEvent<HTMLCanvasElement>) => {
      if (!dragging) return;
      const t = e.touches[0];
      setOffset({
         x: dragStart.current.ox + t.clientX - dragStart.current.x,
         y: dragStart.current.oy + t.clientY - dragStart.current.y,
      });
   };

   // Zoom via scroll
   const onWheel = (e: WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      setZoom((prev) => Math.min(5, Math.max(0.5, prev - e.deltaY * 0.001)));
   };

   // Gerar imagem final recortada
   const confirmar = () => {
      const img = imgRef.current;
      if (!img) return;
      setSalvando(true);
      const out = document.createElement("canvas");
      out.width = 400;
      out.height = 400;
      const ctx = out.getContext("2d")!;
      const scale = 400 / SIZE;
      const z = stateRef.current.zoom;
      const o = stateRef.current.offset;
      const w = img.width * z * scale;
      const h = img.height * z * scale;
      const x = 200 - w / 2 + o.x * scale;
      const y = 200 - h / 2 + o.y * scale;

      ctx.save();
      ctx.beginPath();
      ctx.arc(200, 200, 200, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, x, y, w, h);
      ctx.restore();

      const base64 = out.toDataURL("image/jpeg", 0.88);
      onConfirm(base64);
   };

   return (
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
         <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
               <div>
                  <h3 className="text-sm font-bold text-gray-800">
                     Ajustar foto de perfil
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                     Arraste para reposicionar • Role para dar zoom
                  </p>
               </div>
               <button
                  onClick={onCancel}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
               >
                  <svg
                     className="w-4 h-4 text-gray-400"
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

            {/* Canvas de edição */}
            <div className="flex flex-col items-center gap-4 p-5">
               <canvas
                  ref={canvasRef}
                  width={SIZE}
                  height={SIZE}
                  className="rounded-xl cursor-grab active:cursor-grabbing touch-none"
                  style={{ width: "100%", maxWidth: SIZE, aspectRatio: "1" }}
                  onMouseDown={onMouseDown}
                  onMouseMove={onMouseMove}
                  onMouseUp={onMouseUp}
                  onMouseLeave={onMouseUp}
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onMouseUp}
                  onWheel={onWheel}
               />

               {/* Slider de zoom */}
               <div className="w-full flex items-center gap-3">
                  <svg
                     className="w-4 h-4 text-gray-400 shrink-0"
                     fill="none"
                     stroke="currentColor"
                     viewBox="0 0 24 24"
                  >
                     <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                     />
                  </svg>
                  <input
                     type="range"
                     min="0.5"
                     max="5"
                     step="0.01"
                     value={zoom}
                     onChange={(e) => setZoom(parseFloat(e.target.value))}
                     className="flex-1 h-1.5 rounded-full accent-green-600 cursor-pointer"
                  />
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
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10h-6"
                     />
                  </svg>
               </div>

               {/* Preview */}
               <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">Preview:</span>
                  <canvas
                     ref={previewRef}
                     width={PREVIEW}
                     height={PREVIEW}
                     className="rounded-full ring-2 ring-gray-200"
                     style={{ width: PREVIEW, height: PREVIEW }}
                  />
               </div>
            </div>

            {/* Botões */}
            <div className="px-5 pb-5 flex gap-3">
               <button
                  onClick={onCancel}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors"
               >
                  Cancelar
               </button>
               <button
                  onClick={confirmar}
                  disabled={salvando}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
               >
                  {salvando ? (
                     <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Salvando...
                     </>
                  ) : (
                     "Usar esta foto"
                  )}
               </button>
            </div>
         </div>
      </div>
   );
}

function SectionCard({
   title,
   subtitle,
   icon,
   children,
}: {
   title: string;
   subtitle?: string;
   icon: React.ReactNode;
   children: React.ReactNode;
}) {
   return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
         <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center text-green-700">
               {icon}
            </div>
            <div>
               <h2 className="text-sm font-bold text-gray-800">{title}</h2>
               {subtitle && (
                  <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
               )}
            </div>
         </div>
         <div className="px-6 py-6">{children}</div>
      </div>
   );
}

function FeedbackBox({
   type,
   message,
}: {
   type: "success" | "error";
   message: string;
}) {
   if (!message) return null;
   const styles =
      type === "success"
         ? "bg-green-50 border-green-200 text-green-800"
         : "bg-red-50 border-red-200 text-red-800";
   const icon = type === "success" ? "✅" : "❌";
   return (
      <div
         className={`border rounded-xl px-4 py-3 text-sm flex items-center gap-2 ${styles}`}
      >
         <span>{icon}</span>
         <span>{message}</span>
      </div>
   );
}

function InputField({
   label,
   value,
   onChange,
   type = "text",
   placeholder,
   disabled,
   maxLength,
}: {
   label: string;
   value: string;
   onChange?: (v: string) => void;
   type?: string;
   placeholder?: string;
   disabled?: boolean;
   maxLength?: number;
}) {
   return (
      <div>
         <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            {label}
         </label>
         <input
            type={type}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-all"
         />
      </div>
   );
}

// ── Componente principal ──────────────────────────────────────────────────
export default function MinhaContaPage() {
   const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
   const [loading, setLoading] = useState(true);

   // Perfil
   const [nome, setNome] = useState("");
   const [telefone, setTelefone] = useState("");
   const [salvandoPerfil, setSalvandoPerfil] = useState(false);
   const [feedbackPerfil, setFeedbackPerfil] = useState<{
      type: "success" | "error";
      msg: string;
   } | null>(null);

   // Foto
   const fileRef = useRef<HTMLInputElement>(null);
   const [salvandoFoto, setSalvandoFoto] = useState(false);
   const [cropperSrc, setCropperSrc] = useState<string | null>(null);
   const [feedbackFoto, setFeedbackFoto] = useState<{
      type: "success" | "error";
      msg: string;
   } | null>(null);

   // Senha
   const [solicitandoSenha, setSolicitandoSenha] = useState(false);
   const [feedbackSenha, setFeedbackSenha] = useState<{
      type: "success" | "error";
      msg: string;
   } | null>(null);

   // Preferências
   const [moeda, setMoeda] = useState("BRL");
   const [formatoData, setFormatoData] = useState("DD/MM/YYYY");
   const [notifEmail, setNotifEmail] = useState(true);
   const [salvandoPrefs, setSalvandoPrefs] = useState(false);
   const [feedbackPrefs, setFeedbackPrefs] = useState<{
      type: "success" | "error";
      msg: string;
   } | null>(null);

   // Suporte
   const [tipoSuporte, setTipoSuporte] = useState<TipoSuporte>("duvida");
   const [assunto, setAssunto] = useState("");
   const [mensagem, setMensagem] = useState("");
   const [enviandoSuporte, setEnviandoSuporte] = useState(false);
   const [feedbackSuporte, setFeedbackSuporte] = useState<{
      type: "success" | "error";
      msg: string;
   } | null>(null);

   // Carregar perfil
   useEffect(() => {
      contaService
         .getPerfil()
         .then((p) => {
            setPerfil(p);
            setNome(p.nome);
            setTelefone(p.telefone || "");
         })
         .catch(() => {})
         .finally(() => setLoading(false));
   }, []);

   // ── Salvar perfil ─────────────────────────────────────────
   const salvarPerfil = async () => {
      if (!nome.trim()) return;
      setSalvandoPerfil(true);
      setFeedbackPerfil(null);
      try {
         const res = await contaService.atualizarPerfil({
            nome: nome.trim(),
            telefone,
         });
         setPerfil(res.usuario);
         setFeedbackPerfil({
            type: "success",
            msg: "Perfil atualizado com sucesso!",
         });
      } catch {
         setFeedbackPerfil({
            type: "error",
            msg: "Erro ao salvar. Tente novamente.",
         });
      } finally {
         setSalvandoPerfil(false);
         setTimeout(() => setFeedbackPerfil(null), 4000);
      }
   };

   // ── Upload de foto ────────────────────────────────────────
   // Abre o cropper ao selecionar arquivo
   const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      // Resetar input para permitir re-seleção do mesmo arquivo
      e.target.value = "";
      setFeedbackFoto(null);
      const reader = new FileReader();
      reader.onload = () => setCropperSrc(reader.result as string);
      reader.readAsDataURL(file);
   };

   // Chamado pelo Cropper após o usuário ajustar e confirmar
   const salvarFotoCropada = async (base64: string) => {
      setCropperSrc(null);
      setSalvandoFoto(true);
      setFeedbackFoto(null);
      try {
         const res = await contaService.atualizarFoto(base64);
         setPerfil((prev) =>
            prev ? { ...prev, foto_url: res.foto_url } : prev,
         );
         setFeedbackFoto({ type: "success", msg: "Foto atualizada!" });
      } catch {
         setFeedbackFoto({ type: "error", msg: "Erro ao enviar foto." });
      } finally {
         setSalvandoFoto(false);
         setTimeout(() => setFeedbackFoto(null), 4000);
      }
   };

   const removerFoto = async () => {
      setSalvandoFoto(true);
      try {
         await contaService.removerFoto();
         setPerfil((prev) => (prev ? { ...prev, foto_url: null } : prev));
         setFeedbackFoto({ type: "success", msg: "Foto removida." });
      } catch {
         setFeedbackFoto({ type: "error", msg: "Erro ao remover foto." });
      } finally {
         setSalvandoFoto(false);
         setTimeout(() => setFeedbackFoto(null), 4000);
      }
   };

   // ── Solicitar troca de senha ──────────────────────────────
   const solicitarSenha = async () => {
      setSolicitandoSenha(true);
      setFeedbackSenha(null);
      try {
         const res = await contaService.solicitarTrocaSenha();
         setFeedbackSenha({ type: "success", msg: res.message });
      } catch {
         setFeedbackSenha({
            type: "error",
            msg: "Erro ao enviar email. Tente novamente.",
         });
      } finally {
         setSolicitandoSenha(false);
      }
   };

   // ── Salvar preferências ───────────────────────────────────
   const salvarPrefs = async () => {
      setSalvandoPrefs(true);
      setFeedbackPrefs(null);
      try {
         await contaService.atualizarPreferencias({
            moeda,
            formato_data: formatoData,
            notificacoes_email: notifEmail,
         });
         setFeedbackPrefs({ type: "success", msg: "Preferências salvas!" });
      } catch {
         setFeedbackPrefs({
            type: "error",
            msg: "Erro ao salvar preferências.",
         });
      } finally {
         setSalvandoPrefs(false);
         setTimeout(() => setFeedbackPrefs(null), 4000);
      }
   };

   // ── Enviar suporte ────────────────────────────────────────
   const enviarSuporte = async () => {
      if (!assunto.trim() || !mensagem.trim()) return;
      setEnviandoSuporte(true);
      setFeedbackSuporte(null);
      try {
         const res = await contaService.enviarSuporte({
            tipo: tipoSuporte,
            assunto: assunto.trim(),
            mensagem: mensagem.trim(),
         });
         setFeedbackSuporte({ type: "success", msg: res.message });
         setAssunto("");
         setMensagem("");
         setTipoSuporte("duvida");
      } catch (err: any) {
         setFeedbackSuporte({
            type: "error",
            msg: err?.response?.data?.error || "Erro ao enviar mensagem.",
         });
      } finally {
         setEnviandoSuporte(false);
         setTimeout(() => setFeedbackSuporte(null), 6000);
      }
   };

   if (loading) {
      return (
         <DashboardLayout>
            <div className="flex items-center justify-center h-64">
               <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
         </DashboardLayout>
      );
   }

   return (
      <DashboardLayout>
         <div className="max-w-2xl mx-auto space-y-6 pb-10">
            {/* Cabeçalho */}
            <div>
               <h1 className="text-xl font-bold text-gray-900">Minha Conta</h1>
               <p className="text-sm text-gray-500 mt-0.5">
                  Gerencie seu perfil, segurança e preferências
               </p>
            </div>

            {/* ── SEÇÃO: PERFIL ───────────────────────────── */}
            <SectionCard
               title="Perfil"
               subtitle="Suas informações pessoais"
               icon={
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
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                     />
                  </svg>
               }
            >
               {/* Avatar */}
               <div className="flex items-center gap-5 mb-6 pb-6 border-b border-gray-50">
                  <div className="relative">
                     <Avatar
                        foto_url={perfil?.foto_url}
                        nome={perfil?.nome || "U"}
                        size="lg"
                     />
                     {salvandoFoto && (
                        <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                           <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                     )}
                  </div>
                  <div className="flex flex-col gap-2">
                     <p className="text-sm font-semibold text-gray-700">
                        {perfil?.nome}
                     </p>
                     <div className="flex gap-2">
                        <button
                           onClick={() => fileRef.current?.click()}
                           disabled={salvandoFoto}
                           className="px-3 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                           {perfil?.foto_url ? "Trocar foto" : "Adicionar foto"}
                        </button>
                        {perfil?.foto_url && (
                           <button
                              onClick={removerFoto}
                              disabled={salvandoFoto}
                              className="px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                           >
                              Remover
                           </button>
                        )}
                     </div>
                     <p className="text-[10px] text-gray-400">
                        JPG, PNG ou WebP • Máximo 2MB
                     </p>
                  </div>
                  <input
                     ref={fileRef}
                     type="file"
                     accept="image/*"
                     className="hidden"
                     onChange={handleFoto}
                  />
               </div>
               {feedbackFoto && (
                  <div className="mb-4">
                     <FeedbackBox
                        type={feedbackFoto.type}
                        message={feedbackFoto.msg}
                     />
                  </div>
               )}

               {/* Campos */}
               <div className="space-y-4">
                  <InputField
                     label="Nome completo"
                     value={nome}
                     onChange={setNome}
                     placeholder="Seu nome"
                     maxLength={100}
                  />
                  <div>
                     <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Email
                     </label>
                     <div className="flex items-center gap-2">
                        <input
                           type="email"
                           value={perfil?.email || ""}
                           disabled
                           className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
                        />
                        <span className="text-[10px] font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-lg whitespace-nowrap">
                           ✓ Verificado
                        </span>
                     </div>
                  </div>
                  <InputField
                     label="Telefone"
                     value={telefone}
                     onChange={setTelefone}
                     placeholder="(11) 99999-9999"
                     maxLength={20}
                  />

                  {feedbackPerfil && (
                     <FeedbackBox
                        type={feedbackPerfil.type}
                        message={feedbackPerfil.msg}
                     />
                  )}

                  <div className="flex justify-end pt-2">
                     <button
                        onClick={salvarPerfil}
                        disabled={salvandoPerfil || !nome.trim()}
                        className="px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                     >
                        {salvandoPerfil ? (
                           <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Salvando...
                           </>
                        ) : (
                           "Salvar perfil"
                        )}
                     </button>
                  </div>
               </div>
            </SectionCard>

            {/* ── SEÇÃO: SEGURANÇA ─────────────────────────── */}
            <SectionCard
               title="Segurança"
               subtitle="Gerencie sua senha com segurança"
               icon={
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
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                     />
                  </svg>
               }
            >
               <div className="flex items-start gap-4 p-4 bg-amber-50 border border-amber-100 rounded-xl mb-5">
                  <svg
                     className="w-5 h-5 text-amber-500 mt-0.5 shrink-0"
                     fill="none"
                     stroke="currentColor"
                     viewBox="0 0 24 24"
                  >
                     <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                     />
                  </svg>
                  <div>
                     <p className="text-sm font-semibold text-amber-800">
                        Alteração via email
                     </p>
                     <p className="text-xs text-amber-700 mt-1">
                        Por segurança, enviaremos um link de confirmação para{" "}
                        <strong>{perfil?.email}</strong>. Clique no link para
                        criar sua nova senha. O link expira em 1 hora.
                     </p>
                  </div>
               </div>

               {feedbackSenha && (
                  <div className="mb-4">
                     <FeedbackBox
                        type={feedbackSenha.type}
                        message={feedbackSenha.msg}
                     />
                  </div>
               )}

               <div className="flex justify-between items-center">
                  <div>
                     <p className="text-sm font-semibold text-gray-700">
                        Alterar senha
                     </p>
                     <p className="text-xs text-gray-400 mt-0.5">
                        Você receberá um email com o link de confirmação
                     </p>
                  </div>
                  <button
                     onClick={solicitarSenha}
                     disabled={solicitandoSenha}
                     className="px-4 py-2.5 bg-gray-800 text-white text-sm font-semibold rounded-xl hover:bg-gray-900 disabled:opacity-50 transition-colors flex items-center gap-2 shrink-0"
                  >
                     {solicitandoSenha ? (
                        <>
                           <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                           Enviando...
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
                                 d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                           </svg>
                           Enviar link
                        </>
                     )}
                  </button>
               </div>
            </SectionCard>

            {/* ── SEÇÃO: PREFERÊNCIAS ──────────────────────── */}
            <SectionCard
               title="Preferências"
               subtitle="Personalize sua experiência"
               icon={
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
                        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                     />
                  </svg>
               }
            >
               <div className="space-y-5">
                  {/* Moeda */}
                  <div>
                     <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Moeda padrão
                     </label>
                     <select
                        value={moeda}
                        onChange={(e) => setMoeda(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                     >
                        <option value="BRL">🇧🇷 Real Brasileiro (R$)</option>
                        <option value="USD">🇺🇸 Dólar Americano (US$)</option>
                        <option value="EUR">🇪🇺 Euro (€)</option>
                        <option value="GBP">🇬🇧 Libra Esterlina (£)</option>
                     </select>
                  </div>

                  {/* Formato de data */}
                  <div>
                     <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Formato de data
                     </label>
                     <select
                        value={formatoData}
                        onChange={(e) => setFormatoData(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                     >
                        <option value="DD/MM/YYYY">
                           DD/MM/AAAA — ex: 27/02/2026
                        </option>
                        <option value="MM/DD/YYYY">
                           MM/DD/AAAA — ex: 02/27/2026
                        </option>
                        <option value="YYYY-MM-DD">
                           AAAA-MM-DD — ex: 2026-02-27
                        </option>
                     </select>
                  </div>

                  {/* Notificações por email */}
                  <div className="flex items-center justify-between py-1">
                     <div>
                        <p className="text-sm font-semibold text-gray-700">
                           Notificações por email
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                           Receba alertas de vencimentos e convites por email
                        </p>
                     </div>
                     <button
                        onClick={() => setNotifEmail((prev) => !prev)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${notifEmail ? "bg-green-500" : "bg-gray-300"}`}
                     >
                        <span
                           className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifEmail ? "translate-x-5" : "translate-x-0"}`}
                        />
                     </button>
                  </div>

                  {feedbackPrefs && (
                     <FeedbackBox
                        type={feedbackPrefs.type}
                        message={feedbackPrefs.msg}
                     />
                  )}

                  <div className="flex justify-end pt-1">
                     <button
                        onClick={salvarPrefs}
                        disabled={salvandoPrefs}
                        className="px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                     >
                        {salvandoPrefs ? (
                           <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Salvando...
                           </>
                        ) : (
                           "Salvar preferências"
                        )}
                     </button>
                  </div>
               </div>
            </SectionCard>

            {/* ── SEÇÃO: MINHA CONTA (info) ─────────────────── */}
            <SectionCard
               title="Informações da conta"
               subtitle="Detalhes do seu plano e cadastro"
               icon={
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
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                     />
                  </svg>
               }
            >
               <div className="space-y-3">
                  <div className="flex justify-between items-center py-2.5 border-b border-gray-50">
                     <span className="text-sm text-gray-500">Plano atual</span>
                     <span className="text-sm font-semibold text-gray-800 capitalize flex items-center gap-1.5">
                        <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                        {perfil?.tipo_plano === "free"
                           ? "Gratuito"
                           : perfil?.tipo_plano}
                     </span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 border-b border-gray-50">
                     <span className="text-sm text-gray-500">Email</span>
                     <span className="text-sm font-semibold text-gray-800">
                        {perfil?.email}
                     </span>
                  </div>
                  <div className="flex justify-between items-center py-2.5">
                     <span className="text-sm text-gray-500">Membro desde</span>
                     <span className="text-sm font-semibold text-gray-800">
                        {perfil?.created_at
                           ? new Date(perfil.created_at).toLocaleDateString(
                                "pt-BR",
                                {
                                   day: "2-digit",
                                   month: "long",
                                   year: "numeric",
                                },
                             )
                           : "—"}
                     </span>
                  </div>
               </div>
            </SectionCard>

            {/* ── SEÇÃO: SUPORTE ───────────────────────────── */}
            <SectionCard
               title="Suporte & Feedback"
               subtitle="Envie dúvidas, sugestões ou reclamações"
               icon={
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
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                     />
                  </svg>
               }
            >
               <div className="space-y-4">
                  {/* Tipo */}
                  <div>
                     <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Tipo de mensagem
                     </label>
                     <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {(
                           [
                              { value: "duvida", label: "❓ Dúvida" },
                              { value: "sugestao", label: "💡 Sugestão" },
                              { value: "reclamacao", label: "😠 Reclamação" },
                              { value: "solicitacao", label: "📋 Solicitação" },
                           ] as const
                        ).map((opt) => (
                           <button
                              key={opt.value}
                              onClick={() => setTipoSuporte(opt.value)}
                              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                                 tipoSuporte === opt.value
                                    ? "bg-green-600 text-white border-green-600 shadow-sm"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-green-300"
                              }`}
                           >
                              {opt.label}
                           </button>
                        ))}
                     </div>
                  </div>

                  <InputField
                     label="Assunto"
                     value={assunto}
                     onChange={setAssunto}
                     placeholder="Descreva brevemente o assunto"
                     maxLength={100}
                  />

                  <div>
                     <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Mensagem{" "}
                        <span className="text-gray-300 font-normal normal-case">
                           ({mensagem.length}/1000)
                        </span>
                     </label>
                     <textarea
                        value={mensagem}
                        onChange={(e) => setMensagem(e.target.value)}
                        placeholder="Descreva com detalhes sua dúvida, sugestão ou problema. Quanto mais informações você fornecer, mais rápido conseguimos ajudar."
                        maxLength={1000}
                        rows={5}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none transition-all"
                     />
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-3">
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
                           d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                     </svg>
                     Prazo de resposta: até 3 dias úteis. Respondemos pelo email
                     da sua conta.
                  </div>

                  {feedbackSuporte && (
                     <FeedbackBox
                        type={feedbackSuporte.type}
                        message={feedbackSuporte.msg}
                     />
                  )}

                  <div className="flex justify-end pt-1">
                     <button
                        onClick={enviarSuporte}
                        disabled={
                           enviandoSuporte ||
                           !assunto.trim() ||
                           mensagem.trim().length < 20
                        }
                        className="px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                     >
                        {enviandoSuporte ? (
                           <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Enviando...
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
                                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                 />
                              </svg>
                              Enviar mensagem
                           </>
                        )}
                     </button>
                  </div>
               </div>
            </SectionCard>
         </div>
         {/* ── Modal Cropper de Foto ── */}
         {cropperSrc && (
            <AvatarCropper
               imageSrc={cropperSrc}
               onConfirm={salvarFotoCropada}
               onCancel={() => setCropperSrc(null)}
            />
         )}
      </DashboardLayout>
   );
}
