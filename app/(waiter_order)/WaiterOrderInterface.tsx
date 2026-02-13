"use client";

// ============================================================================
// External Imports
// ============================================================================
import { useState, useEffect, useMemo } from "react";
import Cookies from "js-cookie";
import {
  Search,
  Filter,
  ChevronDown,
  ShoppingCart,
  X,
  ChefHat,
  Flame,
  Leaf,
  Clock,
  Star,
  AlertTriangle,
} from "lucide-react";

// ============================================================================
// Internal Imports - Contexts & Hooks
// ============================================================================
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useOrderManager } from "../hooks/useOrderManager";
import { useInventoryDeduction } from "../hooks/useInventoryDeduction";

// ============================================================================
// Internal Imports - Components
// ============================================================================
import MenuItemCardForWaiter from "../presentation/components/MenuItemCard/MenuItemCardForWaiter";
import OrderForm from "../presentation/components/OrderForm/OrderForm";
import OrderSummary from "../presentation/components/OrderSummary/OrderSummary";
import LoadingState from "./common/LoadingState";
import ErrorState from "./common/ErrorState";

// ============================================================================
// Type Definitions
// ============================================================================
import { MenuItem } from "../hooks/useMenuData";

// ============================================================================
// Main Component: WaiterOrderInterface
// ============================================================================

/**
 * WaiterOrderInterface Component
 *
 * Provides a complete order‑taking interface for waitstaff.
 * Features:
 * - Real‑time menu fetching and filtering (search, category, availability)
 * - Quick dietary filters (popular, chef's picks, vegetarian, fast prep)
 * - Mobile‑responsive layout with a floating cart button
 * - Persistent order data via localStorage (table, customer, notes)
 * - Order management (add, update quantity, remove)
 * - Submission to kitchen with automatic inventory deduction
 * - WebSocket integration for real‑time updates
 *
 * @component
 * @returns {JSX.Element} The rendered waiter order interface
 */
