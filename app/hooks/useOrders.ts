"use client";

// ============================================================================
// External Dependencies
// ============================================================================
import { useState, useEffect, useCallback } from "react";
import Cookies from "js-cookie";

// ============================================================================
// Application Types & Contexts
// ============================================================================
import { Order } from "../types/order";
import { useSocket } from "../contexts/SocketContext";

// ============================================================================
// Environment Configuration
// ============================================================================

/** Base URL for the backend API – must be defined in environment variables. */
const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  console.error("NEXT_PUBLIC_API_URL environment variable is not set");
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Checks whether a given string is a valid order status.
 * Used to safely update order status from WebSocket events.
 *
 * @param status - The status string received from the server.
 * @returns True if the status is one of the allowed Order statuses.
 */
const isValidOrderStatus = (status: string): status is Order["status"] => {
  return [
    "pending",
    "confirmed",
    "preparing",
    "ready",
    "served",
    "cancelled",
  ].includes(status);
};

// ============================================================================
// Custom Hook – useOrders
// ============================================================================

/**
 * useOrders – Manages fetching, real‑time updates, and filtering of kitchen orders.
 *
 * - Fetches orders from the backend with an optional status filter.
 * - Listens to WebSocket events for new orders and status updates.
 * - Automatically refetches when the filter or authentication token changes.
 *
 * @param token  - JWT token from authentication context (may be null).
 * @param filter - Status filter string ("all" or a specific order status).
 * @returns An object containing the orders array, loading state, error message,
 *          and a `fetchOrders` function for manual refresh.
 */
export const useOrders = (token: string | null, filter: string) => {
  // --------------------------------------------------------------------------
  // State Declarations
  // --------------------------------------------------------------------------
  /** List of orders currently displayed (filtered by the server). */
  const [orders, setOrders] = useState<Order[]>([]);

  /** Indicates whether the initial fetch is in progress. */
  const [loading, setLoading] = useState(true);

  /** Stores any error message encountered during API requests. */
  const [error, setError] = useState<string | null>(null);

  // --------------------------------------------------------------------------
  // WebSocket Context
  // --------------------------------------------------------------------------
  const { socket } = useSocket();

  // --------------------------------------------------------------------------
  // Data Fetching (Memoized)
  // --------------------------------------------------------------------------

  /**
   * Fetches orders from the API.
   * - Uses the provided `filter` to append a `?status=` query parameter.
   * - Falls back to reading the token from cookies if no token is provided.
   * - Updates `orders`, `loading`, and `error` states accordingly.
   *
   * @returns Promise<void>
   */
  const fetchOrders = useCallback(async () => {
    if (!API_URL) {
      setError("API URL is not configured");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let url = `${API_URL}/api/orders`;
      if (filter !== "all") {
        url += `?status=${filter}`;
      }

      const authToken = token || Cookies.get("token");

      if (!authToken) {
        throw new Error("No authentication token found. Please log in again.");
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Your session has expired. Please log in again.");
        }
        throw new Error(`Failed to fetch orders: ${response.status}`);
      }

      const data = await response.json();
      setOrders(data);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [filter, token]);

  // --------------------------------------------------------------------------
  // Effects
  // --------------------------------------------------------------------------

  /**
   * Effect 1: Fetch orders whenever the filter or token changes.
   * Also runs on mount.
   */
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  /**
   * Effect 2: Set up WebSocket listeners for real‑time order updates.
   * - Announces the user's role as "chef" to the server.
   * - Listens for newly created orders and prepends them to the list.
   * - Listens for order status updates and validates the new status.
   * - Cleans up listeners on unmount.
   */
  useEffect(() => {
    if (socket) {
      // Identify this client as a kitchen user (receives relevant broadcasts)
      socket.emit("set_role", "chef");

      // ----- Incoming new order -----
      socket.on("order_created", (newOrder: Order) => {
        console.log("New order received:", newOrder._id);
        setOrders((prev) => [newOrder, ...prev]);
      });

      // ----- Order status change -----
      socket.on(
        "order_updated",
        (updatedData: { orderId: string; status: string }) => {
          console.log("Order updated:", updatedData.orderId);
          setOrders((prev) =>
            prev.map((order) => {
              if (order._id === updatedData.orderId) {
                // Only apply the update if the status string is valid
                if (isValidOrderStatus(updatedData.status)) {
                  return { ...order, status: updatedData.status };
                } else {
                  console.warn(
                    `Invalid status received: ${updatedData.status}`,
                  );
                  return order; // Ignore invalid status
                }
              }
              return order;
            }),
          );
        },
      );

      // ----- Global error handler -----
      socket.on("error", (error) => {
        console.error("Socket error:", error);
      });

      // ----- Cleanup -----
      return () => {
        socket.off("order_created");
        socket.off("order_updated");
        socket.off("error");
      };
    }
  }, [socket]);

  // --------------------------------------------------------------------------
  // Return Value
  // --------------------------------------------------------------------------
  return { orders, loading, error, fetchOrders };
};
