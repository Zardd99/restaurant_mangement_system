"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

interface StatsData {
  dailyEarnings: number;
  weeklyEarnings: number;
  yearlyEarnings: number;
  todayOrderCount: number;
  avgOrderValue: number;
  ordersByStatus: Record<string, number>;
  bestSellingDishes: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  message?: string;
}

interface KitchenStatsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const KitchenStatsPanel = ({ isOpen, onClose }: KitchenStatsPanelProps) => {
  const { token } = useAuth();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!token) {
        throw new Error("No authentication token found");
      }

      // Use provided API URL or fallback to same-origin API route
      const base = API_URL ? String(API_URL).replace(/\/$/, "") : "";
      const url = base ? `${base}/api/orders/stats` : `/api/orders/stats`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          // When using ngrok tunnels, this header prevents ngrok's HTML warning page
          // from being returned for API requests in the browser
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      });

      const contentType = response.headers.get("content-type") || "";

      // If the server didn't return JSON (e.g. an HTML error page), capture it
      let data: any = null;
      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error("Expected JSON response but received:", text);
        throw new Error(
          `Expected JSON response but received ${response.status} ${response.statusText}`,
        );
      }

      if (!response.ok) {
        const errorMessage =
          (data && data.message) ||
          `Error ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      console.log("Received stats data:", data);
      setStats(data);
    } catch (err) {
      console.error("Error fetching stats:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load statistics",
      );

      // Set default stats on error
      setStats({
        dailyEarnings: 0,
        weeklyEarnings: 0,
        yearlyEarnings: 0,
        todayOrderCount: 0,
        avgOrderValue: 0,
        ordersByStatus: {},
        bestSellingDishes: [],
        message: "Using default statistics",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStats();

      // Refresh every 30 seconds while panel is open
      const interval = setInterval(fetchStats, 30000);
      return () => clearInterval(interval);
    }
  }, [isOpen, token]);

  if (!isOpen) return null;

  // Status colors
  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    preparing: "bg-purple-100 text-purple-800",
    ready: "bg-green-100 text-green-800",
    served: "bg-teal-100 text-teal-800",
    cancelled: "bg-red-100 text-red-800",
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl border-l border-gray-200 z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold">Kitchen Analytics</h2>
          <p className="text-xs text-gray-300 mt-1">Real-time statistics</p>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-300 transition-colors p-1"
          aria-label="Close panel"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="p-4 overflow-y-auto h-[calc(100%-64px)]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40 space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 text-sm">Loading statistics...</p>
          </div>
        ) : error ? (
          <div className="text-center p-4">
            <div className="text-yellow-500 mb-2">⚠️</div>
            <p className="text-red-600 mb-2">{error}</p>
            <p className="text-gray-500 text-sm mb-4">
              Showing default statistics
            </p>
            <button
              onClick={fetchStats}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
            >
              Retry
            </button>
          </div>
        ) : stats ? (
          <div className="space-y-6">
            {/* Message if any */}
            {stats.message && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-yellow-800 text-sm">{stats.message}</p>
              </div>
            )}

            {/* Today's Summary */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wider">
                Today's Summary
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col p-3 bg-blue-50 rounded border border-blue-100">
                  <span className="text-xs font-medium text-blue-600 mb-1">
                    Total Orders
                  </span>
                  <span className="font-bold text-blue-800 text-xl">
                    {stats.todayOrderCount}
                  </span>
                </div>
                <div className="flex flex-col p-3 bg-green-50 rounded border border-green-100">
                  <span className="text-xs font-medium text-green-600 mb-1">
                    Avg Order Value
                  </span>
                  <span className="font-bold text-green-800 text-xl">
                    {formatCurrency(stats.avgOrderValue)}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Status Breakdown */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wider">
                Order Status (Today)
              </h3>
              <div className="space-y-2">
                {Object.entries(stats.ordersByStatus).length > 0 ? (
                  Object.entries(stats.ordersByStatus).map(
                    ([status, count]) => (
                      <div
                        key={status}
                        className={`flex justify-between items-center p-3 rounded border ${
                          statusColors[status] || "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <span className="text-sm font-medium capitalize">
                          {status}
                        </span>
                        <span className="font-bold">{count}</span>
                      </div>
                    ),
                  )
                ) : (
                  <div className="text-center p-3 bg-gray-50 rounded border border-gray-200">
                    <p className="text-gray-500 text-sm">No orders today</p>
                  </div>
                )}
              </div>
            </div>

            {/* Earnings Section */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wider">
                Earnings
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded border border-green-100">
                  <span className="text-sm font-medium text-green-700">
                    Today
                  </span>
                  <span className="font-bold text-green-800 text-lg">
                    {formatCurrency(stats.dailyEarnings)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded border border-blue-100">
                  <span className="text-sm font-medium text-blue-700">
                    This Week
                  </span>
                  <span className="font-bold text-blue-800 text-lg">
                    {formatCurrency(stats.weeklyEarnings)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded border border-purple-100">
                  <span className="text-sm font-medium text-purple-700">
                    This Year
                  </span>
                  <span className="font-bold text-purple-800 text-lg">
                    {formatCurrency(stats.yearlyEarnings)}
                  </span>
                </div>
              </div>
            </div>

            {/* Best Sellers Section */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wider">
                Top Dishes (All Time)
              </h3>
              <div className="space-y-2">
                {stats.bestSellingDishes.length > 0 ? (
                  stats.bestSellingDishes.map((dish, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-3 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center justify-center w-6 h-6 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">
                          {index + 1}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium truncate max-w-[120px]">
                            {dish.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {dish.quantity} sold
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-green-600">
                          {formatCurrency(dish.revenue)}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-3 bg-gray-50 rounded border border-gray-200">
                    <p className="text-gray-500 text-sm">No dishes sold yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={fetchStats}
                className="w-full py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
              >
                Refresh Statistics
              </button>
              <p className="text-xs text-gray-500 text-center mt-2">
                Updated every 30 seconds
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default KitchenStatsPanel;
