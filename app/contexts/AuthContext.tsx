"use client";

/**
 * =============================================================================
 * AUTHENTICATION CONTEXT PROVIDER
 * =============================================================================
 *
 * Provides global authentication state and methods (login, register, logout)
 * throughout the application.
 *
 * ✅ Responsibilities:
 *   - Manage user session (token, user data) in memory and cookies.
 *   - Persist token in HTTP‑only cookies (via js-cookie).
 *   - Automatically verify existing token on app initialisation.
 *   - Provide a centralised axios instance pre‑configured with authentication
 *     headers and ngrok bypass.
 *
 * 🚫 Does NOT:
 *   - Handle routing or redirects (should be handled by consumer).
 *   - Store sensitive data in localStorage (uses cookies).
 *
 * @module AuthContext
 */

// -----------------------------------------------------------------------------
// IMPORTS
// -----------------------------------------------------------------------------
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import axios, { AxiosInstance } from "axios";
import Cookies from "js-cookie";

// -----------------------------------------------------------------------------
// TYPES & INTERFACES
// -----------------------------------------------------------------------------

/**
 * Authenticated user entity as returned by the backend.
 */
export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

/**
 * Shape of the authentication context value.
 */
interface AuthContextType {
  /** Currently authenticated user, or null if not logged in. */
  user: User | null;
  /** JWT token, or null if not authenticated. */
  token: string | null;
  /** Login with email and password. */
  login: (email: string, password: string) => Promise<void>;
  /** Register a new user account. */
  register: (userData: RegisterData) => Promise<void>;
  /** Logout – clear session and cookies. */
  logout: () => void;
  /** Whether the initial session verification is in progress. */
  isLoading: boolean;
  /** Optimistically update the local user object. */
  updateUser: (userData: Partial<User>) => void;
}

/**
 * Data required for user registration.
 */
interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: string;
  phone?: string;
}

/**
 * Standard API response shape for authentication endpoints.
 */
interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

/**
 * Props for the AuthProvider component.
 */
interface AuthProviderProps {
  children: ReactNode;
}

// -----------------------------------------------------------------------------
// AXIOS INSTANCE FACTORY
// -----------------------------------------------------------------------------

/**
 * Creates a pre‑configured axios instance with:
 * - Base URL from environment variable `NEXT_PUBLIC_API_URL`.
 * - JSON content type header.
 * - `ngrok-skip-browser-warning` header to bypass ngrok interstitial.
 *
 * @returns Configured AxiosInstance.
 */
const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
  });

  return instance;
};

// Singleton axios instance – re‑created on mount to pick up env changes.
let axiosInstance = createAxiosInstance();

// -----------------------------------------------------------------------------
// CONTEXT CREATION & HOOK
// -----------------------------------------------------------------------------

/**
 * Authentication context – not meant to be consumed directly.
 * Use `useAuth()` hook instead.
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Custom hook to access the authentication context.
 * Must be used within an `<AuthProvider>`.
 *
 * @throws {Error} If used outside of AuthProvider.
 * @returns The current authentication context value.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// -----------------------------------------------------------------------------
// PROVIDER COMPONENT
// -----------------------------------------------------------------------------

/**
 * AuthProvider – wraps the application to provide authentication state.
 *
 * @param props - Component props (children).
 * @returns JSX provider element.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ---------------------------------------------------------------------------
  // SIDE EFFECTS
  // ---------------------------------------------------------------------------

  /**
   * Re‑initialise the axios instance on component mount.
   * This ensures the base URL is up‑to‑date (useful for tests or env changes).
   */
  useEffect(() => {
    axiosInstance = createAxiosInstance();
  }, []);

  /**
   * On initial render, check for an existing token in cookies.
   * If present, verify it with the `/api/auth/me` endpoint and restore the session.
   * Otherwise, set loading to false.
   */
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = Cookies.get("token");

      if (savedToken) {
        try {
          // Attach token to axios headers
          axiosInstance.defaults.headers.common["Authorization"] =
            `Bearer ${savedToken}`;

          const response = await axiosInstance.get<{ user: User }>(
            "/api/auth/me",
          );

          setUser(response.data.user);
          setToken(savedToken);
        } catch (error) {
          // Token is invalid or expired – clear it
          console.error("Token verification failed:", error);
          Cookies.remove("token");
          delete axiosInstance.defaults.headers.common["Authorization"];
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  // ---------------------------------------------------------------------------
  // AUTHENTICATION METHODS (memoised with useCallback)
  // ---------------------------------------------------------------------------

  /**
   * Authenticate a user with email and password.
   * On success, stores the token in cookies and axios headers,
   * and updates the user state.
   *
   * @param email    - User's email address.
   * @param password - User's password.
   * @throws {Error} With the error message from the API or a generic one.
   */
  const login = async (email: string, password: string) => {
    try {
      const response = await axiosInstance.post<AuthResponse>(
        "/api/auth/login",
        {
          email,
          password,
        },
      );
      const { token: newToken, user: userData } = response.data;

      // Persist token in cookie (30 days expiry)
      Cookies.set("token", newToken, { expires: 30 });
      // Set default authorization header for all subsequent requests
      axiosInstance.defaults.headers.common["Authorization"] =
        `Bearer ${newToken}`;

      setToken(newToken);
      setUser(userData);
    } catch (error: unknown) {
      throw new Error(
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Login failed",
      );
    }
  };

  /**
   * Register a new user account.
   * On success, automatically logs the user in (token and user data returned).
   *
   * @param userData - Registration details (name, email, password, optional role/phone).
   * @throws {Error} With the error message from the API or a generic one.
   */
  const register = async (userData: RegisterData) => {
    try {
      const response = await axiosInstance.post<AuthResponse>(
        "/api/auth/register",
        userData,
      );
      const { token: newToken, user: newUser } = response.data;

      // Persist token
      Cookies.set("token", newToken, { expires: 30 });
      axiosInstance.defaults.headers.common["Authorization"] =
        `Bearer ${newToken}`;

      setToken(newToken);
      setUser(newUser);
    } catch (error: unknown) {
      throw new Error(
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Register failed",
      );
    }
  };

  /**
   * Log out the current user.
   * Removes token from cookies and axios headers, and clears state.
   */
  const logout = () => {
    Cookies.remove("token");
    delete axiosInstance.defaults.headers.common["Authorization"];
    setToken(null);
    setUser(null);
  };

  /**
   * Optimistically update the local user object without calling the API.
   * Useful for immediate UI feedback (e.g., profile edits).
   *
   * @param userData - Partial user fields to merge into the existing user.
   */
  const updateUser = useCallback((userData: Partial<User>) => {
    setUser((prevUser) => {
      if (!prevUser) return prevUser;
      return { ...prevUser, ...userData };
    });
  }, []);

  // ---------------------------------------------------------------------------
  // CONTEXT VALUE
  // ---------------------------------------------------------------------------
  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    isLoading,
    updateUser,
  };

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
