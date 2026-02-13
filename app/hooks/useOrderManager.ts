/**
 * =============================================================================
 * CUSTOM HOOK: useOrderManager
 * =============================================================================
 *
 * Manages the waiter's current order state, synchronising it with both
 * `localStorage` (via `useLocalStorage`) and the domain repository
 * (`LocalStorageOrderRepository`). All order mutations are performed through
 * use cases from `OrderUseCases`, ensuring business rules are enforced.
 *
 * ✅ Responsibilities:
 *   - Provide the current order array and mutation methods.
 *   - Persist order state to `localStorage` automatically.
 *   - Synchronise with the repository on mount.
 *   - Compute synchronous totals for UI display.
 *
 * 🚫 Does NOT:
 *   - Handle order submission (finalisation).
 *   - Perform ingredient validation (delegated to use cases).
 *
 * @module useOrderManager
 */

import { useCallback, useEffect } from "react";
import { MenuItem } from "./useMenuData";
import { useLocalStorage } from "./useLocalStorage";
import { LocalStorageOrderRepository } from "../domain/repositories/LocalStorageOrderRepository";
import {
  loadOrder,
  addToOrder as ucAddToOrder,
  updateQuantity as ucUpdateQuantity,
  updateInstructions as ucUpdateInstructions,
  removeItem as ucRemoveItem,
  clearOrder as ucClearOrder,
} from "../application/usecases/OrderUseCases";

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

/**
 * Represents a single item in the current order.
 * Contains the full menu item, quantity, and optional special instructions.
 */
export interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  specialInstructions?: string;
}

// =============================================================================
// HOOK DEFINITION
// =============================================================================

/**
 * useOrderManager
 * ---------------
 * Custom hook that provides complete order management capabilities.
 * The order state is automatically persisted to localStorage and synchronised
 * with the repository. All write operations are routed through use cases.
 *
 * @returns {Object} An object containing:
 *   - currentOrder: The current array of OrderItem.
 *   - addToOrder:    Adds a menu item (quantity 1) to the order.
 *   - updateQuantity: Updates the quantity of an existing item.
 *   - updateInstructions: Updates special instructions for an item.
 *   - removeFromOrder: Removes an item completely.
 *   - calculateTotal: Synchronous sum of (price × quantity).
 *   - clearOrder:     Removes all items.
 */
export const useOrderManager = () => {
  // -------------------------------------------------------------------------
  // STATE & PERSISTENCE
  // -------------------------------------------------------------------------
  // Order state is stored in localStorage via the useLocalStorage hook.
  // This ensures the order survives page refreshes.
  const [currentOrder, setCurrentOrder] = useLocalStorage<OrderItem[]>(
    "waiter_current_order",
    [],
  );

  // -------------------------------------------------------------------------
  // REPOSITORY INSTANTIATION (Dependency Injection)
  // -------------------------------------------------------------------------
  // Repository instance is created here. In a more advanced setup,
  // this could be injected via context. The `as any` assertions below are
  // temporary workarounds for type mismatches between the repository
  // interface and the concrete implementation – they do not affect runtime.
  const repo = new LocalStorageOrderRepository();

  // -------------------------------------------------------------------------
  // SYNCHRONISATION ON MOUNT
  // -------------------------------------------------------------------------
  // When the hook mounts, load the order from the repository and
  // update the local state if it exists. This ensures that if the
  // order was modified outside this component (e.g., by another tab),
  // we still get the latest data.
  useEffect(() => {
    let mounted = true;

    (async () => {
      const res = await loadOrder(repo as any);
      if (mounted && res.ok) {
        setCurrentOrder(res.value as OrderItem[]);
      }
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // -------------------------------------------------------------------------
  // MUTATION METHODS (MEMOIZED)
  // -------------------------------------------------------------------------
  // Each method calls the corresponding use case, passing the repository.
  // On success, the new order state (returned by the use case) is set into
  // the local state, which in turn persists to localStorage.

  /**
   * Adds a menu item to the current order with default quantity 1 and
   * empty special instructions.
   *
   * @param item - The menu item to add.
   */
  const addToOrder = useCallback(
    async (item: MenuItem) => {
      const dto = { menuItem: item, quantity: 1, specialInstructions: "" };
      const res = await ucAddToOrder(repo as any, dto as any);
      if (res.ok) {
        setCurrentOrder(res.value as OrderItem[]);
      }
    },
    [setCurrentOrder],
  );

  /**
   * Updates the quantity of an existing order item.
   *
   * @param itemId      - The ID of the menu item (not the order item index).
   * @param newQuantity - The new quantity (must be >= 1).
   */
  const updateQuantity = useCallback(
    async (itemId: string, newQuantity: number) => {
      const res = await ucUpdateQuantity(repo as any, itemId, newQuantity);
      if (res.ok) {
        setCurrentOrder(res.value as OrderItem[]);
      }
    },
    [setCurrentOrder],
  );

  /**
   * Updates the special instructions for an existing order item.
   *
   * @param itemId       - The ID of the menu item.
   * @param instructions - The new special instructions (empty string clears).
   */
  const updateInstructions = useCallback(
    async (itemId: string, instructions: string) => {
      const res = await ucUpdateInstructions(repo as any, itemId, instructions);
      if (res.ok) {
        setCurrentOrder(res.value as OrderItem[]);
      }
    },
    [setCurrentOrder],
  );

  /**
   * Removes an item completely from the current order.
   *
   * @param itemId - The ID of the menu item to remove.
   */
  const removeFromOrder = useCallback(
    async (itemId: string) => {
      const res = await ucRemoveItem(repo as any, itemId);
      if (res.ok) {
        setCurrentOrder(res.value as OrderItem[]);
      }
    },
    [setCurrentOrder],
  );

  /**
   * Synchronously computes the total price of the current order.
   * This is a UI‑friendly calculation based on the local state.
   *
   * @returns The sum of (menuItem.price × quantity) for all items.
   */
  const calculateTotal = useCallback(() => {
    return currentOrder.reduce(
      (total, item) => total + item.menuItem.price * item.quantity,
      0,
    );
  }, [currentOrder]);

  /**
   * Clears the entire order, removing all items.
   */
  const clearOrder = useCallback(async () => {
    const res = await ucClearOrder(repo as any);
    if (res.ok) {
      setCurrentOrder([]);
    }
  }, [setCurrentOrder]);

  // -------------------------------------------------------------------------
  // EXPOSED API
  // -------------------------------------------------------------------------
  return {
    currentOrder,
    addToOrder,
    updateQuantity,
    updateInstructions,
    removeFromOrder,
    calculateTotal,
    clearOrder,
  };
};
