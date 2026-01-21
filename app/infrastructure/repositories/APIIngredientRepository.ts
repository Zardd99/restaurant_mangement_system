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
} from "../../repositories/IngredientRepository";

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
    const requests = menuItemIds.map((id, idx) => ({
      menuItemId: id,
      quantity: quantities[idx],
    }));

    return this.fetch<IngredientAvailability[]>(
      "/api/inventory/check-availability",
      {
        method: "POST",
        body: JSON.stringify({ items: requests }),
      },
    );
  }

  async deductIngredients(
    requests: DeductionRequest[],
  ): Promise<Result<DeductionResult[], string>> {
    return this.fetch<DeductionResult[]>("/api/inventory/consume", {
      method: "POST",
      body: JSON.stringify({ items: requests }),
    });
  }

  async previewDeduction(
    requests: DeductionRequest[],
  ): Promise<Result<DeductionResult[], string>> {
    return this.fetch<DeductionResult[]>("/api/inventory/preview", {
      method: "POST",
      body: JSON.stringify({ items: requests }),
    });
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
}
