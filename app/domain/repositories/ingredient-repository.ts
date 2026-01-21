import { Ingredient } from "../models/ingredient";
import { IngredientId } from "../models/ingredient-value-objects";
import { MenuItem } from "../models/menu-item";

export interface IngredientRepository {
  findById(id: IngredientId): Promise<Ingredient | null>;
  findByIds(ids: IngredientId[]): Promise<Ingredient[]>;
  saveAll(ingredients: Ingredient[]): Promise<void>;
}

export interface MenuItemRepository {
  findById(id: string): Promise<MenuItem | null>;
}
