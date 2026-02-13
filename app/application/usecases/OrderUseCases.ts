/**
 * Order Use Cases
 *
 * This module contains the core business logic for managing an order.
 * Each function represents a distinct use case, interacting with an
 * `OrderRepository` to load, mutate, and persist order data.
 *
 * All functions return a `Result` type from the application's core,
 * encapsulating success (`Ok`) or failure (`Err`) with appropriate
 * error messages.
 *
 * @module orderUseCases
 */

// ----------------------------------------------------------------------
// Domain & Core
// ----------------------------------------------------------------------
import {
  OrderRepository,
  OrderItemDTO,
} from "../../domain/repositories/OrderRepository";
import { Result, Ok, Err } from "../../core/Result";

// ----------------------------------------------------------------------
// Read Operations
// ----------------------------------------------------------------------

/**
 * Loads the current order items.
 *
 * @param repo - The OrderRepository implementation (e.g., local storage, API).
 * @returns A Promise resolving to a Result containing either:
 *          - Ok: Array of OrderItemDTO representing the order.
 *          - Err: A string error message if loading fails.
 */
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

// ----------------------------------------------------------------------
// Write Operations (Create / Update)
// ----------------------------------------------------------------------

/**
 * Adds an item to the order. If the item already exists (based on menu item ID),
 * the quantities are merged (summed). Otherwise, the new item is appended.
 *
 * @param repo - The OrderRepository implementation.
 * @param item - The item to add (contains menu item reference and quantity).
 * @returns A Promise resolving to a Result containing either:
 *          - Ok: The updated array of OrderItemDTO.
 *          - Err: A string error message if the operation fails.
 */
export const addToOrder = async (
  repo: OrderRepository,
  item: OrderItemDTO,
): Promise<Result<OrderItemDTO[], string>> => {
  try {
    const existing = await repo.load();
    const found = existing.find((i) => i.menuItem._id === item.menuItem._id);
    let next: OrderItemDTO[];

    if (found) {
      // Merge quantities
      next = existing.map((i) =>
        i.menuItem._id === item.menuItem._id
          ? { ...i, quantity: i.quantity + item.quantity }
          : i,
      );
    } else {
      // Append new item
      next = [...existing, item];
    }

    await repo.save(next);
    return Ok(next);
  } catch (e) {
    return Err("Failed to add to order");
  }
};

/**
 * Updates the quantity of a specific order item.
 * - If the new quantity is less than 1, the item is removed from the order.
 * - Otherwise, the item's quantity is updated to the provided value.
 *
 * @param repo - The OrderRepository implementation.
 * @param itemId - The unique identifier of the menu item (menuItem._id).
 * @param newQuantity - The desired new quantity (must be a non-negative integer).
 * @returns A Promise resolving to a Result containing either:
 *          - Ok: The updated array of OrderItemDTO.
 *          - Err: A string error message if the operation fails.
 */
export const updateQuantity = async (
  repo: OrderRepository,
  itemId: string,
  newQuantity: number,
): Promise<Result<OrderItemDTO[], string>> => {
  try {
    const existing = await repo.load();
    let next: OrderItemDTO[];

    if (newQuantity < 1) {
      // Remove the item entirely
      next = existing.filter((i) => i.menuItem._id !== itemId);
    } else {
      // Update quantity
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

/**
 * Updates the special instructions for a specific order item.
 *
 * @param repo - The OrderRepository implementation.
 * @param itemId - The unique identifier of the menu item (menuItem._id).
 * @param instructions - The new special instructions string.
 * @returns A Promise resolving to a Result containing either:
 *          - Ok: The updated array of OrderItemDTO.
 *          - Err: A string error message if the operation fails.
 */
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

// ----------------------------------------------------------------------
// Delete Operations
// ----------------------------------------------------------------------

/**
 * Removes a single item from the order.
 *
 * @param repo - The OrderRepository implementation.
 * @param itemId - The unique identifier of the menu item to remove (menuItem._id).
 * @returns A Promise resolving to a Result containing either:
 *          - Ok: The updated array of OrderItemDTO (after removal).
 *          - Err: A string error message if the operation fails.
 */
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

/**
 * Completely clears the entire order.
 *
 * @param repo - The OrderRepository implementation.
 * @returns A Promise resolving to a Result containing either:
 *          - Ok: null (indicating successful clearing).
 *          - Err: A string error message if the operation fails.
 */
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

// ----------------------------------------------------------------------
// Query / Calculation Operations
// ----------------------------------------------------------------------

/**
 * Calculates the total price of the current order.
 * Sums (menuItem.price * quantity) for each item.
 *
 * @param repo - The OrderRepository implementation.
 * @returns A Promise resolving to a Result containing either:
 *          - Ok: The total price as a number.
 *          - Err: A string error message if loading fails.
 */
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
