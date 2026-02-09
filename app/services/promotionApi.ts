import axios from "axios";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
  withCredentials: true,
});

// Add request interceptor to attach token
axiosInstance.interceptors.request.use(
  (config) => {
    // Only run on client side
    if (typeof window !== "undefined") {
      // Try to get token from localStorage first, then sessionStorage, then cookies
      const token =
        localStorage.getItem("token") ||
        sessionStorage.getItem("token") ||
        Cookies.get("token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Add response interceptor to handle errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      console.error("Authentication error:", error);
      // You can redirect to login or show a message
    }
    return Promise.reject(error);
  },
);

const promotionApi = {
  getAll: () => axiosInstance.get("/api/promotions"),
  getById: (id: string) => axiosInstance.get(`/api/promotions/${id}`),
  create: (data: any) => axiosInstance.post("/api/promotions", data),
  update: (id: string, data: any) =>
    axiosInstance.put(`/api/promotions/${id}`, data),
  delete: (id: string) => axiosInstance.delete(`/api/promotions/${id}`),
  validateForMenuItem: (menuItemId: string) =>
    axiosInstance.get(`/api/promotions/validate/${menuItemId}`),
};

export { promotionApi };
