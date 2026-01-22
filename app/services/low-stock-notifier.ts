import { ConsumptionResult } from "../application/usecases/consume-ingredients-use-case";

export interface LowStockAlert {
  ingredientId: string;
  ingredientName: string;
  currentStock: number;
  minStock: number;
  unit: string;
}

export interface NotificationService {
  sendLowStockAlert(alerts: LowStockAlert[]): Promise<void>;
}

export class LowStockNotifier {
  constructor(private notificationService: NotificationService) {}

  async notifyLowStock(results: ConsumptionResult[]): Promise<void> {
    // In a real implementation, you would fetch ingredient details here
    const alerts: LowStockAlert[] = results.map((result) => ({
      ingredientId: result.ingredientId,
      ingredientName: `Ingredient ${result.ingredientId}`, // Fetch real name
      currentStock: result.remainingStock,
      minStock: 10, // Fetch real min stock
      unit: "units", // Fetch real unit
    }));

    if (alerts.length > 0) {
      await this.notificationService.sendLowStockAlert(alerts);
    }
  }
}
