"use client";

import { useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useStats } from "../../../hooks/useStats";
import { BarChart3, DollarSign, Package, TrendingUp, X } from "lucide-react";

interface KitchenStatsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const KitchenStatsPanel = ({ isOpen, onClose }: KitchenStatsPanelProps) => {
  const { token } = useAuth();
  const { stats, loading, error, fetchStats } = useStats();

  useEffect(() => {
    if (isOpen && token) {
      fetchStats(token);
    }
  }, [isOpen, token, fetchStats]);

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6">
          <p>Loading statistics...</p>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    preparing: "bg-orange-100 text-orange-800",
    ready: "bg-green-100 text-green-800",
    served: "bg-purple-100 text-purple-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-end">
      <div className="bg-white w-full max-w-2xl h-full overflow-y-auto p-6 shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <BarChart3 className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">
              Kitchen Analytics
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Earnings Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Earnings Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Daily</p>
              <p className="text-2xl font-bold">
                ${stats?.dailyEarnings?.toFixed(2) || "0.00"}
              </p>
              <p className="text-sm text-gray-600">
                {stats?.todayOrderCount || 0} orders
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Weekly</p>
              <p className="text-2xl font-bold">
                ${stats?.weeklyEarnings?.toFixed(2) || "0.00"}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">Yearly</p>
              <p className="text-2xl font-bold">
                ${stats?.yearlyEarnings?.toFixed(2) || "0.00"}
              </p>
            </div>
          </div>
        </div>

        {/* Order Status */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">
            Today's Orders by Status
          </h3>
          <div className="flex flex-wrap gap-2">
            {stats?.ordersByStatus &&
              Object.entries(stats.ordersByStatus).map(([status, count]) => (
                <span
                  key={status}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[status] || "bg-gray-100 text-gray-800"}`}
                >
                  {status}: {count}
                </span>
              ))}
          </div>
        </div>

        {/* Best Selling Dishes */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Best Selling Dishes
          </h3>
          <div className="space-y-3">
            {stats?.bestSellingDishes && stats.bestSellingDishes.length > 0 ? (
              stats.bestSellingDishes.map((dish, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{dish.name}</p>
                    <p className="text-sm text-gray-600">
                      Sold: {dish.quantity} | Revenue: $
                      {dish.revenue.toFixed(2)}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                    #{index + 1}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">
                No sales data available
              </p>
            )}
          </div>
        </div>

        {/* Performance Metrics */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Performance Metrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Average Order Value</p>
              <p className="text-xl font-bold">
                ${stats?.avgOrderValue?.toFixed(2) || "0.00"}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Today's Orders</p>
              <p className="text-xl font-bold">{stats?.todayOrderCount || 0}</p>
            </div>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="mt-8">
          <button
            onClick={() => token && fetchStats(token)}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Refresh Analytics
          </button>
        </div>
      </div>
    </div>
  );
};

export default KitchenStatsPanel;
