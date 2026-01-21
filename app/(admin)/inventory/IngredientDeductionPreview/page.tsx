"use client";

import React, { useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { DeductionRequest } from "../../../domain/repositories/IngredientRepository";
import { APIIngredientRepository } from "../../../infrastructure/repositories/APIIngredientRepository";

interface IngredientDeductionPreviewProps {
  requests: DeductionRequest[];
  onConfirm: (results: any[]) => void;
  onCancel: () => void;
}

export const IngredientDeductionPreview: React.FC<
  IngredientDeductionPreviewProps
> = ({ requests, onConfirm, onCancel }) => {
  const { token } = useAuth();
  const [previewResults, setPreviewResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPreview = async () => {
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
      const result = await repo.previewDeduction(requests);

      if (result.ok) {
        setPreviewResults(result.value);
      } else {
        setError(result.error || "Failed to preview deduction");
      }
    } catch (err) {
      setError("Network error while fetching preview");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!token) {
      setError("Authentication required");
      return;
    }

    try {
      setLoading(true);
      const repo = new APIIngredientRepository(
        process.env.NEXT_PUBLIC_API_URL || "",
        token,
      );
      const result = await repo.deductIngredients(requests);

      if (result.ok) {
        onConfirm(result.value);
      } else {
        setError(result.error || "Failed to deduct ingredients");
      }
    } catch (err) {
      setError("Network error while deducting ingredients");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalConsumption = () => {
    return previewResults.reduce(
      (total, item) => total + item.consumedQuantity,
      0,
    );
  };

  if (!token) {
    return (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Authentication Required
            </h3>
            <p className="text-gray-600 mb-4">
              Please log in to preview ingredient deduction.
            </p>
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            Ingredient Deduction Preview
          </h3>
          <p className="text-sm text-gray-500">
            Review the impact of this order on ingredient stock levels
          </p>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 text-red-400 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-gray-900">Order Summary</h4>
              <button
                onClick={fetchPreview}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Loading..." : "Refresh Preview"}
              </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Menu Items</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Consumption</p>
                  <p className="font-semibold">
                    {calculateTotalConsumption()} units
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ingredients Affected</p>
                  <p className="font-semibold">{previewResults.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Low Stock Items</p>
                  <p className="font-semibold text-yellow-600">
                    {previewResults.filter((r) => r.isLowStock).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Ingredient Impact</h4>

            {previewResults.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="mt-2">No preview data available</p>
                <p className="text-sm">
                  Click "Refresh Preview" to load deduction impact
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ingredient
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Stock
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Consuming
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Remaining
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewResults.map((result, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {result.ingredientName}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {result.ingredientId}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {result.currentStock} {result.unit}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          <span className="text-red-600 font-semibold">
                            -{result.consumedQuantity} {result.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {result.remainingStock} {result.unit}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {result.needsReorder ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              Needs Reorder
                            </span>
                          ) : result.isLowStock ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              Low Stock
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Sufficient
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {previewResults.some((r) => r.needsReorder || r.isLowStock) && (
              <div className="mt-6 p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                <h5 className="font-semibold text-yellow-800 mb-2 flex items-center">
                  <svg
                    className="h-5 w-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Stock Level Warnings
                </h5>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {previewResults
                    .filter((r) => r.needsReorder)
                    .map((result, index) => (
                      <li key={index}>
                        • {result.ingredientName} will drop to{" "}
                        {result.remainingStock}
                        {result.unit} - Critical level!
                      </li>
                    ))}
                  {previewResults
                    .filter((r) => r.isLowStock && !r.needsReorder)
                    .map((result, index) => (
                      <li key={index}>
                        • {result.ingredientName} will drop to{" "}
                        {result.remainingStock}
                        {result.unit} - Low stock warning
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || previewResults.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Processing..." : "Confirm Deduction"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IngredientDeductionPreview;
