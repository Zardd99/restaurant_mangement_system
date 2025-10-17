"use client";

import { useState, useEffect } from "react";
import { useSearch } from "../contexts/SearchContext";
import Cookies from "js-cookie";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import { useLocalStorage } from "../hooks/useLocalStorage";

// Components
import MenuItemCard from "../components/MenuItemCard/MenuItemCard";
import OrderForm from "../components/OrderForm/OrderForm";
import OrderSummary from "../components/OrderSummary/OrderSummary";
import LoadingState from "./common/LoadingState";
import ErrorState from "./common/ErrorState";

// Hooks
import { useOrderManager } from "../hooks/useOrderManager";
import { MenuItem } from "../hooks/useMenuData";

const WaiterOrderInterface = () => {
  // State
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Order Management
  const orderManager = useOrderManager();

  // Form State
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

  // API URL
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Fetch menu items
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
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
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

  // Socket setup
  useEffect(() => {
    if (socket) {
      socket.emit("set_role", "waiter");
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

  // Submit order to kitchen
  const submitOrder = async () => {
    if (orderManager.currentOrder.length === 0) {
      console.log("Please add items to the order before submitting");
      return;
    }

    if (!tableNumber || tableNumber < 1) {
      console.log("Please enter a valid table number");
      return;
    }

    try {
      const authToken = token || Cookies.get("token");

      if (!authToken) {
        throw new Error("No authentication token found. Please log in again.");
      }

      const orderData = {
        items: orderManager.currentOrder.map((item) => ({
          menuItem: item.menuItem._id,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions || "",
          price: item.menuItem.price,
        })),
        totalAmount: orderManager.calculateTotal(),
        tableNumber,
        customerName: customerName || `Table ${tableNumber}`,
        orderType: "dine-in",
        status: "confirmed",
      };

      const response = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        let errorMessage = `Failed to submit order: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.error("Could not parse error response:", e);
        }
        throw new Error(errorMessage);
      }

      const responseData = await response.json();

      if (socket) {
        socket.emit("order_created", responseData);
      }

      // Clear storage and reset
      localStorage.removeItem("waiter_current_order");
      localStorage.removeItem("waiter_table_number");
      localStorage.removeItem("waiter_customer_name");
      localStorage.removeItem("waiter_order_notes");

      orderManager.clearOrder();
      setTableNumber(1);
      setCustomerName("");
      setOrderNotes("");

      console.log("Order submitted successfully to the kitchen!");
    } catch (err: unknown) {
      console.error("Error submitting order:", err);
      setError(err instanceof Error ? err.message : "Failed to submit order");

      if (
        err instanceof Error &&
        (err.message.includes("session has expired") ||
          err.message.includes("No authentication token"))
      ) {
        window.location.href = "/login";
      }
    }
  };

  // Loading state
  if (loading) {
    return <LoadingState type="orders" count={6} />;
  }

  // Error state
  if (error) {
    return (
      <ErrorState error={error} onRetry={() => window.location.reload()} />
    );
  }

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
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
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
            {menuItems.map((item, index) => (
              <MenuItemCard
                key={item._id}
                item={item}
                addToOrder={orderManager.addToOrder}
                animationDelay={index * 0.1}
              />
            ))}
          </div>
        )}
      </div>

      {/* Current Order */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 sticky top-4 h-fit">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Current Order</h2>

        <OrderForm
          tableNumber={tableNumber}
          setTableNumber={setTableNumber}
          customerName={customerName}
          setCustomerName={setCustomerName}
          orderNotes={orderNotes}
          setOrderNotes={setOrderNotes}
        />

        <OrderSummary
          currentOrder={orderManager.currentOrder}
          updateQuantity={orderManager.updateQuantity}
          updateInstructions={orderManager.updateInstructions}
          removeFromOrder={orderManager.removeFromOrder}
          calculateTotal={orderManager.calculateTotal}
        />

        <div className="flex gap-4">
          <button
            onClick={submitOrder}
            disabled={orderManager.currentOrder.length === 0}
            className={`w-full py-3 px-4 rounded-xl font-medium transition-all ${
              orderManager.currentOrder.length === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg"
            }`}
          >
            Send Order to Kitchen
          </button>

          <button
            onClick={() => {
              orderManager.clearOrder();
              setCustomerName("");
              setOrderNotes("");
            }}
            disabled={orderManager.currentOrder.length === 0}
            className={`px-4 py-3 rounded-xl font-medium transition-all ${
              orderManager.currentOrder.length === 0
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
