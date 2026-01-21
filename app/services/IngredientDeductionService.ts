/**
 * Clean Architecture: Service Layer
 *
 * Purpose: Handle ingredient availability and deduction logic
 * Dependencies: Only repositories and domain models
 * Usage: Called by Managers only
 */

import { Result, Ok, Err } from "../core/Result";
import { IngredientRepository } from "../repositories/IngredientRepository";

export interface OrderItemDTO {
  menuItemId: string;
  menuItemName: string;
  quantity: number;
}

export interface IngredientImpact {
  ingredientId: string;
  ingredientName: string;
  consumedQuantity: number;
  remainingStock: number;
  unit: string;
  isLowStock: boolean;
  needsReorder: boolean;
}

/**
 * Service for managing ingredient availability and deduction
 * Pure business logic - no UI dependencies
 */
export class IngredientDeductionService {
  constructor(private ingredientRepo: IngredientRepository) {}

  /**
   * Check if ingredients are available for order items
   */
  async checkAvailability(
    items: OrderItemDTO[],
  ): Promise<Result<boolean, string>> {
    try {
      const menuItemIds = items.map((item) => item.menuItemId);
      const availabilityResult = await this.ingredientRepo.checkAvailability(
        menuItemIds,
        items.map((item) => item.quantity),
      );

      if (!availabilityResult.ok) {
        return Err(availabilityResult.error);
      }

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
   * Deduct ingredients for confirmed order
   */
  async deductIngredients(
    items: OrderItemDTO[],
  ): Promise<Result<IngredientImpact[], string>> {
    try {
      const deductionResult = await this.ingredientRepo.deductIngredients(
        items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
        })),
      );

      if (!deductionResult.ok) {
        return Err(deductionResult.error);
      }

      // Map to impact format
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
   * Preview impact without actually deducting
   */
  async previewImpact(
    items: OrderItemDTO[],
  ): Promise<Result<IngredientImpact[], string>> {
    try {
      const previewResult = await this.ingredientRepo.previewDeduction(
        items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
        })),
      );

      if (!previewResult.ok) {
        return Err(previewResult.error);
      }

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
