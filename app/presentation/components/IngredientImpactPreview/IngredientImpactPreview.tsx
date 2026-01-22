/**
 * UI Component: Ingredient Impact Preview
 *
 * Purpose: Display ingredient deduction preview before order confirmation
 * Dependencies: Only ViewModel types
 * Size: < 200 lines (UI component)
 */

import React from "react";
import { AlertTriangle, CheckCircle, Package } from "lucide-react";
import { IngredientImpact } from "../../../services/IngredientDeductionService";

interface IngredientImpactPreviewProps {
  impacts: IngredientImpact[];
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export const IngredientImpactPreview: React.FC<
  IngredientImpactPreviewProps
> = ({ impacts, onClose, onConfirm, isSubmitting }) => {
  const lowStockItems = impacts.filter((i) => i.isLowStock);
  const reorderItems = impacts.filter((i) => i.needsReorder);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Ingredient Impact Preview
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Review ingredient usage before confirming order
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Warnings */}
          {(lowStockItems.length > 0 || reorderItems.length > 0) && (
            <div className="mb-6 space-y-3">
              {lowStockItems.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
                    <div>
                      <h4 className="font-semibold text-red-900">
                        Low Stock Alert
                      </h4>
                      <p className="text-sm text-red-700 mt-1">
                        {lowStockItems.length} ingredient(s) will be below
                        minimum stock
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {reorderItems.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Package className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
                    <div>
                      <h4 className="font-semibold text-yellow-900">
                        Reorder Needed
                      </h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        {reorderItems.length} ingredient(s) need reordering
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Impact List */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Ingredient Usage</h4>
            {impacts.map((impact) => (
              <div
                key={impact.ingredientId}
                className={`border rounded-lg p-4 ${
                  impact.isLowStock
                    ? "border-red-200 bg-red-50"
                    : impact.needsReorder
                      ? "border-yellow-200 bg-yellow-50"
                      : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h5 className="font-medium text-gray-900">
                        {impact.ingredientName}
                      </h5>
                      {impact.isLowStock && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                          Low Stock
                        </span>
                      )}
                      {!impact.isLowStock && impact.needsReorder && (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                          Reorder
                        </span>
                      )}
                    </div>
                    <div className="mt-2 space-y-1 text-sm">
                      <div className="flex justify-between text-gray-600">
                        <span>Will consume:</span>
                        <span className="font-medium">
                          {impact.consumedQuantity} {impact.unit}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Remaining:</span>
                        <span
                          className={`font-medium ${
                            impact.isLowStock ? "text-red-600" : "text-gray-900"
                          }`}
                        >
                          {impact.remainingStock} {impact.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 bg-gray-900 text-white rounded-lg hover:bg-black disabled:opacity-50 font-medium flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Confirm Order
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
