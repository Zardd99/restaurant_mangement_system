/**
 * @module APIIngredientRepository
 * @description Clean Architecture repository implementation using a REST API.
 *
 * This module provides a concrete implementation of the `IngredientRepository`
 * interface, fetching and mutating ingredient data via HTTP calls to a backend
 * server. All methods return a `Result` type, adhering to the domain layer
 * contract and eliminating the need for try/catch in use cases.
 *
 * @see IngredientRepository - The interface being implemented.
 */

// ============================================================================
// Core Imports
// ============================================================================
import { Result, Ok, Err } from "../../core/Result";
import {
  IngredientRepository,
  IngredientAvailability,
  DeductionRequest,
  DeductionResult,
} from "../../domain/repositories/IngredientRepository";

// ============================================================================
// DTOs for Additional Endpoints
// ============================================================================

/**
 * Data returned from the inventory dashboard endpoint.
 * Contains aggregated inventory statistics and a detailed list of ingredients
 * with their current stock, usage, and status flags.
 */
export interface DashboardData {
  inventory: {
    totalItems: number;
    criticalItems: number;
    lowItems: number;
    normalItems: number;
    totalValue: number;
    ingredients: Array<{
      id: string;
      name: string;
      currentStock: number;
      unit: string;
      minStock: number;
      reorderPoint: number;
      costPerUnit: number;
      isLowStock: boolean;
      needsReorder: boolean;
      usedIn: Array<{
        menuItemId: string;
        menuItemName: string;
        quantityRequired: number;
        unit: string;
      }>;
    }>;
  };
  alerts: {
    enabled: boolean;
    checkInterval: number;
  };
}

/**
 * Represents a stock level item with a computed status.
 * Used by the stock‑levels endpoint for a more compact view.
 */
export interface StockLevelItem {
  id: string;
  name: string;
  currentStock: number;
  minStock: number;
  reorderPoint: number;
  unit: string;
  status: "NORMAL" | "LOW" | "CRITICAL";
  isLowStock: boolean;
  needsReorder: boolean;
  costPerUnit: number;
  category: string;
}

// ============================================================================
// Repository Implementation
// ============================================================================

/**
 * APIIngredientRepository
 *
 * REST API implementation of the `IngredientRepository` interface.
 * Communicates with a backend server that exposes inventory endpoints.
 * All HTTP requests are authenticated via a Bearer token.
 *
 * @implements {IngredientRepository}
 */
export class APIIngredientRepository implements IngredientRepository {
  private baseUrl: string;
  private token: string | null;

  /**
   * Creates an instance of the API repository.
   *
   * @param baseUrl - The base URL of the backend API (e.g., `https://api.example.com`).
   * @param token   - JWT authentication token. If `null`, all requests will fail.
   */
  constructor(baseUrl: string, token: string | null) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  // --------------------------------------------------------------------------
  // Private Helpers
  // --------------------------------------------------------------------------

