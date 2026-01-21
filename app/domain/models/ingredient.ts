import { IngredientId, StockQuantity } from "./ingredient-value-objects";

export class Ingredient {
  private constructor(
    public readonly id: IngredientId,
    public readonly name: string,
    private stock: StockQuantity,
    public readonly minStock: number,
    public readonly reorderPoint: number,
    public readonly costPerUnit: number,
  ) {}

  static create(
    id: string,
    name: string,
    currentStock: number,
    unit: string,
    minStock: number,
    reorderPoint: number,
    costPerUnit: number,
  ): Ingredient {
    if (!name || name.trim().length === 0) {
      throw new Error("Ingredient name is required");
    }
    if (minStock < 0) throw new Error("Min stock cannot be negative");
    if (reorderPoint < minStock) {
      throw new Error("Reorder point must be greater than min stock");
    }
    if (costPerUnit <= 0) throw new Error("Cost must be positive");

    return new Ingredient(
      IngredientId.create(id),
      name,
      StockQuantity.create(currentStock, unit),
      minStock,
      reorderPoint,
      costPerUnit,
    );
  }

  getStock(): number {
    return this.stock.value;
  }

  getUnit(): string {
    return this.stock.unit;
  }

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

  isLowStock(): boolean {
    return this.getStock() <= this.minStock;
  }

  needsReorder(): boolean {
    return this.getStock() <= this.reorderPoint;
  }

  calculateCost(quantity: number): number {
    return this.costPerUnit * quantity;
  }
}
