/**
 * =============================================================================
 * CLEAN ARCHITECTURE: VIEWMODEL LAYER – ORDER VIEW MODEL
 * =============================================================================
 *
 * Purpose: Manage UI state and orchestrate user interactions for the order
 *          submission flow. Acts as a bridge between the React view and the
 *          domain/business logic (OrderManager).
 *
 * ✅ Responsibilities:
 *   - Hold and mutate UI state (loading, errors, success, previews).
 *   - Provide a subscription mechanism for React components to react to state
 *     changes.
 *   - Delegate business operations to the injected OrderManager.
 *   - Convert domain results into UI‑friendly state.
 *
 * 🚫 Does NOT:
 *   - Contain any UI rendering logic.
 *   - Make direct API calls.
 *   - Handle routing or navigation.
 *
 * @module OrderViewModel
 */

import { useState, useCallback } from "react";
import {
  OrderManager,
  OrderSubmissionDTO,
} from "../../application/managers/OrderManager";
import { IngredientImpact } from "../../services/IngredientDeductionService";

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

/**
 * Represents the complete UI state of the order view.
 */
interface OrderViewState {
  /** Whether an order submission or preview is in progress. */
  isSubmitting: boolean;
  /** Human‑readable error message, or null if no error. */
  error: string | null;
  /** Whether the last submission succeeded. */
  success: boolean;
  /** List of low‑stock warnings returned after a successful order. */
  lowStockWarnings: string[];
  /** Ingredient impact preview for the current order. */
  ingredientPreview: IngredientImpact[];
  /** Whether the preview panel should be visible. */
  showPreview: boolean;
}

// =============================================================================
// ORDER VIEW MODEL – CLASS
// =============================================================================

/**
 * OrderViewModel
 * --------------
 * Implements the ViewModel pattern for Clean Architecture.
 * Exposes an observable state and methods that trigger business logic
 * through the injected OrderManager.
 *
 * @example
 * const viewModel = new OrderViewModel(orderManager);
 * viewModel.subscribe((state) => console.log(state));
 * await viewModel.submitOrder(orderDTO);
 */
export class OrderViewModel {
  // ---------------------------------------------------------------------------
  // PRIVATE STATE
  // ---------------------------------------------------------------------------
  private state: OrderViewState = {
    isSubmitting: false,
    error: null,
    success: false,
    lowStockWarnings: [],
    ingredientPreview: [],
    showPreview: false,
  };

  /** Set of listener functions that are called whenever state changes. */
  private listeners: Set<(state: OrderViewState) => void> = new Set();

  // ---------------------------------------------------------------------------
  // CONSTRUCTOR
  // ---------------------------------------------------------------------------
  /**
   * @param orderManager - Injected domain service containing all order business rules.
   */
  constructor(private orderManager: OrderManager) {}

  // ---------------------------------------------------------------------------
  // PUBLIC API – OBSERVABILITY
  // ---------------------------------------------------------------------------

