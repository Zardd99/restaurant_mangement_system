"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Bell, Trash2, Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { OrderNotification, NotificationType } from "../contexts/NotificationContext";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface PaginatedResponse {
  data: (OrderNotification & { _id: string; read: boolean })[];
  total: number;
  page: number;
  totalPages: number;
}

// -----------------------------------------------------------------------------
// Visual config (mirrors ToastCard)
// -----------------------------------------------------------------------------

const TYPE_CONFIG: Record<
  NotificationType,
  { icon: string; label: string; borderColor: string; badgeBg: string }
> = {
  order_created:   { icon: "🆕", label: "New Order",      borderColor: "border-blue-400",  badgeBg: "bg-blue-100 text-blue-700" },
  order_preparing: { icon: "👨‍🍳", label: "Now Preparing",  borderColor: "border-amber-400", badgeBg: "bg-amber-100 text-amber-700" },
  order_ready:     { icon: "✅", label: "Ready to Serve", borderColor: "border-green-400", badgeBg: "bg-green-100 text-green-700" },
  order_served:    { icon: "🍽️", label: "Order Served",   borderColor: "border-gray-400",  badgeBg: "bg-gray-100 text-gray-600" },
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin", manager: "Manager", chef: "Chef",
  waiter: "Waiter", cashier: "Cashier", customer: "Customer",
};

const FILTER_TABS: { value: NotificationType | "all"; label: string }[] = [
  { value: "all",              label: "All" },
  { value: "order_created",   label: "New Orders" },
  { value: "order_preparing", label: "Preparing" },
  { value: "order_ready",     label: "Ready" },
  { value: "order_served",    label: "Served" },
];

const PAGE_LIMIT = 20;

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function formatTime(iso: string): string {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  if (diff < 60_000)     return "Just now";
  if (diff < 3_600_000)  return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

// -----------------------------------------------------------------------------
// NotificationRow
// -----------------------------------------------------------------------------

function NotificationRow({ n }: { n: OrderNotification & { read: boolean } }) {
  const cfg = TYPE_CONFIG[n.type];
  const roleLabel = ROLE_LABELS[n.actor.role] ?? n.actor.role;

  return (
    <div className={`flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-100 border-l-4 ${cfg.borderColor} shadow-sm`}>
      <div className="shrink-0 w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-lg">
        {cfg.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badgeBg}`}>
            {cfg.label}
          </span>
          {!n.read && (
            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" title="Unread" />
          )}
          <span className="text-xs text-gray-400 ml-auto">{formatTime(n.timestamp)}</span>
        </div>

        <p className="text-sm font-medium text-gray-800 mt-1">
          {n.tableNumber
            ? `Table ${n.tableNumber}`
            : n.customerName ?? "Takeaway / Delivery"}
          {n.itemCount > 0 && (
            <span className="text-gray-500 font-normal">
              {" · "}{n.itemCount} {n.itemCount === 1 ? "item" : "items"}
            </span>
          )}
        </p>

        <p className="text-xs text-gray-500 mt-0.5">
          By <span className="font-medium text-gray-700">{n.actor.name}</span>
          <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
            {roleLabel}
          </span>
        </p>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

export default function NotificationsPage() {
  const { axiosInstance } = useAuth();
  const axiosRef = useRef(axiosInstance);
  axiosRef.current = axiosInstance;

  const [items, setItems]             = useState<(OrderNotification & { _id: string; read: boolean })[]>([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [loading, setLoading]         = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<NotificationType | "all">("all");
  const [clearing, setClearing]       = useState(false);

  const fetchPage = useCallback(
    async (pageNum: number, replace: boolean) => {
      replace ? setLoading(true) : setLoadingMore(true);
      setError(null);
      try {
        const params = new URLSearchParams({ page: String(pageNum), limit: String(PAGE_LIMIT) });
        if (activeFilter !== "all") params.set("type", activeFilter);
        const res = await axiosRef.current.get<PaginatedResponse>(`/api/notifications?${params}`);
        const { data, total: t, totalPages: tp } = res.data;
        setItems((prev) => replace ? data : [...prev, ...data]);
        setTotal(t);
        setTotalPages(tp);
        setPage(pageNum);
      } catch {
        setError("Failed to load notifications. Please try again.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [activeFilter],
  );

  useEffect(() => {
    fetchPage(1, true);
  }, [fetchPage]);

  async function handleClearAll() {
    setClearing(true);
    try {
      await axiosInstance.delete("/api/notifications");
      setItems([]);
      setTotal(0);
      setTotalPages(1);
      setPage(1);
    } catch {
      setError("Failed to clear notifications.");
    } finally {
      setClearing(false);
    }
  }

  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6 mt-18">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              <p className="text-sm text-gray-500">{total} total in database</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchPage(1, true)}
              className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {total > 0 && (
              <button
                onClick={handleClearAll}
                disabled={clearing}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                {clearing
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Trash2 className="w-4 h-4" />}
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {FILTER_TABS.map((tab) => (
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
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 bg-white rounded-xl border border-gray-100 animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && items.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700">No notifications yet</h3>
            <p className="text-sm text-gray-400 mt-1">Order events will appear here in real time.</p>
          </div>
        )}

        {/* Notification list */}
        {!loading && items.length > 0 && (
          <>
            <div className="flex flex-col gap-3">
              {items.map((n) => (
                <NotificationRow key={n._id} n={n} />
              ))}
            </div>

            {page < totalPages && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => fetchPage(page + 1, false)}
                  disabled={loadingMore}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loadingMore ? "Loading…" : `Load more (${total - items.length} remaining)`}
                </button>
              </div>
            )}

            <p className="text-center text-xs text-gray-400 mt-4">
              Showing {items.length} of {total}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
