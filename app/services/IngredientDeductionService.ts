/**
 * @module IngredientDeductionService
 * @description Clean Architecture service layer for ingredient deduction logic.
 *
 * This service encapsulates the business rules for checking ingredient availability
 * and deducting stock when orders are placed. It depends only on the repository
 * interface and domain models – no framework or UI dependencies.
 *
 * @see {@link IngredientRepository} - The repository abstraction.
 * @see {@link OrderItemDTO}        - Data transfer object for order items.
 * @see {@link IngredientImpact}    - Result of a successful deduction.
 */

// ============================================================================
// Imports
// ============================================================================
import { Result, Ok, Err } from "../core/Result";
import { IngredientRepository } from "../domain/repositories/IngredientRepository";

// ============================================================================
// Domain DTOs & Types
// ============================================================================

/**
 * Represents a single item in an order for which ingredient impacts are calculated.
 */
export interface OrderItemDTO {
  /** Unique identifier of the menu item. */
  menuItemId: string;
  /** Display name of the menu item (for error messages). */
  menuItemName: string;
  /** Number of portions ordered. */
  quantity: number;
}

/**
 * Describes how an order affects a single ingredient.
 * This DTO is returned after a successful deduction or preview.
 */
export interface IngredientImpact {
  /** Unique identifier of the ingredient. */
  ingredientId: string;
  /** Display name of the ingredient. */
  ingredientName: string;
  /** Total quantity consumed (recipe amount × order quantity). */
  consumedQuantity: number;
  /** Remaining stock after consumption. */
  remainingStock: number;
  /** Unit of measurement (e.g., "kg", "liters"). */
  unit: string;
  /** Flag indicating if stock is below the minimum threshold. */
  isLowStock: boolean;
  /** Flag indicating if stock is at or below the reorder point. */
  needsReorder: boolean;
}

// ============================================================================
// Service Implementation
// ============================================================================

/**
 * IngredientDeductionService
 *
 * Orchestrates the ingredient‑deduction process for incoming orders.
 * This service is used by higher‑level managers (e.g., `OrderManager`) and
 * ensures that all business rules are applied before committing stock changes.
 *
 * Responsibilities:
 * - Validating that sufficient stock exists for all items in an order.
 * - Permanently deducting ingredients for a confirmed order.
 * - Providing a non‑destructive preview of the impact of an order.
 *
 * All methods return a `Result` type, keeping error handling explicit
 * and avoiding exceptions in the application layer.
 */
export class IngredientDeductionService {
  /**
   * Creates an instance of the service.
   *
   * @param ingredientRepo - The repository that provides access to ingredient data.
   */
  constructor(private ingredientRepo: IngredientRepository) {}

  // --------------------------------------------------------------------------
  // Public Methods
  // --------------------------------------------------------------------------

  /**
   * Checks whether all required ingredients are available in sufficient
   * quantities for the given order items.
   *
   * @param items - Array of order items to verify.
   * @returns A `Result` containing:
   *          - `Ok(true)` if all items are available.
   *          - `Err(string)` if any item is unavailable, with a descriptive error
   *            listing the affected menu items.
   */
  async checkAvailability(
    items: OrderItemDTO[],
  ): Promise<Result<boolean, string>> {
    try {
      // ----------------------------------------------------------------------
      // 1. Extract menu item IDs and quantities for the repository call.
      // ----------------------------------------------------------------------
      const menuItemIds = items.map((item) => item.menuItemId);
      const quantities = items.map((item) => item.quantity);

      // ----------------------------------------------------------------------
      // 2. Delegate the availability check to the repository.
      // ----------------------------------------------------------------------
      const availabilityResult = await this.ingredientRepo.checkAvailability(
        menuItemIds,
        quantities,
      );

      if (!availabilityResult.ok) {
        return Err(availabilityResult.error);
      }

      // ----------------------------------------------------------------------
      // 3. Filter items that are flagged as unavailable.
      // ----------------------------------------------------------------------
      const unavailable = availabilityResult.value.filter(
        (item) => !item.available,
      );

      if (unavailable.length > 0) {
        const itemNames = unavailable
          .map((item) => item.menuItemName)
          .join(", ");
        return Err(
          `Insufficient ingredients for: ${itemNames}. Please check inventory.`,
        );
      }

      // ----------------------------------------------------------------------
      // 4. All items are available.
      // ----------------------------------------------------------------------
      return Ok(true);
    } catch (error) {
      return Err(
        error instanceof Error
          ? error.message
          : "Failed to check ingredient availability",
      );
    }
  }

