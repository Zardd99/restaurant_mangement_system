"use client";

// ============================================================================
// External Dependencies
// ============================================================================
import { useState, useCallback } from "react";

// ============================================================================
// Application Types
// ============================================================================
import { StatsData } from "../types/state";

// ============================================================================
// Constants
// ============================================================================

/** Default empty statistics used when an error occurs or no data is available. */
const DEFAULT_STATS: StatsData = {
  dailyEarnings: 0,
  weeklyEarnings: 0,
  yearlyEarnings: 0,
  todayOrderCount: 0,
  avgOrderValue: 0,
  ordersByStatus: {},
  bestSellingDishes: [],
};

// ============================================================================
// Custom Hook – useStats
// ============================================================================

/**
 * useStats – Fetches and manages aggregated statistics for the kitchen dashboard.
 *
 * - Retrieves statistics (earnings, order counts, top dishes) from the API.
 * - Handles authentication, token validation, and error recovery.
 * - Provides a `fetchStats` function that can be called manually (e.g., after a refresh).
 * - On authentication failure, automatically clears invalid tokens from storage.
 *
 * @returns An object containing:
 *   - `stats`: The fetched statistics object, or `null` if not yet loaded.
 *   - `loading`: Boolean indicating whether a request is in progress.
 *   - `error`: Error message string, or `null` if no error.
 *   - `fetchStats`: Async callback to trigger a statistics fetch.
 */
export const useStats = () => {
  // --------------------------------------------------------------------------
  // State
  // --------------------------------------------------------------------------

  /** The statistics data received from the server. Null until first successful fetch. */
  const [stats, setStats] = useState<StatsData | null>(null);

  /** Indicates whether a fetch operation is currently in progress. */
  const [loading, setLoading] = useState<boolean>(false);

  /** Stores any error message resulting from the last fetch attempt. */
  const [error, setError] = useState<string | null>(null);

  // --------------------------------------------------------------------------
  // Public Actions (Memoized)
  // --------------------------------------------------------------------------

  /**
   * Fetches kitchen statistics from the backend.
   * - Requires a valid authentication token.
   * - Handles various HTTP error statuses and malformed responses.
   * - On 401/authentication failure, clears stored tokens to force re‑login.
   * - Always sets `stats` to either the received data or the default empty object.
   *
   * @param token - JWT token obtained from authentication context.
   * @returns Promise<void>
   */
  const fetchStats = useCallback(
    async (token: string | null): Promise<void> => {
      // ----- Guard: No token provided -----
      if (!token) {
        setError("No authentication token found. Please log in.");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        if (!API_URL) {
          throw new Error("API URL not configured");
        }

        console.log(
          "Fetching stats with token:",
          token.substring(0, 20) + "...",
        );

        const response = await fetch(`${API_URL}/api/orders/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        });

        // ----- Detect HTML error pages (common with ngrok or misconfigured proxies) -----
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
          const htmlText = await response.text();
          console.error(
            "Received HTML instead of JSON:",
            htmlText.substring(0, 500),
          );
          throw new Error(
            "Server returned HTML error page. Check authentication.",
          );
        }

        // ----- Handle specific HTTP status codes -----
        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.");
        }

        if (response.status === 403) {
          throw new Error("You don't have permission to view stats.");
        }

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        // ----- Success: parse and store the statistics -----
        const data: StatsData = await response.json();
        setStats(data);
      } catch (err) {
        console.error("Error fetching stats:", err);

        // ----- Construct a user‑friendly error message -----
        if (err instanceof Error) {
          // Special handling for authentication failures – clear invalid tokens
          if (err.message.includes("Authentication failed")) {
            localStorage.removeItem("token");
            sessionStorage.removeItem("token");
          }
          setError(err.message);
        } else {
          setError("Failed to fetch statistics");
        }

        // ----- Provide fallback empty data to avoid UI breakage -----
        setStats(DEFAULT_STATS);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // --------------------------------------------------------------------------
  // Return Value
  // --------------------------------------------------------------------------
  return { stats, loading, error, fetchStats };
};
