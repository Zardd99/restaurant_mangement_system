import {
  OrderRepository,
  OrderItemDTO,
} from "../../domain/repositories/OrderRepository";
import { Result, Ok, Err } from "../../core/Result";

export const loadOrder = async (
  repo: OrderRepository,
): Promise<Result<OrderItemDTO[], string>> => {
  try {
    const items = await repo.load();
    return Ok(items);
  } catch (e) {
    return Err("Failed to load order items");
  }
};

export const addToOrder = async (
  repo: OrderRepository,
  item: OrderItemDTO,
): Promise<Result<OrderItemDTO[], string>> => {
  try {
    const existing = await repo.load();
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

    await repo.save(next);
    return Ok(next);
  } catch (e) {
    return Err("Failed to add to order");
  }
};

export const updateQuantity = async (
  repo: OrderRepository,
  itemId: string,
  newQuantity: number,
): Promise<Result<OrderItemDTO[], string>> => {
  try {
    const existing = await repo.load();
    let next: OrderItemDTO[];
    if (newQuantity < 1) {
      next = existing.filter((i) => i.menuItem._id !== itemId);
    } else {
      next = existing.map((i) =>
        i.menuItem._id === itemId ? { ...i, quantity: newQuantity } : i,
      );
    }
    await repo.save(next);
    return Ok(next);
  } catch (e) {
    return Err("Failed to update quantity");
  }
};

export const updateInstructions = async (
  repo: OrderRepository,
  itemId: string,
  instructions: string,
): Promise<Result<OrderItemDTO[], string>> => {
  try {
    const existing = await repo.load();
    const next = existing.map((i) =>
      i.menuItem._id === itemId
        ? { ...i, specialInstructions: instructions }
        : i,
    );
    await repo.save(next);
    return Ok(next);
  } catch (e) {
    return Err("Failed to update instructions");
  }
};

export const removeItem = async (
  repo: OrderRepository,
  itemId: string,
): Promise<Result<OrderItemDTO[], string>> => {
  try {
    const existing = await repo.load();
    const next = existing.filter((i) => i.menuItem._id !== itemId);
    await repo.save(next);
    return Ok(next);
  } catch (e) {
    return Err("Failed to remove item");
  }
};

export const clearOrder = async (
  repo: OrderRepository,
): Promise<Result<null, string>> => {
  try {
    await repo.clear();
    return Ok(null);
  } catch (e) {
    return Err("Failed to clear order");
  }
};

export const calculateTotal = async (
  repo: OrderRepository,
): Promise<Result<number, string>> => {
  try {
    const items = await repo.load();
    const total = items.reduce((s, i) => s + i.menuItem.price * i.quantity, 0);
    return Ok(total);
  } catch (e) {
    return Err("Failed to calculate total");
  }
};
