// ============================================================================
// Use Case: Consume Ingredients
// ============================================================================
// This use case handles the consumption of ingredient stock when a menu item
// is ordered. It validates stock availability, deducts the required quantities,
// persists the updated ingredient states, and returns detailed consumption
// results including low‑stock and reorder flags.

// ============================================================================
// Domain Imports
// ============================================================================
import { Ingredient } from "../../domain/models/ingredient";
import { MenuItem } from "../../domain/models/menu-item";
import { IngredientId } from "../../domain/models/ingredient-value-objects";
import {
  IngredientRepository,
  MenuItemRepository,
} from "../../domain/repositories/ingredient-repository";

// ============================================================================
// DTOs & Interfaces
// ============================================================================

/**
 * Request object for consuming ingredients.
 * Represents an order for a specific menu item in a given quantity.
 */
export interface ConsumptionRequest {
  /** Unique identifier of the menu item to be prepared */
  menuItemId: string;
  /** Number of times the menu item is ordered */
  quantity: number;
}

/**
 * Result object for a single ingredient consumption operation.
 * Contains the updated stock information and status flags.
 */
export interface ConsumptionResult {
  /** Unique identifier of the ingredient */
  ingredientId: string;
  /** Total quantity consumed for this order (reference.quantity * request.quantity) */
  consumedQuantity: number;
  /** Remaining stock after consumption */
  remainingStock: number;
  /** Flag indicating whether stock is below the minimum threshold */
  isLowStock: boolean;
  /** Flag indicating whether stock is at or below the reorder point */
  needsReorder: boolean;
}

// ============================================================================
// Use Case Implementation
// ============================================================================

/**
 * ConsumeIngredientsUseCase
 *
 * Orchestrates the deduction of ingredient inventory when a menu item is ordered.
 * Steps:
 * 1. Validate the request (positive quantity).
 * 2. Retrieve the menu item and its required ingredient references.
 * 3. Fetch the current state of all required ingredients.
 * 4. Verify that sufficient stock exists for the requested quantity.
 * 5. Consume the required amount from each ingredient (domain logic).
 * 6. Persist the updated ingredient aggregates.
 * 7. Return a detailed consumption result for each affected ingredient.
 *
 * @throws {Error} If the menu item is not found, any ingredient is missing,
 *                 or stock is insufficient.
 */
export class ConsumeIngredientsUseCase {
  /**
   * Creates an instance of the use case.
   *
   * @param menuItemRepository     - Repository for accessing menu item aggregates.
   * @param ingredientRepository   - Repository for accessing ingredient aggregates.
   */
  constructor(
    private menuItemRepository: MenuItemRepository,
    private ingredientRepository: IngredientRepository,
  ) {}

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------

  /**
   * Executes the ingredient consumption process for a given order.
   *
   * @param request - The consumption request containing menuItemId and quantity.
   * @returns A promise that resolves to an array of ConsumptionResult,
   *          one per affected ingredient.
   * @throws {Error} When validation fails, domain entities are not found,
   *                 or stock is insufficient.
   */
  async execute(request: ConsumptionRequest): Promise<ConsumptionResult[]> {
    // ------------------------------------------------------------------------
    // 1. Validate request
    // ------------------------------------------------------------------------
    if (request.quantity <= 0) {
      throw new Error("Quantity must be positive");
    }

    // ------------------------------------------------------------------------
    // 2. Retrieve menu item
    // ------------------------------------------------------------------------
    const menuItem = await this.menuItemRepository.findById(request.menuItemId);
    if (!menuItem) {
      throw new Error("Menu item not found");
    }

    // ------------------------------------------------------------------------
    // 3. Fetch all required ingredients
    // ------------------------------------------------------------------------
    const ingredientIds = menuItem
      .getRequiredIngredients()
      .map((ref: any) => ref.ingredientId);
    const ingredients =
      await this.ingredientRepository.findByIds(ingredientIds);

    // ------------------------------------------------------------------------
    // 4. Verify stock availability for all ingredients
    // ------------------------------------------------------------------------
    this.validateStockAvailability(menuItem, ingredients, request.quantity);

    // ------------------------------------------------------------------------
    // 5. Consume the required quantity from each ingredient
    // ------------------------------------------------------------------------
    const updatedIngredients = ingredients.map((ingredient) => {
      const reference = menuItem
        .getRequiredIngredients()
        .find((ref: any) => ref.ingredientId.value === ingredient.id.value);

      if (!reference) {
        throw new Error(
          `Ingredient reference not found for ${ingredient.id.value}`,
        );
      }

      const requiredQuantity = reference.quantity * request.quantity;
      return ingredient.consume(requiredQuantity);
    });

    // ------------------------------------------------------------------------
    // 6. Persist the updated ingredient aggregates
    // ------------------------------------------------------------------------
    await this.ingredientRepository.saveAll(updatedIngredients);

    // ------------------------------------------------------------------------
    // 7. Build and return consumption results
    // ------------------------------------------------------------------------
    return updatedIngredients.map((ingredient) => ({
      ingredientId: ingredient.id.value,
      consumedQuantity: this.getConsumedQuantity(
        menuItem,
        ingredient,
        request.quantity,
      ),
      remainingStock: ingredient.getStock(),
      isLowStock: ingredient.isLowStock(),
      needsReorder: ingredient.needsReorder(),
    }));
  }

  // --------------------------------------------------------------------------
  // Private Helpers
  // --------------------------------------------------------------------------

  /**
   * Validates that each required ingredient has sufficient stock to fulfill
   * the requested quantity.
   *
   * @param menuItem    - The menu item being prepared.
   * @param ingredients - Array of ingredient aggregates retrieved for this menu item.
   * @param quantity    - Number of portions ordered.
   * @throws {Error} If any required ingredient is missing or if stock is insufficient.
   */
  private validateStockAvailability(
    menuItem: MenuItem,
    ingredients: Ingredient[],
    quantity: number,
  ): void {
    for (const reference of menuItem.getRequiredIngredients()) {
      const ingredient = ingredients.find(
        (ing) => ing.id.value === reference.ingredientId.value,
      );

      if (!ingredient) {
        throw new Error(`Ingredient ${reference.ingredientId.value} not found`);
      }

      const requiredQuantity = reference.quantity * quantity;
      if (requiredQuantity > ingredient.getStock()) {
        throw new Error(
          `Insufficient stock for ${ingredient.name}. ` +
            `Available: ${ingredient.getStock()}${ingredient.getUnit()}, ` +
            `Required: ${requiredQuantity}${ingredient.getUnit()}`,
        );
      }
    }
  }

  /**
   * Calculates the total quantity consumed for a specific ingredient
   * based on the menu item's recipe and the ordered quantity.
   *
   * @param menuItem   - The menu item being prepared.
   * @param ingredient - The ingredient for which consumption is calculated.
   * @param quantity   - Number of portions ordered.
   * @returns The total amount consumed (reference.quantity * order quantity).
   */
  private getConsumedQuantity(
    menuItem: MenuItem,
    ingredient: Ingredient,
    quantity: number,
  ): number {
    const reference = menuItem
      .getRequiredIngredients()
      .find((ref) => ref.ingredientId.value === ingredient.id.value);
    return reference ? reference.quantity * quantity : 0;
  }
}
