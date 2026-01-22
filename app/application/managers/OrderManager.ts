/**
 * Clean Architecture: Manager Layer
 *
 * Purpose: Enforce business rules and coordinate services
 * Dependencies: Only domain models and repositories
 * Usage: Called by ViewModels, never directly by UI
 */

import { Result, Ok, Err } from "../../core/Result";
import { OrderRepository } from "../../domain/repositories/OrderRepository";
import {
  IngredientDeductionService,
  IngredientImpact,
} from "../../services/IngredientDeductionService";

export interface OrderItemDTO {
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  price: number;
  specialInstructions?: string;
}

export interface OrderSubmissionDTO {
  items: OrderItemDTO[];
  tableNumber: number;
  customerName: string;
  orderType: "dine-in" | "takeaway" | "delivery";
  notes?: string;
}

export interface OrderSubmissionResult {
  orderId: string;
  ingredientImpacts: IngredientImpact[];
  lowStockWarnings: string[];
}

/**
 * OrderManager - Pure business logic for order management
 *
 * Responsibilities:
 * - Validate order data
 * - Coordinate ingredient deduction
 * - Handle business rules
 *
 * Does NOT:
 * - Make API calls directly
 * - Handle UI state
 * - Manage navigation
 */
export class OrderManager {
  constructor(
    private orderRepo: OrderRepository,
    private ingredientService: IngredientDeductionService,
  ) {}

  /**
   * Validate order before submission
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

    // Validate each item
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
   * Calculate order total
   */
  calculateTotal(items: OrderItemDTO[]): number {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  /**
   * Submit order and handle ingredient deduction
   */
  async submitOrder(
    order: OrderSubmissionDTO,
  ): Promise<Result<OrderSubmissionResult, string>> {
    // Validate first
    const validationResult = await this.validateOrder(order);
    if (!validationResult.ok) {
      return Err(validationResult.error);
    }

    try {
      // Step 1: Check ingredient availability
      const availabilityCheck = await this.ingredientService.checkAvailability(
        order.items,
      );

      if (!availabilityCheck.ok) {
        return Err(availabilityCheck.error);
      }

      // Step 2: Submit order
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

      // Step 3: Deduct ingredients
      const deductionResult = await this.ingredientService.deductIngredients(
        order.items,
      );

      if (!deductionResult.ok) {
        // Order created but deduction failed - log critical error
        console.error(
          "Critical: Order created but ingredient deduction failed",
          {
            orderId: orderResult.value.orderId,
            error: deductionResult.error,
          },
        );
        return Err("Order created but inventory update failed");
      }

      // Step 4: Build warnings for low stock items
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
   * Preview ingredient impact without submitting
   */
  async previewIngredientImpact(
    items: OrderItemDTO[],
  ): Promise<Result<IngredientImpact[], string>> {
    return this.ingredientService.previewImpact(items);
  }
}