const WaiterOrderInterface = () => {
  // --------------------------------------------------------------------------
  // State Declarations
  // --------------------------------------------------------------------------

  /** All menu items fetched from the API */
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  /** UI loading state for initial data fetch */
  const [loading, setLoading] = useState(true);
  /** Error message to display, or null if no error */
  const [error, setError] = useState<string | null>(null);

  /** Text search term for filtering menu items */
  const [searchTerm, setSearchTerm] = useState("");
  /** Selected category filters; ["all"] means no filter */
  const [categoryFilter, setCategoryFilter] = useState<string[]>(["all"]);
  /** Availability filter: "all" or "available" (unavailable items are hidden by API) */
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  /** Chef special filter: "all", "special", "regular" */
  const [chefSpecialFilter, setChefSpecialFilter] = useState("all");
  /** Price sort order: "none", "low", "high", "rating" */
  const [priceSort, setPriceSort] = useState("none");

  /** Controls visibility of the mobile cart drawer */
  const [isCartOpen, setIsCartOpen] = useState(false);

  /** Quick dietary filter: "all", "popular", "chef", "veg", "fast" */
  const [activeQuickFilter, setActiveQuickFilter] = useState("all");

  /** Stock warning banner visibility */
  const [showStockWarning, setShowStockWarning] = useState(false);
  /** Stock warning message content */
  const [stockWarningMessage, setStockWarningMessage] = useState("");

  // --------------------------------------------------------------------------
  // Persistent State (Local Storage)
  // --------------------------------------------------------------------------
  /** Table number for the current order (persisted) */
  const [tableNumber, setTableNumber] = useLocalStorage<number>(
    "waiter_table_number",
    1,
  );
  /** Customer name for the current order (persisted) */
  const [customerName, setCustomerName] = useLocalStorage<string>(
    "waiter_customer_name",
    "",
  );
  /** Special notes for the current order (persisted) */
  const [orderNotes, setOrderNotes] = useLocalStorage<string>(
    "waiter_order_notes",
    "",
  );

  // --------------------------------------------------------------------------
  // Custom Hooks
  // --------------------------------------------------------------------------

  /** Order management logic (add, remove, update, clear) */
  const orderManager = useOrderManager();

  /** Inventory deduction hook – used when submitting order */
  const { deductIngredientsForOrder, isDeducting } = useInventoryDeduction();

  // --------------------------------------------------------------------------
  // Contexts
  // --------------------------------------------------------------------------

  /** Authentication token and user info */
  const { token } = useAuth();
  /** WebSocket connection for real‑time events */
  const { socket } = useSocket();

  // --------------------------------------------------------------------------
  // Constants
  // --------------------------------------------------------------------------

  /** Base API URL from environment variables */
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // --------------------------------------------------------------------------
  // Memoized Values
  // --------------------------------------------------------------------------

  /**
   * Extract unique category names from the menu items.
   * Used in the category filter dropdown.
   */
  const categories = useMemo(() => {
    const cats = menuItems
      .map((item) =>
        typeof item.category === "string" ? item.category : item.category?.name,
      )
      .filter(Boolean) as string[];
    return Array.from(new Set(cats));
  }, [menuItems]);

  /**
   * Apply all active filters and sorting to the menu items.
   * - Quick filters (popular, chef, veg, fast)
   * - Text search (name/description)
   * - Category filter
   * - Availability filter
   * - Chef special filter
   * - Price / rating sorting
   *
   * @returns {MenuItem[]} Filtered and sorted menu items
   */
  const filteredItems = useMemo(() => {
    let filtered = [...menuItems];

    // ========================================================================
    // Quick Filters (override other filters)
    // ========================================================================
    if (activeQuickFilter === "popular") {
      filtered = filtered.filter((item) => item.reviewCount > 10);
    } else if (activeQuickFilter === "chef") {
      filtered = filtered.filter((item) => item.chefSpecial);
    } else if (activeQuickFilter === "veg") {
      filtered = filtered.filter(
        (item) =>
          item.dietaryTags?.includes("vegetarian") ||
          item.dietaryTags?.includes("vegan"),
      );
    } else if (activeQuickFilter === "fast") {
      // Items with average rating >= 4 are considered "fast prep"
      filtered = filtered.filter((item) => item.averageRating >= 4);
    }

    // ========================================================================
    // Text Search
    // ========================================================================
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          item.description.toLowerCase().includes(term),
      );
    }

    // ========================================================================
    // Category Filter
    // ========================================================================
    if (!categoryFilter.includes("all") && categoryFilter.length > 0) {
      filtered = filtered.filter((item) => {
        const itemCategory =
          typeof item.category === "string"
            ? item.category
            : item.category?.name;
        return itemCategory && categoryFilter.includes(itemCategory);
      });
    }

    // ========================================================================
    // Availability Filter
    // ========================================================================
    if (availabilityFilter === "available") {
      filtered = filtered.filter((item) => item.availability);
    } else if (availabilityFilter === "unavailable") {
      filtered = filtered.filter((item) => !item.availability);
    }

    // ========================================================================
    // Chef Special Filter
    // ========================================================================
    if (chefSpecialFilter === "special") {
      filtered = filtered.filter((item) => item.chefSpecial);
    } else if (chefSpecialFilter === "regular") {
      filtered = filtered.filter((item) => !item.chefSpecial);
    }

    // ========================================================================
    // Sorting
    // ========================================================================
    if (priceSort === "low") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (priceSort === "high") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (priceSort === "rating") {
      filtered.sort((a, b) => b.averageRating - a.averageRating);
    }

    return filtered;
  }, [
    menuItems,
    searchTerm,
    categoryFilter,
    availabilityFilter,
    chefSpecialFilter,
    priceSort,
    activeQuickFilter,
  ]);

  // --------------------------------------------------------------------------
  // Effects
  // --------------------------------------------------------------------------

  /**
   * Effect: Fetch menu items from the API on mount or when token changes.
   * Stores fetched items in state.
   */
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setLoading(true);
        setError(null);

        const authToken = token || Cookies.get("token");
        if (!authToken) {
          throw new Error(
            "No authentication token found. Please log in again.",
          );
        }

        const response = await fetch(`${API_URL}/api/menu`, {
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
  }, [API_URL, token]);

  /**
   * Effect: WebSocket connection setup for waiters.
   * Emits the `set_role` event and listens for errors.
   */
  useEffect(() => {
    if (!socket) return;

    socket.emit("set_role", "waiter");
    socket.on("error", (error) => console.error("Socket error:", error));

    return () => {
      socket.off("error");
    };
  }, [socket]);

  // --------------------------------------------------------------------------
  // Event Handlers
  // --------------------------------------------------------------------------

  /**
   * Submits the current order to the kitchen.
   * - Validates order items and table number
   * - Sends POST request to `/api/orders`
   * - Emits WebSocket `order_created` event
   * - Clears the order and resets form on success
   *
   * @async
   * @throws {Error} When authentication or submission fails
   */
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

      // Construct order payload
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

      // Notify kitchen via WebSocket
      if (socket) socket.emit("order_created", responseData);

      // Clear order and reset form
      orderManager.clearOrder();
      setTableNumber(1);
      setCustomerName("");
      setOrderNotes("");
      setShowStockWarning(false);
      setStockWarningMessage("");
      setIsCartOpen(false);
    } catch (err: unknown) {
      console.error("Error submitting order:", err);
      alert(err instanceof Error ? err.message : "Failed to submit order");
    }
  };

  // --------------------------------------------------------------------------
  // Conditional Rendering (Loading / Error States)
  // --------------------------------------------------------------------------
  if (loading) return <LoadingState type="orders" count={6} />;
  if (error) {
    return (
      <ErrorState error={error} onRetry={() => window.location.reload()} />
    );
  }

  // --------------------------------------------------------------------------
  // Main Render
  // --------------------------------------------------------------------------
  return (
    <div className="relative">
      {/* --------------------------------------------------------------------
        Stock Warning Banner (conditionally visible)
      --------------------------------------------------------------------- */}
      {showStockWarning && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
            <p className="text-yellow-800 font-medium">Stock Level Warning</p>
          </div>
          <p className="text-yellow-700 text-sm mt-1">{stockWarningMessage}</p>
          <button
            onClick={() => setShowStockWarning(false)}
            className="mt-2 text-yellow-600 hover:text-yellow-800 text-sm font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* --------------------------------------------------------------------
        Mobile Cart Button (fixed position)
      --------------------------------------------------------------------- */}
      <button
        onClick={() => setIsCartOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-40 bg-gray-900 text-white p-4 rounded-full shadow-lg hover:bg-black transition-colors"
      >
        <ShoppingCart className="w-6 h-6" />
        {orderManager.currentOrder.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
            {orderManager.currentOrder.length}
          </span>
        )}
      </button>

      {/* --------------------------------------------------------------------
        Main Grid Layout
        - Mobile: 1 column (menu full width)
        - Desktop: 3 columns (menu 2/3, order summary 1/3)
      --------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ==================================================================
          Left Column: Menu Items + Filters
        ================================================================== */}
        <div className="lg:col-span-2">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Take Order</h1>
            <p className="text-gray-600">
              Quickly find and add items to the order
            </p>
          </div>

          {/* ------------------------------------------------------------------
            Quick Dietary Filters
          ------------------------------------------------------------------- */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveQuickFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeQuickFilter === "all"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setActiveQuickFilter("popular")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeQuickFilter === "popular"
                  ? "bg-orange-100 text-orange-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Flame className="w-4 h-4" />
              Popular
            </button>
            <button
              onClick={() => setActiveQuickFilter("chef")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeQuickFilter === "chef"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <ChefHat className="w-4 h-4" />
              Chef&apos;s Picks
            </button>
            <button
              onClick={() => setActiveQuickFilter("veg")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeQuickFilter === "veg"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Leaf className="w-4 h-4" />
              Vegetarian
            </button>
            <button
              onClick={() => setActiveQuickFilter("fast")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeQuickFilter === "fast"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Clock className="w-4 h-4" />
              Fast Prep
            </button>
          </div>

          {/* ------------------------------------------------------------------
            Search & Advanced Filters
          ------------------------------------------------------------------- */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search by name or description..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 bg-gray-50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              {/* Advanced Filters Dropdowns */}
              <div className="flex flex-wrap gap-3">
                {/* Category Filter */}
                <div className="relative">
                  <Filter
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <select
                    className="pl-10 pr-8 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent appearance-none transition-all duration-200 hover:border-gray-300 bg-gray-50 min-w-[150px]"
                    value={categoryFilter.includes("all") ? "all" : "custom"}
                    onChange={(e) => {
                      if (e.target.value === "all") {
                        setCategoryFilter(["all"]);
                      }
                    }}
                  >
                    <option value="all">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price / Rating Sort */}
                <div className="relative">
                  <Filter
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <select
                    className="pl-10 pr-8 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent appearance-none transition-all duration-200 hover:border-gray-300 bg-gray-50 min-w-[150px]"
                    value={priceSort}
                    onChange={(e) => setPriceSort(e.target.value)}
                  >
                    <option value="none">Sort by</option>
                    <option value="rating">Highest Rated</option>
                    <option value="low">Price: Low to High</option>
                    <option value="high">Price: High to Low</option>
                  </select>
                </div>

                {/* Availability Filter */}
                <div className="relative">
                  <Filter
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <select
                    className="pl-10 pr-8 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent appearance-none transition-all duration-200 hover:border-gray-300 bg-gray-50 min-w-[150px]"
                    value={availabilityFilter}
                    onChange={(e) => setAvailabilityFilter(e.target.value)}
                  >
                    <option value="all">All Items</option>
                    <option value="available">Available Only</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------------
            Menu Items Grid
          ------------------------------------------------------------------- */}
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="mb-6 w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No items found
              </h3>
              <p className="text-gray-600 text-center">
                {searchTerm
                  ? "Try a different search term"
                  : "Menu items will appear here"}
              </p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Menu Items{" "}
                  <span className="text-gray-500">
                    ({filteredItems.length})
                  </span>
                </h3>
                <div className="text-sm text-gray-500">
                  {filteredItems.filter((item) => item.availability).length}{" "}
                  available
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredItems.map((item, index) => (
                  <MenuItemCardForWaiter
                    key={item._id}
                    item={item}
                    onAddToCart={orderManager.addToOrder}
                    animationDelay={index * 0.05}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* ==================================================================
          Right Column: Current Order Summary (Desktop)
        ================================================================== */}
        <div className="hidden lg:block">
          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Current Order
              </h2>
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-gray-500" />
                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm font-medium">
                  {orderManager.currentOrder.length} items
                </span>
              </div>
            </div>

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

            <div className="mt-6 space-y-3">
              <button
                onClick={submitOrder}
                disabled={orderManager.currentOrder.length === 0 || isDeducting}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center ${
                  orderManager.currentOrder.length === 0 || isDeducting
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gray-900 hover:bg-black text-white shadow-md hover:shadow-lg"
                }`}
              >
                {isDeducting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
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
                }}
                disabled={orderManager.currentOrder.length === 0}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                  orderManager.currentOrder.length === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Clear Order
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================
        Mobile Cart Drawer (visible when isCartOpen = true)
      ================================================================== */}
      {isCartOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsCartOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white z-50 lg:hidden transform transition-transform duration-300 ease-in-out">
            <div className="h-full flex flex-col">
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  Current Order
                </h2>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-4">
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
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-gray-200 space-y-3">
                <button
                  onClick={submitOrder}
                  disabled={
                    orderManager.currentOrder.length === 0 || isDeducting
                  }
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center ${
                    orderManager.currentOrder.length === 0 || isDeducting
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-gray-900 hover:bg-black text-white shadow-md"
                  }`}
                >
                  {isDeducting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
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
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                    orderManager.currentOrder.length === 0
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Clear Order
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WaiterOrderInterface;
