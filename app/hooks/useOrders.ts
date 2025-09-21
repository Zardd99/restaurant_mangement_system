import { useState, useEffect, useCallback } from "react";
import Cookies from "js-cookie";
import { Order } from "../(waiter_order)/KitchenDisplaySystem";
import { useSocket } from "../contexts/SocketContext";

const API_URL = process.env.API_URL || "http://localhost:5000";
const WS_URL = process.env.WS_URL || "ws://localhost:5000";

export const useOrders = (token: string | null, filter: string) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
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
    if (!token) return;

    const authToken = token || Cookies.get("token");
    const wsUrl = `${WS_URL}/ws?token=${authToken}&role=chef`;
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log("WebSocket connected for orders");
      setWs(websocket);
    };

    websocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        switch (message.type) {
          case "order_created":
            // Add new order to the list
            setOrders((prev) => [message.order, ...prev]);
            break;
          case "orders_updated":
            // Update existing order status
            setOrders((prev) =>
              prev.map((order) =>
                order._id === message.orderId
                  ? { ...order, status: message.status }
                  : order
              )
            );
            break;
          default:
            break;
        }
      } catch (err) {
        console.error("Error processing WebSocket message:", err);
      }
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
