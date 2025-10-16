import { useState, useCallback } from "react";
import { StatsManager, StatsData } from "../managers/StatsManager";

export const useKitchenStatsViewModel = (token: string | null) => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statsManager = new StatsManager();

  const fetchStats = useCallback(async () => {
    if (!token) {
      setError("Authentication required");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await statsManager.fetchKitchenStats(token);
      setStats(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load statistics"
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