  /**
   * Low‑level HTTP fetch wrapper.
   * - Adds authentication headers, `Content-Type`, and ngrok‑skip header.
   * - Automatically unwraps a `Result`‑shaped response if present.
   *
   * @template T - The expected type of the successful response value.
   * @param endpoint - API endpoint (e.g., `/api/inventory/dashboard`).
   * @param options  - Additional fetch options (method, body, etc.).
   * @returns A `Result` containing either the parsed data or an error message.
   */
  private async fetch<T>(
    endpoint: string,
    options?: RequestInit,
  ): Promise<Result<T, string>> {
    try {
      // ----------------------------------------------------------------------
      // 1. Validate authentication
      // ----------------------------------------------------------------------
      if (!this.token) {
        return Err("No authentication token available");
      }

      // ----------------------------------------------------------------------
      // 2. Execute HTTP request
      // ----------------------------------------------------------------------
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
          "ngrok-skip-browser-warning": "true",
          ...options?.headers,
        },
      });

      // ----------------------------------------------------------------------
      // 3. Handle non‑OK responses
      // ----------------------------------------------------------------------
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return Err(errorData.message || `HTTP error ${response.status}`);
      }

      // ----------------------------------------------------------------------
      // 4. Parse JSON response
      // ----------------------------------------------------------------------
      const data = await response.json();

      // ----------------------------------------------------------------------
      // 5. Unwrap backend `Result` wrapper if present
      // ----------------------------------------------------------------------
      if (data && typeof data === "object" && "ok" in data) {
        if (data.ok === true) {
          return Ok(data.value as T);
        } else {
          return Err(data.error || "Unknown error from server");
        }
      }

      // ----------------------------------------------------------------------
      // 6. Assume direct payload if no `Result` wrapper
      // ----------------------------------------------------------------------
      return Ok(data as T);
    } catch (error) {
      return Err(
        error instanceof Error ? error.message : "Network request failed",
      );
    }
  }

  // --------------------------------------------------------------------------
  // Public API – IngredientRepository Interface Methods
  // --------------------------------------------------------------------------

  /**
   * {@inheritDoc IngredientRepository.checkAvailability}
   */
  async checkAvailability(
    menuItemIds: string[],
    quantities: number[],
  ): Promise<Result<IngredientAvailability[], string>> {
    const items = menuItemIds.map((id, idx) => ({
      menuItemId: id,
      quantity: quantities[idx],
    }));

    return this.fetch<IngredientAvailability[]>(
      "/api/inventory/check-availability",
      {
        method: "POST",
        body: JSON.stringify({ items }),
      },
    );
  }

  /**
   * {@inheritDoc IngredientRepository.deductIngredients}
   */
  async deductIngredients(
    requests: DeductionRequest[],
  ): Promise<Result<DeductionResult[], string>> {
    return this.fetch<DeductionResult[]>("/api/inventory/consume", {
      method: "POST",
      body: JSON.stringify({ requests }),
    });
  }

  /**
   * {@inheritDoc IngredientRepository.previewDeduction}
   *
   * @remarks
   * This method ensures that an array is always returned on success.
   * If the backend returns a non‑array, it returns an empty array.
   */
  async previewDeduction(
    requests: DeductionRequest[],
  ): Promise<Result<DeductionResult[], string>> {
    try {
      const result = await this.fetch<DeductionResult[]>(
        "/api/inventory/preview",
        {
          method: "POST",
          body: JSON.stringify({ requests }),
        },
      );

      if (!result.ok) {
        return Err(result.error);
      }

      // Safeguard: the backend should always return an array,
      // but in case it doesn't, return an empty array.
      const value = result.value || [];
      if (!Array.isArray(value)) {
        console.warn("previewDeduction returned non-array:", value);
        return Ok([]);
      }

      return Ok(value);
    } catch (error) {
      return Err(
        error instanceof Error ? error.message : "Preview deduction failed",
      );
    }
  }

  /**
   * {@inheritDoc IngredientRepository.getStockLevel}
   */
  async getStockLevel(ingredientId: string): Promise<Result<number, string>> {
    const result = await this.fetch<{ stock: number }>(
      `/api/inventory/stock/${ingredientId}`,
    );

    if (!result.ok) return Err(result.error);
    return Ok(result.value.stock);
  }

  /**
   * {@inheritDoc IngredientRepository.getLowStockAlerts}
   */
  async getLowStockAlerts(): Promise<Result<DeductionResult[], string>> {
    return this.fetch<DeductionResult[]>("/api/inventory/low-stock");
  }

  // --------------------------------------------------------------------------
  // Additional Public Methods (Beyond Interface)
  // --------------------------------------------------------------------------

  /**
   * Retrieves the full dashboard data, including inventory summary
   * and detailed ingredient usage across menu items.
   *
   * @returns A `Result` containing the dashboard data or an error.
   */
  async getDashboardData(): Promise<Result<DashboardData, string>> {
    console.log(
      "Fetching dashboard data from:",
      `${this.baseUrl}/api/inventory/dashboard`,
    );
    const result = await this.fetch<DashboardData>("/api/inventory/dashboard");

    if (!result.ok) {
      console.error("Error fetching dashboard data:", result.error);
      return Err(result.error);
    }

    console.log(
      "Dashboard data received:",
      JSON.stringify(result.value, null, 2),
    );
    return Ok(result.value);
  }

  /**
   * Retrieves a compact list of all ingredients with their current stock
   * levels and a pre‑computed status (NORMAL / LOW / CRITICAL).
   *
   * @returns A `Result` containing an array of `StockLevelItem` or an error.
   */
  async getStockLevels(): Promise<Result<StockLevelItem[], string>> {
    const result = await this.fetch<{ stockLevels: StockLevelItem[] }>(
      "/api/inventory/stock-levels",
    );

    if (!result.ok) return Err(result.error);
    return Ok(result.value.stockLevels);
  }

  /**
   * Directly updates the stock level of a specific ingredient.
   * Typically used for manual inventory adjustments.
   *
   * @param ingredientId - ID of the ingredient to update.
   * @param newStock     - The new stock quantity.
   * @returns A `Result` containing a success flag and a message.
   */
  async updateStock(
    ingredientId: string,
    newStock: number,
  ): Promise<Result<{ success: boolean; message: string }, string>> {
    return this.fetch<{ success: boolean; message: string }>(
      "/api/inventory/stock",
      {
        method: "PUT",
        body: JSON.stringify({ ingredientId, newStock }),
      },
    );
  }

  /**
   * Places a reorder for a specific ingredient.
   * The backend will create a purchase order or a reorder request.
   *
   * @param ingredientId - ID of the ingredient to reorder.
   * @param quantity     - Optional quantity; if omitted, a default quantity is used.
   * @returns A `Result` containing a success flag and a reorder identifier.
   */
  async reorderIngredient(
    ingredientId: string,
    quantity?: number,
  ): Promise<Result<{ success: boolean; reorderId: string }, string>> {
    return this.fetch<{ success: boolean; reorderId: string }>(
      "/api/inventory/reorder",
      {
        method: "POST",
        body: JSON.stringify({ ingredientId, quantity }),
      },
    );
  }

  /**
   * Performs a batch update of stock levels for multiple ingredients.
   *
   * @param updates - Array of updates, each containing an ingredient ID and a new stock value.
   * @returns A `Result` containing an array of per‑item success flags.
   */
  async bulkUpdateStocks(
    updates: Array<{ ingredientId: string; newStock: number }>,
  ): Promise<
    Result<Array<{ ingredientId: string; success: boolean }>, string>
  > {
    return this.fetch<Array<{ ingredientId: string; success: boolean }>>(
      "/api/inventory/bulk-update",
      {
        method: "POST",
        body: JSON.stringify({ updates }),
      },
    );
  }
}
