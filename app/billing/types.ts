import type { useAuth } from "../contexts/AuthContext";

export type AxiosInstance = ReturnType<typeof useAuth>["axiosInstance"];

export interface PopulatedMenuItem {
  _id: string;
  name: string;
  category?: string;
}

export interface OrderItem {
  _id?: string;
  menuItem: PopulatedMenuItem;
  quantity: number;
  price: number;
  finalPrice?: number;
  discountAmount?: number;
  specialInstructions?: string;
}

export interface SplitPayment {
  amount: number;
  method: "cash" | "credit_card" | "khqr";
  itemIds?: string[];
  tipAmount?: number;
}

export type OrderPaymentStatus =
  | "unpaid"
  | "partially_paid"
  | "paid"
  | "refunded";

export interface BillingOrder {
  _id: string;
  status: "served";
  paymentStatus: OrderPaymentStatus;
  paymentMethod?:
    | "cash"
    | "credit_card"
    | "debit_card"
    | "khqr"
    | "KHQR"
    | "split"
    | null;
  paidAt?: string;
  tableNumber?: number;
  customerName?: string;
  orderType: "dine-in" | "takeaway" | "delivery";
  totalAmount: number;
  totalDiscountAmount?: number;
  amountPaid?: number;
  tipAmount?: number;
  splitDetails?: SplitPayment[];
  items: OrderItem[];
  updatedAt: string;
  createdAt: string;
}

// Display methods (history list + legacy paid orders). Payment actions go
// through the partial/split endpoint and use the narrower PayMethod set.
export type PaymentMethod =
  | "cash"
  | "credit_card"
  | "debit_card"
  | "khqr"
  | "KHQR";
export type PayMethod = "cash" | "credit_card" | "khqr";
export type SplitMode = "full" | "even" | "items";

export interface SplitPortion {
  label: string;
  amount: number;
  itemIds?: string[];
}

export interface PaymentResult {
  paymentStatus: OrderPaymentStatus;
  amountPaid: number;
  amountDue: number;
  referenceId?: string;
}

export interface HistoricalReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

export interface HistoricalReceipt {
  _id: string;
  receiptNumber: string;
  paymentMethod: PaymentMethod;
  paymentStatus: "pending" | "completed" | "failed" | "refunded";
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  issuedAt: string;
  customer?: { name: string; email: string };
  order?: {
    _id: string;
    tableNumber?: number;
    customerName?: string;
    orderType: string;
  };
  items: HistoricalReceiptItem[];
}
