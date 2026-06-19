"use client";

import { useState } from "react";
import { Bell, Trash2 } from "lucide-react";
import {
  useNotifications,
  OrderNotification,
  NotificationType,
} from "../contexts/NotificationContext";

const TYPE_CONFIG: Record<
  NotificationType,
  { icon: string; label: string; borderColor: string; iconBg: string; labelColor: string; badgeBg: string }
> = {
  order_created: {
    icon: "🆕",
    label: "New Order",
    borderColor: "border-blue-400",
    iconBg: "bg-blue-100",
    labelColor: "text-blue-700",
    badgeBg: "bg-blue-100 text-blue-700",
  },
  order_preparing: {
    icon: "👨‍🍳",
    label: "Now Preparing",
    borderColor: "border-amber-400",
    iconBg: "bg-amber-100",
    labelColor: "text-amber-700",
    badgeBg: "bg-amber-100 text-amber-700",
  },
  order_ready: {
    icon: "✅",
    label: "Ready to Serve",
    borderColor: "border-green-400",
    iconBg: "bg-green-100",
    labelColor: "text-green-700",
    badgeBg: "bg-green-100 text-green-700",
  },
  order_served: {
    icon: "🍽️",
    label: "Order Served",
    borderColor: "border-gray-400",
    iconBg: "bg-gray-100",
    labelColor: "text-gray-600",
    badgeBg: "bg-gray-100 text-gray-600",
  },
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  manager: "Manager",
  chef: "Chef",
  waiter: "Waiter",
  cashier: "Cashier",
  customer: "Customer",
};

const FILTER_TABS: { value: NotificationType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "order_created", label: "New Orders" },
  { value: "order_preparing", label: "Preparing" },
  { value: "order_ready", label: "Ready" },
  { value: "order_served", label: "Served" },
];

function formatTime(iso: string): string {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function NotificationCard({ notification }: { notification: OrderNotification }) {
  const config = TYPE_CONFIG[notification.type];
  const roleLabel = ROLE_LABELS[notification.actor.role] ?? notification.actor.role;

  return (
    <div className={`flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-100 border-l-4 ${config.borderColor} shadow-sm`}>
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg ${config.iconBg}`}>
        {config.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.badgeBg}`}>
            {config.label}
          </span>
          <span className="text-xs text-gray-400">{formatTime(notification.timestamp)}</span>
        </div>

        <p className="text-sm font-medium text-gray-800 mt-1">
          {notification.tableNumber
            ? `Table ${notification.tableNumber}`
            : notification.customerName ?? "Takeaway / Delivery"}
          {notification.itemCount > 0 && (
            <span className="text-gray-500 font-normal">
              {" · "}{notification.itemCount} {notification.itemCount === 1 ? "item" : "items"}
            </span>
          )}
        </p>

        <p className="text-xs text-gray-500 mt-0.5">
          By <span className="font-medium text-gray-700">{notification.actor.name}</span>
          <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
            {roleLabel}
          </span>
        </p>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const { history, clearHistory } = useNotifications();
  const [activeFilter, setActiveFilter] = useState<NotificationType | "all">("all");

  const filtered = activeFilter === "all"
    ? history
    : history.filter((n) => n.type === activeFilter);

  return (
    <div className="min-h-screen bg-gray-50 p-6 mt-18">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              <p className="text-sm text-gray-500">{history.length} total received this session</p>
            </div>
          </div>

          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear all
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {FILTER_TABS.map((tab) => {
            const count = tab.value === "all"
              ? history.length
              : history.filter((n) => n.type === tab.value).length;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveFilter(tab.value)}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                  activeFilter === tab.value
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                    activeFilter === tab.value ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-500"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700">No notifications yet</h3>
            <p className="text-sm text-gray-400 mt-1">
              Order events will appear here in real time.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((n) => (
              <NotificationCard key={n.id} notification={n} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
