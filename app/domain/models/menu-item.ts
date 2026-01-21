import { IngredientReference } from "./ingredient-value-objects";

export class MenuItem {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly ingredientReferences: IngredientReference[],
  ) {}

  getRequiredIngredients(): ReadonlyArray<IngredientReference> {
    return [...this.ingredientReferences];
  }

  calculateRequiredQuantity(
    reference: IngredientReference,
    multiplier: number,
  ): number {
    return reference.quantity * multiplier;
  }
}
