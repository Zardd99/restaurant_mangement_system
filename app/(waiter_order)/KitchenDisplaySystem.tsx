"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import FilterButtons from "./FilterButtons";
import LoadingState from "./common/LoadingState";
import ErrorState from "./common/ErrorState";
import EmptyState from "./common/EmptyState";
import OrderCard from "../components/OrderCard/OrderCard";
import { useOrderWebSocket } from "../hooks/useOrderWebSocket";
import { useOrders } from "../hooks/useOrders";

export interface OrderItem {
  menuItem: {
    _id: string;
    name: string;
    price: number;
  };
  quantity: number;
  specialInstructions?: string;
  price: number;
}

export interface Order {
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
  const { token } = useAuth();
  const [filter, setFilter] = useState<string>("all");
  const { orders, loading, error, fetchOrders } = useOrders(token, filter);
  const { updateOrderStatus } = useOrderWebSocket(token, fetchOrders);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Loading state
  if (loading) {
    return <LoadingState type="orders" count={6} />;
  }

  // Error state
  if (error) {
    return <ErrorState error={error} onRetry={fetchOrders} />;
  }

  return (
    <div>
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
    </div>
  );
};

export default KitchenDisplaySystem;
