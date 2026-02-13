// ============================================================================
// Module: Inventory Manager
// ============================================================================
// Handles the processing of orders by consuming ingredient stock and triggering
// low‑stock notifications. This module is the primary entry point for inventory
// operations related to order fulfillment.

// ============================================================================
// Imports
// ============================================================================
import {
  ConsumeIngredientsUseCase,
  ConsumptionResult,
} from "../usecases/consume-ingredients-use-case";
import { LowStockNotifier } from "../../services/low-stock-notifier";

// ============================================================================
// Domain Types & Interfaces
// ============================================================================

/**
 * Represents an item in an order that requires inventory deduction.
 */
export interface OrderItem {
  /** Unique identifier of the menu item */
  menuItemId: string;
  /** Quantity of the menu item ordered */
  quantity: number;
}

/**
 * Represents a single item that failed during inventory consumption.
 */
export interface FailedOrderItem {
  /** Identifier of the menu item that failed */
  menuItemId: string;
  /** Human‑readable error description */
  error: string;
}

/**
 * The result of processing an order through the inventory manager.
 */
export interface ProcessOrderResult {
  /** True if all items were processed successfully; false otherwise */
  successful: boolean;
  /** Array of successful consumption results (ingredient deductions) */
  consumedIngredients: ConsumptionResult[];
  /** Array of items that could not be processed */
  failedItems: FailedOrderItem[];
}

// ============================================================================
// Main Service Class
// ============================================================================

/**
 * InventoryManager
 *
 * Coordinates the consumption of ingredients for incoming orders and
 * automatically notifies about low‑stock conditions. Acts as a facade over
 * the `ConsumeIngredientsUseCase` and `LowStockNotifier`.
 */
export class InventoryManager {
  /**
   * Creates an instance of InventoryManager.
   *
   * @param consumeIngredientsUseCase - The use case responsible for deducting
   *                                    ingredients for a given menu item.
   * @param lowStockNotifier          - The service that sends low‑stock alerts.
   */
  constructor(
    private consumeIngredientsUseCase: ConsumeIngredientsUseCase,
    private lowStockNotifier: LowStockNotifier,
  ) {}

  /**
   * Processes an order by consuming the required ingredients for each item.
   * Iterates through the order items and attempts to consume ingredients.
   * If any item fails, it records the failure and continues processing the rest.
   * After each successful consumption, checks if any ingredients have reached
   * the reorder point and triggers notifications.
   *
   * @param orderItems - Array of items to be processed.
   * @returns A `ProcessOrderResult` containing successful consumption records
   *          and any failed items.
   */
  async processOrder(orderItems: OrderItem[]): Promise<ProcessOrderResult> {
    const results: ConsumptionResult[] = [];
    const failedItems: FailedOrderItem[] = [];

    for (const item of orderItems) {
      try {
        // --------------------------------------------------------------------
        // Step 1: Consume ingredients for this order item.
        // --------------------------------------------------------------------
        const consumptionResults = await this.consumeIngredientsUseCase.execute(
          {
            menuItemId: item.menuItemId,
            quantity: item.quantity,
          },
        );

        // Accumulate successful consumption records.
        results.push(...consumptionResults);

        // --------------------------------------------------------------------
        // Step 2: Identify and notify about low‑stock ingredients.
        // --------------------------------------------------------------------
        // NOTE: `r: any` is used here because `ConsumptionResult` currently
        //       does not expose a `needsReorder` flag directly. In a future
        //       refactor, consider adding this property to the type.
        const lowStockItems = consumptionResults.filter(
          (r: any) => r.needsReorder,
        );
        if (lowStockItems.length > 0) {
          await this.lowStockNotifier.notifyLowStock(lowStockItems);
        }
      } catch (error) {
        // --------------------------------------------------------------------
        // Step 3: Handle failures – record the item and error.
        // --------------------------------------------------------------------
        failedItems.push({
          menuItemId: item.menuItemId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // ------------------------------------------------------------------------
    // Step 4: Assemble and return the final result.
    // ------------------------------------------------------------------------
    return {
      successful: failedItems.length === 0,
      consumedIngredients: results,
      failedItems,
    };
  }
}
