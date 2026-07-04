"use client";

// ============================================================================
// External Imports
// ============================================================================
import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

// ============================================================================
// Internal Imports
// ============================================================================
import { useAuth } from "./AuthContext";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Shape of the SocketContext value.
 */
interface SocketContextType {
  /** The Socket.IO client instance, or null if not connected. */
  socket: Socket | null;
  /** Whether the socket is currently connected to the server. */
  isConnected: boolean;
}

// ============================================================================
// Constants
// ============================================================================

/** Base URL for the Socket.IO server. Falls back to localhost:5000 in development. */
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ============================================================================
// Context & Custom Hook
// ============================================================================

/**
 * React Context for the Socket.IO client.
 * @internal
 */
const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

/**
 * Custom hook to access the Socket.IO client context.
 * @returns The current socket instance and connection status.
 * @throws Will not throw; returns the default context value if used outside provider.
 */
export const useSocket = () => useContext(SocketContext);

// ============================================================================
// Provider Component
// ============================================================================

/**
 * SocketProvider Component
 *
 * Provides a Socket.IO client instance to the component tree.
 * - Automatically connects when a valid authentication token and user role are present.
 - Disconnects and cleans up when the user logs out or the component unmounts.
 - Emits role and user identification events after connection.
 - Handles reconnection, errors, and disconnection gracefully.
 *
 * @component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components that will have access to the socket
 * @returns {JSX.Element} The provider wrapping its children
 */
export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // --------------------------------------------------------------------------
  // Hooks & State
  // --------------------------------------------------------------------------
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { token, user, isLoading } = useAuth();

  // Depend on stable primitives, not the `user` object reference. Optimistic
  // profile edits (`updateUser`) produce a new `user` object with the same
  // identity fields; keying the effect on the object would tear down and
  // re-establish the socket on every such change (connection churn).
  const userId = user?._id;
  const userRole = user?.role;
  const userName = user?.name;

  // --------------------------------------------------------------------------
  // Side Effects
  // --------------------------------------------------------------------------

  /**
   * Effect: Establish Socket.IO connection once authentication is fully resolved.
   * Gated on `!isLoading` so we never open a socket mid-verification (before the
   * token/role are known), and re-runs only when the identity primitives change.
   */
  useEffect(() => {
    // Guard: wait until the initial session verification has settled.
    if (isLoading) return;

    // Guard: require both token and user role to connect.
    if (!token || !userRole) {
      console.log("Socket: Missing token or role, skipping connection");
      return;
    }

    // ------------------------------------------------------------------------
    // 1. Create the Socket.IO client instance
    // ------------------------------------------------------------------------
    const newSocket = io(API_URL, {
      auth: {
        token: token,
      },
      query: {
        token: token,
        role: userRole,
        userId: userId, // Include user ID for server-side room management
      },
      transports: ["websocket", "polling"],
      timeout: 10000,
    });

    // ------------------------------------------------------------------------
    // 2. Attach event listeners
    // ------------------------------------------------------------------------

    /** Handle successful connection */
    newSocket.on("connect", () => {
      console.log("Socket: Connected to server with ID:", newSocket.id);
      setIsConnected(true);

      // Notify server about the user's role and identity
      newSocket.emit("set_role", userRole);
      newSocket.emit("user_connected", {
        userId: userId,
        role: userRole,
        name: userName,
      });
    });

    /** Handle disconnection (cleanup, no need to update state if component unmounts) */
    newSocket.on("disconnect", (reason) => {
      console.log("Socket: Disconnected from server. Reason:", reason);
      setIsConnected(false);
    });

    /** Handle connection errors (e.g., network failure, invalid auth) */
    newSocket.on("connect_error", (error) => {
      console.error("Socket: Connection error:", error.message);
      setIsConnected(false);
    });

    /** Handle successful reconnection after a drop */
    newSocket.on("reconnect", (attemptNumber) => {
      console.log("Socket: Reconnected after", attemptNumber, "attempts");
      setIsConnected(true);
      if (userId) {
        newSocket.emit("user_reconnected", userId);
      }
    });

    /** Catch-all error handler */
    newSocket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    // ------------------------------------------------------------------------
    // 3. Store the socket instance in state
    // ------------------------------------------------------------------------
    setSocket(newSocket);

    // ------------------------------------------------------------------------
    // 4. Cleanup function – runs on unmount or before re‑running the effect
    // ------------------------------------------------------------------------
    return () => {
      console.log("Socket: Cleaning up connection");
      if (userId) {
        newSocket.emit("user_disconnected", userId);
      }
      // Remove listeners before disconnecting so a lingering handler can't fire
      // against a torn-down instance, then close the underlying connection to
      // eliminate the leak on unmount / re-run.
      newSocket.removeAllListeners();
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
    // Re-establish only when the token or identity primitives actually change.
  }, [token, isLoading, userId, userRole, userName]);

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------
  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
