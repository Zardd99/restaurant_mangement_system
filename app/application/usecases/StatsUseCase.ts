import { Result, Ok, Err } from "../../core/Result";

export interface StatsData {
  dailyEarnings: number;
  weeklyEarnings: number;
  yearlyEarnings: number;
  todayOrderCount: number;
  avgOrderValue: number;
  ordersByStatus: Record<string, number>;
  bestSellingDishes: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
}

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

    if (!response.ok) return Err(`Failed to fetch stats: ${response.status}`);

    const data = await response.json();
    return Ok(data as StatsData);
  } catch (e) {
    return Err(e instanceof Error ? e.message : "Unknown error fetching stats");
  }
};

export const calculateTrend = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};
