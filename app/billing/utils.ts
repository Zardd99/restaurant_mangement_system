import type { BillingOrder, OrderItem } from "./types";

export const fmt = (n: number) =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const round2 = (n: number) => Math.round(n * 100) / 100;

export const errMsg = (e: unknown, fallback: string) => {
  const data = (
    e as { response?: { data?: { error?: string; message?: string } } }
  ).response?.data;
  return data?.error || data?.message || fallback;
};

export const labelFor: Record<string, string> = {
  cash: "Cash",
  credit_card: "Credit Card",
  debit_card: "Debit Card",
  khqr: "KHQR",
  KHQR: "KHQR",
  split: "Split",
};

export const statusColors: Record<string, string> = {
  completed: "bg-green-50 text-green-700 border-green-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  refunded: "bg-purple-50 text-purple-700 border-purple-200",
};

export const timeAgo = (iso: string) => {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export const orderLabel = (o: BillingOrder) =>
  o.tableNumber ? `Table ${o.tableNumber}` : o.customerName || "Takeaway";

export const itemTotal = (item: OrderItem) =>
  (item.finalPrice ?? item.price) * item.quantity;

export const orderSubtotal = (o: BillingOrder) =>
  o.items.reduce((sum, i) => sum + itemTotal(i), 0);
