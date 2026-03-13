import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
const api = axios.create({
   baseURL: API_URL,
});

api.interceptors.request.use((config) => {
   const token = localStorage.getItem("token");
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

export default api;
