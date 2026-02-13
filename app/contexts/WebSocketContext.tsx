"use client";

/**
 * =============================================================================
 * WEB SOCKET CONTEXT PROVIDER
 * =============================================================================
 *
 * Provides a WebSocket‑enhanced interface for real‑time order status updates.
 * This context decouples the actual HTTP PATCH request from the UI and
 * automatically emits a socket event after a successful status change.
 *
 * ✅ Responsibilities:
 *   - Expose an `updateOrderStatus` function that:
 *       a) Performs an authenticated PATCH request to the backend.
 *       b) Emits a `order_status_update` socket event on success.
 *   - Centralise order status update logic.
 *
 * 🚫 Does NOT:
 *   - Manage socket connection lifecycle (delegated to `SocketContext`).
 *   - Store order state locally.
 *
 * 🔗 Dependencies:
 *   - `AuthContext` – provides the authentication token.
 *   - `SocketContext` – provides the socket instance for real‑time events.
 *
 * @module WebSocketProvider
 */

// -----------------------------------------------------------------------------
// IMPORTS
// -----------------------------------------------------------------------------
import { createContext, useContext, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";

// -----------------------------------------------------------------------------
// TYPES & INTERFACES
// -----------------------------------------------------------------------------

/**
 * Shape of the WebSocket context value.
 */
interface WebSocketContextType {
  /**
   * Updates the status of a specific order.
   *
   * @param orderId   - ID of the order to update.
   * @param newStatus - New status value (e.g., "preparing", "ready", "served").
   * @throws          - If token is missing or the request fails.
   */
  updateOrderStatus: (orderId: string, newStatus: string) => Promise<void>;
}

// -----------------------------------------------------------------------------
// CONTEXT CREATION & HOOK
// -----------------------------------------------------------------------------

/**
 * WebSocket context – not meant to be consumed directly.
 * Use `useWebSocket()` hook instead.
 */
const WebSocketContext = createContext<WebSocketContextType>({
  // Default no‑op implementation
  updateOrderStatus: async () => {},
});

/**
 * Custom hook to access the WebSocket context.
 * Must be used within a `<WebSocketProvider>`.
 *
 * @throws {Error} If used outside of its provider (handled by default context).
 * @returns The current WebSocket context value.
 */
export const useWebSocket = () => useContext(WebSocketContext);

// -----------------------------------------------------------------------------
// PROVIDER COMPONENT
// -----------------------------------------------------------------------------

/**
 * WebSocketProvider – wraps a part of the application that needs
 * real‑time order status update capabilities.
 *
 * @param props.children - React child nodes.
 * @returns JSX provider element.
 */
export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // ---------------------------------------------------------------------------
  // CONTEXT DEPENDENCIES
  // ---------------------------------------------------------------------------
  const { token } = useAuth();
  const { socket } = useSocket();

  // ---------------------------------------------------------------------------
  // CONSTANTS
  // ---------------------------------------------------------------------------
  const API_URL = process.env.API_URL || "http://localhost:5000";

  // ---------------------------------------------------------------------------
  // PUBLIC METHODS (memoised with useCallback)
  // ---------------------------------------------------------------------------

  /**
   * Sends an authenticated PATCH request to update an order's status.
   * On success, emits a `order_status_update` socket event to notify
   * all connected clients (kitchen display, waiter interfaces, etc.).
   *
   * @param orderId   - The ID of the order to update.
   * @param newStatus - The target status.
   * @throws          - If token is missing, response is not OK, or network error.
   */
  const updateOrderStatus = useCallback(
    async (orderId: string, newStatus: string) => {
      try {
        // Authentication guard
        if (!token) {
          throw new Error(
            "No authentication token found. Please log in again.",
          );
        }

        // 1. Perform HTTP PATCH to update the order status on the server
        const response = await fetch(
          `${API_URL}/api/orders/${orderId}/status`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status: newStatus }),
          },
        );

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Your session has expired. Please log in again.");
          }
          throw new Error(`Failed to update order status: ${response.status}`);
        }

        // 2. Broadcast the status change via WebSocket (if socket is available)
        if (socket) {
          socket.emit("order_status_update", { orderId, status: newStatus });
        }
      } catch (err) {
        console.error("Error updating order status:", err);
        throw err; // Re‑throw so the caller can handle it (e.g., show toast)
      }
    },
    [token, socket, API_URL], // Re‑create only when these dependencies change
  );

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  return (
    <WebSocketContext.Provider value={{ updateOrderStatus }}>
      {children}
    </WebSocketContext.Provider>
  );
};
