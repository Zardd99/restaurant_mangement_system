import {
  ConsumeIngredientsUseCase,
  ConsumptionResult,
} from "../usecases/consume-ingredients-use-case";
import { LowStockNotifier } from "../../services/low-stock-notifier";

export interface OrderItem {
  menuItemId: string;
  quantity: number;
}

export class InventoryManager {
  constructor(
    private consumeIngredientsUseCase: ConsumeIngredientsUseCase,
    private lowStockNotifier: LowStockNotifier,
  ) {}

  async processOrder(orderItems: OrderItem[]): Promise<ProcessOrderResult> {
    const results: ConsumptionResult[] = [];
    const failedItems: FailedOrderItem[] = [];

    for (const item of orderItems) {
      try {
        const consumptionResults = await this.consumeIngredientsUseCase.execute(
          {
            menuItemId: item.menuItemId,
            quantity: item.quantity,
          },
        );

        results.push(...consumptionResults);

        // Check and notify low stock
        const lowStockItems = consumptionResults.filter(
          (r: any) => r.needsReorder,
        );
        if (lowStockItems.length > 0) {
          await this.lowStockNotifier.notifyLowStock(lowStockItems);
        }
      } catch (error) {
        failedItems.push({
          menuItemId: item.menuItemId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      successful: failedItems.length === 0,
      consumedIngredients: results,
      failedItems,
    };
  }
}

export interface ProcessOrderResult {
  successful: boolean;
  consumedIngredients: ConsumptionResult[];
  failedItems: FailedOrderItem[];
}

export interface FailedOrderItem {
  menuItemId: string;
  error: string;
}
