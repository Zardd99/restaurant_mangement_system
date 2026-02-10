"use client";

import { useEffect, useState, useCallback, memo, useMemo, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import FilterButtons from "./FilterButtons";
import LoadingState from "./common/LoadingState";
import ErrorState from "./common/ErrorState";
import EmptyState from "./common/EmptyState";
import OrderCard from "../presentation/components/OrderCard/OrderCard";
import KitchenStatsPanel from "../presentation/components/KitchenStatsPanel/KitchenStatsPanel";
import { useOrders } from "../hooks/useOrders";
import { useOrderWebSocket } from "../hooks/useOrderWebSocket";
import { useInventoryDeduction } from "../hooks/useInventoryDeduction";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

// Individual order wrapper that manages its own data
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

    // Update local order when initialOrder changes
    useEffect(() => {
      setOrder(initialOrder);
    }, [initialOrder]);

    return <OrderCard order={order} onStatusUpdate={onStatusUpdate} />;
  },
  (prevProps, nextProps) => {
    // Only re-render if this specific order changed
    return (
      prevProps.orderId === nextProps.orderId &&
      prevProps.initialOrder._id === nextProps.initialOrder._id &&
      prevProps.initialOrder.status === nextProps.initialOrder.status &&
      prevProps.initialOrder.items === nextProps.initialOrder.items &&
      prevProps.onStatusUpdate === nextProps.onStatusUpdate
    );
  },
);

OrderCardWrapper.displayName = "OrderCardWrapper";

const KitchenDisplaySystem = () => {
  const { token } = useAuth();
  const [filter, setFilter] = useState<string>("all");
  const [isStatsPanelOpen, setIsStatsPanelOpen] = useState(false);
  const [showDeductionWarning, setShowDeductionWarning] = useState(false);
  const [deductionWarning, setDeductionWarning] = useState("");
  const [visibleOrders, setVisibleOrders] = useState<number>(12);

  const { orders, loading, error, fetchOrders } = useOrders(token, filter);
  const { updateOrderStatus } = useOrderWebSocket(token, fetchOrders);
  const { deductIngredientsForOrder } = useInventoryDeduction();

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Use refs to store values without causing re-renders
  const ordersRef = useRef(orders);
  const apiUrlRef = useRef(API_URL);
  const tokenRef = useRef(token);
  const deductIngredientsRef = useRef(deductIngredientsForOrder);
  const updateOrderStatusRef = useRef(updateOrderStatus);

  // Keep refs in sync
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

  // Memoize fetchOrders to prevent infinite loops
  const memoizedFetchOrders = useCallback(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    memoizedFetchOrders();
  }, [memoizedFetchOrders]);

  // Create a STABLE status update handler with NO dependencies on orders
  const handleStatusUpdate = useCallback(
    async (orderId: string, newStatus: string) => {
      // Find the order from the ref (not from state)
      const order = ordersRef.current.find((o) => o._id === orderId);
      if (!order) return;

      try {
        // If status is changing to "preparing", deduct ingredients
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

            // Update the order with deduction information
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

        // Update the order status via WebSocket using ref
        updateOrderStatusRef.current(orderId, newStatus);
      } catch (error) {
        console.error("Error handling status update:", error);
        alert("Failed to update order status");
      }
    },
    [], // NO DEPENDENCIES - completely stable!
  );

  // Create a Map of orders by ID for O(1) lookup and referential stability
  const ordersMap = useMemo(() => {
    const map = new Map();
    orders.forEach((order) => {
      map.set(order._id, order);
    });
    return map;
  }, [orders]);

  // Memoize visible order IDs instead of orders
  const visibleOrderIds = useMemo(
    () => orders.slice(0, visibleOrders).map((o) => o._id),
    [orders, visibleOrders],
  );

  // Lazy load more orders when scrolling
  const handleLoadMore = useCallback(() => {
    setVisibleOrders((prev) => prev + 12);
  }, []);

  // Reset visible orders when filter changes
  useEffect(() => {
    setVisibleOrders(12);
  }, [filter]);

  // Memoize event handlers
  const handleStatsPanelOpen = useCallback(() => {
    setIsStatsPanelOpen(true);
  }, []);

  const handleStatsPanelClose = useCallback(() => {
    setIsStatsPanelOpen(false);
  }, []);

  const handleDismissWarning = useCallback(() => {
    setShowDeductionWarning(false);
  }, []);

  // Memoize filter setter to prevent re-renders
  const handleFilterChange = useCallback((newFilter: string) => {
    setFilter(newFilter);
  }, []);

  if (loading) {
    return <LoadingState type="orders" count={6} />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={fetchOrders} />;
  }

  return (
    <div className="relative">
      {/* Deduction Warning Banner */}
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

      {/* Header with Stats Toggle */}
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

      <FilterButtons filter={filter} setFilter={handleFilterChange} />

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

          {/* Load More Button (Lazy Loading) */}
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

      {/* Stats Panel Modal */}
      <KitchenStatsPanel
        isOpen={isStatsPanelOpen}
        onClose={handleStatsPanelClose}
      />
    </div>
  );
};

export default memo(KitchenDisplaySystem);
