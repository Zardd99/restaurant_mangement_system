"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { StatsData, KitchenStatsPanelProps } from "@/app/types/state";

const KitchenStatsPanel = ({ isOpen, onClose }: KitchenStatsPanelProps) => {
  const { token } = useAuth();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const fetchStats = async () => {
    if (!API_URL) {
      setError("API URL is not configured");
      setLoading(false);
      return;
    }

    if (!token) {
      setError("Authentication required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/orders/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          "ngrok-skip-browser-warning": "true",
        },
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `HTTP error! status: ${response.status}`
        );
      }

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch statistics");
      }

      setStats(data.data);
    } catch (err) {
      console.error("Fetch stats error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load statistics"
      );

      // Set empty stats on error for better UX
      setStats({
        dailyEarnings: 0,
        weeklyEarnings: 0,
        yearlyEarnings: 0,
        todayOrderCount: 0,
        avgOrderValue: 0,
        ordersByStatus: {},
        bestSellingDishes: [],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStats();
    }
  }, [isOpen, token]);

  if (!isOpen) return null;

  // Default order status colors
  const statusColors: Record<string, string> = {
    pending: "bg-yellow-50 text-yellow-700",
    confirmed: "bg-blue-50 text-blue-700",
    preparing: "bg-purple-50 text-purple-700",
    ready: "bg-green-50 text-green-700",
    delivered: "bg-teal-50 text-teal-700",
    cancelled: "bg-red-50 text-red-700",
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
            <div className="text-red-500 mb-2">⚠️</div>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchStats}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
            >
              Retry
            </button>
          </div>
        ) : stats ? (
          <div className="space-y-6">
            {/* Today's Summary */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wider">
                Todays Summary
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
                    ${stats.avgOrderValue.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Status Breakdown */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wider">
                Order Status
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
                    )
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
                    ${stats.dailyEarnings.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded border border-blue-100">
                  <span className="text-sm font-medium text-blue-700">
                    This Week
                  </span>
                  <span className="font-bold text-blue-800 text-lg">
                    ${stats.weeklyEarnings.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded border border-purple-100">
                  <span className="text-sm font-medium text-purple-700">
                    This Year
                  </span>
                  <span className="font-bold text-purple-800 text-lg">
                    ${stats.yearlyEarnings.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Best Sellers Section */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wider">
                Top Dishes
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
                          ${dish.revenue.toFixed(2)}
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
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default KitchenStatsPanel;
