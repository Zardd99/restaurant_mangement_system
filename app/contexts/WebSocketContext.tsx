import {
  useEffect,
  useState,
  createContext,
  useContext,
  useCallback,
} from "react";
import { useAuth } from "../contexts/AuthContext";
import Cookies from "js-cookie";

const WebSocketContext = createContext<{
  updateOrderStatus: (orderId: string, newStatus: string) => void;
}>({
  updateOrderStatus: () => {},
});

export const useWebSocket = () => useContext(WebSocketContext);

const API_URL = process.env.API_URL || "http://localhost:5000";
const WS_URL = process.env.WS_URL || "ws://localhost:5000";

// WebSocket Provider Component
export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { token } = useAuth();
  const [ws, setWs] = useState<WebSocket | null>(null);

  // Function to update order status
  const updateOrderStatus = useCallback(
    async (orderId: string, newStatus: string) => {
      try {
        const authToken = token || Cookies.get("token");
        if (!authToken) {
          throw new Error(
            "No authentication token found. Please log in again."
          );
        }

        const response = await fetch(
          `${API_URL}/api/orders/${orderId}/status`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({ status: newStatus }),
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Your session has expired. Please log in again.");
          }
          throw new Error(`Failed to update order status: ${response.status}`);
        }
      } catch (err) {
        console.error("Error updating order status:", err);
        throw err;
      }
    },
    [token]
  );

  useEffect(() => {
    if (!token) return;

    const authToken = token || Cookies.get("token");
    const wsUrl = `${WS_URL}/ws?token=${authToken}&role=chef`;
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log("WebSocket connected");
      setWs(websocket);
    };

    websocket.onclose = () => {
      console.log("WebSocket disconnected");
      setWs(null);
    };

    // I'm sorry this error is a pain 😭 not that the web is crushing, this error just exist

    // websocket.onerror = (error) => {
    //   console.error("WebSocket error:", error);
    // };

    return () => {
      websocket.close();
    };
  }, [token]);

  return (
    <WebSocketContext.Provider value={{ updateOrderStatus }}>
      {children}
    </WebSocketContext.Provider>
  );
};
