"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import FilterButtons from "./FilterButtons";
import LoadingState from "./common/LoadingState";
import ErrorState from "./common/ErrorState";
import EmptyState from "./common/EmptyState";
import OrderCard from "../components/OrderCard/OrderCard";
import KitchenStatsPanel from "../components/KitchenStatsPanel/KitchenStatsPanel";
import { useOrders } from "../hooks/useOrders";
import { useOrderWebSocket } from "../hooks/useOrderWebSocket";
import { useInventoryDeduction } from "../hooks/useInventoryDeduction";
import { AlertTriangle } from "lucide-react";

const KitchenDisplaySystem = () => {
  const { token } = useAuth();
  const [filter, setFilter] = useState<string>("all");
  const [isStatsPanelOpen, setIsStatsPanelOpen] = useState(false);
  const [showDeductionWarning, setShowDeductionWarning] = useState(false);
  const [deductionWarning, setDeductionWarning] = useState("");

  const { orders, loading, error, fetchOrders } = useOrders(token, filter);
  const { updateOrderStatus } = useOrderWebSocket(token, fetchOrders);
  const { deductIngredientsForOrder } = useInventoryDeduction();

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Enhanced status update that deducts ingredients when status changes to "preparing"
  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      // Find the current order
      const order = orders.find((o) => o._id === orderId);
      if (!order) return;

      // If status is changing to "preparing", deduct ingredients
      if (newStatus === "preparing" && order.status !== "preparing") {
        // Prepare items for deduction
        const deductionItems = order.items.map((item: any) => ({
          menuItemId: item.menuItem?._id || item.menuItem,
          quantity: item.quantity,
        }));

        const authToken = token;
        if (authToken && API_URL) {
          const deductionResult = await deductIngredientsForOrder(
            deductionItems,
            authToken,
            API_URL,
          );

          if (!deductionResult.success) {
            // Show warning but allow status update
            setDeductionWarning(
              `Inventory deduction warning: ${deductionResult.error}`,
            );
            setShowDeductionWarning(true);

            // Ask for confirmation to proceed
            const proceed = window.confirm(
              `Failed to deduct ingredients: ${deductionResult.error}\n\nDo you want to mark as preparing anyway?`,
            );

            if (!proceed) {
              return;
            }
          } else if (deductionResult.warning) {
            // Show warning but continue
            setDeductionWarning(deductionResult.warning);
            setShowDeductionWarning(true);
          }

          // Update the order with deduction information
          const updateResponse = await fetch(
            `${API_URL}/api/orders/${orderId}/inventory`,
            {
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
            },
          );

          if (!updateResponse.ok) {
            console.warn(
              "Failed to update order with inventory deduction info",
            );
          }
        }
      }

      // Update the order status via WebSocket
      updateOrderStatus(orderId, newStatus);
    } catch (error) {
      console.error("Error handling status update:", error);
      alert("Failed to update order status");
    }
  };

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
              onClick={() => setShowDeductionWarning(false)}
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
        <button
          onClick={() => setIsStatsPanelOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          📊 View Analytics
        </button>
      </div>

      <FilterButtons filter={filter} setFilter={setFilter} />

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              onStatusUpdate={handleStatusUpdate}
            />
          ))}
        </div>
      )}

      {/* Stats Panel */}
      <KitchenStatsPanel
        isOpen={isStatsPanelOpen}
        onClose={() => setIsStatsPanelOpen(false)}
      />
    </div>
  );
};

export default KitchenDisplaySystem;
