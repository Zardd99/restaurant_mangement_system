/**
 * Clean Architecture: ViewModel Layer
 *
 * Purpose: Manage UI state and coordinate user actions
 * Dependencies: Managers and Coordinators only
 * Usage: Used directly by React components
 */

import { useState, useCallback } from "react";
import {
  OrderManager,
  OrderSubmissionDTO,
} from "../../application/managers/OrderManager";
import { IngredientImpact } from "../../services/IngredientDeductionService";

interface OrderViewState {
  isSubmitting: boolean;
  error: string | null;
  success: boolean;
  lowStockWarnings: string[];
  ingredientPreview: IngredientImpact[];
  showPreview: boolean;
}

export class OrderViewModel {
  private state: OrderViewState = {
    isSubmitting: false,
    error: null,
    success: false,
    lowStockWarnings: [],
    ingredientPreview: [],
    showPreview: false,
  };

  private listeners: Set<(state: OrderViewState) => void> = new Set();

  constructor(private orderManager: OrderManager) {}

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: OrderViewState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of state change
   */
  private notify(): void {
    this.listeners.forEach((listener) => listener({ ...this.state }));
  }

  /**
   * Get current state
   */
  getState(): OrderViewState {
    return { ...this.state };
  }

  /**
   * Preview ingredient impact
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
   * Submit order
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
   * Clear state
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
   * Dismiss error
   */
  dismissError(): void {
    this.state = { ...this.state, error: null };
    this.notify();
  }

  /**
   * Hide preview
   */
  hidePreview(): void {
    this.state = { ...this.state, showPreview: false };
    this.notify();
  }
}

/**
 * React Hook for OrderViewModel
 */
export function useOrderViewModel(orderManager: OrderManager) {
  const [viewModel] = useState(() => new OrderViewModel(orderManager));
  const [state, setState] = useState(viewModel.getState());

  // Subscribe to ViewModel changes
  useState(() => {
    const unsubscribe = viewModel.subscribe(setState);
    return () => unsubscribe();
  });

  return {
    state,
    previewIngredientImpact: useCallback(
      (order: OrderSubmissionDTO) => viewModel.previewIngredientImpact(order),
      [viewModel],
    ),
    submitOrder: useCallback(
      (order: OrderSubmissionDTO) => viewModel.submitOrder(order),
      [viewModel],
    ),
    reset: useCallback(() => viewModel.reset(), [viewModel]),
    dismissError: useCallback(() => viewModel.dismissError(), [viewModel]),
    hidePreview: useCallback(() => viewModel.hidePreview(), [viewModel]),
  };
}
