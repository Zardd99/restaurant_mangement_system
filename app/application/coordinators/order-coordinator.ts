import {
  InventoryManager,
  ProcessOrderResult,
} from "../../application/managers/inventory-manager";
import { FailedOrderItem } from "../../application/managers/inventory-manager";

export interface NavigationService {
  navigateToConfirmation(): void;
  showError(message: string): void;
}

export class OrderCoordinator {
  constructor(
    private inventoryManager: InventoryManager,
    private navigationService: NavigationService,
  ) {}

  async processOrder(orderItems: any[]): Promise<ProcessOrderResult> {
    const result = await this.inventoryManager.processOrder(orderItems);

    if (result.successful) {
      this.navigationService.navigateToConfirmation();
    }

    return result;
  }

  showOrderErrors(failedItems: FailedOrderItem[]): void {
    const errorMessage = failedItems
      .map((item) => `Item ${item.menuItemId}: ${item.error}`)
      .join("\n");

    this.navigationService.showError(`Some items failed:\n${errorMessage}`);
  }

  navigateToConfirmation(): void {
    this.navigationService.navigateToConfirmation();
  }

  showError(message: string): void {
    this.navigationService.showError(message);
  }
}