  /**
   * Subscribes to state changes.
   *
   * @param listener - Function that will be called with the new state on every change.
   * @returns A function to unsubscribe this listener.
   */
  subscribe(listener: (state: OrderViewState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Returns a snapshot of the current state.
   * Always returns a new object to prevent accidental mutations.
   */
  getState(): OrderViewState {
    return { ...this.state };
  }

  // ---------------------------------------------------------------------------
  // PUBLIC API – ACTIONS
  // ---------------------------------------------------------------------------

  /**
   * Requests an ingredient impact preview for a draft order.
   * Does not mutate any data – only reads from the manager.
   *
   * @param order - The order DTO to preview.
   */
  async previewIngredientImpact(order: OrderSubmissionDTO): Promise<void> {
    this.state = {
      ...this.state,
      isSubmitting: true,
      error: null,
    };
    this.notify();

    const result = await this.orderManager.previewIngredientImpact(order.items);

    if (result.ok) {
      this.state = {
        ...this.state,
        isSubmitting: false,
        ingredientPreview: result.value,
        showPreview: true,
      };
    } else {
      this.state = {
        ...this.state,
        isSubmitting: false,
        error: result.error,
        showPreview: false,
      };
    }

    this.notify();
  }

  /**
   * Submits the order.
   * On success, stores low‑stock warnings and sets `success = true`.
   *
   * @param order - The fully populated order DTO.
   * @returns `true` if submission succeeded, `false` otherwise.
   */
  async submitOrder(order: OrderSubmissionDTO): Promise<boolean> {
    this.state = {
      ...this.state,
      isSubmitting: true,
      error: null,
      success: false,
    };
    this.notify();

    const result = await this.orderManager.submitOrder(order);

    if (result.ok) {
      this.state = {
        ...this.state,
        isSubmitting: false,
        success: true,
        lowStockWarnings: result.value.lowStockWarnings,
      };
      this.notify();
      return true;
    } else {
      this.state = {
        ...this.state,
        isSubmitting: false,
        error: result.error,
        success: false,
      };
      this.notify();
      return false;
    }
  }

  /**
   * Resets the entire ViewModel state to its initial values.
   * Useful when the user starts a new order.
   */
  reset(): void {
    this.state = {
      isSubmitting: false,
      error: null,
      success: false,
      lowStockWarnings: [],
      ingredientPreview: [],
      showPreview: false,
    };
    this.notify();
  }

  /**
   * Clears the current error message without affecting other state.
   */
  dismissError(): void {
    this.state = { ...this.state, error: null };
    this.notify();
  }

  /**
   * Hides the ingredient preview panel.
   */
  hidePreview(): void {
    this.state = { ...this.state, showPreview: false };
    this.notify();
  }

  // ---------------------------------------------------------------------------
  // PRIVATE HELPERS
  // ---------------------------------------------------------------------------

  /**
   * Notifies all subscribed listeners of the current state.
   * Always sends a shallow copy to enforce immutability in the UI layer.
   */
  private notify(): void {
    const stateCopy = { ...this.state };
    this.listeners.forEach((listener) => listener(stateCopy));
  }
}

// =============================================================================
// REACT HOOK – CONSUMER INTERFACE
// =============================================================================

/**
 * useOrderViewModel
 * -----------------
 * React hook that instantiates and provides the OrderViewModel.
 * The ViewModel is created once and persists for the lifetime of the component.
 *
 * @param orderManager - Injected OrderManager instance.
 * @returns An object containing the current state and all bound actions.
 *
 * @example
 * const { state, submitOrder } = useOrderViewModel(orderManager);
 */
export function useOrderViewModel(orderManager: OrderManager) {
  // -------------------------------------------------------------------------
  // VIEWMODEL INSTANTIATION (stable across re‑renders)
  // -------------------------------------------------------------------------
  const [viewModel] = useState(() => new OrderViewModel(orderManager));

  // -------------------------------------------------------------------------
  // LOCAL STATE – synchronised with ViewModel
  // -------------------------------------------------------------------------
  const [state, setState] = useState(viewModel.getState());

  // -------------------------------------------------------------------------
  // SUBSCRIPTION – react to ViewModel state changes
  // -------------------------------------------------------------------------
  // NOTE: Using `useState` to run a side effect is an anti‑pattern.
  //       This should be `useEffect`, but the code is preserved as‑is to
  //       maintain exact original behaviour.
  useState(() => {
    const unsubscribe = viewModel.subscribe(setState);
    return () => unsubscribe();
  });

  // -------------------------------------------------------------------------
  // MEMOISED ACTIONS – stable callbacks that delegate to the ViewModel
  // -------------------------------------------------------------------------
  const previewIngredientImpact = useCallback(
    (order: OrderSubmissionDTO) => viewModel.previewIngredientImpact(order),
    [viewModel],
  );

  const submitOrder = useCallback(
    (order: OrderSubmissionDTO) => viewModel.submitOrder(order),
    [viewModel],
  );

  const reset = useCallback(() => viewModel.reset(), [viewModel]);

  const dismissError = useCallback(() => viewModel.dismissError(), [viewModel]);

  const hidePreview = useCallback(() => viewModel.hidePreview(), [viewModel]);

  // -------------------------------------------------------------------------
  // EXPOSED API
  // -------------------------------------------------------------------------
  return {
    state,
    previewIngredientImpact,
    submitOrder,
    reset,
    dismissError,
    hidePreview,
  };
}
