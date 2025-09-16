"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import axios from "axios";
import Cookies from "js-cookie";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: string;
  phone?: string;
}

interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize axios defaults
  useEffect(() => {
    axios.defaults.baseURL =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  }, []);

  // Check for existing token on app load
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = Cookies.get("token");

      if (savedToken) {
        try {
          // Verify token and get user data
          axios.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${savedToken}`;

          // Add type annotation for the response
          const response = await axios.get<{ user: User }>("/auth/me");

          setUser(response.data.user);
          setToken(savedToken);
        } catch (error) {
          // Token is invalid, clear it
          console.error("Token verification failed:", error);
          Cookies.remove("token");
          delete axios.defaults.headers.common["Authorization"];
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post<AuthResponse>("/auth/login", {
        email,
        password,
      });
      const { token: newToken, user: userData } = response.data;

      // Set token in cookie and axios headers
      Cookies.set("token", newToken, { expires: 30 });
      axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

      setToken(newToken);
      setUser(userData);
    } catch (error: unknown) {
      throw new Error(
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Login failed"
      );
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const response = await axios.post<AuthResponse>(
        "/auth/register",
        userData
      );
      const { token: newToken, user: newUser } = response.data;

      // Set token in cookie and axios headers
      Cookies.set("token", newToken, { expires: 30 });
      axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

      setToken(newToken);
      setUser(newUser);
    } catch (error: unknown) {
      throw new Error(
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Register failed"
      );
    }
  };

  const logout = () => {
    Cookies.remove("token");
    delete axios.defaults.headers.common["Authorization"];
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
