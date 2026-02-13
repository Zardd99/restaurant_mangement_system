/**
 * @module IngredientRepository
 * @description Clean Architecture repository interface for ingredient data access.
 *
 * This module defines the contract that any concrete ingredient repository
 * (e.g., API, in‑memory, mock) must implement. It abstracts all persistence
 * concerns related to ingredient stock management, availability checks,
 * and inventory deduction.
 */

import { Result } from "../../core/Result";

// ============================================================================
// Domain DTOs (Data Transfer Objects)
// ============================================================================

/**
 * Represents the availability status of a menu item based on its ingredient stock.
 */
export interface IngredientAvailability {
  /** Unique identifier of the menu item. */
  menuItemId: string;
  /** Display name of the menu item. */
  menuItemName: string;
  /** True if all required ingredients are in sufficient stock. */
  available: boolean;
  /** Optional list of ingredient names that are missing or insufficient. */
  missingIngredients?: string[];
}

/**
 * Request object for deducting ingredients for a single menu item.
 */
export interface DeductionRequest {
  /** Unique identifier of the menu item to be prepared. */
  menuItemId: string;
  /** Number of portions to prepare. */
  quantity: number;
}

/**
 * Result of a successful ingredient deduction for a single ingredient.
 */
export interface DeductionResult {
  /** Unique identifier of the ingredient. */
  ingredientId: string;
  /** Display name of the ingredient. */
  ingredientName: string;
  /** Total quantity consumed (per recipe × quantity ordered). */
  consumedQuantity: number;
  /** Remaining stock after deduction. */
  remainingStock: number;
  /** Unit of measurement (e.g., "kg", "pieces"). */
  unit: string;
  /** Flag indicating if stock is below the minimum threshold. */
  isLowStock: boolean;
  /** Flag indicating if stock is at or below the reorder point. */
  needsReorder: boolean;
  /** The configured reorder point for this ingredient. */
  reorderPoint: number;
}

// ============================================================================
// Repository Interface
// ============================================================================

/**
 * IngredientRepository
 *
 * Defines the contract for data access operations related to ingredient
 * inventory. This interface follows the Clean Architecture principles,
 * keeping the domain layer completely independent of infrastructure
 * details (HTTP, database, etc.).
 *
 * All methods return a `Result` type that encapsulates either a success
 * value or an error string, eliminating the need for try/catch at the
 * use‑case level.
 */
export interface IngredientRepository {
  /**
   * Checks whether the required ingredients for one or more menu items
   * are available in sufficient quantities.
   *
   * @param menuItemIds - Array of menu item identifiers.
   * @param quantities  - Array of requested quantities (must be same length as menuItemIds).
   * @returns A `Result` containing an array of `IngredientAvailability`
   *          objects (one per requested menu item) or an error message.
   */
  checkAvailability(
    menuItemIds: string[],
    quantities: number[],
  ): Promise<Result<IngredientAvailability[], string>>;

  /**
   * Permanently deducts ingredients from stock for a confirmed order.
   * This operation is idempotent and should be called only once per order.
   *
   * @param requests - Array of deduction requests (menuItemId + quantity).
   * @returns A `Result` containing an array of `DeductionResult` objects
   *          (one per affected ingredient) or an error message.
   */
  deductIngredients(
    requests: DeductionRequest[],
  ): Promise<Result<DeductionResult[], string>>;

  /**
   * Simulates the deduction of ingredients without persisting the changes.
   * Useful for order previews or "what‑if" analyses.
   *
   * @param requests - Array of deduction requests.
   * @returns A `Result` containing a preview of the deduction results
   *          (same shape as `deductIngredients`) or an error message.
   */
  previewDeduction(
    requests: DeductionRequest[],
  ): Promise<Result<DeductionResult[], string>>;

  /**
   * Retrieves the current stock level for a specific ingredient.
   *
   * @param ingredientId - Unique identifier of the ingredient.
   * @returns A `Result` containing the numeric stock quantity or an error message.
   */
  getStockLevel(ingredientId: string): Promise<Result<number, string>>;

  /**
   * Retrieves all ingredients that are currently below their minimum stock
   * threshold or have reached the reorder point.
   *
   * @returns A `Result` containing an array of `DeductionResult` objects
   *          (only the fields relevant for alerts) or an error message.
   */
  getLowStockAlerts(): Promise<Result<DeductionResult[], string>>;
}
