"use client";

// ============================================================================
// Third-Party Libraries
// ============================================================================
import { useEffect, useState, useCallback, memo, useMemo, useRef } from "react";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

// ============================================================================
// Application Contexts, Hooks, and Components
// ============================================================================
import { useAuth } from "../contexts/AuthContext";
import { useOrders } from "../hooks/useOrders";
import { useOrderWebSocket } from "../hooks/useOrderWebSocket";
import { useInventoryDeduction } from "../hooks/useInventoryDeduction";
import FilterButtons from "./FilterButtons";
import LoadingState from "./common/LoadingState";
import ErrorState from "./common/ErrorState";
import EmptyState from "./common/EmptyState";
import OrderCard from "../presentation/components/OrderCard/OrderCard";
import KitchenStatsPanel from "../presentation/components/KitchenStatsPanel/KitchenStatsPanel";

// ============================================================================
// Sub‑Components (Memoized)
// ============================================================================

/**
 * OrderCardWrapper – Memoized wrapper for individual order cards.
 * - Receives an order ID and its initial data.
 * - Manages local state for that order to avoid re‑rendering the entire list.
 * - Only re‑renders when this specific order's data changes.
 *
 * @component
 * @param {Object} props
 * @param {string} props.orderId - Unique identifier of the order.
 * @param {any} props.initialOrder - Initial order data.
 * @param {Function} props.onStatusUpdate - Callback invoked when order status changes.
 * @returns {JSX.Element} The rendered OrderCard.
 */
const OrderCardWrapper = memo(
  ({
    orderId,
    initialOrder,
    onStatusUpdate,
  }: {
    orderId: string;
    initialOrder: any;
    onStatusUpdate: (orderId: string, newStatus: string) => void;
  }) => {
    const [order, setOrder] = useState(initialOrder);

    // Keep local state in sync when the initialOrder prop changes (e.g., after WebSocket update)
    useEffect(() => {
      setOrder(initialOrder);
    }, [initialOrder]);

    return <OrderCard order={order} onStatusUpdate={onStatusUpdate} />;
  },
  // Custom comparison function: prevent re‑render unless this specific order's critical fields change
  (prevProps, nextProps) =>
    prevProps.orderId === nextProps.orderId &&
    prevProps.initialOrder._id === nextProps.initialOrder._id &&
    prevProps.initialOrder.status === nextProps.initialOrder.status &&
    prevProps.initialOrder.items === nextProps.initialOrder.items &&
    prevProps.onStatusUpdate === nextProps.onStatusUpdate,
);

OrderCardWrapper.displayName = "OrderCardWrapper";

// ============================================================================
// Main Component: Kitchen Display System
// ============================================================================

/**
 * KitchenDisplaySystem – Real‑time kitchen order dashboard.
 * - Displays orders filtered by status.
 * - Supports lazy loading with a "Load More" button.
 * - Uses WebSocket for live updates and inventory deduction when orders start preparing.
 * - Includes a quick stats panel and a link to full analytics.
 *
 * @component
 * @returns {JSX.Element} The rendered kitchen display.
 */
