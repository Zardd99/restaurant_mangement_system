// ============================================================================
// Domain Entities – Ingredient Management
// ============================================================================

/**
 * Represents a validated, non-empty ingredient identifier.
 * Enforces domain invariants at construction time.
 */
export class IngredientId {
  /**
   * Private constructor; use the static factory method `create()`.
   * @param value - The raw ID string.
   */
  private constructor(public readonly value: string) {}

  /**
   * Factory method to create an IngredientId.
   * @param id - The raw ID string.
   * @returns A new IngredientId instance.
   * @throws {Error} If the ID is null, undefined, or empty/whitespace.
   */
  static create(id: string): IngredientId {
    if (!id || id.trim().length === 0) {
      throw new Error("Ingredient ID cannot be empty");
    }
    return new IngredientId(id);
  }
}

// ----------------------------------------------------------------------------

/**
 * Represents a validated stock quantity with its unit of measure.
 * Immutable – operations return new instances.
 */
export class StockQuantity {
  /**
   * Private constructor; use the static factory method `create()`.
   * @param value - Numerical quantity.
   * @param unit  - Unit of measure (e.g., "kg", "liters", "pieces").
   */
  private constructor(
    public readonly value: number,
    public readonly unit: string,
  ) {}

  /**
   * Factory method to create a StockQuantity.
   * @param value - Numerical quantity (must be >= 0).
   * @param unit  - Unit of measure (must be non-empty).
   * @returns A new StockQuantity instance.
   * @throws {Error} If value is negative or unit is empty/whitespace.
   */
  static create(value: number, unit: string): StockQuantity {
    if (value < 0) throw new Error("Stock quantity cannot be negative");
    if (!unit || unit.trim().length === 0) throw new Error("Unit is required");

    return new StockQuantity(value, unit);
  }

  /**
   * Subtracts a given quantity from the current stock.
   * @param quantity - Amount to subtract (must be non-negative and not exceed current stock).
   * @returns A new StockQuantity with the updated value (same unit).
   * @throws {Error} If quantity is negative or exceeds current stock.
   */
  subtract(quantity: number): StockQuantity {
    if (quantity < 0) throw new Error("Cannot subtract negative quantity");
    if (quantity > this.value) throw new Error("Insufficient stock");

    return new StockQuantity(this.value - quantity, this.unit);
  }

  /**
   * Adds a given quantity to the current stock.
   * @param quantity - Amount to add (must be non-negative).
   * @returns A new StockQuantity with the updated value (same unit).
   * @throws {Error} If quantity is negative.
   */
  add(quantity: number): StockQuantity {
    if (quantity < 0) throw new Error("Cannot add negative quantity");
    return new StockQuantity(this.value + quantity, this.unit);
  }
}

// ----------------------------------------------------------------------------

/**
 * Represents the relationship between an ingredient and its required amount
 * in a recipe, order item, or stock movement.
 */
export class IngredientReference {
  /**
   * Creates an IngredientReference.
   * @param ingredientId - Validated identifier of the ingredient.
   * @param quantity     - Required amount (may be any non-negative number; validation is caller's responsibility).
   * @param unit         - Unit of measure for the quantity.
   */
  constructor(
    public readonly ingredientId: IngredientId,
    public readonly quantity: number,
    public readonly unit: string,
  ) {}
}
