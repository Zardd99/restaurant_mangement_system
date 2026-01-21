/**
 * Clean Architecture: Repository Interface
 *
 * Purpose: Abstract data access for ingredients
 * Dependencies: None (pure interface)
 * Implementation: APIIngredientRepository
 */

import { Result } from "../../core/Result";

export interface IngredientAvailability {
  menuItemId: string;
  menuItemName: string;
  available: boolean;
  missingIngredients?: string[];
}

export interface DeductionRequest {
  menuItemId: string;
  quantity: number;
}

export interface DeductionResult {
  ingredientId: string;
  ingredientName: string;
  consumedQuantity: number;
  remainingStock: number;
  unit: string;
  isLowStock: boolean;
  needsReorder: boolean;
  reorderPoint: number;
}

/**
 * Repository interface for ingredient operations
 * Must be implemented by concrete data sources
 */
export interface IngredientRepository {
  /**
   * Check if ingredients are available for menu items
   */
  checkAvailability(
    menuItemIds: string[],
    quantities: number[],
  ): Promise<Result<IngredientAvailability[], string>>;

  /**
   * Deduct ingredients for confirmed order
   */
  deductIngredients(
    requests: DeductionRequest[],
  ): Promise<Result<DeductionResult[], string>>;

  /**
   * Preview deduction without committing
   */
  previewDeduction(
    requests: DeductionRequest[],
  ): Promise<Result<DeductionResult[], string>>;

  /**
   * Get current stock level for an ingredient
   */
  getStockLevel(ingredientId: string): Promise<Result<number, string>>;

  /**
   * Get low stock alerts
   */
  getLowStockAlerts(): Promise<Result<DeductionResult[], string>>;
}
