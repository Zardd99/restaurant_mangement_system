import { useState, useEffect, useCallback } from "react";
import Cookies from "js-cookie";
import { Order } from "../(waiter_order)/KitchenDisplaySystem";
import { useSocket } from "../contexts/SocketContext";

const API_URL = process.env.API_URL || "http://localhost:5000";

export const useOrders = (token: string | null, filter: string) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { socket } = useSocket();

  const fetchOrders = useCallback(async () => {
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

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (socket) {
      // Set role for this connection using the set_role event
      socket.emit("set_role", "chef");

      socket.on("order_created", (newOrder: Order) => {
        console.log("New order received:", newOrder._id);
        setOrders((prev) => [newOrder, ...prev]);
      });

      socket.on(
        "order_updated",
        (updatedData: { orderId: string; status: string }) => {
          console.log("Order updated:", updatedData.orderId);
          setOrders((prev) =>
            prev.map((order) =>
              order._id === updatedData.orderId
                ? { ...order, status: updatedData.status }
                : order
            )
          );
        }
      );

      socket.on("error", (error) => {
        console.error("Socket error:", error);
      });

      return () => {
        socket.off("order_created");
        socket.off("order_updated");
        socket.off("error");
      };
    }
  }, [socket, setOrders]);

  return { orders, loading, error, fetchOrders };
};
