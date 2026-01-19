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

export interface KitchenStatsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}
