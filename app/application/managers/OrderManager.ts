/**
 * =============================================================================
 * CLEAN ARCHITECTURE: MANAGER LAYER
 * =============================================================================
 *
 * OrderManager - Pure business logic for order processing.
 *
 * 🔒 Purpose:
 *   - Enforces business rules and invariants for order submission.
 *   - Coordinates between the OrderRepository (data layer) and
 *     IngredientDeductionService (domain service).
 *
 * 📦 Dependencies:
 *   - OrderRepository (abstraction, injected)
 *   - IngredientDeductionService (abstraction, injected)
 *
 * 🚫 Does NOT:
 *   - Make HTTP calls directly.
 *   - Handle UI state or navigation.
 *   - Know about frameworks or presenters.
 *
 * ✅ Usage:
 *   - Instantiated by a ViewModel (e.g., OrderViewModel) and called
 *     when the user submits an order.
 *
 * @module OrderManager
 */

import { Result, Ok, Err } from "../../core/Result";
import { OrderRepository } from "../../domain/repositories/OrderRepository";
import {
  IngredientDeductionService,
  IngredientImpact,
} from "../../services/IngredientDeductionService";

// =============================================================================
// TYPES & DTOs
// =============================================================================

/**
 * Data Transfer Object representing a single item in an order submission.
 */
export interface OrderItemDTO {
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  price: number;
  specialInstructions?: string;
}

/**
 * Data Transfer Object containing all data required to submit a new order.
 */
export interface OrderSubmissionDTO {
  items: OrderItemDTO[];
  tableNumber: number;
  customerName: string;
  orderType: "dine-in" | "takeaway" | "delivery";
  notes?: string;
}

/**
 * Result returned after a successful order submission.
 * Contains the created order ID, detailed ingredient impacts,
 * and human‑readable low‑stock warnings.
 */
export interface OrderSubmissionResult {
  orderId: string;
  ingredientImpacts: IngredientImpact[];
  lowStockWarnings: string[];
}

// =============================================================================
// ORDER MANAGER – BUSINESS LOGIC LAYER
// =============================================================================

/**
 * OrderManager
 * ------------
 * Encapsulates all business rules related to order processing.
 * Acts as an orchestration layer between the UI/ViewModel and
 * the infrastructure (repositories) and domain services.
 *
 * All public methods return `Result<T, E>` to explicitly handle
 * success/failure without exceptions.
 */
export class OrderManager {
  /**
   * Creates a new instance of OrderManager with the required dependencies.
   *
   * @param orderRepo         - Repository for persisting orders.
   * @param ingredientService - Domain service for ingredient availability
   *                            checking and deduction.
   */
  constructor(
    private orderRepo: OrderRepository,
    private ingredientService: IngredientDeductionService,
  ) {}

  // ---------------------------------------------------------------------------
  // PUBLIC API – BUSINESS OPERATIONS
  // ---------------------------------------------------------------------------

  /**
   * Validates an order DTO against business rules.
   *
   * Rules enforced:
   * - At least one item must be present.
   * - Table number must be a positive integer.
   * - Customer name must not be empty.
   * - Every item quantity must be ≥ 1.
   * - Every item price must be ≥ 0.
   *
   * @param order - The order data to validate.
   * @returns `Ok(true)` if valid; `Err(errorMessage)` otherwise.
   */
  async validateOrder(
    order: OrderSubmissionDTO,
  ): Promise<Result<boolean, string>> {
    if (order.items.length === 0) {
      return Err("Order must contain at least one item");
    }

    if (!order.tableNumber || order.tableNumber < 1) {
      return Err("Valid table number is required");
    }

    if (!order.customerName || order.customerName.trim().length === 0) {
      return Err("Customer name is required");
    }

    // Validate each individual item
    for (const item of order.items) {
      if (item.quantity < 1) {
        return Err(`Invalid quantity for ${item.menuItemName}`);
      }
      if (item.price < 0) {
        return Err(`Invalid price for ${item.menuItemName}`);
      }
    }

    return Ok(true);
  }

  /**
   * Computes the total monetary value of an order.
   *
   * @param items - Array of order items.
   * @returns Sum of (price × quantity) for all items.
   */
  calculateTotal(items: OrderItemDTO[]): number {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  /**
   * Submits an order after performing validation and ingredient deduction.
   *
   * Process:
   * 1. Validate the order DTO.
   * 2. Check ingredient availability (fail early if insufficient stock).
   * 3. Persist the order via the repository.
   * 4. Deduct the required ingredients.
   * 5. Generate low‑stock warnings if any ingredient falls below reorder point.
   *
   * @param order - Fully populated order submission data.
   * @returns
   *   - `Ok(OrderSubmissionResult)` if the entire flow succeeds.
   *   - `Err(error)` if any step fails (order creation may still have occurred
   *     in case of deduction failure – a critical error is logged).
   */
  async submitOrder(
    order: OrderSubmissionDTO,
  ): Promise<Result<OrderSubmissionResult, string>> {
    // Step 1: Validate input
    const validationResult = await this.validateOrder(order);
    if (!validationResult.ok) {
      return Err(validationResult.error);
    }

    try {
      // Step 2: Check ingredient availability before creating the order
      const availabilityCheck = await this.ingredientService.checkAvailability(
        order.items,
      );

      if (!availabilityCheck.ok) {
        return Err(availabilityCheck.error);
      }

      // Step 3: Persist the order
      const orderResult = await this.orderRepo.submitOrder({
        items: order.items.map((item) => ({
          menuItem: item.menuItemId,
          quantity: item.quantity,
          price: item.price,
          specialInstructions: item.specialInstructions || "",
        })),
        totalAmount: this.calculateTotal(order.items),
        tableNumber: order.tableNumber,
        customerName: order.customerName,
        orderType: order.orderType,
        status: "confirmed",
      });

      if (!orderResult.ok) {
        return Err(orderResult.error);
      }

      // Step 4: Deduct ingredients
      const deductionResult = await this.ingredientService.deductIngredients(
        order.items,
      );

      if (!deductionResult.ok) {
        // CRITICAL: Order created but inventory update failed.
        // This is logged and reported to the caller.
        console.error(
          "Critical: Order created but ingredient deduction failed",
          {
            orderId: orderResult.value.orderId,
            error: deductionResult.error,
          },
        );
        return Err("Order created but inventory update failed");
      }

      // Step 5: Build user‑friendly warnings for low stock
      const lowStockWarnings = deductionResult.value
        .filter((impact) => impact.needsReorder)
        .map(
          (impact) =>
            `⚠️ ${impact.ingredientName}: ${impact.remainingStock} remaining (reorder needed)`,
        );

      return Ok({
        orderId: orderResult.value.orderId,
        ingredientImpacts: deductionResult.value,
        lowStockWarnings,
      });
    } catch (error) {
      return Err(
        error instanceof Error ? error.message : "Failed to submit order",
      );
    }
  }

  /**
   * Simulates the ingredient impact of a potential order without
   * persisting anything or mutating stock.
   *
   * Useful for displaying real‑time feedback in the UI (e.g., low‑stock
   * warnings before the user clicks "Submit").
   *
   * @param items - The items the user is considering.
   * @returns A list of ingredient impacts, or an error if the calculation fails.
   */
  async previewIngredientImpact(
    items: OrderItemDTO[],
  ): Promise<Result<IngredientImpact[], string>> {
    return this.ingredientService.previewImpact(items);
  }
}
