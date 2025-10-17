import { useCallback } from "react";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const useOrderWebSocket = (
  token: string | null,
  fetchOrders: () => void
) => {
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

        // Refresh orders after update
        fetchOrders();
      } catch (err) {
        console.error("Error updating order status:", err);
        throw err;
      }
    },
    [token, fetchOrders]
  );

  return { updateOrderStatus };
};
