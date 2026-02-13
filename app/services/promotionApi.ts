// ============================================================================
// Third-Party Libraries
// ============================================================================
import axios from "axios";
import Cookies from "js-cookie";

// ============================================================================
// Environment Configuration
// ============================================================================

/**
 * Base URL for the backend API.
 * Falls back to localhost:5000 if the environment variable is not defined.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ============================================================================
// Axios Instance Configuration
// ============================================================================

/**
 * Pre‑configured Axios instance with:
 * - Base URL pointing to the backend API.
 * - Default JSON content type.
 * - ngrok warning bypass header (useful during development).
 * - Credentials included for cross‑origin requests.
 */
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
  withCredentials: true,
});

// ============================================================================
// Request Interceptor – Authentication Token Attachment
// ============================================================================

/**
 * Attaches the JWT token to every outgoing request.
 * Token is retrieved from (in order of precedence):
 *   1. localStorage
 *   2. sessionStorage
 *   3. Cookies (js-cookie)
 *
 * Only runs on the client side to avoid errors during SSR.
 */
axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
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
  (error) => Promise.reject(error),
);

// ============================================================================
// Response Interceptor – Global Error Handling
// ============================================================================

/**
 * Handles HTTP errors globally.
 * Currently logs 401 (Unauthorized) errors; can be extended to redirect
 * to login or display a notification.
 */
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("Authentication error (401):", error);
      // Optional: redirect to login page, clear invalid tokens, etc.
    }
    return Promise.reject(error);
  },
);

// ============================================================================
// Promotion API – Encapsulated Endpoints
// ============================================================================

/**
 * Promotion API service.
 * Provides methods to interact with the `/api/promotions` endpoints.
 * All methods return a Promise that resolves to the Axios response.
 */
export const promotionApi = {
  /** Fetches all promotions. */
  getAll: () => axiosInstance.get("/api/promotions"),

  /** Fetches a single promotion by its ID. */
  getById: (id: string) => axiosInstance.get(`/api/promotions/${id}`),

  /** Creates a new promotion. */
  create: (data: any) => axiosInstance.post("/api/promotions", data),

  /** Updates an existing promotion. */
  update: (id: string, data: any) =>
    axiosInstance.put(`/api/promotions/${id}`, data),

  /** Deletes a promotion. */
  delete: (id: string) => axiosInstance.delete(`/api/promotions/${id}`),

  /**
   * Validates whether a given menu item has an active applicable promotion.
   * Used before adding an item to the cart to display discount information.
   */
  validateForMenuItem: (menuItemId: string) =>
    axiosInstance.get(`/api/promotions/validate/${menuItemId}`),
};
