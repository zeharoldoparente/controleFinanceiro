"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { MesaProvider } from "@/contexts/MesaContext";
import { useAlertas } from "@/hooks/useAlertas";
import {
   FULL_TOUR_STEPS,
   getScreenHelpSteps,
   type HelpStep,
} from "./helpTourConfig";

interface DashboardLayoutProps {
   children: React.ReactNode;
}

type TutorialMode = "full" | "screen";

type TutorialSession = {
   mode: TutorialMode;
   stepIndex: number;
   neverShowAgain: boolean;
   sourcePath?: string;
};

const STORAGE_SESSION_KEY = "cf_tutorial_session_v1";
const STORAGE_COMPLETED_KEY = "cf_tutorial_completed_v1";
const STORAGE_DISABLED_KEY = "cf_tutorial_disabled_v1";
const STORAGE_SEEN_KEY = "cf_tutorial_seen_v1";

function clamp(value: number, min: number, max: number) {
   return Math.min(Math.max(value, min), max);
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
   const pathname = usePathname();
   const router = useRouter();

   const [sidebarOpen, setSidebarOpen] = useState(false);
   const [isHovering, setIsHovering] = useState(false);

   const [tutorialOpen, setTutorialOpen] = useState(false);
   const [tutorialMode, setTutorialMode] = useState<TutorialMode | null>(null);
   const [stepIndex, setStepIndex] = useState(0);
   const [neverShowAgain, setNeverShowAgain] = useState(false);
   const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
   const [viewport, setViewport] = useState({ width: 1280, height: 720 });

   useAlertas();

   const toggleSidebar = () => {
      setSidebarOpen(!sidebarOpen);
   };

   const handleHoverChange = (hovering: boolean) => {
      setIsHovering(hovering);
   };

   const screenSteps = useMemo(() => getScreenHelpSteps(pathname), [pathname]);

   const steps = useMemo<HelpStep[]>(() => {
      if (tutorialMode === "full") return FULL_TOUR_STEPS;
      if (tutorialMode === "screen") return screenSteps;
      return [];
   }, [tutorialMode, screenSteps]);

   const currentStep = steps[stepIndex];
   const isLastStep = stepIndex === steps.length - 1;
   const stepMatchesPath = Boolean(
      currentStep &&
      (currentStep.route === "*" || currentStep.route === pathname),
   );

   const persistSession = useCallback((session: TutorialSession | null) => {
      if (typeof window === "undefined") return;

      if (session) {
         localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));
      } else {
         localStorage.removeItem(STORAGE_SESSION_KEY);
      }
   }, []);

   const closeTutorial = useCallback(
      (markCompleted: boolean) => {
         if (typeof window !== "undefined" && tutorialMode === "full") {
            if (markCompleted) {
               localStorage.setItem(STORAGE_COMPLETED_KEY, "1");
            }
            if (neverShowAgain) {
               localStorage.setItem(STORAGE_DISABLED_KEY, "1");
               localStorage.setItem(STORAGE_COMPLETED_KEY, "1");
            }
         }

         setTutorialOpen(false);
         setTutorialMode(null);
         setStepIndex(0);
         setNeverShowAgain(false);
         setTargetRect(null);
         persistSession(null);
      },
      [neverShowAgain, persistSession, tutorialMode],
   );

   const startFullTutorial = useCallback(() => {
      setTutorialMode("full");
      setStepIndex(0);
      setNeverShowAgain(false);
      setTutorialOpen(true);
   }, []);

   const startScreenHelp = useCallback(() => {
      setTutorialMode("screen");
      setStepIndex(0);
      setNeverShowAgain(false);
      setTutorialOpen(true);
   }, []);

   const goNext = useCallback(() => {
      if (!steps.length) return;
      if (isLastStep) {
         closeTutorial(true);
         return;
      }
      setStepIndex((prev) => prev + 1);
   }, [closeTutorial, isLastStep, steps.length]);

   const goPrev = useCallback(() => {
      setStepIndex((prev) => Math.max(0, prev - 1));
   }, []);

   useEffect(() => {
      if (typeof window === "undefined") return;

      const updateViewport = () => {
         setViewport({ width: window.innerWidth, height: window.innerHeight });
      };

      updateViewport();
      window.addEventListener("resize", updateViewport);
      return () => window.removeEventListener("resize", updateViewport);
   }, []);

   useEffect(() => {
      if (typeof window === "undefined") return;

      const rawSession = localStorage.getItem(STORAGE_SESSION_KEY);
      if (rawSession) {
         try {
            const parsed = JSON.parse(rawSession) as TutorialSession;
            const keepScreenSession =
               parsed.mode === "screen" ? parsed.sourcePath === pathname : true;

            if (keepScreenSession) {
               window.setTimeout(() => {
                  setTutorialMode(parsed.mode);
                  setStepIndex(parsed.stepIndex);
                  setNeverShowAgain(Boolean(parsed.neverShowAgain));
                  setTutorialOpen(true);
               }, 0);
               return;
            }
         } catch {
            // Ignora sessao invalida
         }

         localStorage.removeItem(STORAGE_SESSION_KEY);
      }

      const completed = localStorage.getItem(STORAGE_COMPLETED_KEY) === "1";
      const disabled = localStorage.getItem(STORAGE_DISABLED_KEY) === "1";
      const seen = localStorage.getItem(STORAGE_SEEN_KEY) === "1";

      if (!completed && !disabled && !seen) {
         localStorage.setItem(STORAGE_SEEN_KEY, "1");
         window.setTimeout(() => startFullTutorial(), 0);
      }
   }, [pathname, startFullTutorial]);

   useEffect(() => {
      if (!tutorialOpen || !tutorialMode) {
         persistSession(null);
         return;
      }

      const session: TutorialSession = {
         mode: tutorialMode,
         stepIndex,
         neverShowAgain,
         sourcePath: tutorialMode === "screen" ? pathname : undefined,
      };

      persistSession(session);
   }, [
      tutorialOpen,
      tutorialMode,
      stepIndex,
      neverShowAgain,
      pathname,
      persistSession,
   ]);

   useEffect(() => {
      if (!tutorialOpen || !currentStep) return;

      if (currentStep.route !== "*" && currentStep.route !== pathname) {
         router.push(currentStep.route);
      }
   }, [currentStep, pathname, router, tutorialOpen]);

   useEffect(() => {
      if (!tutorialOpen || !currentStep || !stepMatchesPath) {
         return;
      }

      if (!currentStep.selector) {
         return;
      }

      const updateRect = () => {
         const element = document.querySelector(
            currentStep.selector!,
         ) as HTMLElement | null;

         if (!element) {
            setTargetRect(null);
            return;
         }

         const rect = element.getBoundingClientRect();
         if (rect.width <= 0 || rect.height <= 0) {
            setTargetRect(null);
            return;
         }

         setTargetRect(rect);
      };

      updateRect();
      const timeoutId = window.setTimeout(updateRect, 80);

      window.addEventListener("resize", updateRect);
      window.addEventListener("scroll", updateRect, true);

      return () => {
         window.clearTimeout(timeoutId);
         window.removeEventListener("resize", updateRect);
         window.removeEventListener("scroll", updateRect, true);
      };
   }, [currentStep, stepMatchesPath, tutorialOpen]);

   const showCenteredCard =
      !stepMatchesPath ||
      !currentStep ||
      currentStep.placement === "center" ||
      !currentStep.selector ||
      !targetRect;

   const cardStyle = useMemo(() => {
      if (showCenteredCard || !targetRect || !currentStep) {
         return {
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: "min(92vw, 420px)",
         };
      }

      const width = Math.min(400, viewport.width - 24);
      const estimatedHeight = 250;
      const offset = 12;

      const shouldPlaceAbove =
         currentStep.placement === "top" ||
         (targetRect.bottom + estimatedHeight + offset > viewport.height &&
            targetRect.top > estimatedHeight + offset);

      const top = shouldPlaceAbove
         ? clamp(
              targetRect.top - estimatedHeight - offset,
              12,
              viewport.height - 20,
           )
         : clamp(
              targetRect.bottom + offset,
              12,
              viewport.height - estimatedHeight - 12,
           );

      const left = clamp(
         targetRect.left + targetRect.width / 2 - width / 2,
         12,
         viewport.width - width - 12,
      );

      return {
         top,
         left,
         width,
      };
   }, [
      currentStep,
      showCenteredCard,
      targetRect,
      viewport.height,
      viewport.width,
   ]);

   const primaryLabel =
      currentStep?.nextLabel || (isLastStep ? "Concluir" : "Proxima");

   return (
      <MesaProvider>
         <div className="min-h-screen bg-gray-50">
            <Sidebar
               isOpen={sidebarOpen}
               onToggle={toggleSidebar}
               onHoverChange={handleHoverChange}
            />

            <div
               className={`transition-all duration-300 ${
                  isHovering ? "lg:ml-64" : "lg:ml-20"
               }`}
            >
               <Header onMenuToggle={toggleSidebar} sidebarOpen={sidebarOpen} />

               <main className="pt-16 px-4 md:px-6 pb-24 sm:pb-10">
                  {children}
               </main>
            </div>

            {!tutorialOpen && (
               <button
                  onClick={startScreenHelp}
                  title="Ajuda desta tela"
                  aria-label="Ajuda desta tela"
                  className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-40 h-9 w-9 sm:h-11 sm:w-11 rounded-full bg-gray-800 text-white shadow-lg hover:bg-gray-700 transition-colors flex items-center justify-center text-base sm:text-lg font-bold"
               >
                  ?
               </button>
            )}

            {!tutorialOpen && (
               <button
                  onClick={startFullTutorial}
                  title="Reiniciar tutorial completo"
                  aria-label="Reiniciar tutorial completo"
                  className="fixed bottom-4 right-14 sm:bottom-5 sm:right-20 z-40 h-9 sm:h-11 rounded-full bg-green-600 px-3 sm:px-4 text-[11px] sm:text-xs font-semibold shadow-lg hover:bg-green-700 transition-colors"
               >
                  Tutorial
               </button>
            )}

            {tutorialOpen && currentStep && (
               <>
                  <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-[1.5px]" />

                  {stepMatchesPath &&
                     currentStep.selector &&
                     currentStep.placement !== "center" &&
                     targetRect && (
                        <div
                           className="pointer-events-none fixed z-[61] rounded-xl border-2 border-green-400"
                           style={{
                              top: targetRect.top - 6,
                              left: targetRect.left - 6,
                              width: targetRect.width + 12,
                              height: targetRect.height + 12,
                           }}
                        />
                     )}

                  <div
                     className="fixed z-[62] rounded-2xl bg-white p-5 shadow-2xl border border-gray-100"
                     style={cardStyle}
                  >
                     <button
                        onClick={() => closeTutorial(false)}
                        className="absolute right-3 top-3 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        aria-label="Fechar tutorial"
                     >
                        <svg
                           className="h-4 w-4"
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

                     <h3 className="pr-8 text-base font-bold text-gray-800">
                        {currentStep.title}
                     </h3>

                     {!stepMatchesPath && currentStep.route !== "*" ? (
                        <p className="mt-3 text-sm text-gray-500">
                           Abrindo etapa na tela certa...
                        </p>
                     ) : (
                        <>
                           <p className="mt-2 text-sm leading-relaxed text-gray-600">
                              {currentStep.description}
                           </p>
                        </>
                     )}

                     {tutorialMode === "full" && isLastStep && (
                        <label className="mt-4 flex items-start gap-2 text-xs text-gray-600">
                           <input
                              type="checkbox"
                              checked={neverShowAgain}
                              onChange={(event) =>
                                 setNeverShowAgain(event.target.checked)
                              }
                              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                           />
                           <span>Nao exibir tutorial e dicas novamente.</span>
                        </label>
                     )}

                     <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                           {steps.map((step, index) => (
                              <span
                                 key={step.id}
                                 className={`h-1.5 w-1.5 rounded-full ${
                                    index === stepIndex
                                       ? "bg-gray-700"
                                       : "bg-gray-300"
                                 }`}
                              />
                           ))}
                        </div>

                        <div className="flex items-center gap-2">
                           {stepIndex > 0 && (
                              <button
                                 onClick={goPrev}
                                 className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                              >
                                 Voltar
                              </button>
                           )}
                           <button
                              onClick={goNext}
                              className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700"
                           >
                              {primaryLabel}
                           </button>
                        </div>
                     </div>
                  </div>
               </>
            )}
         </div>
      </MesaProvider>
   );
}
