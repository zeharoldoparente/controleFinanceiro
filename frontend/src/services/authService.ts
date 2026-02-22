import api from "./api";

interface LoginData {
   email: string;
   senha: string;
}

interface RegisterData {
   nome: string;
   email: string;
   senha: string;
}

interface LoginResponse {
   message: string;
   token: string;
   user: {
      id: number;
      nome: string;
      email: string;
      emailVerificado: boolean;
   };
}

class AuthService {
   async login(data: LoginData): Promise<LoginResponse> {
      const response = await api.post("/auth/login", data);

      if (response.data.token) {
         localStorage.setItem("token", response.data.token);
         localStorage.setItem("user", JSON.stringify(response.data.user));
      }

      return response.data;
   }

   async register(data: RegisterData) {
      const response = await api.post("/auth/register", data);
      return response.data;
   }

   logout() {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
   }

   isAuthenticated(): boolean {
      return !!localStorage.getItem("token");
   }

   getUser() {
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user) : null;
   }

   async solicitarRecuperacaoSenha(email: string) {
      const response = await api.post("/auth/solicitar-recuperacao-senha", {
         email,
      });
      return response.data;
   }

   async resetarSenha(token: string, novaSenha: string) {
      const response = await api.post(`/auth/resetar-senha/${token}`, {
         novaSenha,
      });
      return response.data;
   }
}

const authService = new AuthService();
export default authService;
