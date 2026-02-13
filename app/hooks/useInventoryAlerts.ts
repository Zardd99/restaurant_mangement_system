// ============================================================================
// External Imports
// ============================================================================
import { useEffect, useCallback, useRef } from "react";

// ============================================================================
// Internal Imports
// ============================================================================
import { createEmailJSNotificationService } from "../services/emailjsNotificationService";
import { IngredientStock } from "../types/inventory";

// ============================================================================
// Custom Hook: useInventoryAlerts
// ============================================================================

/**
 * useInventoryAlerts Hook
 *
 * Manages inventory‑related email notifications:
 * - Sends low‑stock and reorder‑point alerts only once per ingredient,
 *   avoiding duplicate notifications.
 * - Sends a reorder confirmation email when a manual reorder is placed.
 *
 * @returns An object containing:
 *   - `sendLowStockAlerts`   – Function to evaluate current stock and send
 *                              notifications for **new** low‑stock items.
 *   - `sendReorderConfirmation` – Function to send a confirmation email for
 *                                 a successful reorder.
 */
export const useInventoryAlerts = () => {
  // --------------------------------------------------------------------------
  // Persistent References (no re‑initialization on re‑render)
  // --------------------------------------------------------------------------
  /** Singleton instance of the email notification service. */
  const emailService = useRef(createEmailJSNotificationService());

  /**
   * Set of ingredient IDs for which a low‑stock / reorder alert has already
   * been sent. Used to prevent duplicate notifications across multiple
   * invocations of `sendLowStockAlerts`.
   */
  const previousAlerts = useRef<Set<string>>(new Set());

  // --------------------------------------------------------------------------
  // Public Functions (memoized with useCallback)
  // --------------------------------------------------------------------------

  /**
   * Evaluates the current stock levels of all provided ingredients and sends
   * email alerts **only for ingredients that have just become low‑stock
   * or reached the reorder point** (i.e., not already in `previousAlerts`).
   *
   * Also removes from `previousAlerts` any ingredients that are no longer
   * in a low‑stock / reorder state.
   *
   * @param ingredients - Array of current ingredient stock data.
   */
  const sendLowStockAlerts = useCallback(
    (ingredients: IngredientStock[]) => {
      // ----------------------------------------------------------------------
      // 1. Identify items that currently require attention.
      // ----------------------------------------------------------------------
      const lowStockItems = ingredients.filter(
        (ing) => ing.isLowStock || ing.needsReorder,
      );

      // ----------------------------------------------------------------------
      // 2. Filter out alerts that have already been sent.
      // ----------------------------------------------------------------------
      const newAlerts = lowStockItems.filter(
        (item) => !previousAlerts.current.has(item.id),
      );

      // ----------------------------------------------------------------------
      // 3. Send notifications for genuinely new low‑stock items.
      // ----------------------------------------------------------------------
      if (newAlerts.length > 0) {
        const alerts = newAlerts.map((ing) => ({
          ingredientId: ing.id,
          ingredientName: ing.name,
          currentStock: ing.currentStock,
          minStock: ing.minStock,
          unit: ing.unit,
          reorderPoint: ing.reorderPoint,
          costPerUnit: ing.costPerUnit,
        }));

        // Fire-and‑forget; failures are logged but do not block.
        emailService.current.sendLowStockAlert(alerts).catch(console.error);

        // Remember that we have sent an alert for these ingredients.
        newAlerts.forEach((item) => previousAlerts.current.add(item.id));
      }

      // ----------------------------------------------------------------------
      // 4. Clean up ingredients that have recovered from low‑stock state.
      // ----------------------------------------------------------------------
      Array.from(previousAlerts.current).forEach((itemId) => {
        const item = ingredients.find((i) => i.id === itemId);
        if (item && !item.isLowStock && !item.needsReorder) {
          previousAlerts.current.delete(itemId);
        }
      });
    },
    [], // No external dependencies – all dependencies are refs (stable).
  );

  /**
   * Sends a confirmation email after a reorder has been successfully placed.
   *
   * @param ingredientName - Name of the ingredient being reordered.
   * @param reorderId      - Identifier of the reorder transaction.
   * @param quantity       - Quantity ordered.
   * @param estimatedCost  - Estimated total cost of the reorder.
   */
  const sendReorderConfirmation = useCallback(
    (
      ingredientName: string,
      reorderId: string,
      quantity: number,
      estimatedCost: number,
    ) => {
      // Fire‑and‑forget; failures are logged.
      emailService.current
        .sendReorderConfirmation(
          ingredientName,
          reorderId,
          quantity,
          estimatedCost,
        )
        .catch(console.error);
    },
    [],
  );

  // --------------------------------------------------------------------------
  // Return Public API
  // --------------------------------------------------------------------------
  return {
    sendLowStockAlerts,
    sendReorderConfirmation,
  };
};