const KitchenDisplaySystem = () => {
  // --------------------------------------------------------------------------
  // Local State
  // --------------------------------------------------------------------------
  const [filter, setFilter] = useState<string>("all");
  const [isStatsPanelOpen, setIsStatsPanelOpen] = useState(false);
  const [showDeductionWarning, setShowDeductionWarning] = useState(false);
  const [deductionWarning, setDeductionWarning] = useState("");
  const [visibleOrders, setVisibleOrders] = useState<number>(12);

  // --------------------------------------------------------------------------
  // Hooks & Context
  // --------------------------------------------------------------------------
  const { token } = useAuth();
  const { orders, loading, error, fetchOrders } = useOrders(token, filter);
  const { updateOrderStatus } = useOrderWebSocket(token, fetchOrders);
  const { deductIngredientsForOrder } = useInventoryDeduction();

  // --------------------------------------------------------------------------
  // Refs (Stable References to Avoid Closure Issues)
  // --------------------------------------------------------------------------
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const ordersRef = useRef(orders);
  const apiUrlRef = useRef(API_URL);
  const tokenRef = useRef(token);
  const deductIngredientsRef = useRef(deductIngredientsForOrder);
  const updateOrderStatusRef = useRef(updateOrderStatus);

  // Keep refs synchronised with the latest state / prop values
  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  useEffect(() => {
    apiUrlRef.current = API_URL;
  }, [API_URL]);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  useEffect(() => {
    deductIngredientsRef.current = deductIngredientsForOrder;
  }, [deductIngredientsForOrder]);

  useEffect(() => {
    updateOrderStatusRef.current = updateOrderStatus;
  }, [updateOrderStatus]);

  // --------------------------------------------------------------------------
  // Data Fetching
  // --------------------------------------------------------------------------

  /**
   * Memoised fetchOrders callback – prevents infinite loops in useEffect.
   * Dependencies: none – the function itself is stable.
   */
  const memoizedFetchOrders = useCallback(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Initial load and refetch when filter changes
  useEffect(() => {
    memoizedFetchOrders();
  }, [memoizedFetchOrders]);

  // Reset visible orders when filter changes
  useEffect(() => {
    setVisibleOrders(12);
  }, [filter]);

  // --------------------------------------------------------------------------
  // Event Handlers (Memoised, Stable References)
  // --------------------------------------------------------------------------

  /**
   * Handles order status updates.
   * - Triggers inventory deduction when moving to "preparing".
   * - If deduction fails, asks the user for confirmation before proceeding.
   * - Always uses refs to avoid stale closures and unnecessary re‑renders.
   *
   * @param {string} orderId - ID of the order to update.
   * @param {string} newStatus - Target status.
   */
  const handleStatusUpdate = useCallback(
    async (orderId: string, newStatus: string) => {
      const order = ordersRef.current.find((o) => o._id === orderId);
      if (!order) return;

      try {
        // ----- Inventory Deduction (only when moving to "preparing") -----
        if (newStatus === "preparing" && order.status !== "preparing") {
          const deductionItems = order.items.map((item: any) => ({
            menuItemId: item.menuItem?._id || item.menuItem,
            quantity: item.quantity,
          }));

          const authToken = tokenRef.current;
          const apiUrl = apiUrlRef.current;

          if (authToken && apiUrl) {
            const deductionResult = await deductIngredientsRef.current(
              deductionItems,
              authToken,
              apiUrl,
            );

            if (!deductionResult.success) {
              setDeductionWarning(
                `Inventory deduction warning: ${deductionResult.error}`,
              );
              setShowDeductionWarning(true);

              const proceed = window.confirm(
                `Failed to deduct ingredients: ${deductionResult.error}\n\nDo you want to mark as preparing anyway?`,
              );

              if (!proceed) {
                return;
              }
            } else if (deductionResult.warning) {
              setDeductionWarning(deductionResult.warning);
              setShowDeductionWarning(true);
            }

            // Record deduction result on the order (for audit/logging)
            await fetch(`${apiUrl}/api/orders/${orderId}/inventory`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
              },
              body: JSON.stringify({
                deductionStatus: deductionResult.success
                  ? "completed"
                  : "failed",
                deductionData: deductionResult.data,
                warning: deductionResult.warning,
                timestamp: new Date().toISOString(),
              }),
            });
          }
        }

        // ----- Update Order Status via WebSocket -----
        updateOrderStatusRef.current(orderId, newStatus);
      } catch (error) {
        console.error("Error handling status update:", error);
        alert("Failed to update order status");
      }
    },
    [], // Intentionally empty – all dependencies are accessed via refs
  );

  /** Opens the quick statistics panel. */
  const handleStatsPanelOpen = useCallback(() => {
    setIsStatsPanelOpen(true);
  }, []);

  /** Closes the quick statistics panel. */
  const handleStatsPanelClose = useCallback(() => {
    setIsStatsPanelOpen(false);
  }, []);

  /** Dismisses the inventory deduction warning banner. */
  const handleDismissWarning = useCallback(() => {
    setShowDeductionWarning(false);
  }, []);

  /** Changes the active filter and resets pagination. */
  const handleFilterChange = useCallback((newFilter: string) => {
    setFilter(newFilter);
  }, []);

  /** Loads 12 more orders (lazy loading). */
  const handleLoadMore = useCallback(() => {
    setVisibleOrders((prev) => prev + 12);
  }, []);

  // --------------------------------------------------------------------------
  // Memoised Derived Data
  // --------------------------------------------------------------------------

  /**
   * Map of orders indexed by ID – enables O(1) lookups and prevents unnecessary
   * array iterations in the render loop.
   */
  const ordersMap = useMemo(() => {
    const map = new Map();
    orders.forEach((order) => {
      map.set(order._id, order);
    });
    return map;
  }, [orders]);

  /**
   * IDs of the orders that are currently visible (based on pagination).
   * Using IDs instead of full order objects minimises memo dependencies.
   */
  const visibleOrderIds = useMemo(
    () => orders.slice(0, visibleOrders).map((o) => o._id),
    [orders, visibleOrders],
  );

  // --------------------------------------------------------------------------
  // Conditional Rendering (Loading / Error / Empty)
  // --------------------------------------------------------------------------
  if (loading) {
    return <LoadingState type="orders" count={6} />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={fetchOrders} />;
  }

  // --------------------------------------------------------------------------
  // Main Render
  // --------------------------------------------------------------------------
  return (
    <div className="relative">
      {/* -------------------- Inventory Warning Banner -------------------- */}
      {showDeductionWarning && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
            <p className="text-yellow-800 font-medium">Inventory Alert</p>
            <button
              onClick={handleDismissWarning}
              className="ml-auto text-yellow-600 hover:text-yellow-800"
            >
              ✕
            </button>
          </div>
          <p className="text-yellow-700 text-sm mt-1">{deductionWarning}</p>
        </div>
      )}

      {/* -------------------- Header & Action Buttons -------------------- */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kitchen Orders</h1>
        <div className="flex gap-2">
          <Link
            href="/analytics"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
          >
            📊 Full Analytics
          </Link>
          <button
            onClick={handleStatsPanelOpen}
            className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            📈 Quick Stats
          </button>
        </div>
      </div>

      {/* -------------------- Status Filter Buttons -------------------- */}
      <FilterButtons filter={filter} setFilter={handleFilterChange} />

      {/* -------------------- Order Grid -------------------- */}
      {orders.length === 0 ? (
        <EmptyState
          title="No Orders Found"
          message={
            filter === "all"
              ? "No orders have been placed yet."
              : `No orders with status "${filter}".`
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleOrderIds.map((orderId) => {
              const order = ordersMap.get(orderId);
              if (!order) return null;

              return (
                <OrderCardWrapper
                  key={orderId}
                  orderId={orderId}
                  initialOrder={order}
                  onStatusUpdate={handleStatusUpdate}
                />
              );
            })}
          </div>

          {/* -------------------- Load More (Lazy Loading) -------------------- */}
          {visibleOrders < orders.length && (
            <div className="flex justify-center mt-8">
              <button
                onClick={handleLoadMore}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors"
              >
                Load More Orders ({orders.length - visibleOrders} remaining)
              </button>
            </div>
          )}
        </>
      )}

      {/* -------------------- Quick Stats Modal -------------------- */}
      <KitchenStatsPanel
        isOpen={isStatsPanelOpen}
        onClose={handleStatsPanelClose}
      />
    </div>
  );
};

// ============================================================================
// Export – Memoised to prevent parent re‑renders from affecting this component
// ============================================================================
export default memo(KitchenDisplaySystem);
