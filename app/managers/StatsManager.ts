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

export class StatsManager {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_URL as string) {
    this.baseUrl = baseUrl;
  }

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

  calculateTrend(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }
}
