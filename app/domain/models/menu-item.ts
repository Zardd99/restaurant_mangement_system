/**
 * =============================================================================
 * DOMAIN ENTITY: MENU ITEM
 * =============================================================================
 *
 * Represents a menu item in the domain layer.
 * A MenuItem is defined by its identity, name, and the list of ingredients
 * required to prepare it.
 *
 * ✅ Responsibilities:
 *   - Hold the immutable definition of a menu item.
 *   - Provide access to its required ingredients.
 *   - Calculate ingredient quantities based on a multiplier.
 *
 * 🚫 Does NOT:
 *   - Manage inventory or stock levels.
 *   - Handle pricing or promotional logic.
 *
 * @module MenuItem
 */

import { IngredientReference } from "./ingredient-value-objects";

// =============================================================================
// DOMAIN ENTITY
// =============================================================================

/**
 * MenuItem
 * --------
 * Core domain entity representing a dish or product that can be ordered.
 * Instances are immutable – all fields are readonly.
 */
export class MenuItem {
  /**
   * Creates a new MenuItem entity.
   *
   * @param id                    - Unique identifier of the menu item.
   * @param name                  - Display name of the menu item.
   * @param ingredientReferences  - List of ingredients and their base quantities
   *                                required to prepare one unit of this item.
   */
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly ingredientReferences: IngredientReference[],
  ) {}

  // ---------------------------------------------------------------------------
  // PUBLIC METHODS
  // ---------------------------------------------------------------------------

  /**
   * Returns the list of ingredient references required for this menu item.
   * The returned array is a shallow copy to preserve immutability.
   *
   * @returns A read‑only array of `IngredientReference` objects.
   */
  getRequiredIngredients(): ReadonlyArray<IngredientReference> {
    return [...this.ingredientReferences];
  }

  /**
   * Calculates the required quantity of a specific ingredient
   * when preparing multiple units of this menu item.
   *
   * @param reference  - The ingredient reference containing the base quantity.
   * @param multiplier - Number of portions to prepare (must be >= 1).
   * @returns          - Total quantity needed = base quantity × multiplier.
   */
  calculateRequiredQuantity(
    reference: IngredientReference,
    multiplier: number,
  ): number {
    return reference.quantity * multiplier;
  }
}
