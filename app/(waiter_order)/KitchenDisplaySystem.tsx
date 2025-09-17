"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import Cookies from "js-cookie";

interface OrderItem {
  menuItem: {
    _id: string;
    name: string;
    price: number;
  };
  quantity: number;
  specialInstructions?: string;
  price: number;
}

interface Order {
  _id: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  customer: {
    _id: string;
    name: string;
    email: string;
  };
  tableNumber?: number;
  orderType: string;
  orderDate: string;
  createdAt: string;
  updatedAt: string;
}

const KitchenDisplaySystem = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const { user, token } = useAuth();
  const isConnecting = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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
  }, [API_URL, filter, token]);

  const connectWebSocket = useCallback(() => {
    if (isConnecting.current || ws.current?.readyState === WebSocket.OPEN)
      return;

    isConnecting.current = true;

    // Clear existing connection and timeouts
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    const authToken = token || Cookies.get("token");
    if (!authToken) {
      setError("No authentication token found. Please log in again.");
      isConnecting.current = false;
      return;
    }

    try {
      // Handle different environments
      let wsUrl;
      if (API_URL.includes("localhost") || API_URL.includes("127.0.0.1")) {
        wsUrl = `ws://localhost:5000/ws?role=chef&token=${encodeURIComponent(
          authToken
        )}`;
      } else {
        // For production, use wss and the actual API URL
        const url = new URL(API_URL);
        const protocol = url.protocol === "https:" ? "wss:" : "ws:";
        wsUrl = `${protocol}//${
          url.host
        }/ws?role=chef&token=${encodeURIComponent(authToken)}`;
      }

      console.log("Connecting to WebSocket:", wsUrl);
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log("WebSocket connected successfully");
        isConnecting.current = false;
        setError(null);
        reconnectAttempts.current = 0;
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (
            message.type === "orders_updated" ||
            message.type === "order_created"
          ) {
            fetchOrders();
          }
        } catch (err) {
          console.log("Received non-JSON message:", event.data);
        }
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        isConnecting.current = false;
      };

      ws.current.onclose = (event) => {
        console.log("WebSocket disconnected:", event.code, event.reason);
        isConnecting.current = false;

        if (
          event.code !== 1000 &&
          reconnectAttempts.current < maxReconnectAttempts
        ) {
          reconnectAttempts.current += 1;
          const delay = Math.min(1000 * reconnectAttempts.current, 10000);

          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, delay);
        }
      };
    } catch (err) {
      console.error("Error creating WebSocket:", err);
      isConnecting.current = false;
    }
  }, [API_URL, token, fetchOrders]);

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

        // Notify via WebSocket if connected
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
          ws.current.send(
            JSON.stringify({
              type: "order_status_update",
              orderId,
              status: newStatus,
            })
          );
        }

        // Refresh orders after update
        fetchOrders();
      } catch (err) {
        console.error("Error updating order status:", err);
        setError(err instanceof Error ? err.message : "Failed to update order");
      }
    },
    [API_URL, token, fetchOrders]
  );

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (!token) return;

    // Use a self-contained connect function within useEffect
    const connect = () => {
      // Your existing connectWebSocket logic goes here
      if (isConnecting.current || ws.current?.readyState === WebSocket.OPEN) {
        return;
      }

      isConnecting.current = true;
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      let wsUrl;
      const authToken = token || Cookies.get("token");
      if (!authToken) {
        setError("No authentication token found. Please log in again.");
        isConnecting.current = false;
        return;
      }

      try {
        if (API_URL.includes("localhost") || API_URL.includes("127.0.0.1")) {
          wsUrl = `ws://localhost:5000/ws?role=chef&token=${encodeURIComponent(
            authToken
          )}`;
        } else {
          const url = new URL(API_URL);
          const protocol = url.protocol === "https:" ? "wss:" : "ws:";
          wsUrl = `${protocol}//${
            url.host
          }/ws?role=chef&token=${encodeURIComponent(authToken)}`;
        }

        console.log("Connecting to WebSocket:", wsUrl);
        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
          console.log("WebSocket connected successfully");
          isConnecting.current = false;
          setError(null);
          reconnectAttempts.current = 0;
        };

        // This handler will now get the latest fetchOrders function
        ws.current.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            if (message.type === "orders_updated") {
              fetchOrders(); // This will always be the latest version
            }
          } catch (err) {
            console.log("Received non-JSON message:", event.data);
          }
        };

        ws.current.onerror = (error) => {
          // I hate this error 💀
          // console.error("WebSocket error:", error);
          isConnecting.current = false;
        };

        ws.current.onclose = (event) => {
          console.log("WebSocket disconnected:", event.code, event.reason);
          isConnecting.current = false;
          if (
            event.code !== 1000 &&
            reconnectAttempts.current < maxReconnectAttempts
          ) {
            reconnectAttempts.current += 1;
            const delay = Math.min(1000 * reconnectAttempts.current, 10000);
            reconnectTimeoutRef.current = setTimeout(connect, delay);
          }
        };
      } catch (err) {
        console.error("Error creating WebSocket:", err);
        isConnecting.current = false;
      }
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (ws.current) {
        ws.current.close();
      }
      isConnecting.current = false;
    };
  }, [fetchOrders, token]);

  // const updateOrderStatus = async (orderId: string, newStatus: string) => {
  //   try {
  //     const authToken = token || Cookies.get("token");
  //     if (!authToken) {
  //       throw new Error("No authentication token found. Please log in again.");
  //     }

  //     const response = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
  //       method: "PATCH",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${authToken}`,
  //       },
  //       body: JSON.stringify({ status: newStatus }),
  //     });

  //     if (!response.ok) {
  //       if (response.status === 401) {
  //         throw new Error("Your session has expired. Please log in again.");
  //       }
  //       throw new Error(`Failed to update order status: ${response.status}`);
  //     }

  //     if (ws.current && ws.current.readyState === WebSocket.OPEN) {
  //       ws.current.send(
  //         JSON.stringify({
  //           type: "order_status_update",
  //           orderId,
  //           status: newStatus,
  //         })
  //       );
  //     }
  //   } catch (err) {
  //     console.error("Error updating order status:", err);
  //     setError(err instanceof Error ? err.message : "Failed to update order");
  //     if (err instanceof Error && err.message.includes("session has expired")) {
  //       logout();
  //       window.location.href = "/login";
  //     }
  //   }
  // };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "preparing":
        return "bg-orange-100 text-orange-800";
      case "ready":
        return "bg-green-100 text-green-800";
      case "served":
        return "bg-purple-100 text-purple-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatOrderDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex space-x-4 mb-6">
          {["all", "confirmed", "preparing", "ready"].map((status) => (
            <div
              key={status}
              className="h-10 bg-gray-200 rounded-full px-4 py-2 w-24"
            ></div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-md p-6 border border-gray-100"
            >
              <div className="h-6 bg-gray-200 rounded-full w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded-full w-1/4 mb-6"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded-full"></div>
                ))}
              </div>
              <div className="h-10 bg-gray-200 rounded-xl mt-6"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="mb-6 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Something went wrong
        </h3>
        <p className="text-gray-600 text-center mb-6 max-w-md">{error}</p>
        <button
          onClick={fetchOrders}
          className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-xl transition-colors font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            filter === "all"
              ? "bg-indigo-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          All Orders
        </button>
        <button
          onClick={() => setFilter("confirmed")}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            filter === "confirmed"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Confirmed
        </button>
        <button
          onClick={() => setFilter("preparing")}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            filter === "preparing"
              ? "bg-orange-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Preparing
        </button>
        <button
          onClick={() => setFilter("ready")}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            filter === "ready"
              ? "bg-green-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Ready to Serve
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="mb-6 w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              ></path>
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Orders Found
          </h3>
          <p className="text-gray-600 text-center">
            {filter === "all"
              ? "No orders have been placed yet."
              : `No orders with status "${filter}".`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-2xl shadow-md p-6 border border-gray-100"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {order.tableNumber
                      ? `Table ${order.tableNumber}`
                      : order.orderType}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {formatOrderDate(order.orderDate)}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    order.status
                  )}`}
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">Order Items:</h4>
                <ul className="space-y-2">
                  {order.items.map((item, index) => (
                    <li key={index} className="text-sm">
                      <div className="flex justify-between">
                        <span>
                          {item.quantity}× {item.menuItem.name}
                        </span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                      {item.specialInstructions && (
                        <p className="text-xs text-gray-500 mt-1">
                          Note: {item.specialInstructions}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-gray-200 pt-3 mb-4">
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span>${order.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex space-x-2">
                {order.status === "confirmed" && (
                  <button
                    onClick={() => updateOrderStatus(order._id, "preparing")}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 px-3 rounded-lg text-sm font-medium"
                  >
                    Start Preparing
                  </button>
                )}
                {order.status === "preparing" && (
                  <button
                    onClick={() => updateOrderStatus(order._id, "ready")}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded-lg text-sm font-medium"
                  >
                    Mark as Ready
                  </button>
                )}
                {order.status === "ready" && (
                  <button
                    onClick={() => updateOrderStatus(order._id, "served")}
                    className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 px-3 rounded-lg text-sm font-medium"
                  >
                    Mark as Served
                  </button>
                )}
                {(order.status === "confirmed" ||
                  order.status === "preparing") && (
                  <button
                    onClick={() => updateOrderStatus(order._id, "cancelled")}
                    className="bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-lg text-sm font-medium"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default KitchenDisplaySystem;
