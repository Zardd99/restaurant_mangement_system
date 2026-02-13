// ============================================================================
// Types & Interfaces – Statistics Data Structure
// ============================================================================

/**
 * Represents aggregated statistics for the kitchen / order dashboard.
 * Used to power both quick stats panels and full analytics views.
 */
export interface StatsData {
  /** Total earnings for the current day. */
  dailyEarnings: number;
  /** Total earnings for the current week. */
  weeklyEarnings: number;
  /** Total earnings for the current year. */
  yearlyEarnings: number;
  /** Number of orders placed today. */
  todayOrderCount: number;
  /** Average monetary value per order (over the selected period). */
  avgOrderValue: number;
  /** Breakdown of order counts by their status (e.g., pending, preparing, completed). */
  ordersByStatus: Record<string, number>;
  /** List of top‑selling dishes with quantity sold and revenue generated. */
  bestSellingDishes: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
}

// ============================================================================
// Stats Manager – Business Logic for Retrieving and Computing Statistics
// ============================================================================

/**
 * StatsManager – Encapsulates all operations related to fetching and
 * calculating statistical data from the backend.
 *
 * @class
 */
export class StatsManager {
  private baseUrl: string;

  /**
   * Creates an instance of StatsManager.
   * @param {string} baseUrl - The base API URL. Defaults to the environment variable `NEXT_PUBLIC_API_URL`.
   */
  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_URL as string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetches kitchen statistics from the server.
   * @param {string} token - Bearer token for authentication.
   * @returns {Promise<StatsData>} A promise that resolves to the aggregated statistics.
   * @throws {Error} If the HTTP response is not ok.
   */
  async fetchKitchenStats(token: string): Promise<StatsData> {
    const response = await fetch(`${this.baseUrl}/api/orders/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch stats: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Calculates the percentage trend between two numeric values.
   * Useful for comparing current vs. previous period metrics.
   * @param {number} current - The value for the current period.
   * @param {number} previous - The value for the previous period.
   * @returns {number} The percentage change (positive = increase, negative = decrease).
   */
  calculateTrend(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }
}
