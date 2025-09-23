"use client";

import { createContext, useContext, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";

interface WebSocketContextType {
  updateOrderStatus: (orderId: string, newStatus: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  updateOrderStatus: () => {},
});

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { token } = useAuth();
  const { socket } = useSocket();
  const API_URL = process.env.API_URL || "http://localhost:5000";

  // Function to update order status
  const updateOrderStatus = useCallback(
    async (orderId: string, newStatus: string) => {
      try {
        if (!token) {
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
              Authorization: `Bearer ${token}`,
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

        // Emit socket event after successful update
        if (socket) {
          socket.emit("order_status_update", { orderId, status: newStatus });
        }
      } catch (err) {
        console.error("Error updating order status:", err);
        throw err;
      }
    },
    [token, socket, API_URL]
  );

  return (
    <WebSocketContext.Provider value={{ updateOrderStatus }}>
      {children}
    </WebSocketContext.Provider>
  );
};
