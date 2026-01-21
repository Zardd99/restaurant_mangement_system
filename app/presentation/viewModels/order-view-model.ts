import { OrderItem } from "../..//managers/inventory-manager";
import { OrderCoordinator } from "../coordinators/order-coordinator";

export class OrderViewModel {
  private orderItems: OrderItem[] = [];

  constructor(private coordinator: OrderCoordinator) {}

  addOrderItem(menuItemId: string, quantity: number): void {
    this.orderItems.push({ menuItemId, quantity });
  }

  removeOrderItem(menuItemId: string): void {
    this.orderItems = this.orderItems.filter(
      (item) => item.menuItemId !== menuItemId,
    );
  }

  updateQuantity(menuItemId: string, newQuantity: number): void {
    const item = this.orderItems.find((item) => item.menuItemId === menuItemId);
    if (item) {
      item.quantity = newQuantity;
    }
  }

  async submitOrder(): Promise<void> {
    try {
      const result = await this.coordinator.processOrder(this.orderItems);

      if (result.successful) {
        // Clear order on success
        this.orderItems = [];
        this.coordinator.navigateToConfirmation();
      } else {
        this.coordinator.showOrderErrors(result.failedItems);
      }
    } catch (error) {
      this.coordinator.showError(
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  getCurrentOrder(): ReadonlyArray<OrderItem> {
    return [...this.orderItems];
  }
}
