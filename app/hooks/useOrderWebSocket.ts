// ============================================================================
// External Imports
// ============================================================================
import { useCallback } from "react";
import Cookies from "js-cookie";

// ============================================================================
// Constants
// ============================================================================

/** Base API URL from environment variables. */
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ============================================================================
// Custom Hook: useOrderWebSocket
// ============================================================================

/**
 * useOrderWebSocket Hook
 *
 * Provides a function to update an order's status via a REST API call.
 * This hook is typically used in WebSocket event handlers to reflect
 * real‑time status changes (e.g., waiter marks order as ready).
 *
 * @param token        - JWT authentication token (from `useAuth`). If null,
 *                       falls back to reading the token from cookies.
 * @param fetchOrders  - Callback to refresh the order list after a successful update.
 * @returns An object containing the `updateOrderStatus` function.
 */
export const useOrderWebSocket = (
  token: string | null,
  fetchOrders: () => void,
) => {
  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------

  /**
   * Updates the status of a specific order by sending a PATCH request
   * to the backend API.
   *
   * @param orderId     - Unique identifier of the order to update.
   * @param newStatus   - The new status value (e.g., "confirmed", "preparing", "ready").
   * @throws {Error}    If authentication fails or the API request is unsuccessful.
   * @returns {Promise<void>}
   */
  const updateOrderStatus = useCallback(
    async (orderId: string, newStatus: string): Promise<void> => {
      try {
        // --------------------------------------------------------------------
        // 1. Obtain a valid authentication token.
        // --------------------------------------------------------------------
        const authToken = token || Cookies.get("token");
        if (!authToken) {
          throw new Error(
            "No authentication token found. Please log in again.",
          );
        }

        // --------------------------------------------------------------------
        // 2. Execute the PATCH request to update the order status.
        // --------------------------------------------------------------------
        const response = await fetch(
          `${API_URL}/api/orders/${orderId}/status`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({ status: newStatus }),
          },
        );

        // --------------------------------------------------------------------
        // 3. Handle HTTP error responses.
        // --------------------------------------------------------------------
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Your session has expired. Please log in again.");
          }
          throw new Error(`Failed to update order status: ${response.status}`);
        }

        // --------------------------------------------------------------------
        // 4. Refresh the order list to reflect the change.
        // --------------------------------------------------------------------
        fetchOrders();
      } catch (err) {
        console.error("Error updating order status:", err);
        throw err; // Re‑throw so the caller can handle it.
      }
    },
    [token, fetchOrders], // Re‑create callback if token or fetchOrders changes.
  );

  return { updateOrderStatus };
};
