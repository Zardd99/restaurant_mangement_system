"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import KitchenStatsPanel from "../../presentation/components/KitchenStatsPanel/KitchenStatsPanel";
import LoadingState from "../../(waiter_order)/common/LoadingState";
import ErrorState from "../../(waiter_order)/common/ErrorState";
import {
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  DollarSign,
  Package,
  Calendar,
  Download,
  RefreshCw,
  Home,
  Filter,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

const AnalyticsPage = () => {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStatsPanelOpen, setIsStatsPanelOpen] = useState(true);
  const [timeRange, setTimeRange] = useState<string>("today");
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Simulate loading delay for better UX
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // Handle retry for error state
  const handleRetry = useCallback(() => {
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
    }, 800);
  }, []);

  // Handle closing the stats panel (not used in full page, but kept for consistency)
  const handleStatsPanelClose = useCallback(() => {
    // In full page view, redirect back to kitchen
    window.location.href = "/waiter_order";
  }, []);

  // Handle time range change
  const handleTimeRangeChange = useCallback((range: string) => {
    setTimeRange(range);
    // Here you would typically refetch data based on the time range
    console.log(`Changed time range to: ${range}`);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header skeleton */}
          <div className="mb-8">
            <div className="h-8 w-64 bg-gray-200 rounded mb-4 animate-pulse"></div>
            <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
          </div>

          {/* Stats skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-xl border border-gray-200 animate-pulse"
              >
                <div className="h-4 w-24 bg-gray-200 rounded mb-3"></div>
                <div className="h-8 w-32 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 w-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>

          {/* Main content skeleton */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
            <div className="h-6 w-48 bg-gray-200 rounded mb-6"></div>
            <div className="h-64 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6 flex items-center justify-center">
        <div className="max-w-md w-full">
          <ErrorState error={error} onRetry={handleRetry} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
          <div className="flex items-center text-sm text-gray-600">
            <Link
              href="/kitchen"
              className="hover:text-blue-600 flex items-center"
            >
              <Home className="w-4 h-4 mr-1" />
              Kitchen
            </Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-gray-900 font-medium">
              Analytics Dashboard
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Kitchen Analytics Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Comprehensive overview of kitchen performance, order statistics,
                and operational metrics
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Data
              </button>
              <button
                onClick={() => (window.location.href = "/kitchen")}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center"
              >
                ← Back to Kitchen
              </button>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="mb-6">
            <div className="flex items-center mb-3">
              <Calendar className="w-5 h-5 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">
                Time Range:
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {["today", "yesterday", "week", "month", "quarter", "year"].map(
                (range) => (
                  <button
                    key={range}
                    onClick={() => handleTimeRangeChange(range)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${timeRange === range ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                  >
                    {range.charAt(0).toUpperCase() + range.slice(1)}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* Quick Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center mb-3">
                <div className="p-2 bg-green-50 rounded-lg mr-3">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-sm text-gray-500 font-medium">
                  Today&apos;s Revenue
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">$1,856.50</div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +12.5% from yesterday
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center mb-3">
                <div className="p-2 bg-blue-50 rounded-lg mr-3">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-sm text-gray-500 font-medium">
                  Total Orders
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">68</div>
              <div className="text-xs text-gray-500 mt-1">
                42 completed • 26 in progress
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center mb-3">
                <div className="p-2 bg-purple-50 rounded-lg mr-3">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-sm text-gray-500 font-medium">
                  Avg Prep Time
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">14m 23s</div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                -2m faster than avg
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center mb-3">
                <div className="p-2 bg-orange-50 rounded-lg mr-3">
                  <Package className="w-5 h-5 text-orange-600" />
                </div>
                <div className="text-sm text-gray-500 font-medium">
                  Top Dish
                </div>
              </div>
              <div className="text-xl font-bold text-gray-900">
                Classic Burger
              </div>
              <div className="text-xs text-gray-500 mt-1">
                28 sold • $425 revenue
              </div>
            </div>
          </div>
        </div>

        {/* Tabs for different analytics views */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <div className="flex flex-wrap gap-2">
              {[
                { id: "overview", label: "Overview", icon: BarChart3 },
                { id: "revenue", label: "Revenue", icon: DollarSign },
                { id: "orders", label: "Orders", icon: Users },
                { id: "efficiency", label: "Efficiency", icon: TrendingUp },
                { id: "inventory", label: "Inventory", icon: Package },
                { id: "comparison", label: "Comparison", icon: Filter },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-t-lg font-medium transition-colors flex items-center ${activeTab === tab.id ? "bg-white border-t border-l border-r border-gray-200 text-blue-600" : "text-gray-600 hover:text-blue-600"}`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Analytics Content */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
          <KitchenStatsPanel
            isOpen={isStatsPanelOpen}
            onClose={handleStatsPanelClose}
            isFullPage={true}
          />
        </div>

        {/* Additional Analytics Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Performance Trends
              </h2>
              <button className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center">
                <Download className="w-4 h-4 mr-1" />
                Export
              </button>
            </div>
            <div className="h-64 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-lg">
              <BarChart3 className="w-12 h-12 mb-3" />
              <p>Performance trends chart</p>
              <p className="text-sm mt-1">
                Hourly/daily order volume and efficiency metrics
              </p>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="font-semibold">Morning</div>
                <div className="text-green-600">+8% efficiency</div>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="font-semibold">Afternoon</div>
                <div className="text-blue-600">Peak hours</div>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="font-semibold">Evening</div>
                <div className="text-orange-600">High revenue</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Menu Item Analysis
              </h2>
              <button className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center">
                <Download className="w-4 h-4 mr-1" />
                Export
              </button>
            </div>
            <div className="h-64 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-lg">
              <Package className="w-12 h-12 mb-3" />
              <p>Menu item performance chart</p>
              <p className="text-sm mt-1">
                Top dishes, preparation times, and ingredient usage
              </p>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                <span>Classic Burger</span>
                <div className="flex items-center">
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden mr-3">
                    <div
                      className="h-full bg-green-500"
                      style={{ width: "85%" }}
                    ></div>
                  </div>
                  <span className="font-semibold">85%</span>
                </div>
              </div>
              <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                <span>Margherita Pizza</span>
                <div className="flex items-center">
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden mr-3">
                    <div
                      className="h-full bg-blue-500"
                      style={{ width: "72%" }}
                    ></div>
                  </div>
                  <span className="font-semibold">72%</span>
                </div>
              </div>
              <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                <span>Caesar Salad</span>
                <div className="flex items-center">
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden mr-3">
                    <div
                      className="h-full bg-yellow-500"
                      style={{ width: "65%" }}
                    ></div>
                  </div>
                  <span className="font-semibold">65%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Insights and Recommendations */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Insights & Recommendations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">
                  Revenue Opportunity
                </h3>
              </div>
              <p className="text-sm text-gray-600">
                Extend happy hour by 1 hour during weekdays to increase evening
                sales by estimated 15%.
              </p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <Clock className="w-4 h-4 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900">
                  Efficiency Improvement
                </h3>
              </div>
              <p className="text-sm text-gray-600">
                Prep time for top 3 dishes can be reduced by 2-3 minutes with
                optimized workflow.
              </p>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <Package className="w-4 h-4 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Inventory Alert</h3>
              </div>
              <p className="text-sm text-gray-600">
                Dairy inventory at 91% usage. Reorder recommended to avoid
                stockout.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center text-sm text-gray-500 bg-white p-4 rounded-lg border border-gray-200">
          <p>
            Analytics update in real-time. Data is collected from all order
            sources and kitchen operations.
            <span className="block mt-1">
              For detailed historical reports or custom analytics, contact your
              system administrator.
            </span>
          </p>
          <div className="flex items-center justify-center mt-3 text-xs">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span>Data refreshed automatically every 5 minutes</span>
            <div className="w-2 h-2 bg-blue-500 rounded-full mx-2"></div>
            <span>
              Last manual refresh:{" "}
              {new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
