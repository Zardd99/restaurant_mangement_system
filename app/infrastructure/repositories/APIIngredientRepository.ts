/**
 * Clean Architecture: Repository Implementation
 *
 * Purpose: Concrete implementation using REST API
 * Dependencies: Only the repository interface
 * Usage: Injected into services via DI
 */

import { Result, Ok, Err } from "../../core/Result";
import {
  IngredientRepository,
  IngredientAvailability,
  DeductionRequest,
  DeductionResult,
} from "../../domain/repositories/IngredientRepository";

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

export class APIIngredientRepository implements IngredientRepository {
  private baseUrl: string;
  private token: string | null;

  constructor(baseUrl: string, token: string | null) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  private async fetch<T>(
    endpoint: string,
    options?: RequestInit,
  ): Promise<Result<T, string>> {
    try {
      if (!this.token) {
        return Err("No authentication token available");
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
          "ngrok-skip-browser-warning": "true",
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return Err(errorData.message || `HTTP error ${response.status}`);
      }

      const data = await response.json();

      // Handle the Result wrapper from backend
      if (data && typeof data === "object" && "ok" in data) {
        if (data.ok === true) {
          return Ok(data.value as T);
        } else {
          return Err(data.error || "Unknown error from server");
        }
      }

      // If no Result wrapper, assume direct data
      return Ok(data as T);
    } catch (error) {
      return Err(
        error instanceof Error ? error.message : "Network request failed",
      );
    }
  }

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

  async deductIngredients(
    requests: DeductionRequest[],
  ): Promise<Result<DeductionResult[], string>> {
    return this.fetch<DeductionResult[]>("/api/inventory/consume", {
      method: "POST",
      body: JSON.stringify({ requests }),
    });
  }

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

      // Ensure we always return an array, even if there's an error
      if (!result.ok) {
        return Err(result.error);
      }

      // Ensure value is an array
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

  async getStockLevel(ingredientId: string): Promise<Result<number, string>> {
    const result = await this.fetch<{ stock: number }>(
      `/api/inventory/stock/${ingredientId}`,
    );

    if (!result.ok) return Err(result.error);
    return Ok(result.value.stock);
  }

  async getLowStockAlerts(): Promise<Result<DeductionResult[], string>> {
    return this.fetch<DeductionResult[]>("/api/inventory/low-stock");
  }

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

  async getStockLevels(): Promise<Result<StockLevelItem[], string>> {
    const result = await this.fetch<{ stockLevels: StockLevelItem[] }>(
      "/api/inventory/stock-levels",
    );

    if (!result.ok) return Err(result.error);
    return Ok(result.value.stockLevels);
  }

  // Additional methods for specific operations
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

  // Batch operations
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
