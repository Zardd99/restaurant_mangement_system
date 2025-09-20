"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useSearch } from "../contexts/SearchContext";
import Cookies from "js-cookie";
import { useAuth } from "../contexts/AuthContext";
import { useRef, useCallback } from "react";
import { useSocket } from "../contexts/SocketContext";
import { useLocalStorage } from "../hooks/useLocalStorage";

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  averageRating: number;
  category: {
    _id: string;
    name: string;
    description?: string;
  };
  dietaryTags?: string[];
  availability: boolean;
  chefSpecial?: boolean;
}

interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  specialInstructions?: string;
}

const WaiterOrderInterface = () => {
  // State
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentOrder, setCurrentOrder] = useLocalStorage<OrderItem[]>(
    "waiter_current_order",
    []
  );

  const [tableNumber, setTableNumber] = useLocalStorage<number>(
    "waiter_table_number",
    1
  );

  const [customerName, setCustomerName] = useLocalStorage<string>(
    "waiter_customer_name",
    ""
  );
  const [orderNotes, setOrderNotes] = useLocalStorage<string>(
    "waiter_order_notes",
    ""
  );

  // Contexts
  const { searchQuery } = useSearch();
  const { token } = useAuth();
  const { socket } = useSocket();

  // Refs
  const ws = useRef<WebSocket | null>(null);

  // API URL
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // -- Effect / Function -- //

  // Fetch menu items from API
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setLoading(true);
        setError(null);

        let url = `${API_URL}/api/menu`;
        if (searchQuery) {
          url += `?search=${encodeURIComponent(searchQuery)}`;
        }

        const authToken = token || Cookies.get("token");

        if (!authToken) {
          throw new Error(
            "No authentication token found. Please log in again."
          );
        }

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch menu items: ${response.status}`);
        }

        const data = await response.json();
        const items = data.data || data;

        if (Array.isArray(items)) {
          setMenuItems(items);
        } else {
          throw new Error("Invalid response format from API");
        }
      } catch (err) {
        console.error("Error fetching menu items:", err);
        setError(err instanceof Error ? err.message : "Failed to load menu");
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, [API_URL, searchQuery, token]);

  useEffect(() => {
    if (socket) {
      // Set role for this connection using the set_role event
      socket.emit("set_role", "waiter");

      // Handle connection errors
      socket.on("error", (error) => {
        console.error("Socket error:", error);
      });
    }

    return () => {
      if (socket) {
        socket.off("error");
      }
    };
  }, [socket]);

  useEffect(() => {
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  // Add item to current order
  const addToOrder = (item: MenuItem) => {
    const existingItem = currentOrder.find(
      (orderItem) => orderItem.menuItem._id === item._id
    );

    if (existingItem) {
      // Increase quantity if item already exists in order
      setCurrentOrder(
        currentOrder.map((orderItem) =>
          orderItem.menuItem._id === item._id
            ? { ...orderItem, quantity: orderItem.quantity + 1 }
            : orderItem
        )
      );
    } else {
      // Add new item to order
      setCurrentOrder([
        ...currentOrder,
        { menuItem: item, quantity: 1, specialInstructions: "" },
      ]);
    }
  };

  // Update item quantity in order
  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      // Remove item if quantity is 0
      setCurrentOrder(
        currentOrder.filter((item) => item.menuItem._id !== itemId)
      );
    } else {
      // Update quantity
      setCurrentOrder(
        currentOrder.map((item) =>
          item.menuItem._id === itemId
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    }
  };

  // Update special instructions for an item
  const updateInstructions = (itemId: string, instructions: string) => {
    setCurrentOrder(
      currentOrder.map((item) =>
        item.menuItem._id === itemId
          ? { ...item, specialInstructions: instructions }
          : item
      )
    );
  };

  // Remove item from order
  const removeFromOrder = (itemId: string) => {
    setCurrentOrder(
      currentOrder.filter((item) => item.menuItem._id !== itemId)
    );
  };

  // Calculate total order amount
  const calculateTotal = () => {
    return currentOrder.reduce(
      (total, item) => total + item.menuItem.price * item.quantity,
      0
    );
  };

  // Submit order to kitchen
  const submitOrder = async () => {
    if (currentOrder.length === 0) {
      console.log("Please add items to the order before submitting");
      return;
    }

    if (!tableNumber || tableNumber < 1) {
      console.log("Please enter a valid table number");
      return;
    }

    try {
      // Get token from auth context or cookies
      const authToken = token || Cookies.get("token");

      if (!authToken) {
        throw new Error("No authentication token found. Please log in again.");
      }

      const orderData = {
        items: currentOrder.map((item) => ({
          menuItem: item.menuItem._id,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions || "",
          price: item.menuItem.price,
        })),
        totalAmount: calculateTotal(),
        tableNumber,
        customerName: customerName || `Table ${tableNumber}`,
        orderType: "dine-in",
        status: "confirmed",
      };

      console.log("Submitting order:", orderData); // Debug log

      const response = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(orderData),
      });

      // Check if response is OK before trying to parse JSON
      if (!response.ok) {
        let errorMessage = `Failed to submit order: ${response.status} ${response.statusText}`;

        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.error("Error details:", errorData); // Debug log
        } catch (e) {
          // If we can't parse JSON error, use the status text
          console.error("Could not parse error response:", e);
        }

        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      console.log("Order submitted successfully:", responseData); // Debug log

      if (socket) {
        socket.emit("order_created", responseData);
      }

      notifyOrderCreation(responseData);

      localStorage.removeItem("waiter_current_order");
      localStorage.removeItem("waiter_table_number");
      localStorage.removeItem("waiter_customer_name");
      localStorage.removeItem("waiter_order_notes");

      // Reset order after successful submission
      setCurrentOrder([]);
      setTableNumber(1);
      setCustomerName("");
      setOrderNotes("");
      console.log("Order submitted successfully to the kitchen!");
    } catch (err: unknown) {
      console.error("Error submitting order:", err);
      setError(err instanceof Error ? err.message : "Failed to submit order");
      // If it's an authentication error, redirect to login
      if (
        err instanceof Error &&
        (err.message.includes("session has expired") ||
          err.message.includes("No authentication token"))
      ) {
        window.location.href = "/login";
      }
    }
  };

  const notifyOrderCreation = useCallback(
    (orderData: OrderItem) => {
      const authToken = token || Cookies.get("token");
      if (!authToken) return;

      let wsUrl;
      if (API_URL.includes("localhost") || API_URL.includes("127.0.0.1")) {
        wsUrl = `ws://localhost:5000/ws?role=waiter&token=${encodeURIComponent(
          authToken
        )}`;
      } else {
        const url = new URL(API_URL);
        const protocol = url.protocol === "https:" ? "wss:" : "ws:";
        wsUrl = `${protocol}//${
          url.host
        }/ws?role=waiter&token=${encodeURIComponent(authToken)}`;
      }

      try {
        const notificationWs = new WebSocket(wsUrl);
        notificationWs.onopen = () => {
          notificationWs.send(
            JSON.stringify({
              type: "order_created",
              order: orderData,
            })
          );
          notificationWs.close();
        };
      } catch (err) {
        console.error("Failed to send order notification:", err);
      }
    },
    [API_URL, token]
  );

  const renderStars = (averageRating: number) => {
    const fullStars = Math.floor(averageRating);
    const hasHalfStar = averageRating % 1 >= 0.5;

    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => {
          if (i < fullStars) {
            return (
              <svg
                key={i}
                className="w-4 h-4 text-yellow-400 fill-current"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            );
          } else if (i === fullStars && hasHalfStar) {
            return (
              <svg
                key={i}
                className="w-4 h-4 text-yellow-400 fill-current"
                viewBox="0 0 20 20"
              >
                <defs>
                  <linearGradient id="half-star">
                    <stop offset="50%" stopColor="currentColor" />
                    <stop offset="50%" stopColor="#D1D5DB" />
                  </linearGradient>
                </defs>
                <path
                  fill="url(#half-star)"
                  d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                />
              </svg>
            );
          } else {
            return (
              <svg
                key={i}
                className="w-4 h-4 text-gray-300 fill-current"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            );
          }
        })}
        <span className="ml-1 text-sm font-medium text-gray-600">
          {(averageRating || 0).toFixed(2)}
        </span>
      </div>
    );
  };

  // Loading state UI
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100"
              >
                <div className="h-40 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse"></div>
                <div className="p-4">
                  <div className="h-6 bg-gray-200 rounded-full w-3/4 mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded-full w-1/4 mb-3"></div>
                  <div className="h-10 bg-gray-200 rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
          <div className="h-8 bg-gray-200 rounded-full w-1/2 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="h-12 bg-gray-200 rounded-xl mt-8"></div>
        </div>
      </div>
    );
  }

  // Error state UI
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
          onClick={() => window.location.reload()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-xl transition-colors font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Main UI
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Menu Items */}
      <div className="lg:col-span-2">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Menu Items</h2>
          <p className="text-gray-600">Select items to add to the order</p>
        </div>

        {menuItems.length === 0 ? (
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
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Menu Available
            </h3>
            <p className="text-gray-600 text-center">
              Check back later for our menu creations
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {menuItems.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300"
              >
                <div className="relative h-40 w-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <svg
                        className="w-12 h-12 mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        ></path>
                      </svg>
                      <span className="text-sm">No image available</span>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {item.name}
                    </h3>
                    <p className="text-lg font-bold text-green-600">
                      ${item.price.toFixed(2)}
                    </p>
                  </div>

                  <p className="text-gray-600 mb-3 text-sm line-clamp-2">
                    {item.description}
                  </p>

                  <div className="flex justify-between items-center mb-4">
                    {renderStars(item.averageRating)}
                    {item.dietaryTags && item.dietaryTags.length > 0 && (
                      <div className="flex space-x-1">
                        {item.dietaryTags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {item.dietaryTags.length > 2 && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                            +{item.dietaryTags.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => addToOrder(item)}
                    className={`w-full py-2 px-4 rounded-xl font-medium transition-all ${
                      item.availability
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    }`}
                    disabled={!item.availability}
                  >
                    {item.availability ? (
                      <div className="flex items-center justify-center">
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          ></path>
                        </svg>
                        Add to Order
                      </div>
                    ) : (
                      "Out of Stock"
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Current Order */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 sticky top-4 h-fit">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Current Order</h2>

        {/* Order Details */}
        <div className="mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Table Number *
            </label>
            <input
              type="number"
              min="1"
              value={tableNumber}
              onChange={(e) => setTableNumber(Number(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Name
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Optional"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order Notes
            </label>
            <textarea
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="Special requests or instructions"
              rows={2}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Order Items */}
        {currentOrder.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <svg
              className="w-12 h-12 mx-auto mb-4 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              ></path>
            </svg>
            <p>No items in the order yet</p>
          </div>
        ) : (
          <div className="mb-6">
            <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
              {currentOrder.map((item) => (
                <div
                  key={item.menuItem._id}
                  className="border-b border-gray-200 pb-4 last:border-0"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {item.menuItem.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        ${item.menuItem.price.toFixed(2)} × {item.quantity} = $
                        {(item.menuItem.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromOrder(item.menuItem._id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        ></path>
                      </svg>
                    </button>
                  </div>

                  <div className="mt-2 flex items-center space-x-2">
                    <button
                      onClick={() =>
                        updateQuantity(item.menuItem._id, item.quantity - 1)
                      }
                      className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M20 12H4"
                        ></path>
                      </svg>
                    </button>

                    <span className="text-sm font-medium">{item.quantity}</span>

                    <button
                      onClick={() =>
                        updateQuantity(item.menuItem._id, item.quantity + 1)
                      }
                      className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        ></path>
                      </svg>
                    </button>
                  </div>

                  <div className="mt-2">
                    <input
                      type="text"
                      value={item.specialInstructions || ""}
                      onChange={(e) =>
                        updateInstructions(item.menuItem._id, e.target.value)
                      }
                      placeholder="Special instructions"
                      className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">
                  ${calculateTotal().toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600">Tax (10%)</span>
                <span className="font-medium">
                  ${(calculateTotal() * 0.1).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total</span>
                <span>${(calculateTotal() * 1.1).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-4">
          {/* Submit Button */}
          <button
            onClick={submitOrder}
            disabled={currentOrder.length === 0}
            className={`w-full py-3 px-4 rounded-xl font-medium transition-all ${
              currentOrder.length === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg"
            }`}
          >
            Send Order to Kitchen
          </button>

          {/* clear orders */}
          <button
            onClick={() => {
              setCurrentOrder([]);
              setCustomerName("");
              setOrderNotes("");
            }}
            disabled={currentOrder.length === 0}
            className={`px-4 py-3 rounded-xl font-medium transition-all ${
              currentOrder.length === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg"
            }`}
          >
            Clear Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default WaiterOrderInterface;
