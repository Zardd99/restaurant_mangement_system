import { Ingredient } from "../domain/models/ingredient";
import { MenuItem } from "../domain/models/menu-item";
import { IngredientId } from "../domain/models/ingredient-value-objects";
import {
  IngredientRepository,
  MenuItemRepository,
} from "../domain/repositories/ingredient-repository";

export interface ConsumptionRequest {
  menuItemId: string;
  quantity: number;
}

export interface ConsumptionResult {
  ingredientId: string;
  consumedQuantity: number;
  remainingStock: number;
  isLowStock: boolean;
  needsReorder: boolean;
}

export class ConsumeIngredientsUseCase {
  constructor(
    private menuItemRepository: MenuItemRepository,
    private ingredientRepository: IngredientRepository,
  ) {}

  async execute(request: ConsumptionRequest): Promise<ConsumptionResult[]> {
    // Validate
    if (request.quantity <= 0) {
      throw new Error("Quantity must be positive");
    }

    // Get menu item
    const menuItem = await this.menuItemRepository.findById(request.menuItemId);
    if (!menuItem) {
      throw new Error("Menu item not found");
    }

    // Get required ingredients
    const ingredientIds = menuItem
      .getRequiredIngredients()
      .map((ref: any) => ref.ingredientId);
    const ingredients =
      await this.ingredientRepository.findByIds(ingredientIds);

    // Check stock availability
    this.validateStockAvailability(menuItem, ingredients, request.quantity);

    // Consume ingredients
    const updatedIngredients = ingredients.map((ingredient) => {
      const reference = menuItem
        .getRequiredIngredients()
        .find((ref: any) => ref.ingredientId.value === ingredient.id.value);

      if (!reference)
        throw new Error(
          `Ingredient reference not found for ${ingredient.id.value}`,
        );

      const requiredQuantity = reference.quantity * request.quantity;
      return ingredient.consume(requiredQuantity);
    });

    // Save updated ingredients
    await this.ingredientRepository.saveAll(updatedIngredients);

    // Return consumption results
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
