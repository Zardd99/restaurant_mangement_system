// hooks/useInventoryDeduction.ts
import { useState } from "react";
import { APIIngredientRepository } from "../infrastructure/repositories/APIIngredientRepository";
import { DeductionRequest } from "../domain/repositories/IngredientRepository";

export interface OrderItemForDeduction {
  menuItemId: string;
  quantity: number;
}

export const useInventoryDeduction = () => {
  const [isDeducting, setIsDeducting] = useState(false);
  const [deductionError, setDeductionError] = useState<string | null>(null);

  const deductIngredientsForOrder = async (
    items: OrderItemForDeduction[],
    token: string | null,
    baseUrl: string,
  ) => {
    if (!token || items.length === 0) {
      return { success: false, error: "Invalid parameters" };
    }

    setIsDeducting(true);
    setDeductionError(null);

    try {
      const repo = new APIIngredientRepository(baseUrl, token);

      // First, check availability
      const availabilityResult = await repo.checkAvailability(
        items.map((item) => item.menuItemId),
        items.map((item) => item.quantity),
      );

      if (!availabilityResult.ok) {
        return {
          success: false,
          error: "Failed to check availability: " + availabilityResult.error,
        };
      }

      // FIX 1: Ensure availabilityResult.value is an array
      const availableItems = availabilityResult.value || [];
      const filteredItems = Array.isArray(availableItems)
        ? availableItems.filter((item) => !item.available)
        : [];

      if (filteredItems.length > 0) {
        const unavailableDetails = filteredItems
          .map(
            (item) =>
              `${item.menuItemName}: ${item.missingIngredients?.join(", ") || "Unknown ingredients"}`,
          )
          .join("\n");

        return {
          success: false,
          error: `Some items are unavailable:\n${unavailableDetails}`,
        };
      }

      // Convert to deduction requests
      const deductionRequests: DeductionRequest[] = items.map((item) => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
      }));

      // Preview the deduction - FIX 2: Ensure we handle the response properly
      const previewResult = await repo.previewDeduction(deductionRequests);

      if (!previewResult.ok) {
        console.error("Preview deduction failed:", previewResult.error);
        // Show user-friendly error
        return {
          success: false,
          error: "Could not check inventory levels. Please try again.",
        };
      }

      // FIX 3: Ensure previewResult.value is an array before using .filter()
      const previewItems = previewResult.value || [];
      if (!Array.isArray(previewItems)) {
        console.error("previewResult.value is not an array:", previewItems);
        // Continue anyway, as this might be a temporary API issue
        console.warn(
          "Skipping critical stock check due to invalid data format",
        );
      } else {
        // Check for critical stock levels
        const criticalItems = previewItems.filter(
          (item) =>
            item.needsReorder || item.remainingStock <= item.reorderPoint,
        );

        if (criticalItems.length > 0) {
          console.warn(
            "Order will trigger critical stock levels for:",
            criticalItems.map((item) => item.ingredientName).join(", "),
          );

          // Ask for confirmation if there are critical items
          const criticalMessage =
            `This order will reduce the following ingredients to critical levels:\n\n` +
            criticalItems
              .map(
                (item) =>
                  `${item.ingredientName}: ${item.remainingStock}${item.unit} remaining (Reorder point: ${item.reorderPoint}${item.unit})`,
              )
              .join("\n") +
            `\n\nDo you want to proceed anyway?`;

          const shouldProceed = window.confirm(criticalMessage);

          if (!shouldProceed) {
            return {
              success: false,
              error: "Order cancelled due to critical stock levels",
            };
          }
        }
      }

      // Perform the actual deduction
      const deductionResult = await repo.deductIngredients(deductionRequests);
      if (!deductionResult.ok) {
        return {
          success: false,
          error: "Failed to deduct ingredients: " + deductionResult.error,
        };
      }

      return {
        success: true,
        data: deductionResult.value,
        warning:
          Array.isArray(previewItems) &&
          previewItems.some((item) => item.needsReorder)
            ? "Some ingredients are now at critical levels"
            : undefined,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Deduction error:", error);
      setDeductionError(errorMessage);

      // Show the dialog to mark as preparing anyway
      const shouldProceed = window.confirm(
        `Failed to deduct ingredients: ${errorMessage}\n\nDo you want to mark as preparing anyway?`,
      );

      return {
        success: shouldProceed,
        error: shouldProceed ? undefined : errorMessage,
      };
    } finally {
      setIsDeducting(false);
    }
  };

  const checkMenuItemAvailability = async (
    menuItemId: string,
    quantity: number,
    token: string | null,
    baseUrl: string,
  ) => {
    if (!token) {
      return { available: false, error: "No authentication token" };
    }

    try {
      const repo = new APIIngredientRepository(baseUrl, token);
      const result = await repo.checkAvailability([menuItemId], [quantity]);

      if (!result.ok) {
        return { available: false, error: result.error };
      }

      // Ensure value is an array
      const items = result.value || [];
      if (!Array.isArray(items) || items.length === 0) {
        return { available: false, error: "Invalid response format" };
      }

      return {
        available: items[0]?.available || false,
        missingIngredients: items[0]?.missingIngredients,
        menuItemName: items[0]?.menuItemName,
      };
    } catch (error) {
      return {
        available: false,
        error: error instanceof Error ? error.message : "Check failed",
      };
    }
  };

  return {
    deductIngredientsForOrder,
    checkMenuItemAvailability,
    isDeducting,
    deductionError,
    clearError: () => setDeductionError(null),
  };
};
