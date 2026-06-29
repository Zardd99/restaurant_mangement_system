"use client";

import { CheckCircle } from "lucide-react";
import type { BillingOrder } from "../types";
import { fmt, labelFor, orderLabel, round2, timeAgo } from "../utils";

// Pending / Paid-today order list (left column of the live billing tabs).
export function OrderList({
  orders,
  loading,
  error,
  selectedId,
  tab,
  onSelect,
}: {
  orders: BillingOrder[];
  loading: boolean;
  error: string | null;
  selectedId: string | null;
  tab: "pending" | "paid";
  onSelect: (order: BillingOrder) => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <span className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-center text-sm text-red-500">{error}</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-2 text-gray-400">
        <CheckCircle className="w-8 h-8" />
        <p className="text-sm font-medium">
          {tab === "paid" ? "No payments today yet" : "No pending payments"}
        </p>
      </div>
    );
  }

  return (
    <>
      {orders.map((order) => (
        <button
          key={order._id}
          onClick={() => onSelect(order)}
          className={`w-full text-left px-4 py-4 border-b border-gray-100 transition-colors ${
            selectedId === order._id
              ? "bg-blue-50 border-l-4 border-l-blue-500"
              : "hover:bg-gray-50 border-l-4 border-l-transparent"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-gray-900 text-sm">
              {orderLabel(order)}
            </span>
            <span className="font-bold text-gray-900 text-sm">
              ${fmt(order.totalAmount)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 capitalize">
              {order.orderType.replace("-", " ")} · {order.items.length} item
              {order.items.length !== 1 ? "s" : ""}
            </span>
            <span className="text-xs text-gray-400">
              {timeAgo(order.updatedAt)}
            </span>
          </div>
          {order.paymentStatus === "paid" && order.paymentMethod && (
            <div className="mt-1.5">
              <span className="text-xs text-green-600 font-medium bg-green-50 rounded px-1.5 py-0.5">
                {labelFor[order.paymentMethod]}
              </span>
            </div>
          )}
          {order.paymentStatus === "partially_paid" && (
            <div className="mt-1.5">
              <span className="text-xs text-blue-600 font-medium bg-blue-50 rounded px-1.5 py-0.5">
                Partial · $
                {fmt(round2(order.totalAmount - (order.amountPaid ?? 0)))} due
              </span>
            </div>
          )}
        </button>
      ))}
    </>
  );
}
