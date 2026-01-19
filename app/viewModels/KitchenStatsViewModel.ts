import { useState, useCallback } from "react";
import {
  fetchKitchenStatsUseCase,
  StatsData,
} from "@/app/usecases/StatsUseCase";

export const useKitchenStatsViewModel = (token: string | null) => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchStats = useCallback(async () => {
    if (!token) {
      setError("Authentication required");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await fetchKitchenStatsUseCase(token);
      if (res.ok) setStats(res.value);
      else setError(res.error ?? "Failed to load statistics");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load statistics",
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  return {
    stats,
    loading,
    error,
    fetchStats,
  };
};
