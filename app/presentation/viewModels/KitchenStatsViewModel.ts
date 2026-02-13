/**
 * @module useKitchenStatsViewModel
 * @description ViewModel hook for kitchen statistics dashboard.
 *
 * This hook encapsulates the logic for fetching and managing kitchen statistics
 * data. It acts as an adapter between the UI component and the use case layer,
 * handling loading states, error handling, and data caching.
 *
 * @see StatsUseCase - The underlying use case that performs the actual data fetching.
 */

// ============================================================================
// External Imports
// ============================================================================
import { useState, useCallback } from "react";

// ============================================================================
// Internal Imports
// ============================================================================
import {
  fetchKitchenStatsUseCase,
  StatsData,
} from "../../application/usecases/StatsUseCase";

// ============================================================================
// Custom Hook: useKitchenStatsViewModel
// ============================================================================

/**
 * useKitchenStatsViewModel
 *
 * Provides a clean interface for UI components to access kitchen statistics.
 * - Manages loading/error states during data fetching.
 * - Exposes a `fetchStats` function that triggers the use case.
 * - Returns the latest statistics data or null if not yet loaded.
 *
 * @param token - JWT authentication token; if null, the hook will set an error
 *                and not attempt to fetch.
 * @returns An object containing:
 *   - `stats`     – The fetched statistics data, or `null` if not loaded.
 *   - `loading`   – Boolean indicating if a fetch is in progress.
 *   - `error`     – Error message string, or `null` if no error.
 *   - `fetchStats`– Async callback to trigger the fetch operation.
 */
export const useKitchenStatsViewModel = (token: string | null) => {
  // --------------------------------------------------------------------------
  // State Management
  // --------------------------------------------------------------------------

  /** The fetched kitchen statistics, or null if not yet loaded. */
  const [stats, setStats] = useState<StatsData | null>(null);

  /** Indicates whether a fetch operation is currently in progress. */
  const [loading, setLoading] = useState(false);

  /** Stores any error that occurred during the last fetch attempt. */
  const [error, setError] = useState<string | null>(null);

  // --------------------------------------------------------------------------
  // Callbacks
  // --------------------------------------------------------------------------

  /**
   * Fetches kitchen statistics from the backend.
   * - Requires a valid authentication token.
   * - On success: updates `stats` and clears any previous error.
   * - On failure: updates `error` with the failure reason and clears `stats`.
   *
   * @remarks
   * This function is memoized with `useCallback` and will only change when
   * the `token` dependency changes.
   *
   * @async
   * @throws {Error} Does not throw; errors are captured in the `error` state.
   */
  const fetchStats = useCallback(async () => {
    // ------------------------------------------------------------------------
    // 1. Validate authentication
    // ------------------------------------------------------------------------
    if (!token) {
      setError("Authentication required");
      return;
    }

    // ------------------------------------------------------------------------
    // 2. Execute the use case
    // ------------------------------------------------------------------------
    try {
      setLoading(true);
      setError(null);

      const result = await fetchKitchenStatsUseCase(token);

      if (result.ok) {
        setStats(result.value);
      } else {
        setError(result.error ?? "Failed to load statistics");
        setStats(null);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load statistics",
      );
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [token]); // Only recreate when the token changes.

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------
  return {
    stats,
    loading,
    error,
    fetchStats,
  };
};
