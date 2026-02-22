export interface User {
   id: number;
   nome: string;
   email: string;
   emailVerificado: boolean;
   tipoPlano?: "free" | "premium";
}

export interface ApiError {
   response?: {
      data?: {
         message?: string;
      };
      status?: number;
   };
   message?: string;
}

export function isApiError(error: unknown): error is ApiError {
   return typeof error === "object" && error !== null && "response" in error;
}
