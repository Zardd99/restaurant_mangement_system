// ============================================================================
// Application Managers
// ============================================================================
import {
  InventoryManager,
  ProcessOrderResult,
  FailedOrderItem,
} from "../../application/managers/inventory-manager";

// ============================================================================
// Navigation Service Interface
// ============================================================================

/**
 * NavigationService – Contract for routing and user feedback during order flow.
 * Implementations provide concrete navigation and error display logic.
 */
export interface NavigationService {
  /**
   * Navigates the user to the order confirmation page/screen.
   */
  navigateToConfirmation(): void;

  /**
   * Displays an error message to the user.
   * @param message - The error text to be shown.
   */
  showError(message: string): void;
}

// ============================================================================
// Order Coordinator Class
// ============================================================================

/**
 * OrderCoordinator – Orchestrates the order processing workflow.
 * - Delegates inventory validation and deduction to an InventoryManager.
 * - Uses a NavigationService for user feedback and routing.
 * - Encapsulates business logic for handling successful and failed orders.
 */
export class OrderCoordinator {
  /**
   * Creates an instance of OrderCoordinator.
   * @param inventoryManager - Responsible for checking stock and deducting ingredients.
   * @param navigationService - Responsible for navigation and displaying errors.
   */
  constructor(
    private inventoryManager: InventoryManager,
    private navigationService: NavigationService,
  ) {}

  /**
   * Processes an order by delegating to the inventory manager.
   * If the order is fully successful, navigates to the confirmation page.
   * @param orderItems - Array of order items to be processed.
   * @returns A promise that resolves to the processing result.
   */
  async processOrder(orderItems: any[]): Promise<ProcessOrderResult> {
    const result = await this.inventoryManager.processOrder(orderItems);

    if (result.successful) {
      this.navigationService.navigateToConfirmation();
    }

    return result;
  }

  /**
   * Displays a formatted error message for items that failed processing.
   * @param failedItems - List of items that could not be processed.
   */
  showOrderErrors(failedItems: FailedOrderItem[]): void {
    const errorMessage = failedItems
      .map((item) => `Item ${item.menuItemId}: ${item.error}`)
      .join("\n");

    this.navigationService.showError(`Some items failed:\n${errorMessage}`);
  }

  /**
   * Directly triggers navigation to the confirmation page.
   * Useful when order processing is bypassed or already succeeded.
   */
  navigateToConfirmation(): void {
    this.navigationService.navigateToConfirmation();
  }

  /**
   * Directly displays an error message via the navigation service.
   * @param message - The error text to be shown.
   */
  showError(message: string): void {
    this.navigationService.showError(message);
  }
}
