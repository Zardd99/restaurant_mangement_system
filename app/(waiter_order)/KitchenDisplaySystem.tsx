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

const KitchenDisplaySystem = () => {
  const { token } = useAuth();
  const [filter, setFilter] = useState<string>("all");
  const [isStatsPanelOpen, setIsStatsPanelOpen] = useState(false);

  const { orders, loading, error, fetchOrders } = useOrders(token, filter);
  const { updateOrderStatus } = useOrderWebSocket(token, fetchOrders);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  if (loading) {
    return <LoadingState type="orders" count={6} />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={fetchOrders} />;
  }

  return (
    <div className="relative">
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
              onStatusUpdate={updateOrderStatus}
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
