/**
 * =============================================================================
 * DOMAIN NOTIFICATION – LOW STOCK ALERTING
 * =============================================================================
 *
 * Defines the contract for sending low‑stock notifications and provides a
 * concrete notifier that translates `ConsumptionResult` into `LowStockAlert`
 * objects and delegates to a `NotificationService`.
 *
 * ✅ Responsibilities:
 *   - Define the `LowStockAlert` data structure.
 *   - Define the `NotificationService` interface (abstraction for email,
 *     push, SMS, etc.).
 *   - Provide `LowStockNotifier` which implements the business rule:
 *     “Whenever ingredients are consumed and fall below threshold,
 *     generate alerts and send them.”
 *
 * 🚫 Does NOT:
 *   - Implement actual email/notification sending logic.
 *   - Fetch ingredient metadata (e.g., name, minStock, unit) – this is left
 *     to the caller or a future enhancement.
 *
 * @module LowStockNotifier
 */

import { ConsumptionResult } from "../application/usecases/consume-ingredients-use-case";

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

/**
 * Represents a single low‑stock alert for an ingredient.
 * Used by the `NotificationService` to format and deliver the alert.
 */
export interface LowStockAlert {
  /** Unique identifier of the ingredient. */
  ingredientId: string;
  /** Display name of the ingredient (should be resolved from repository). */
  ingredientName: string;
  /** Current stock level after consumption. */
  currentStock: number;
  /** Minimum stock threshold that triggered the alert. */
  minStock: number;
  /** Unit of measurement (e.g., "kg", "liters", "pieces"). */
  unit: string;
}

/**
 * NotificationService
 * -------------------
 * Abstraction for sending low‑stock alerts.
 * Implementations can use EmailJS, SMS gateways, push notifications, etc.
 */
export interface NotificationService {
  /**
   * Sends one or more low‑stock alerts.
   *
   * @param alerts - Array of `LowStockAlert` objects to be delivered.
   */
  sendLowStockAlert(alerts: LowStockAlert[]): Promise<void>;
}

// =============================================================================
// DOMAIN SERVICE – LOW STOCK NOTIFIER
// =============================================================================

/**
 * LowStockNotifier
 * ----------------
 * Domain service that converts `ConsumptionResult` objects (produced after
 * ingredient deduction) into `LowStockAlert` objects and forwards them to
 * a `NotificationService`.
 *
 * @remarks
 * The current implementation uses placeholder values for ingredient name,
 * minimum stock, and unit. In a production system, these should be fetched
 * from an `IngredientRepository` using the `ingredientId`.
 */
export class LowStockNotifier {
  /**
   * @param notificationService - The underlying delivery mechanism.
   */
  constructor(private notificationService: NotificationService) {}

  /**
   * Processes consumption results and sends alerts for any ingredients
   * that are now below their minimum stock level.
   *
   * @param results - Array of `ConsumptionResult` from ingredient deduction.
   */
  async notifyLowStock(results: ConsumptionResult[]): Promise<void> {
    // TODO: Replace placeholder values with real ingredient data.
    // Currently, ingredient name, minStock, and unit are mocked.
    const alerts: LowStockAlert[] = results.map((result) => ({
      ingredientId: result.ingredientId,
      ingredientName: `Ingredient ${result.ingredientId}`, // Placeholder
      currentStock: result.remainingStock,
      minStock: 10, // Placeholder – should be fetched from repository
      unit: "units", // Placeholder – should be fetched from repository
    }));

    if (alerts.length > 0) {
      await this.notificationService.sendLowStockAlert(alerts);
    }
  }
}
