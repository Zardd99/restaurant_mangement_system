// ============================================================================
// Application Managers and Coordinators
// ============================================================================
import { OrderItem } from "../../application/managers/inventory-manager";
import { OrderCoordinator } from "../../application/coordinators/order-coordinator";

// ============================================================================
// Order ViewModel
// ============================================================================

/**
 * OrderViewModel – Presentation‑layer component that manages the state and
 * behaviour of an order in the UI (e.g., cart, current order).
 *
 * - Maintains a mutable list of order items.
 * - Provides methods to add, remove, and update items.
 * - Delegates order submission and error handling to the injected OrderCoordinator.
 * - Exposes a read‑only snapshot of the current order.
 *
 * @class
 */
export class OrderViewModel {
  // --------------------------------------------------------------------------
  // Private Properties
  // --------------------------------------------------------------------------

  /** Internal mutable list of items currently in the order. */
  private orderItems: OrderItem[] = [];

  // --------------------------------------------------------------------------
  // Constructor
  // --------------------------------------------------------------------------

  /**
   * Creates an instance of OrderViewModel.
   * @param coordinator - The business‑logic coordinator responsible for
   *                      processing orders and handling navigation/errors.
   */
  constructor(private coordinator: OrderCoordinator) {}

  // --------------------------------------------------------------------------
  // Public Methods – Order Manipulation
  // --------------------------------------------------------------------------

  /**
   * Adds a new item to the current order.
   * @param menuItemId - Unique identifier of the menu item.
   * @param quantity   - Number of units to add.
   */
  addOrderItem(menuItemId: string, quantity: number): void {
    this.orderItems.push({ menuItemId, quantity });
  }

  /**
   * Removes an item from the current order by its menu item ID.
   * @param menuItemId - The identifier of the item to remove.
   */
  removeOrderItem(menuItemId: string): void {
    this.orderItems = this.orderItems.filter(
      (item) => item.menuItemId !== menuItemId,
    );
  }

  /**
   * Updates the quantity of an existing item in the order.
   * If the item does not exist, the method does nothing.
   * @param menuItemId  - The identifier of the item to update.
   * @param newQuantity - The new quantity value.
   */
  updateQuantity(menuItemId: string, newQuantity: number): void {
    const item = this.orderItems.find((item) => item.menuItemId === menuItemId);
    if (item) {
      item.quantity = newQuantity;
    }
  }

  // --------------------------------------------------------------------------
  // Public Methods – Order Submission
  // --------------------------------------------------------------------------

  /**
   * Submits the current order to the coordinator.
   * - On success: clears the internal order list and triggers navigation.
   * - On partial failure: displays errors via the coordinator.
   * - On unexpected error: displays a generic error message.
   *
   * @returns Promise<void>
   */
  async submitOrder(): Promise<void> {
    try {
      const result = await this.coordinator.processOrder(this.orderItems);

      if (result.successful) {
        // Order fully processed – clear local state and navigate to confirmation
        this.orderItems = [];
        this.coordinator.navigateToConfirmation();
      } else {
        // Some items failed – delegate error presentation to the coordinator
        this.coordinator.showOrderErrors(result.failedItems);
      }
    } catch (error) {
      // Unexpected runtime error (network, serialisation, etc.)
      this.coordinator.showError(
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  // --------------------------------------------------------------------------
  // Public Methods – State Access
  // --------------------------------------------------------------------------

  /**
   * Returns a read‑only snapshot of the current order.
   * The returned array is a shallow copy; modifications to the copy
   * do not affect the internal state.
   *
   * @returns {ReadonlyArray<OrderItem>} An immutable copy of the order items.
   */
  getCurrentOrder(): ReadonlyArray<OrderItem> {
    return [...this.orderItems];
  }
}
