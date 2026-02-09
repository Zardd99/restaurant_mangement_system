import { useState, useCallback } from "react";
import { StatsData } from "../types/state";

export const useStats = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (token: string | null) => {
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

      console.log("Fetching stats with token:", token.substring(0, 20) + "...");

      const response = await fetch(`${API_URL}/api/orders/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      });

      // Check if response is HTML (ngrok error page)
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        // Read HTML response to debug
        const htmlText = await response.text();
        console.error(
          "Received HTML instead of JSON:",
          htmlText.substring(0, 500),
        );
        throw new Error(
          "Server returned HTML error page. Check authentication.",
        );
      }

      if (response.status === 401) {
        throw new Error("Authentication failed. Please log in again.");
      }

      if (response.status === 403) {
        throw new Error("You don't have permission to view stats.");
      }

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data: StatsData = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Error fetching stats:", err);

      if (err instanceof Error) {
        if (err.message.includes("Authentication failed")) {
          // Clear invalid token
          localStorage.removeItem("token");
          sessionStorage.removeItem("token");
        }
        setError(err.message);
      } else {
        setError("Failed to fetch statistics");
      }

      // Set default stats on error
      setStats({
        dailyEarnings: 0,
        weeklyEarnings: 0,
        yearlyEarnings: 0,
        todayOrderCount: 0,
        avgOrderValue: 0,
        ordersByStatus: {},
        bestSellingDishes: [],
      });
    } finally {
      setLoading(false);
    }
  }, []);

  return { stats, loading, error, fetchStats };
};
