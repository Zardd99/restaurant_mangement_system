/**
 * =============================================================================
 * KITCHEN STATS USE CASE
 * =============================================================================
 *
 * Clean Architecture Use Case:
 * Fetches kitchen performance statistics from the backend API.
 * Provides a pure function for calculating percentage trends.
 *
 * 🔒 Dependencies:
 *   - `Result` type from core (for explicit error handling)
 *   - Environment variable `NEXT_PUBLIC_API_URL` for base URL
 *
 * ✅ Responsibilities:
 *   - Call the `/api/orders/stats` endpoint with authentication.
 *   - Transform the raw response into a typed `StatsData` object.
 *   - Return a `Result<StatsData, string>` to handle failures gracefully.
 *
 * 🚫 Does NOT:
 *   - Manage UI state or caching.
 *   - Handle authentication tokens (must be provided).
 *
 * @module fetchKitchenStatsUseCase
 */

import { Result, Ok, Err } from "../../core/Result";

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

/**
 * Comprehensive statistics for kitchen performance.
 * Used by dashboard views and analytics panels.
 */
export interface StatsData {
  /** Total revenue generated today. */
  dailyEarnings: number;

  /** Total revenue generated in the last 7 days. */
  weeklyEarnings: number;

  /** Total revenue generated this year. */
  yearlyEarnings: number;

  /** Number of orders placed today. */
  todayOrderCount: number;

  /** Average monetary value per order (today). */
  avgOrderValue: number;

  /** Breakdown of orders by their current status (e.g., pending, preparing, ready, served). */
  ordersByStatus: Record<string, number>;

  /** Top‑selling dishes ranked by quantity sold (with revenue). */
  bestSellingDishes: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
}

// =============================================================================
// USE CASE: FETCH KITCHEN STATISTICS
// =============================================================================

/**
 * Fetches kitchen statistics from the backend API.
 *
 * @param token   - Valid authentication JWT.
 * @param baseUrl - API base URL (defaults to NEXT_PUBLIC_API_URL).
 * @returns       - `Ok(StatsData)` if successful, `Err(error)` otherwise.
 *
 * @example
 * const result = await fetchKitchenStatsUseCase(userToken);
 * if (result.ok) {
 *   setStats(result.value);
 * } else {
 *   showError(result.error);
 * }
 */
export const fetchKitchenStatsUseCase = async (
  token: string,
  baseUrl: string = process.env.NEXT_PUBLIC_API_URL as string,
): Promise<Result<StatsData, string>> => {
  try {
    const response = await fetch(`${baseUrl}/api/orders/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return Err(`Failed to fetch stats: ${response.status}`);
    }

    const data = await response.json();
    return Ok(data as StatsData);
  } catch (e) {
    return Err(e instanceof Error ? e.message : "Unknown error fetching stats");
  }
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculates the percentage change between two numeric values.
 * Useful for displaying trends (e.g., revenue compared to previous period).
 *
 * @param current  - Current period value.
 * @param previous - Previous period value.
 * @returns        - Percentage change.
 *                  - If previous = 0 and current > 0 → returns 100.
 *                  - If both are 0 → returns 0.
 *
 * @example
 * const trend = calculateTrend(120, 100); // 20
 * const trend = calculateTrend(50, 0);    // 100
 */
export const calculateTrend = (current: number, previous: number): number => {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
};
