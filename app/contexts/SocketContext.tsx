"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { token, user } = useAuth();

  useEffect(() => {
    if (!token || !user?.role) {
      console.log("Socket: Missing token or role, skipping connection");
      return;
    }

    const API_URL = process.env.API_URL || "http://localhost:5000";

    const newSocket = io(API_URL, {
      auth: {
        token: token,
      },
      query: {
        token: token,
        role: user.role,
        userId: user._id, // Add user ID to query
      },
      transports: ["websocket", "polling"],
      timeout: 10000,
    });

    newSocket.on("connect", () => {
      console.log("Socket: Connected to server with ID:", newSocket.id);
      setIsConnected(true);

      // Set role and user info after connection
      newSocket.emit("set_role", user.role);
      newSocket.emit("user_connected", {
        userId: user._id,
        role: user.role,
        name: user.name,
      });
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Socket: Disconnected from server. Reason:", reason);
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket: Connection error:", error.message);
      setIsConnected(false);
    });

    newSocket.on("reconnect", (attemptNumber) => {
      console.log("Socket: Reconnected after", attemptNumber, "attempts");
      setIsConnected(true);
      if (user) {
        newSocket.emit("user_reconnected", user._id);
      }
    });

    newSocket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    setSocket(newSocket);

    return () => {
      console.log("Socket: Cleaning up connection");
      if (user) {
        newSocket.emit("user_disconnected", user._id);
      }
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [token, user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
