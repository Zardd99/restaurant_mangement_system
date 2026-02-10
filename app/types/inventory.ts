export interface IngredientStock {
  id: string;
  name: string;
  currentStock: number;
  unit: string;
  minStock: number;
  reorderPoint: number;
  costPerUnit: number;
  isLowStock: boolean;
  needsReorder: boolean;
  usedIn: Array<{
    menuItemId: string;
    menuItemName: string;
    quantityRequired: number;
    unit: string;
  }>;
}
