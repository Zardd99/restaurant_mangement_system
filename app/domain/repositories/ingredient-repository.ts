// ============================================================================
// Domain Models
// ============================================================================
import { Ingredient } from "../models/ingredient";
import { IngredientId } from "../models/ingredient-value-objects";
import { MenuItem } from "../models/menu-item";

// ============================================================================
// Repository Interfaces – Ingredient Management
// ============================================================================

/**
 * Repository interface for managing persistence of Ingredient aggregates.
 * Follows the Repository pattern, abstracting data access logic.
 */
export interface IngredientRepository {
  /**
   * Retrieves a single ingredient by its unique identifier.
   * @param id - Validated IngredientId value object.
   * @returns A promise that resolves to the Ingredient entity, or null if not found.
   */
  findById(id: IngredientId): Promise<Ingredient | null>;

  /**
   * Retrieves multiple ingredients by their identifiers.
   * @param ids - Array of validated IngredientId value objects.
   * @returns A promise that resolves to an array of Ingredient entities.
   *          Order may not correspond to input order; missing IDs are simply omitted.
   */
  findByIds(ids: IngredientId[]): Promise<Ingredient[]>;

  /**
   * Persists a batch of ingredient entities (insert or update).
   * Implementations should handle upsert logic appropriately.
   * @param ingredients - Array of Ingredient domain entities to save.
   */
  saveAll(ingredients: Ingredient[]): Promise<void>;
}

// ============================================================================
// Repository Interfaces – Menu Item Management
// ============================================================================

/**
 * Repository interface for managing persistence of MenuItem aggregates.
 */
export interface MenuItemRepository {
  /**
   * Retrieves a single menu item by its unique identifier.
   * @param id - Menu item ID as a raw string (may be validated at domain level).
   * @returns A promise that resolves to the MenuItem entity, or null if not found.
   */
  findById(id: string): Promise<MenuItem | null>;
}
