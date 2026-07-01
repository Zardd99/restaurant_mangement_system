"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Cookies from "js-cookie";
import {
  Search,
  ShoppingCart,
  X,
  ChefHat,
  Flame,
  Leaf,
  Clock,
  LayoutList,
  LayoutGrid,
  AlertTriangle,
} from "lucide-react";

import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useOrderManager } from "../hooks/useOrderManager";
import { useInventoryDeduction } from "../hooks/useInventoryDeduction";

import MenuGrid from "../presentation/components/MenuItemCard/MenuGrid";
import MenuItemRowWaiter from "../presentation/components/MenuItemCard/MenuItemRowWaiter";
import OrderForm from "../presentation/components/OrderForm/OrderForm";
import OrderSummary from "../presentation/components/OrderSummary/OrderSummary";
import LoadingState from "./common/LoadingState";
import ErrorState from "./common/ErrorState";

import { MenuItem } from "../hooks/useMenuData";

// ---------------------------------------------------------------------------
// Quick filter config
// ---------------------------------------------------------------------------

const QUICK_FILTERS = [
  { id: "all", label: "All", icon: null },
  { id: "popular", label: "Popular", icon: <Flame className="w-3.5 h-3.5" /> },
  { id: "chef", label: "Chef's Pick", icon: <ChefHat className="w-3.5 h-3.5" /> },
  { id: "veg", label: "Vegetarian", icon: <Leaf className="w-3.5 h-3.5" /> },
  { id: "fast", label: "Fast Prep", icon: <Clock className="w-3.5 h-3.5" /> },
] as const;

type QuickFilter = (typeof QUICK_FILTERS)[number]["id"];

// ---------------------------------------------------------------------------
// WaiterOrderInterface
// ---------------------------------------------------------------------------

