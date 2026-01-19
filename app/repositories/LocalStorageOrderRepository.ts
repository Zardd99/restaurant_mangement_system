import { OrderRepository, OrderItemDTO } from "./OrderRepository";

const STORAGE_KEY = "waiter_current_order";

export class LocalStorageOrderRepository implements OrderRepository {
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
