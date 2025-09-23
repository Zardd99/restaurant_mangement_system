export interface OrderItem {
  menuItem: {
    _id: string;
    name: string;
    description?: string;
    price: number;
    category?: string;
  };
  quantity: number;
  specialInstructions?: string;
  price: number;
}

export interface Order {
  _id: string;  
  items: OrderItem[];
  totalAmount: number;
  status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "ready"
    | "served"
    | "cancelled";
  customer: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  tableNumber?: number;
  orderType: "dine-in" | "takeaway" | "delivery";
  orderDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderSummary {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  bestSellingDish: {
    name: string;
    quantity: number;
    revenue: number;
  };
  statusCount: {
    [key: string]: number;
  };
}

export interface DateRange {
  label: string;
  value: string;
  startDate: Date;
  endDate: Date;
}