const WaiterOrderInterface = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeQuickFilter, setActiveQuickFilter] = useState<QuickFilter>("all");
  const [viewMode, setViewMode] = useState<"list" | "card">("card");

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showStockWarning, setShowStockWarning] = useState(false);
  const [stockWarningMessage, setStockWarningMessage] = useState("");

  const [tableNumber, setTableNumber] = useLocalStorage<number>("waiter_table_number", 1);
  const [customerName, setCustomerName] = useLocalStorage<string>("waiter_customer_name", "");
  const [orderNotes, setOrderNotes] = useLocalStorage<string>("waiter_order_notes", "");

  const orderManager = useOrderManager();
  const { isDeducting } = useInventoryDeduction();
  const { token } = useAuth();
  const { socket } = useSocket();

  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const searchRef = useRef<HTMLInputElement>(null);

  // ---------------------------------------------------------------------------
  // Derived
  // ---------------------------------------------------------------------------

  const categories = useMemo(() => {
    const cats = menuItems
      .map((item) => (typeof item.category === "string" ? item.category : item.category?.name))
      .filter(Boolean) as string[];
    return Array.from(new Set(cats)).sort();
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    let result = [...menuItems];

    if (activeQuickFilter === "popular") result = result.filter((i) => i.reviewCount > 10);
    else if (activeQuickFilter === "chef") result = result.filter((i) => i.chefSpecial);
    else if (activeQuickFilter === "veg")
      result = result.filter(
        (i) => i.dietaryTags?.includes("vegetarian") || i.dietaryTags?.includes("vegan"),
      );
    else if (activeQuickFilter === "fast") result = result.filter((i) => i.averageRating >= 4);

    if (activeCategory !== "all") {
      result = result.filter((i) => {
        const cat = typeof i.category === "string" ? i.category : i.category?.name;
        return cat === activeCategory;
      });
    }

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(lower) ||
          i.description.toLowerCase().includes(lower),
      );
    }

    // Available items first, then unavailable
    return result.sort((a, b) => Number(b.availability) - Number(a.availability));
  }, [menuItems, searchTerm, activeCategory, activeQuickFilter]);

  const cartQuantities = useMemo(() => {
    const map: Record<string, number> = {};
    for (const entry of orderManager.currentOrder) {
      map[entry.menuItem._id] = entry.quantity;
    }
    return map;
  }, [orderManager.currentOrder]);

  const removeOneFromOrder = useCallback(
    (item: MenuItem) => {
      const current = orderManager.currentOrder.find(
        (entry) => entry.menuItem._id === item._id,
      );
      if (current) orderManager.updateQuantity(item._id, current.quantity - 1);
    },
    [orderManager],
  );

  // ---------------------------------------------------------------------------
  // Fetch
  // ---------------------------------------------------------------------------

  const fetchMenuItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const authToken = token || Cookies.get("token");
      if (!authToken) throw new Error("No authentication token found. Please log in again.");

      const response = await fetch(`${API_URL}/api/menu`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      });
      if (!response.ok) throw new Error(`Failed to fetch menu items: ${response.status}`);

      const data = await response.json();
      const items = data.data || data;
      if (!Array.isArray(items)) throw new Error("Invalid response format from API");
      setMenuItems(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load menu");
    } finally {
      setLoading(false);
    }
  }, [API_URL, token]);

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  useEffect(() => {
    if (!socket) return;
    socket.emit("set_role", "waiter");
    socket.on("error", (e) => console.error("Socket error:", e));
    return () => { socket.off("error"); };
  }, [socket]);

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  const submitOrder = async () => {
    if (orderManager.currentOrder.length === 0) {
      alert("Please add items to the order before submitting");
      return;
    }
    if (!tableNumber || tableNumber < 1) {
      alert("Please enter a valid table number");
      return;
    }

    try {
      const authToken = token || Cookies.get("token");
      if (!authToken) throw new Error("No authentication token found.");

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

      if (!response.ok) throw new Error("Failed to submit order");
      const responseData = await response.json();

      if (socket) socket.emit("order_created", responseData);

      orderManager.clearOrder();
      setTableNumber(1);
      setCustomerName("");
      setOrderNotes("");
      setShowStockWarning(false);
      setStockWarningMessage("");
      setIsCartOpen(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to submit order");
    }
  };

  // ---------------------------------------------------------------------------
  // Loading / Error
  // ---------------------------------------------------------------------------

  if (loading) return <LoadingState type="orders" count={6} />;
  if (error) return <ErrorState error={error} onRetry={fetchMenuItems} />;

  // ---------------------------------------------------------------------------
  // Shared order panel (reused in sidebar + mobile drawer)
  // ---------------------------------------------------------------------------

  const OrderPanel = () => (
    <>
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
      <div className="mt-4 space-y-2">
        <button
          onClick={submitOrder}
          disabled={orderManager.currentOrder.length === 0 || isDeducting}
          className="w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 disabled:bg-gray-200 disabled:text-gray-400 bg-gray-900 hover:bg-black text-white"
        >
          {isDeducting ? (
            <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Processing…</>
          ) : (
            "Send to Kitchen"
          )}
        </button>
        <button
          onClick={() => {
            orderManager.clearOrder();
            setCustomerName("");
            setOrderNotes("");
            setShowStockWarning(false);
            setIsCartOpen(false);
          }}
          disabled={orderManager.currentOrder.length === 0}
          className="w-full py-2.5 rounded-lg font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40"
        >
          Clear Order
        </button>
      </div>
    </>
  );

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <div className="relative flex flex-col h-full overflow-hidden">

      {/* Stock warning */}
      {showStockWarning && (
        <div className="mx-4 mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2 shrink-0">
          <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-800 flex-1">{stockWarningMessage}</p>
          <button onClick={() => setShowStockWarning(false)} className="text-yellow-500 hover:text-yellow-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── Main split layout ─── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ═══ LEFT: Menu panel ═══ */}
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">

          {/* Sticky toolbar */}
          <div className="bg-white border-b border-gray-200 px-4 pt-4 pb-3 shrink-0 space-y-3">

            {/* Row 1: search + view toggle + cart count */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search menu…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* View mode toggle */}
              <div className="flex border border-gray-200 rounded-lg overflow-hidden shrink-0">
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-2.5 py-2 transition-colors ${viewMode === "list" ? "bg-gray-900 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
                  aria-label="List view"
                >
                  <LayoutList className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("card")}
                  className={`px-2.5 py-2 transition-colors ${viewMode === "card" ? "bg-gray-900 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
                  aria-label="Card view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>

              {/* Mobile cart button */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="md:hidden relative shrink-0 p-2.5 bg-gray-900 text-white rounded-lg"
              >
                <ShoppingCart className="w-4 h-4" />
                {orderManager.currentOrder.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center leading-none px-1">
                    {orderManager.currentOrder.length}
                  </span>
                )}
              </button>
            </div>

            {/* Row 2: Quick filters */}
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
              {QUICK_FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveQuickFilter(f.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                    activeQuickFilter === f.id
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {f.icon}
                  {f.label}
                </button>
              ))}
            </div>

            {/* Row 3: Category pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
              <button
                onClick={() => setActiveCategory("all")}
                className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                  activeCategory === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                    activeCategory === cat
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Result count */}
            <p className="text-xs text-gray-400">
              {filteredItems.filter((i) => i.availability).length} available ·{" "}
              {filteredItems.length} shown
            </p>
          </div>

          {/* Scrollable item list */}
          <div className="flex-1 overflow-y-auto">
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Search className="w-8 h-8 mb-3" />
                <p className="text-sm font-medium">No items found</p>
                <p className="text-xs mt-1">
                  {searchTerm ? "Try a different search" : "Change your filters"}
                </p>
              </div>
            ) : viewMode === "list" ? (
              <div>
                {filteredItems.map((item) => (
                  <MenuItemRowWaiter
                    key={item._id}
                    item={item}
                    onAddToCart={orderManager.addToOrder}
                  />
                ))}
              </div>
            ) : (
              <MenuGrid
                items={filteredItems}
                cartQuantities={cartQuantities}
                onAdd={orderManager.addToOrder}
                onRemoveOne={removeOneFromOrder}
                emptyHint={searchTerm ? "Try a different search" : "Change your filters"}
              />
            )}
          </div>
        </div>

        {/* ═══ RIGHT: Order panel (tablet+) ═══ */}
        <div className="hidden md:flex flex-col w-72 lg:w-80 xl:w-96 shrink-0 border-l border-gray-200 bg-white">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Current Order</h2>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {orderManager.currentOrder.length} items
            </span>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <OrderPanel />
          </div>
        </div>
      </div>

      {/* ═══ Mobile cart drawer ═══ */}
      {isCartOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() => setIsCartOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white z-50 md:hidden flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h2 className="font-bold text-gray-900">Current Order</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-1 rounded hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3">
              <OrderPanel />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WaiterOrderInterface;
