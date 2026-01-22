"use client";

import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { ProtectedRoute } from "../../presentation/components/ProtectedRoute/ProtectedRoute";
import WaiterOrderInterface from "../WaiterOrderInterface";
import KitchenDisplaySystem from "../KitchenDisplaySystem";
import { SocketProvider } from "@/app/contexts/SocketContext";
import { WebSocketProvider } from "@/app/contexts/WebSocketContext";

const WaiterOrderPage = () => {
  // context
  const { user } = useAuth();

  // state
  const [activeTab, setActiveTab] = useState<"order" | "kitchen">("order");

  // constants
  const allowedRoles = ["waiter", "admin", "manager", "chef"];

  // Roles check
  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto mt-18 px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Access Denied
            </h2>
            <p>You dont have permission to access this page.</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Main UI
  return (
    <ProtectedRoute>
      <div className="container mx-auto mt-18 px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Waiter Order System
          </h1>
          <p className="text-gray-600">
            Manage customer orders and track kitchen progress
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === "order"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("order")}
          >
            Take Order
          </button>
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === "kitchen"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("kitchen")}
          >
            Kitchen Display
          </button>
        </div>

        {/* Tab Content */}
        <SocketProvider>
          <WebSocketProvider>
            {activeTab === "order" ? (
              <WaiterOrderInterface />
            ) : (
              <KitchenDisplaySystem />
            )}
          </WebSocketProvider>
        </SocketProvider>
      </div>
    </ProtectedRoute>
  );
};

export default WaiterOrderPage;
