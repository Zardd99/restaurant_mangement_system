export class IngredientId {
  private constructor(public readonly value: string) {}

  static create(id: string): IngredientId {
    if (!id || id.trim().length === 0) {
      throw new Error("Ingredient ID cannot be empty");
    }
    return new IngredientId(id);
  }
}

export class StockQuantity {
  private constructor(
    public readonly value: number,
    public readonly unit: string
  ) {}

  static create(value: number, unit: string): StockQuantity {
    if (value < 0) throw new Error("Stock quantity cannot be negative");
    if (!unit || unit.trim().length === 0) throw new Error("Unit is required");
    
    return new StockQuantity(value, unit);
  }

  subtract(quantity: number): StockQuantity {
    if (quantity < 0) throw new Error("Cannot subtract negative quantity");
    if (quantity > this.value) throw new Error("Insufficient stock");
    
    return new StockQuantity(this.value - quantity, this.unit);
  }

  add(quantity: number): StockQuantity {
    if (quantity < 0) throw new Error("Cannot add negative quantity");
    return new StockQuantity(this.value + quantity, this.unit);
  }
}

export class IngredientReference {
  constructor(
    public readonly ingredientId: IngredientId,
    public readonly quantity: number,
    public readonly unit: string
  ) {}
}