  /**
   * Permanently deducts the required ingredients from stock for a confirmed order.
   * This operation is idempotent and should be called exactly once per order.
   *
   * @param items - Array of order items for which to deduct ingredients.
   * @returns A `Result` containing:
   *          - `Ok(IngredientImpact[])` with details of each deducted ingredient.
   *          - `Err(string)` if the operation fails.
   */
  async deductIngredients(
    items: OrderItemDTO[],
  ): Promise<Result<IngredientImpact[], string>> {
    try {
      // ----------------------------------------------------------------------
      // 1. Transform DTOs into the repository's request format.
      // ----------------------------------------------------------------------
      const deductionRequests = items.map((item) => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
      }));

      // ----------------------------------------------------------------------
      // 2. Execute the deduction via the repository.
      // ----------------------------------------------------------------------
      const deductionResult =
        await this.ingredientRepo.deductIngredients(deductionRequests);

      if (!deductionResult.ok) {
        return Err(deductionResult.error);
      }

      // ----------------------------------------------------------------------
      // 3. Map repository results to the service's impact DTO.
      // ----------------------------------------------------------------------
      const impacts: IngredientImpact[] = deductionResult.value.map(
        (result) => ({
          ingredientId: result.ingredientId,
          ingredientName: result.ingredientName,
          consumedQuantity: result.consumedQuantity,
          remainingStock: result.remainingStock,
          unit: result.unit,
          isLowStock: result.isLowStock,
          needsReorder: result.needsReorder,
        }),
      );

      return Ok(impacts);
    } catch (error) {
      return Err(
        error instanceof Error ? error.message : "Failed to deduct ingredients",
      );
    }
  }

  /**
   * Simulates the impact of an order without making any permanent changes.
   * Useful for order previews, cost estimation, and "what‑if" analyses.
   *
   * @param items - Array of order items to preview.
   * @returns A `Result` containing:
   *          - `Ok(IngredientImpact[])` – the exact same impact as if the order
   *            were placed, but without persisting changes.
   *          - `Err(string)` if the preview operation fails.
   */
  async previewImpact(
    items: OrderItemDTO[],
  ): Promise<Result<IngredientImpact[], string>> {
    try {
      // ----------------------------------------------------------------------
      // 1. Transform DTOs into the repository's request format.
      // ----------------------------------------------------------------------
      const previewRequests = items.map((item) => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
      }));

      // ----------------------------------------------------------------------
      // 2. Delegate the preview to the repository.
      // ----------------------------------------------------------------------
      const previewResult =
        await this.ingredientRepo.previewDeduction(previewRequests);

      if (!previewResult.ok) {
        return Err(previewResult.error);
      }

      // ----------------------------------------------------------------------
      // 3. Map repository results to the service's impact DTO.
      // ----------------------------------------------------------------------
      const impacts: IngredientImpact[] = previewResult.value.map((result) => ({
        ingredientId: result.ingredientId,
        ingredientName: result.ingredientName,
        consumedQuantity: result.consumedQuantity,
        remainingStock: result.remainingStock,
        unit: result.unit,
        isLowStock: result.isLowStock,
        needsReorder: result.needsReorder,
      }));

      return Ok(impacts);
    } catch (error) {
      return Err(
        error instanceof Error ? error.message : "Failed to preview impact",
      );
    }
  }
}
