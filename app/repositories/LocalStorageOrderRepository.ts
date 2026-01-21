import { OrderRepository, OrderItemDTO } from "./OrderRepository";
import { Result, Ok } from "../core/Result";

const STORAGE_KEY = "waiter_current_order";

export class LocalStorageOrderRepository implements OrderRepository {
  /**
   * Implementation of the missing submitOrder method
   */
  async submitOrder(data: any): Promise<Result<{ orderId: string }, string>> {
    try {
      // For a LocalStorage implementation, we might just simulate a server hit
      console.log("Submitting order to local storage simulation:", data);

      const mockOrderId = `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Optionally clear the current draft since it's now "submitted"
      await this.clear();

      return Ok({ orderId: mockOrderId });
    } catch (e) {
      return { ok: false, error: "Failed to process local order" } as any;
    }
  }

  async load(): Promise<OrderItemDTO[]> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      return [];
    } catch (e) {
      console.error("LocalStorage load error", e);
      return [];
    }
  }

  async save(items: OrderItemDTO[]): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("LocalStorage save error", e);
    }
  }

  async clear(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error("LocalStorage clear error", e);
    }
  }
}
