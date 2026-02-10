"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { APIIngredientRepository } from "../../../infrastructure/repositories/APIIngredientRepository";
import { createEmailJSNotificationService } from "../../../services/emailjsNotificationService";
import { checkEmailJSConfig } from "../../../utils/emailjsConfig";

interface IngredientStock {
  id: string;
  name: string;
  currentStock: number;
  unit: string;
  minStock: number;
  reorderPoint: number;
  costPerUnit: number;
  isLowStock: boolean;
  needsReorder: boolean;
  usedIn: Array<{
    menuItemId: string;
    menuItemName: string;
    quantityRequired: number;
    unit: string;
  }>;
}

export const IngredientStockDashboard: React.FC = () => {
  const { token } = useAuth();
  const [ingredients, setIngredients] = useState<IngredientStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIngredient, setExpandedIngredient] = useState<string | null>(
    null,
  );
  const [filter, setFilter] = useState<"all" | "low" | "critical">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [emailService] = useState(() => createEmailJSNotificationService());
  const [emailStatus, setEmailStatus] = useState<{
    lastSent: Date | null;
    success: boolean;
    message?: string;
  }>({
    lastSent: null,
    success: false,
  });

  useEffect(() => {
    if (token) {
      fetchIngredientStock();
    }
  }, [token]);

  const fetchIngredientStock = async () => {
    if (!token) {
      setError("Authentication required");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const repo = new APIIngredientRepository(
        process.env.NEXT_PUBLIC_API_URL || "",
        token,
      );

      const dashboardResult = await repo.getDashboardData();

      if (!dashboardResult.ok) {
        throw new Error(
          dashboardResult.error || "Failed to fetch inventory data",
        );
      }

      const dashboardData = dashboardResult.value;

      if (!dashboardData?.inventory?.ingredients) {
        setIngredients([]);
        return;
      }

      const newIngredients = dashboardData.inventory.ingredients;
      setIngredients(newIngredients);

      // Send email alerts if there are low stock items
      const config = checkEmailJSConfig();
      if (config.isConfigured && config.managerEmail) {
        const lowStockItems = newIngredients.filter(
          (ing) => ing.isLowStock || ing.needsReorder,
        );

        if (lowStockItems.length > 0) {
          const alerts = lowStockItems.map((ing) => ({
            ingredientId: ing.id,
            ingredientName: ing.name,
            currentStock: ing.currentStock,
            minStock: ing.minStock,
            unit: ing.unit,
            reorderPoint: ing.reorderPoint,
            costPerUnit: ing.costPerUnit,
          }));

          const result = await emailService.sendLowStockAlert(alerts);

          setEmailStatus({
            lastSent: new Date(),
            success: result,
            message: result
              ? "Low stock alert sent successfully"
              : "Failed to send email alert",
          });

          if (result) {
            console.log("Low stock email notification sent");
          } else {
            console.warn("Failed to send email notification");
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch ingredients:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load ingredient data",
      );
      setIngredients([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredIngredients = ingredients.filter((ingredient) => {
    if (
      searchTerm &&
      !ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }

    switch (filter) {
      case "low":
        return ingredient.isLowStock;
      case "critical":
        return ingredient.needsReorder;
      default:
        return true;
    }
  });

  const getStockStatusColor = (ingredient: IngredientStock) => {
    if (ingredient.needsReorder)
      return "bg-red-100 text-red-800 border-red-300";
    if (ingredient.isLowStock)
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-green-100 text-green-800 border-green-300";
  };

  const getStockStatusText = (ingredient: IngredientStock) => {
    if (ingredient.needsReorder) return "Critical - Reorder Now";
    if (ingredient.isLowStock) return "Low Stock";
    return "In Stock";
  };

  const calculateTotalInventoryValue = () => {
    return ingredients.reduce((total, ingredient) => {
      return total + ingredient.currentStock * ingredient.costPerUnit;
    }, 0);
  };

  const handleReorder = async (ingredientId: string) => {
    if (!token) return;

    try {
      const repo = new APIIngredientRepository(
        process.env.NEXT_PUBLIC_API_URL || "",
        token,
      );

      const reorderResult = await repo.reorderIngredient(ingredientId);

      if (!reorderResult.ok) {
        throw new Error(reorderResult.error || "Failed to place reorder");
      }

      await fetchIngredientStock();
    } catch (err) {
      console.error("Failed to reorder:", err);
      setError(err instanceof Error ? err.message : "Reorder failed");
    }
  };

  const handleUpdateStock = async (ingredientId: string) => {
    if (!token) return;

    try {
      const newStock = prompt(
        `Enter new stock level for ingredient ${ingredientId}:`,
        "100",
      );

      if (newStock && !isNaN(parseFloat(newStock))) {
        const repo = new APIIngredientRepository(
          process.env.NEXT_PUBLIC_API_URL || "",
          token,
        );

        const updateResult = await repo.updateStock(
          ingredientId,
          parseFloat(newStock),
        );

        if (!updateResult.ok) {
          throw new Error(updateResult.error || "Failed to update stock");
        }

        console.log("Stock updated successfully");
        await fetchIngredientStock();
      }
    } catch (err) {
      console.error("Failed to update stock:", err);
      setError(err instanceof Error ? err.message : "Update failed");
    }
  };

  if (!token) {
    return (
      <div className="p-6 text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-800">
            Authentication Required
          </h3>
          <p className="text-yellow-600">Please log in to view inventory.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (ingredients.length === 0 && !loading && !error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No ingredients found
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            There are no ingredients in the inventory yet.
          </p>
          <button
            onClick={fetchIngredientStock}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-red-800">Error</h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchIngredientStock}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 mt-16">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Ingredient Inventory
          </h1>
          <p className="text-gray-600">Monitor stock levels and track usage</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Total Inventory Value</p>
          <p className="text-2xl font-bold text-green-600">
            ${calculateTotalInventoryValue().toFixed(2)}
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg ${filter === "all" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
          >
            All Ingredients
          </button>
          <button
            onClick={() => setFilter("low")}
            className={`px-4 py-2 rounded-lg ${filter === "low" ? "bg-yellow-600 text-white" : "bg-gray-100 text-gray-700"}`}
          >
            Low Stock
          </button>
          <button
            onClick={() => setFilter("critical")}
            className={`px-4 py-2 rounded-lg ${filter === "critical" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-700"}`}
          >
            Critical
          </button>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search ingredients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <svg
            className="absolute right-3 top-2.5 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <p className="text-sm text-gray-600">Total Ingredients</p>
          <p className="text-2xl font-bold">{ingredients.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <p className="text-sm text-gray-600">Low Stock Items</p>
          <p className="text-2xl font-bold text-yellow-600">
            {ingredients.filter((i) => i.isLowStock).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <p className="text-sm text-gray-600">Critical Items</p>
          <p className="text-2xl font-bold text-red-600">
            {ingredients.filter((i) => i.needsReorder).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <p className="text-sm text-gray-600">In Stock Items</p>
          <p className="text-2xl font-bold text-green-600">
            {ingredients.filter((i) => !i.isLowStock).length}
          </p>
        </div>
      </div>

      {/* Ingredient Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ingredient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost per Unit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Used In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredIngredients.map((ingredient) => (
                <React.Fragment key={ingredient.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {ingredient.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Min: {ingredient.minStock}
                            {ingredient.unit} | Reorder:{" "}
                            {ingredient.reorderPoint}
                            {ingredient.unit}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {ingredient.currentStock} {ingredient.unit}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                        <div
                          className={`h-2.5 rounded-full ${
                            ingredient.needsReorder
                              ? "bg-red-600"
                              : ingredient.isLowStock
                                ? "bg-yellow-500"
                                : "bg-green-600"
                          }`}
                          style={{
                            width: `${Math.min(100, (ingredient.currentStock / (ingredient.minStock * 2)) * 100)}%`,
                          }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStockStatusColor(ingredient)}`}
                      >
                        {getStockStatusText(ingredient)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${ingredient.costPerUnit.toFixed(2)}/{ingredient.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {ingredient.usedIn.length} menu items
                      </div>
                      <button
                        onClick={() =>
                          setExpandedIngredient(
                            expandedIngredient === ingredient.id
                              ? null
                              : ingredient.id,
                          )
                        }
                        className="text-sm text-blue-600 hover:text-blue-900"
                      >
                        {expandedIngredient === ingredient.id
                          ? "Hide details"
                          : "View details"}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleReorder(ingredient.id)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Reorder
                      </button>
                      <button
                        onClick={() => handleUpdateStock(ingredient.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Update Stock
                      </button>
                    </td>
                  </tr>
                  {expandedIngredient === ingredient.id && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 bg-gray-50">
                        <div className="space-y-4">
                          <h4 className="font-semibold text-gray-900">
                            Used in these menu items:
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {ingredient.usedIn.map((menuItem) => (
                              <div
                                key={menuItem.menuItemId}
                                className="bg-white p-3 rounded border"
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h5 className="font-medium text-gray-900">
                                      {menuItem.menuItemName}
                                    </h5>
                                    <p className="text-sm text-gray-600">
                                      Required: {menuItem.quantityRequired}{" "}
                                      {menuItem.unit}
                                    </p>
                                  </div>
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    ID: {menuItem.menuItemId}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default IngredientStockDashboard;
