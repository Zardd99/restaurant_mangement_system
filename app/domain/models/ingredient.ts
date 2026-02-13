// ============================================================================
// Domain Entity: Ingredient
// ============================================================================
// Represents an ingredient in the inventory system. This is an aggregate root
// that enforces all business invariants related to stock management:
// - Stock cannot become negative (enforced by StockQuantity value object).
// - Minimum stock and reorder point must follow logical ordering.
// - Ingredient name is required and cannot be empty.
// - Cost per unit must be positive.
//
// All state mutations (consume, replenish) return a new immutable instance.

// ============================================================================
// Imports
// ============================================================================
import { IngredientId, StockQuantity } from "./ingredient-value-objects";

// ============================================================================
// Main Class
// ============================================================================

export class Ingredient {
  // --------------------------------------------------------------------------
  // Private Constructor
  // --------------------------------------------------------------------------
  /**
   * Creates a new Ingredient instance.
   * @internal
   * Use the static `create()` method for proper validation.
   */
  private constructor(
    /** Unique identifier of the ingredient. */
    public readonly id: IngredientId,
    /** Display name of the ingredient. */
    public readonly name: string,
    /** Current stock level and unit. */
    private stock: StockQuantity,
    /** Minimum stock level before low‑stock warning. */
    public readonly minStock: number,
    /** Stock level at which a reorder should be placed. */
    public readonly reorderPoint: number,
    /** Cost per unit in the base currency. */
    public readonly costPerUnit: number,
  ) {}

  // --------------------------------------------------------------------------
  // Static Factory Method
  // --------------------------------------------------------------------------

  /**
   * Factory method to create a validated Ingredient instance.
   *
   * @param id            - Unique identifier (string).
   * @param name          - Ingredient name – must be non‑empty.
   * @param currentStock  - Initial stock quantity.
   * @param unit          - Unit of measurement (e.g., "kg", "liters", "pieces").
   * @param minStock      - Minimum stock threshold – cannot be negative.
   * @param reorderPoint  - Reorder threshold – must be >= minStock.
   * @param costPerUnit   - Cost per unit – must be > 0.
   * @returns A new Ingredient instance.
   * @throws {Error} If validation rules are violated.
   */
  static create(
    id: string,
    name: string,
    currentStock: number,
    unit: string,
    minStock: number,
    reorderPoint: number,
    costPerUnit: number,
  ): Ingredient {
    // ------------------------------------------------------------------------
    // Domain invariants validation
    // ------------------------------------------------------------------------
    if (!name || name.trim().length === 0) {
      throw new Error("Ingredient name is required");
    }
    if (minStock < 0) {
      throw new Error("Min stock cannot be negative");
    }
    if (reorderPoint < minStock) {
      throw new Error(
        "Reorder point must be greater than or equal to min stock",
      );
    }
    if (costPerUnit <= 0) {
      throw new Error("Cost per unit must be positive");
    }

    // ------------------------------------------------------------------------
    // Instantiate using value objects
    // ------------------------------------------------------------------------
    return new Ingredient(
      IngredientId.create(id),
      name,
      StockQuantity.create(currentStock, unit),
      minStock,
      reorderPoint,
      costPerUnit,
    );
  }

  // --------------------------------------------------------------------------
  // Read Methods (Queries)
  // --------------------------------------------------------------------------

  /**
   * Returns the current stock quantity.
   * @returns The numeric stock level.
   */
  getStock(): number {
    return this.stock.value;
  }

  /**
   * Returns the unit of measurement for this ingredient.
   * @returns Unit string (e.g., "kg").
   */
  getUnit(): string {
    return this.stock.unit;
  }

  /**
   * Checks whether the current stock is at or below the minimum threshold.
   * @returns True if stock <= minStock, otherwise false.
   */
  isLowStock(): boolean {
    return this.getStock() <= this.minStock;
  }

  /**
   * Checks whether the current stock is at or below the reorder point.
   * @returns True if stock <= reorderPoint, otherwise false.
   */
  needsReorder(): boolean {
    return this.getStock() <= this.reorderPoint;
  }

  /**
   * Calculates the total cost for a given quantity of this ingredient.
   * @param quantity - The amount to price.
   * @returns The total cost = costPerUnit * quantity.
   */
  calculateCost(quantity: number): number {
    return this.costPerUnit * quantity;
  }

  // --------------------------------------------------------------------------
  // Behavioral Methods (Commands)
  // --------------------------------------------------------------------------

  /**
   * Consumes a specified quantity of this ingredient, reducing the stock.
   *
   * @param quantity - The amount to deduct (must be positive and <= current stock).
   * @returns A new Ingredient instance with the updated stock.
   * @throws {Error} If quantity is negative or exceeds available stock
   *                 (thrown by StockQuantity.subtract).
   */
  consume(quantity: number): Ingredient {
    const newStock = this.stock.subtract(quantity);
    return new Ingredient(
      this.id,
      this.name,
      newStock,
      this.minStock,
      this.reorderPoint,
      this.costPerUnit,
    );
  }

  /**
   * Replenishes (adds) a specified quantity to the ingredient stock.
   *
   * @param quantity - The amount to add (must be positive).
   * @returns A new Ingredient instance with the updated stock.
   * @throws {Error} If quantity is negative (thrown by StockQuantity.add).
   */
  replenish(quantity: number): Ingredient {
    const newStock = this.stock.add(quantity);
    return new Ingredient(
      this.id,
      this.name,
      newStock,
      this.minStock,
      this.reorderPoint,
      this.costPerUnit,
    );
  }
}
