import axios from "axios";
import {
   getValidToken,
   redirectToLoginWithSessionExpired,
} from "@/lib/authSession";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
const api = axios.create({
   baseURL: API_URL,
});

api.interceptors.request.use((config) => {
   const token = getValidToken();
   if (token) {
      config.headers.Authorization = `Bearer ${token}`;
   }

   if (typeof FormData !== "undefined" && config.data instanceof FormData) {
      if (typeof config.headers?.delete === "function") {
         config.headers.delete("Content-Type");
      } else if (config.headers) {
         delete config.headers["Content-Type"];
      }
   }

   return config;
});

api.interceptors.response.use(
   (response) => response,
   (error) => {
      const status = error.response?.status;
      const requestUrl = String(error.config?.url || "");
      const isLoginRequest = requestUrl.includes("/auth/login");

      if (status === 401 && !isLoginRequest) {
         redirectToLoginWithSessionExpired();
      }

      return Promise.reject(error);
   },
);

export default api;
