import {
  OrderRepository,
  OrderItemDTO,
} from "@/app/repositories/OrderRepository";
import { Result, Ok, Err } from "@/app/core/Result";

export class OrderManager {
  private repo: OrderRepository;

  constructor(repo: OrderRepository) {
    this.repo = repo;
  }

  // Load order items (pure delegation to repository)
  async load(): Promise<Result<OrderItemDTO[], string>> {
    try {
      const items = await this.repo.load();
      return Ok(items);
    } catch (e) {
      return Err("Failed to load order items");
    }
  }

  async add(item: OrderItemDTO): Promise<Result<OrderItemDTO[], string>> {
    try {
      const existing = await this.repo.load();
      const found = existing.find((i) => i.menuItem._id === item.menuItem._id);
      let next: OrderItemDTO[];
      if (found) {
        next = existing.map((i) =>
          i.menuItem._id === item.menuItem._id
            ? { ...i, quantity: i.quantity + item.quantity }
            : i,
        );
      } else {
        next = [...existing, item];
      }

      await this.repo.save(next);
      return Ok(next);
    } catch (e) {
      return Err("Failed to add to order");
    }
  }

  async updateQuantity(
    itemId: string,
    newQuantity: number,
  ): Promise<Result<OrderItemDTO[], string>> {
    try {
      const existing = await this.repo.load();
      let next: OrderItemDTO[];
      if (newQuantity < 1) {
        next = existing.filter((i) => i.menuItem._id !== itemId);
      } else {
        next = existing.map((i) =>
          i.menuItem._id === itemId ? { ...i, quantity: newQuantity } : i,
        );
      }
      await this.repo.save(next);
      return Ok(next);
    } catch (e) {
      return Err("Failed to update quantity");
    }
  }

  async updateInstructions(
    itemId: string,
    instructions: string,
  ): Promise<Result<OrderItemDTO[], string>> {
    try {
      const existing = await this.repo.load();
      const next = existing.map((i) =>
        i.menuItem._id === itemId
          ? { ...i, specialInstructions: instructions }
          : i,
      );
      await this.repo.save(next);
      return Ok(next);
    } catch (e) {
      return Err("Failed to update instructions");
    }
  }

  async remove(itemId: string): Promise<Result<OrderItemDTO[], string>> {
    try {
      const existing = await this.repo.load();
      const next = existing.filter((i) => i.menuItem._id !== itemId);
      await this.repo.save(next);
      return Ok(next);
    } catch (e) {
      return Err("Failed to remove item");
    }
  }

  async clear(): Promise<Result<null, string>> {
    try {
      await this.repo.clear();
      return Ok(null);
    } catch (e) {
      return Err("Failed to clear order");
    }
  }

  async calculateTotal(): Promise<Result<number, string>> {
    try {
      const items = await this.repo.load();
      const total = items.reduce(
        (s, i) => s + i.menuItem.price * i.quantity,
        0,
      );
      return Ok(total);
    } catch (e) {
      return Err("Failed to calculate total");
    }
  }
}
