/**
 * =============================================================================
 * INFRASTRUCTURE REPOSITORY: LOCAL STORAGE ORDER REPOSITORY
 * =============================================================================
 *
 * Implements the `OrderRepository` interface using browser's localStorage.
 * This repository is used to persist the current draft order locally,
 * allowing the waiter to retain the order even after page refresh.
 *
 * ✅ Responsibilities:
 *   - Load, save, and clear the current order draft.
 *   - Simulate order submission (mock implementation for demonstration).
 *
 * 🚫 Does NOT:
 *   - Actually submit orders to a backend API.
 *   - Handle real network requests.
 *
 * @module LocalStorageOrderRepository
 */

import { OrderRepository, OrderItemDTO } from "./OrderRepository";
import { Result, Ok } from "../../core/Result";

// -----------------------------------------------------------------------------
// LOCAL STORAGE KEY
// -----------------------------------------------------------------------------
const STORAGE_KEY = "waiter_current_order";

// -----------------------------------------------------------------------------
// REPOSITORY IMPLEMENTATION
// -----------------------------------------------------------------------------

/**
 * LocalStorageOrderRepository
 * ---------------------------
 * Concrete implementation of `OrderRepository` that uses the browser's
 * localStorage for persistence. Designed for development and prototyping.
 */
export class LocalStorageOrderRepository implements OrderRepository {
  // ---------------------------------------------------------------------------
  // READ OPERATIONS
  // ---------------------------------------------------------------------------

  /**
   * Loads the current order draft from localStorage.
   *
   * @returns {Promise<OrderItemDTO[]>} - Array of order items, or empty array
   *                                      if nothing is stored or parsing fails.
   */
  async load(): Promise<OrderItemDTO[]> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];

      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("LocalStorage load error", e);
      return [];
    }
  }

  // ---------------------------------------------------------------------------
  // WRITE OPERATIONS
  // ---------------------------------------------------------------------------

  /**
   * Saves the current order draft to localStorage.
   *
   * @param items - The array of order items to persist.
   */
  async save(items: OrderItemDTO[]): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("LocalStorage save error", e);
    }
  }

  /**
   * Clears the current order draft from localStorage.
   */
  async clear(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error("LocalStorage clear error", e);
    }
  }

  // ---------------------------------------------------------------------------
  // ORDER SUBMISSION (MOCK)
  // ---------------------------------------------------------------------------

  /**
   * Simulates the submission of an order.
   *
   * In this localStorage implementation, no actual network request is made.
   * Instead, a mock order ID is generated, and the draft is cleared.
   *
   * @param data - The order data (unused in this mock).
   * @returns    - `Ok` containing a generated order ID.
   */
  async submitOrder(data: any): Promise<Result<{ orderId: string }, string>> {
    try {
      // Log the submission for debugging purposes
      console.log("Submitting order to local storage simulation:", data);

      // Generate a mock order ID (e.g., ORD-ABC123XYZ)
      const mockOrderId = `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Since the order is now "submitted", clear the draft
      await this.clear();

      return Ok({ orderId: mockOrderId });
    } catch (e) {
      // NOTE: This is a temporary type assertion. In a real implementation,
      //       this should return Err("Failed to process local order").
      //       Kept as `any` to preserve existing functionality.
      return { ok: false, error: "Failed to process local order" } as any;
    }
  }
}
