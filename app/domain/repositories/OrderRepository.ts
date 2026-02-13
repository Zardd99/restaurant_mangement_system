// ============================================================================
// Core Result Type
// ============================================================================
import { Result } from "../../core/Result";

// ============================================================================
// Domain / Hook Types
// ============================================================================
import { MenuItem } from "../../hooks/useMenuData";

// ============================================================================
// Data Transfer Objects (DTOs)
// ============================================================================

/**
 * Represents an item in the current order, including the full menu item details
 * and the quantity ordered. Used for cart state and submission payload.
 */
export interface OrderItemDTO {
  /** The full menu item entity (includes name, price, category, etc.). */
  menuItem: MenuItem;
  /** Number of units of this item ordered. */
  quantity: number;
  /** Optional customer instructions (e.g., "no onions", "extra sauce"). */
  specialInstructions?: string;
}

// ============================================================================
// Order Repository Interface
// ============================================================================

/**
 * Repository interface for managing order persistence and submission.
 * Abstracts the underlying storage mechanism (local storage, session storage,
 * IndexedDB) and the remote API communication.
 */
export interface OrderRepository {
  /**
   * Submits the current order to the backend API.
   * @param data - Order payload containing items, total, table, customer, etc.
   * @returns A promise resolving to a Result object.
   *          - Success: contains the generated order ID.
   *          - Failure: contains an error message string.
   */
  submitOrder(data: {
    items: Array<{
      menuItem: string;
      quantity: number;
      price: number;
      specialInstructions: string;
    }>;
    totalAmount: number;
    tableNumber: number;
    customerName: string;
    orderType: string;
    status: string;
  }): Promise<Result<{ orderId: string }, string>>;

  /**
   * Loads the persisted order items (e.g., from local storage).
   * @returns A promise resolving to an array of OrderItemDTOs.
   */
  load(): Promise<OrderItemDTO[]>;

  /**
   * Persists the current order items (e.g., saves to local storage).
   * @param items - Array of order items to save.
   */
  save(items: OrderItemDTO[]): Promise<void>;

  /**
   * Clears all persisted order data.
   * Typically called after successful submission or when user cancels.
   */
  clear(): Promise<void>;
}
