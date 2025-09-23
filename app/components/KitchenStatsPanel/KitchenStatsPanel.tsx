"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { StatsData, KitchenStatsPanelProps } from "@/app/types/state";

const KitchenStatsPanel = ({ isOpen, onClose }: KitchenStatsPanelProps) => {
  const { token } = useAuth();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = (process.env.API_URL as string) || "http://localhost:5000";

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/orders/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch statistics");
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load statistics"
      );
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

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl border-l border-gray-200 z-50">
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
        <h2 className="text-lg font-bold">Kitchen Analytics</h2>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-300 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="p-4 overflow-y-auto h-full">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-red-600 text-center p-4">{error}</div>
        ) : stats ? (
          <div className="space-y-6">
            {/* Earnings Section */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Earnings</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                  <span className="text-sm font-medium">Today</span>
                  <span className="font-bold text-green-700">
                    ${stats.dailyEarnings.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                  <span className="text-sm font-medium">This Week</span>
                  <span className="font-bold text-blue-700">
                    ${stats.weeklyEarnings.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                  <span className="text-sm font-medium">This Year</span>
                  <span className="font-bold text-purple-700">
                    ${stats.yearlyEarnings.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Best Sellers Section */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Top Dishes</h3>
              <div className="space-y-2">
                {stats.bestSellingDishes.map((dish, index) => (
                  <div
                    key={dish.name}
                    className="flex justify-between items-center p-2 bg-white border rounded hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="flex items-center justify-center w-6 h-6 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium truncate max-w-[120px]">
                        {dish.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-600">
                        {dish.quantity} orders
                      </div>
                      <div className="text-xs font-semibold text-green-600">
                        ${dish.revenue.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default KitchenStatsPanel;
