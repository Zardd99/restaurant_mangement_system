/**
 * Custom React hook for inventory deduction operations.
 *
 * This hook encapsulates the logic for checking ingredient availability,
 * previewing the impact of an order, and actually deducting ingredients
 * from inventory. It communicates with an `APIIngredientRepository` and
 * manages loading/error states. It also provides a helper to check the
 * availability of a single menu item.
 *
 * @module useInventoryDeduction
 */

// ----------------------------------------------------------------------
// External Dependencies
// ----------------------------------------------------------------------
import { useState } from "react";

// ----------------------------------------------------------------------
// Internal Dependencies
// ----------------------------------------------------------------------
import { APIIngredientRepository } from "../infrastructure/repositories/APIIngredientRepository";
import { DeductionRequest } from "../domain/repositories/IngredientRepository";

// ----------------------------------------------------------------------
// Types & Interfaces
// ----------------------------------------------------------------------

/**
 * Represents an order item that requires ingredient deduction.
 */
export interface OrderItemForDeduction {
  /** Unique identifier of the menu item. */
  menuItemId: string;
  /** Quantity ordered. */
  quantity: number;
}

// ----------------------------------------------------------------------
// Hook Definition
// ----------------------------------------------------------------------

/**
 * Provides inventory deduction operations and state management.
 *
 * @returns An object containing:
 *  - `deductIngredientsForOrder`: Main function to process an order's ingredient deduction.
 *  - `checkMenuItemAvailability`: Helper to check availability of a single menu item.
 *  - `isDeducting`: Boolean indicating if a deduction operation is in progress.
 *  - `deductionError`: String error message, or null if no error.
 *  - `clearError`: Function to reset the error state.
 */
export const useInventoryDeduction = () => {
  // --------------------------------------------------------------------
  // Local State
  // --------------------------------------------------------------------
  const [isDeducting, setIsDeducting] = useState(false);
  const [deductionError, setDeductionError] = useState<string | null>(null);

  // --------------------------------------------------------------------
  // Public Methods
  // --------------------------------------------------------------------

  /**
   * Deducts ingredients for a list of order items.
   *
   * Workflow:
   * 1. Validates token and items.
   * 2. Checks availability for all items.
   * 3. Previews the deduction to identify critical stock levels.
   * 4. If critical items are found, asks for user confirmation.
   * 5. Performs the actual deduction.
   * 6. Handles errors and provides a fallback confirmation option.
   *
   * @param items - Array of order items to process.
   * @param token - Authentication token for API requests.
   * @param baseUrl - Base URL of the inventory API.
   * @returns A promise resolving to an object with:
   *  - `success`: boolean indicating if deduction succeeded.
   *  - `error`: optional error message.
   *  - `data`: optional response data from the deduction API.
   *  - `warning`: optional warning string if ingredients reached critical levels.
   */
  const deductIngredientsForOrder = async (
    items: OrderItemForDeduction[],
    token: string | null,
    baseUrl: string,
  ) => {
    // Early exit on invalid input
    if (!token || items.length === 0) {
      return { success: false, error: "Invalid parameters" };
    }

    setIsDeducting(true);
    setDeductionError(null);

    try {
      const repo = new APIIngredientRepository(baseUrl, token);

      // ------------------------------------------------------------------
      // Step 1: Check availability of all requested items
      // ------------------------------------------------------------------
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

      // Ensure the response value is an array (defensive programming)
      const availableItems = availabilityResult.value || [];
      const filteredItems = Array.isArray(availableItems)
        ? availableItems.filter((item) => !item.available)
        : [];

      // If any item is unavailable, return a detailed error
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

      // ------------------------------------------------------------------
      // Step 2: Prepare deduction requests
      // ------------------------------------------------------------------
      const deductionRequests: DeductionRequest[] = items.map((item) => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
      }));

      // ------------------------------------------------------------------
      // Step 3: Preview the deduction to detect critical stock levels
      // ------------------------------------------------------------------
      const previewResult = await repo.previewDeduction(deductionRequests);

      if (!previewResult.ok) {
        console.error("Preview deduction failed:", previewResult.error);
        // User-friendly message, do not block the order
        return {
          success: false,
          error: "Could not check inventory levels. Please try again.",
        };
      }

      // Defensive handling of preview response
      const previewItems = previewResult.value || [];
      if (!Array.isArray(previewItems)) {
        console.error("previewResult.value is not an array:", previewItems);
        console.warn(
          "Skipping critical stock check due to invalid data format",
        );
      } else {
        // Identify ingredients that will reach or exceed reorder point
        const criticalItems = previewItems.filter(
          (item) =>
            item.needsReorder || item.remainingStock <= item.reorderPoint,
        );

        if (criticalItems.length > 0) {
          console.warn(
            "Order will trigger critical stock levels for:",
            criticalItems.map((item) => item.ingredientName).join(", "),
          );

          // Build user confirmation message
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

      // ------------------------------------------------------------------
      // Step 4: Perform the actual ingredient deduction
      // ------------------------------------------------------------------
      const deductionResult = await repo.deductIngredients(deductionRequests);
      if (!deductionResult.ok) {
        return {
          success: false,
          error: "Failed to deduct ingredients: " + deductionResult.error,
        };
      }

      // Success: return data and optional warning
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
      // ------------------------------------------------------------------
      // Step 5: Global error handling – allow fallback confirmation
      // ------------------------------------------------------------------
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Deduction error:", error);
      setDeductionError(errorMessage);

      // Ask the user if they want to mark the order as preparing anyway
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

  /**
   * Checks availability for a single menu item.
   *
   * @param menuItemId - ID of the menu item to check.
   * @param quantity - Desired quantity.
   * @param token - Authentication token.
   * @param baseUrl - Base URL of the inventory API.
   * @returns A promise resolving to an object with:
   *  - `available`: boolean indicating if the item can be fulfilled.
   *  - `error`: optional error message.
   *  - `missingIngredients`: optional array of missing ingredient names.
   *  - `menuItemName`: optional name of the menu item.
   */
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

      // Defensively handle response format
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

  // --------------------------------------------------------------------
  // Hook Return
  // --------------------------------------------------------------------
  return {
    deductIngredientsForOrder,
    checkMenuItemAvailability,
    isDeducting,
    deductionError,
    clearError: () => setDeductionError(null),
  };
};
