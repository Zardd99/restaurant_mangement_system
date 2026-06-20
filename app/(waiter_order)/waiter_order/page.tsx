"use client";

import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { ProtectedRoute } from "../../presentation/components/ProtectedRoute/ProtectedRoute";
import WaiterOrderInterface from "../WaiterOrderInterface";
import KitchenDisplaySystem from "../KitchenDisplaySystem";
import { SocketProvider } from "@/app/contexts/SocketContext";
import { WebSocketProvider } from "@/app/contexts/WebSocketContext";

const WaiterOrderPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"order" | "kitchen">("order");

  if (!user || !["waiter", "admin", "manager", "chef"].includes(user.role)) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="bg-white rounded-xl border border-red-200 p-8 text-center max-w-sm">
            <h2 className="text-xl font-bold text-red-600 mb-2">Access Denied</h2>
            <p className="text-gray-600 text-sm">You don&apos;t have permission to access this page.</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
        {/* Page header with inline tabs */}
        <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-2.5 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-base font-bold text-gray-900 leading-tight">Waiter Order System</h1>
            <p className="text-xs text-gray-400">Place and track orders</p>
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("order")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === "order"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Take Order
            </button>
            <button
              onClick={() => setActiveTab("kitchen")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === "kitchen"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Kitchen
            </button>
          </div>
        </div>

        {/* Full-height content */}
        <div className="flex-1 overflow-hidden">
          <SocketProvider>
            <WebSocketProvider>
              {activeTab === "order" ? <WaiterOrderInterface /> : <KitchenDisplaySystem />}
            </WebSocketProvider>
          </SocketProvider>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default WaiterOrderPage;
