"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  CreditCard,
  FileText,
  Filter,
  Printer,
  RefreshCw,
  Smartphone,
  Wallet,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PopulatedMenuItem {
  _id: string;
  name: string;
  category?: string;
}

interface OrderItem {
  _id?: string;
  menuItem: PopulatedMenuItem;
  quantity: number;
  price: number;
  finalPrice?: number;
  discountAmount?: number;
  specialInstructions?: string;
}

interface SplitPayment {
  amount: number;
  method: "cash" | "credit_card" | "khqr";
  itemIds?: string[];
  tipAmount?: number;
}

type OrderPaymentStatus = "unpaid" | "partially_paid" | "paid" | "refunded";

interface BillingOrder {
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
type PaymentMethod = "cash" | "credit_card" | "debit_card" | "khqr" | "KHQR";
type PayMethod = "cash" | "credit_card" | "khqr";
type SplitMode = "full" | "even" | "items";

interface SplitPortion {
  label: string;
  amount: number;
  itemIds?: string[];
}

interface PaymentResult {
  paymentStatus: OrderPaymentStatus;
  amountPaid: number;
  amountDue: number;
  referenceId?: string;
}

interface HistoricalReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

interface HistoricalReceipt {
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const round2 = (n: number) => Math.round(n * 100) / 100;

const errMsg = (e: unknown, fallback: string) => {
  const data = (e as { response?: { data?: { error?: string; message?: string } } })
    .response?.data;
  return data?.error || data?.message || fallback;
};

const labelFor: Record<string, string> = {
  cash: "Cash",
  credit_card: "Credit Card",
  debit_card: "Debit Card",
  khqr: "KHQR",
  KHQR: "KHQR",
  split: "Split",
};

const timeAgo = (iso: string) => {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const orderLabel = (o: BillingOrder) =>
  o.tableNumber ? `Table ${o.tableNumber}` : o.customerName || "Takeaway";

const itemTotal = (item: OrderItem) =>
  (item.finalPrice ?? item.price) * item.quantity;

const orderSubtotal = (o: BillingOrder) =>
  o.items.reduce((sum, i) => sum + itemTotal(i), 0);

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PaymentMethodButton({
  method,
  selected,
  onClick,
}: {
  method: PayMethod;
  selected: boolean;
  onClick: () => void;
}) {
  const icons: Record<PayMethod, React.ReactNode> = {
    cash: <Wallet className="w-4 h-4" />,
    credit_card: <CreditCard className="w-4 h-4" />,
    khqr: <Smartphone className="w-4 h-4" />,
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
        selected
          ? "bg-blue-600 border-blue-600 text-white shadow-sm"
          : "bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50"
      }`}
    >
      {icons[method]}
      {labelFor[method]}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Receipt print area (only visible during window.print())
// ---------------------------------------------------------------------------

function ReceiptPrintArea({
  order,
  paymentMethod,
  amountTendered,
  receiptRef,
}: {
  order: BillingOrder | null;
  paymentMethod: PaymentMethod;
  amountTendered: string;
  receiptRef: React.RefObject<HTMLDivElement | null>;
}) {
  if (!order) return null;

  const subtotal = orderSubtotal(order);
  const discount = order.totalDiscountAmount ?? 0;
  const total = order.totalAmount;
  const tendered = parseFloat(amountTendered) || 0;
  const change = tendered - total;
  const printedAt = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div
      ref={receiptRef}
      id="receipt-print-area"
      className="hidden"
      style={{ fontFamily: "monospace" }}
    >
      <div style={{ width: "300px", margin: "0 auto", padding: "16px" }}>
        <div style={{ textAlign: "center", marginBottom: "12px" }}>
          <div style={{ fontWeight: "bold", fontSize: "18px" }}>RESTAURANT</div>
          <div style={{ fontSize: "12px", color: "#555" }}>Management System</div>
          <div style={{ fontSize: "11px", marginTop: "4px" }}>{printedAt}</div>
        </div>

        <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />

        <div style={{ fontSize: "13px", marginBottom: "8px" }}>
          <div>
            <strong>Order:</strong> {orderLabel(order)}
          </div>
          <div>
            <strong>Type:</strong>{" "}
            {order.orderType.charAt(0).toUpperCase() + order.orderType.slice(1).replace("-", " ")}
          </div>
        </div>

        <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />

        {order.items.map((item, idx) => (
          <div
            key={idx}
            style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}
          >
            <span>
              {item.menuItem.name} ×{item.quantity}
            </span>
            <span>${fmt(itemTotal(item))}</span>
          </div>
        ))}

        <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />

        <div style={{ fontSize: "13px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Subtotal</span>
            <span>${fmt(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", color: "#16a34a" }}>
              <span>Discount</span>
              <span>-${fmt(discount)}</span>
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontWeight: "bold",
              fontSize: "15px",
              marginTop: "4px",
            }}
          >
            <span>TOTAL</span>
            <span>${fmt(total)}</span>
          </div>
        </div>

        <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />

        <div style={{ fontSize: "13px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Payment</span>
            <span>{labelFor[paymentMethod]}</span>
          </div>
          {paymentMethod === "cash" && tendered > 0 && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Tendered</span>
                <span>${fmt(tendered)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Change</span>
                <span>${fmt(Math.max(0, change))}</span>
              </div>
            </>
          )}
        </div>

        <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />

        <div style={{ textAlign: "center", fontSize: "12px", color: "#555" }}>
          <div>Thank you for dining with us!</div>
          <div>Please come again.</div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Payment panel — full / partial / even-split / by-item, with tips + KHQR
// ---------------------------------------------------------------------------

function PaymentPanel({
  order,
  axiosInstance,
  onResult,
  onPrint,
  onMethodChange,
  onTenderedChange,
}: {
  order: BillingOrder;
  axiosInstance: ReturnType<typeof useAuth>["axiosInstance"];
  onResult: (result: PaymentResult, method: PayMethod) => void;
  onPrint: () => void;
  onMethodChange: (m: PayMethod) => void;
  onTenderedChange: (v: string) => void;
}) {
  const total = order.totalAmount;
  const paidSoFar = order.amountPaid ?? 0;
  const remaining = Math.max(0, round2(total - paidSoFar));

  const serverPaidItemIds = useMemo(
    () =>
      new Set(
        (order.splitDetails ?? []).flatMap((s) => s.itemIds ?? []).map(String),
      ),
    [order.splitDetails],
  );

  const [mode, setMode] = useState<SplitMode>("full");
  const [method, setMethod] = useState<PayMethod>("cash");
  const [amountInput, setAmountInput] = useState(remaining.toFixed(2));
  const [tipInput, setTipInput] = useState("");
  const [tendered, setTendered] = useState("");
  const [ways, setWays] = useState(2);
  const [portions, setPortions] = useState<SplitPortion[]>([]);
  const [paidPortions, setPaidPortions] = useState<Set<number>>(new Set());
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [paidItemIds, setPaidItemIds] = useState<Set<string>>(new Set());
  const [khqr, setKhqr] = useState<{ qrPayload: string; referenceId: string } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => onMethodChange(method), [method, onMethodChange]);
  useEffect(() => onTenderedChange(tendered), [tendered, onTenderedChange]);

  const tip = parseFloat(tipInput) || 0;

  const unpaidItems = order.items.filter(
    (it) => it._id && !serverPaidItemIds.has(it._id) && !paidItemIds.has(it._id),
  );
  const selectedSubtotal = round2(
    order.items
      .filter((it) => it._id && selectedItems.has(it._id))
      .reduce((sum, it) => sum + itemTotal(it), 0),
  );

  const fullAmount = parseFloat(amountInput) || 0;
  const cashTendered = parseFloat(tendered) || 0;
  const cashChange = cashTendered - (fullAmount + tip);
  const insufficient =
    method === "cash" && mode === "full" && cashTendered > 0 && cashChange < 0;

  const pay = async (
    amount: number,
    itemIds: string[] | undefined,
    after?: () => void,
  ) => {
    if (!(amount > 0)) {
      setError("Enter an amount greater than zero");
      return;
    }
    setProcessing(true);
    setError(null);
    try {
      const { data } = await axiosInstance.post<PaymentResult>(
        `/api/billing/${order._id}/pay`,
        {
          amount: round2(amount),
          method,
          tipAmount: tip > 0 ? tip : undefined,
          referenceId: method === "khqr" ? khqr?.referenceId : undefined,
          itemIds,
        },
      );
      onResult(data, method);
      setTipInput("");
      setTendered("");
      setKhqr(null);
      after?.();
    } catch (e) {
      setError(errMsg(e, "Payment failed. Please try again."));
    } finally {
      setProcessing(false);
    }
  };

  const generateKhqr = async (amount: number) => {
    if (!(amount > 0)) {
      setError("Nothing to charge");
      return;
    }
    setProcessing(true);
    setError(null);
    try {
      const { data } = await axiosInstance.post<{
        qrPayload: string;
        referenceId: string;
      }>(`/api/billing/${order._id}/khqr`, { amount: round2(amount + tip) });
      setKhqr(data);
    } catch (e) {
      setError(errMsg(e, "Failed to generate KHQR code"));
    } finally {
      setProcessing(false);
    }
  };

  // KHQR is two-step: generate the code, then confirm against its reference.
  const chargeAction = (
    amount: number,
    itemIds: string[] | undefined,
    after?: () => void,
  ) => {
    if (method === "khqr" && !khqr) return generateKhqr(amount);
    return pay(amount, itemIds, after);
  };

  const loadEvenSplit = async (n: number) => {
    setError(null);
    try {
      const { data } = await axiosInstance.post<SplitPortion[]>(
        `/api/billing/${order._id}/split/even`,
        { ways: n },
      );
      setPortions(data);
      setPaidPortions(new Set());
    } catch (e) {
      setError(errMsg(e, "Failed to compute the split"));
    }
  };

  const switchMode = (m: SplitMode) => {
    setMode(m);
    setError(null);
    setKhqr(null);
    if (m === "even" && portions.length === 0) loadEvenSplit(ways);
  };

  const changeWays = (n: number) => {
    const next = Math.max(2, Math.min(20, n));
    setWays(next);
    loadEvenSplit(next);
  };

  const toggleItem = (id: string) =>
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const chargeLabel = (amount: number, settleLabel = false) => {
    if (method === "khqr" && !khqr) return "Generate KHQR";
    if (settleLabel && amount >= remaining) return `Settle $${fmt(amount)}`;
    return `Pay $${fmt(amount)}`;
  };

  const Spinner = (
    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
  );

  return (
    <div className="px-5 py-4 border-t border-gray-100 space-y-4">
      {/* Balance summary */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-gray-50 rounded-lg py-2">
          <p className="text-[11px] uppercase tracking-wider text-gray-400">Total</p>
          <p className="text-sm font-semibold text-gray-900">${fmt(total)}</p>
        </div>
        <div className="bg-gray-50 rounded-lg py-2">
          <p className="text-[11px] uppercase tracking-wider text-gray-400">Paid</p>
          <p className="text-sm font-semibold text-green-600">${fmt(paidSoFar)}</p>
        </div>
        <div className="bg-amber-50 rounded-lg py-2">
          <p className="text-[11px] uppercase tracking-wider text-amber-500">Remaining</p>
          <p className="text-sm font-bold text-amber-700">${fmt(remaining)}</p>
        </div>
      </div>

      {/* Split mode */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Split
        </p>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(
            [
              ["full", "Full / Partial"],
              ["even", "Even"],
              ["items", "By Item"],
            ] as [SplitMode, string][]
          ).map(([m, label]) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
                mode === m
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Method selector */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Payment Method
        </p>
        <div className="flex flex-wrap gap-2">
          {(["cash", "credit_card", "khqr"] as PayMethod[]).map((m) => (
            <PaymentMethodButton
              key={m}
              method={m}
              selected={method === m}
              onClick={() => {
                setMethod(m);
                setKhqr(null);
              }}
            />
          ))}
        </div>
      </div>

      {/* Tip */}
      <div className="space-y-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Tip (optional)
        </p>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">
            $
          </span>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={tipInput}
            onChange={(e) => setTipInput(e.target.value)}
            className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Mode body */}
      {mode === "full" && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Amount to Charge
          </p>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">
              $
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {fullAmount > 0 && fullAmount < remaining && (
            <p className="text-xs text-amber-600">
              Partial — ${fmt(round2(remaining - fullAmount))} will remain due.
            </p>
          )}
          {method === "cash" && (
            <div className="space-y-2 pt-1">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Cash received"
                  value={tendered}
                  onChange={(e) => setTendered(e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {cashTendered > 0 && (
                <div
                  className={`flex justify-between items-center px-3 py-2 rounded-lg text-sm font-semibold ${
                    insufficient
                      ? "bg-red-50 text-red-600 border border-red-200"
                      : "bg-green-50 text-green-700 border border-green-200"
                  }`}
                >
                  <span>{insufficient ? "Insufficient" : "Change"}</span>
                  <span>
                    {insufficient
                      ? `-$${fmt(Math.abs(cashChange))}`
                      : `$${fmt(cashChange)}`}
                  </span>
                </div>
              )}
            </div>
          )}
          <button
            onClick={() => chargeAction(fullAmount, undefined)}
            disabled={processing || insufficient || !(fullAmount > 0)}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            {processing ? Spinner : <CheckCircle className="w-4 h-4" />}
            {processing ? "Processing…" : chargeLabel(fullAmount, true)}
          </button>
        </div>
      )}

      {mode === "even" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Split Evenly
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => changeWays(ways - 1)}
                className="w-7 h-7 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                −
              </button>
              <span className="text-sm font-semibold w-6 text-center">{ways}</span>
              <button
                onClick={() => changeWays(ways + 1)}
                className="w-7 h-7 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                +
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            {portions.map((p, i) => {
              const portionPaid = paidPortions.has(i);
              return (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 px-3 py-2 border border-gray-200 rounded-lg"
                >
                  <span className="text-sm text-gray-700">{p.label}</span>
                  <span className="text-sm font-semibold text-gray-900">
                    ${fmt(p.amount)}
                  </span>
                  <button
                    onClick={() =>
                      chargeAction(p.amount, undefined, () =>
                        setPaidPortions((prev) => new Set(prev).add(i)),
                      )
                    }
                    disabled={portionPaid || processing}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
                      portionPaid
                        ? "bg-green-50 text-green-600 cursor-default"
                        : "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300"
                    }`}
                  >
                    {portionPaid
                      ? "Paid"
                      : method === "khqr" && !khqr
                        ? "QR"
                        : "Collect"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {mode === "items" && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Charge Selected Items
          </p>
          {unpaidItems.length === 0 ? (
            <p className="text-sm text-gray-400">All items have been charged.</p>
          ) : (
            <div className="space-y-1">
              {unpaidItems.map((it) => (
                <label
                  key={it._id}
                  className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedItems.has(it._id!)}
                    onChange={() => toggleItem(it._id!)}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span className="flex-1 text-sm text-gray-700 truncate">
                    {it.menuItem.name} ×{it.quantity}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    ${fmt(itemTotal(it))}
                  </span>
                </label>
              ))}
            </div>
          )}
          {unpaidItems.length > 0 && (
            <>
              <div className="flex justify-between text-sm font-semibold text-gray-900 px-1">
                <span>Selected</span>
                <span>${fmt(selectedSubtotal)}</span>
              </div>
              <button
                onClick={() =>
                  chargeAction(selectedSubtotal, [...selectedItems], () => {
                    setPaidItemIds((prev) => new Set([...prev, ...selectedItems]));
                    setSelectedItems(new Set());
                  })
                }
                disabled={processing || !(selectedSubtotal > 0)}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                {processing ? Spinner : <CheckCircle className="w-4 h-4" />}
                {processing ? "Processing…" : chargeLabel(selectedSubtotal)}
              </button>
            </>
          )}
        </div>
      )}

      {/* KHQR code */}
      {khqr && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3 space-y-1">
          <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
            KHQR — scan to pay
          </p>
          <p className="text-[11px] font-mono break-all text-indigo-500">
            {khqr.qrPayload}
          </p>
          <p className="text-[11px] text-indigo-400">
            Tap the charge button again to confirm once the guest has paid.
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        onClick={onPrint}
        className="flex items-center justify-center gap-2 w-full py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <Printer className="w-4 h-4" />
        Print
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Order detail + payment panel
// ---------------------------------------------------------------------------

function OrderDetailPanel({
  order,
  axiosInstance,
  onResult,
  onPrint,
  onMethodChange,
  onTenderedChange,
}: {
  order: BillingOrder;
  axiosInstance: ReturnType<typeof useAuth>["axiosInstance"];
  onResult: (result: PaymentResult, method: PayMethod) => void;
  onPrint: () => void;
  onMethodChange: (m: PayMethod) => void;
  onTenderedChange: (v: string) => void;
}) {
  const subtotal = orderSubtotal(order);
  const discount = order.totalDiscountAmount ?? 0;
  const total = order.totalAmount;

  const paidSoFar = order.amountPaid ?? 0;
  const remaining = Math.max(0, round2(total - paidSoFar));
  const isPaid = order.paymentStatus === "paid";
  const isPartial = order.paymentStatus === "partially_paid";

  return (
    <div className="flex flex-col h-full">
      {/* Order header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{orderLabel(order)}</h2>
            <span className="text-sm text-gray-500 capitalize">
              {order.orderType.replace("-", " ")} · {timeAgo(order.updatedAt)}
            </span>
          </div>
          {isPaid ? (
            <span className="flex items-center gap-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1">
              <CheckCircle className="w-4 h-4" />
              Paid
            </span>
          ) : isPartial ? (
            <span className="flex items-center gap-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-3 py-1">
              <Clock className="w-4 h-4" />
              Partial · ${fmt(remaining)} due
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
              <Clock className="w-4 h-4" />
              Unpaid
            </span>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 min-h-0">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{item.menuItem.name}</p>
              {item.specialInstructions && (
                <p className="text-xs text-gray-400 truncate">{item.specialInstructions}</p>
              )}
              {(item.discountAmount ?? 0) > 0 && (
                <p className="text-xs text-green-600">
                  Disc: -${fmt(item.discountAmount! * item.quantity)}
                </p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm text-gray-500">×{item.quantity}</p>
              <p className="text-sm font-semibold text-gray-900">${fmt(itemTotal(item))}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 space-y-1">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Subtotal</span>
          <span>${fmt(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount</span>
            <span>-${fmt(discount)}</span>
          </div>
        )}
        {(order.tipAmount ?? 0) > 0 && (
          <div className="flex justify-between text-sm text-gray-600">
            <span>Tip</span>
            <span>${fmt(order.tipAmount!)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold text-gray-900 pt-1 border-t border-gray-200 mt-1">
          <span>Total</span>
          <span>${fmt(total)}</span>
        </div>
        {isPartial && (
          <>
            <div className="flex justify-between text-sm text-green-600">
              <span>Paid</span>
              <span>${fmt(paidSoFar)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold text-amber-700">
              <span>Remaining</span>
              <span>${fmt(remaining)}</span>
            </div>
          </>
        )}
      </div>

      {/* Payment section */}
      {!isPaid && (
        <PaymentPanel
          order={order}
          axiosInstance={axiosInstance}
          onResult={onResult}
          onPrint={onPrint}
          onMethodChange={onMethodChange}
          onTenderedChange={onTenderedChange}
        />
      )}

      {/* Already-paid info */}
      {isPaid && (
        <div className="px-5 py-4 border-t border-gray-100 space-y-2">
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 space-y-1">
            <p className="text-sm font-semibold text-green-700">Payment Complete</p>
            {order.paymentMethod && (
              <p className="text-sm text-green-600">
                Method: {labelFor[order.paymentMethod]}
              </p>
            )}
            {order.paidAt && (
              <p className="text-xs text-green-500">
                {new Date(order.paidAt).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            )}
          </div>
          <button
            onClick={onPrint}
            className="flex items-center justify-center gap-2 w-full py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Receipt history view (admin / manager only)
// ---------------------------------------------------------------------------

const statusColors: Record<string, string> = {
  completed: "bg-green-50 text-green-700 border-green-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  refunded: "bg-purple-50 text-purple-700 border-purple-200",
};

function ReceiptHistoryDetail({ receipt, onPrint }: { receipt: HistoricalReceipt; onPrint: () => void }) {
  const orderLabel =
    receipt.order?.tableNumber
      ? `Table ${receipt.order.tableNumber}`
      : receipt.order?.customerName || receipt.customer?.name || "Takeaway";

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">{receipt.receiptNumber}</p>
            <h2 className="text-lg font-semibold text-gray-900 mt-0.5">{orderLabel}</h2>
            <p className="text-sm text-gray-500">
              {new Date(receipt.issuedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
            </p>
          </div>
          <span className={`text-xs font-medium border rounded-full px-2.5 py-1 capitalize ${statusColors[receipt.paymentStatus] ?? ""}`}>
            {receipt.paymentStatus}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 min-h-0">
        {receipt.items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm text-gray-500">×{item.quantity}</p>
              <p className="text-sm font-semibold text-gray-900">${fmt(item.price * item.quantity)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 space-y-1">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Subtotal</span>
          <span>${fmt(receipt.subtotal)}</span>
        </div>
        {receipt.tax > 0 && (
          <div className="flex justify-between text-sm text-gray-600">
            <span>Tax</span>
            <span>${fmt(receipt.tax)}</span>
          </div>
        )}
        {receipt.discount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount</span>
            <span>-${fmt(receipt.discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold text-gray-900 pt-1 border-t border-gray-200 mt-1">
          <span>Total</span>
          <span>${fmt(receipt.totalAmount)}</span>
        </div>
      </div>

      <div className="px-5 py-4 border-t border-gray-100 space-y-2">
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 flex items-center justify-between">
          <span className="text-sm text-gray-600">Payment Method</span>
          <span className="text-sm font-semibold text-gray-900">{labelFor[receipt.paymentMethod]}</span>
        </div>
        <button
          onClick={onPrint}
          className="flex items-center justify-center gap-2 w-full py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Printer className="w-4 h-4" />
          Print Receipt
        </button>
      </div>
    </div>
  );
}

function HistoryView({ axiosInstance }: { axiosInstance: ReturnType<typeof useAuth>["axiosInstance"] }) {
  const [receipts, setReceipts] = useState<HistoricalReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const [filterMethod, setFilterMethod] = useState<PaymentMethod | "">("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const fetchReceipts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (filterMethod) params.paymentMethod = filterMethod;
      if (filterFrom) params.startDate = filterFrom;
      if (filterTo) params.endDate = filterTo;
      const res = await axiosInstance.get<HistoricalReceipt[]>("/api/receipts", { params });
      setReceipts(res.data);
    } catch {
      setError("Failed to load receipt history.");
    } finally {
      setLoading(false);
    }
  }, [axiosInstance, filterMethod, filterFrom, filterTo]);

  useEffect(() => {
    fetchReceipts();
  }, []);

  const selectedReceipt = receipts.find((r) => r._id === selectedId) ?? null;

  const handlePrint = () => window.print();

  const applyFilters = () => fetchReceipts();
  const resetFilters = () => {
    setFilterMethod("");
    setFilterFrom("");
    setFilterTo("");
  };

  return (
    <>
      {selectedReceipt && (
        <div
          id="receipt-print-area"
          className="hidden"
          style={{ fontFamily: "monospace" }}
        >
          <div style={{ width: "300px", margin: "0 auto", padding: "16px" }}>
            <div style={{ textAlign: "center", marginBottom: "12px" }}>
              <div style={{ fontWeight: "bold", fontSize: "18px" }}>RESTAURANT</div>
              <div style={{ fontSize: "12px", color: "#555" }}>Receipt #{selectedReceipt.receiptNumber}</div>
              <div style={{ fontSize: "11px", marginTop: "4px" }}>
                {new Date(selectedReceipt.issuedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
              </div>
            </div>
            <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />
            {selectedReceipt.items.map((item, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                <span>{item.name} ×{item.quantity}</span>
                <span>${fmt(item.price * item.quantity)}</span>
              </div>
            ))}
            <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />
            <div style={{ fontSize: "13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Subtotal</span><span>${fmt(selectedReceipt.subtotal)}</span>
              </div>
              {selectedReceipt.discount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", color: "#16a34a" }}>
                  <span>Discount</span><span>-${fmt(selectedReceipt.discount)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "15px", marginTop: "4px" }}>
                <span>TOTAL</span><span>${fmt(selectedReceipt.totalAmount)}</span>
              </div>
            </div>
            <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />
            <div style={{ fontSize: "13px", display: "flex", justifyContent: "space-between" }}>
              <span>Payment</span><span>{labelFor[selectedReceipt.paymentMethod]}</span>
            </div>
            <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />
            <div style={{ textAlign: "center", fontSize: "12px", color: "#555" }}>
              <div>Thank you for dining with us!</div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* List side */}
        <div className={`w-full md:w-80 lg:w-96 shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-hidden ${showMobileDetail ? "hidden md:flex" : "flex"}`}>
          {/* Filters */}
          <div className="px-4 py-3 border-b border-gray-100 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <Filter className="w-3.5 h-3.5" />
              Filters
            </div>
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value as PaymentMethod | "")}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All payment methods</option>
              {(["cash", "credit_card", "debit_card", "KHQR"] as PaymentMethod[]).map((m) => (
                <option key={m} value={m}>{labelFor[m]}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                type="date"
                value={filterFrom}
                onChange={(e) => setFilterFrom(e.target.value)}
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="From"
              />
              <input
                type="date"
                value={filterTo}
                onChange={(e) => setFilterTo(e.target.value)}
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="To"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={applyFilters}
                className="flex-1 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply
              </button>
              <button
                onClick={resetFilters}
                className="flex-1 py-1.5 text-sm font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Receipt list */}
          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center h-32">
                <span className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {error && <div className="p-6 text-center text-sm text-red-500">{error}</div>}
            {!loading && !error && receipts.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 gap-2 text-gray-400">
                <FileText className="w-8 h-8" />
                <p className="text-sm font-medium">No receipts found</p>
              </div>
            )}
            {!loading && receipts.map((receipt) => {
              const label =
                receipt.order?.tableNumber
                  ? `Table ${receipt.order.tableNumber}`
                  : receipt.order?.customerName || receipt.customer?.name || "Takeaway";
              return (
                <button
                  key={receipt._id}
                  onClick={() => { setSelectedId(receipt._id); setShowMobileDetail(true); }}
                  className={`w-full text-left px-4 py-4 border-b border-gray-100 transition-colors ${
                    selectedId === receipt._id
                      ? "bg-blue-50 border-l-4 border-l-blue-500"
                      : "hover:bg-gray-50 border-l-4 border-l-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-900 text-sm">{label}</span>
                    <span className="font-bold text-gray-900 text-sm">${fmt(receipt.totalAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-mono">{receipt.receiptNumber}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(receipt.issuedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-xs text-blue-600 font-medium bg-blue-50 rounded px-1.5 py-0.5">
                      {labelFor[receipt.paymentMethod]}
                    </span>
                    <span className={`text-xs font-medium border rounded px-1.5 py-0.5 capitalize ${statusColors[receipt.paymentStatus] ?? ""}`}>
                      {receipt.paymentStatus}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detail side */}
        <div className={`flex-1 flex flex-col bg-white overflow-hidden ${showMobileDetail ? "flex" : "hidden md:flex"}`}>
          <div className="flex md:hidden items-center px-4 py-3 border-b border-gray-100">
            <button
              onClick={() => setShowMobileDetail(false)}
              className="flex items-center gap-1 text-sm text-blue-600 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
          {selectedReceipt ? (
            <ReceiptHistoryDetail receipt={selectedReceipt} onPrint={handlePrint} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-300">
              <FileText className="w-12 h-12" />
              <p className="text-sm font-medium text-gray-400">Select a receipt to view details</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function BillingPage() {
  const { axiosInstance, user } = useAuth();
  const { socket } = useSocket();

  const canViewHistory = user?.role === "admin" || user?.role === "manager";

  const [orders, setOrders] = useState<BillingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"pending" | "paid" | "history">("pending");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PayMethod>("cash");
  const [amountTendered, setAmountTendered] = useState("");

  const receiptRef = useRef<HTMLDivElement>(null);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchOrders = useCallback(async () => {
    setError(null);
    try {
      const res = await axiosInstance.get<{ success: boolean; orders: BillingOrder[] }>(
        "/api/billing/served",
      );
      setOrders(res.data.orders);
    } catch {
      setError("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [axiosInstance]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ---------------------------------------------------------------------------
  // Real-time sync
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const handlePaymentUpdate = (data: {
      orderId: string;
      paymentStatus: "paid";
      paymentMethod: PaymentMethod;
    }) => {
      setOrders((prev) =>
        prev.map((o) =>
          o._id === data.orderId
            ? { ...o, paymentStatus: data.paymentStatus, paymentMethod: data.paymentMethod, paidAt: new Date().toISOString() }
            : o,
        ),
      );
    };

    if (!socket) return;
    socket.on("billing:payment_updated", handlePaymentUpdate);
    return () => {
      socket.off("billing:payment_updated", handlePaymentUpdate);
    };
  }, [socket]);

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------

  const pendingOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.paymentStatus === "unpaid" || o.paymentStatus === "partially_paid",
      ),
    [orders],
  );

  const paidToday = useMemo(() => {
    const today = new Date().toDateString();
    return orders.filter(
      (o) => o.paymentStatus === "paid" && o.paidAt && new Date(o.paidAt).toDateString() === today,
    );
  }, [orders]);

  const displayOrders = tab === "paid" ? paidToday : pendingOrders;
  const selectedOrder = orders.find((o) => o._id === selectedId) ?? null;

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const selectOrder = (order: BillingOrder) => {
    setSelectedId(order._id);
    setAmountTendered("");
    setPaymentMethod("cash");
    setShowMobileDetail(true);
  };

  const applyPaymentResult = useCallback(
    (orderId: string, result: PaymentResult, method: PayMethod) => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o._id !== orderId) return o;
          const settled = result.paymentStatus === "paid";
          const hadPriorPayment = (o.amountPaid ?? 0) > 0;
          return {
            ...o,
            amountPaid: result.amountPaid,
            paymentStatus: result.paymentStatus,
            paymentMethod: settled
              ? hadPriorPayment
                ? "split"
                : method
              : o.paymentMethod,
            paidAt: settled ? new Date().toISOString() : o.paidAt,
          };
        }),
      );
    },
    [],
  );

  const handlePrint = () => {
    window.print();
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      {/* Print-only receipt (hidden from screen, shown on print) */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #receipt-print-area,
          #receipt-print-area * { visibility: visible !important; }
          #receipt-print-area {
            position: fixed !important;
            inset: 0 !important;
            display: block !important;
          }
        }
      `}</style>

      <ReceiptPrintArea
        order={selectedOrder}
        paymentMethod={paymentMethod}
        amountTendered={amountTendered}
        receiptRef={receiptRef}
      />

      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Page header */}
        <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Billing & Payments</h1>
            <p className="text-sm text-gray-500">Manage served order payments</p>
          </div>
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200 px-4 md:px-6 flex gap-1">
          <button
            onClick={() => setTab("pending")}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              tab === "pending"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Pending Payment
            {pendingOrders.length > 0 && (
              <span className="ml-2 bg-amber-100 text-amber-700 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                {pendingOrders.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("paid")}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              tab === "paid"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Paid Today
            {paidToday.length > 0 && (
              <span className="ml-2 bg-green-100 text-green-700 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                {paidToday.length}
              </span>
            )}
          </button>
          {canViewHistory && (
            <button
              onClick={() => setTab("history")}
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                tab === "history"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Receipt History
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden min-h-0 relative">

          {tab === "history" && <HistoryView axiosInstance={axiosInstance} />}

          {/* ORDER LIST */}
          <div
            className={`
              w-full md:w-80 lg:w-96 shrink-0
              border-r border-gray-200 bg-white
              overflow-y-auto
              ${tab === "history" ? "hidden" : ""}
              ${showMobileDetail ? "hidden md:block" : "block"}
            `}
          >
            {loading && (
              <div className="flex items-center justify-center h-48">
                <span className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {error && (
              <div className="p-6 text-center text-sm text-red-500">{error}</div>
            )}
            {!loading && !error && displayOrders.length === 0 && (
              <div className="flex flex-col items-center justify-center h-48 gap-2 text-gray-400">
                <CheckCircle className="w-8 h-8" />
                <p className="text-sm font-medium">
                  {tab === "paid" ? "No payments today yet" : "No pending payments"}
                </p>
              </div>
            )}
            {!loading &&
              displayOrders.map((order) => (
                <button
                  key={order._id}
                  onClick={() => selectOrder(order)}
                  className={`w-full text-left px-4 py-4 border-b border-gray-100 transition-colors ${
                    selectedId === order._id
                      ? "bg-blue-50 border-l-4 border-l-blue-500"
                      : "hover:bg-gray-50 border-l-4 border-l-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-900 text-sm">
                      {orderLabel(order)}
                    </span>
                    <span className="font-bold text-gray-900 text-sm">
                      ${fmt(order.totalAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 capitalize">
                      {order.orderType.replace("-", " ")} · {order.items.length} item
                      {order.items.length !== 1 ? "s" : ""}
                    </span>
                    <span className="text-xs text-gray-400">{timeAgo(order.updatedAt)}</span>
                  </div>
                  {order.paymentStatus === "paid" && order.paymentMethod && (
                    <div className="mt-1.5">
                      <span className="text-xs text-green-600 font-medium bg-green-50 rounded px-1.5 py-0.5">
                        {labelFor[order.paymentMethod]}
                      </span>
                    </div>
                  )}
                  {order.paymentStatus === "partially_paid" && (
                    <div className="mt-1.5">
                      <span className="text-xs text-blue-600 font-medium bg-blue-50 rounded px-1.5 py-0.5">
                        Partial · ${fmt(round2(order.totalAmount - (order.amountPaid ?? 0)))} due
                      </span>
                    </div>
                  )}
                </button>
              ))}
          </div>

          {/* DETAIL PANEL — desktop always visible, mobile = slide-in */}
          <div
            className={`
              flex-1 flex flex-col bg-white overflow-hidden
              ${tab === "history" ? "hidden" : ""}
              ${showMobileDetail ? "flex" : "hidden md:flex"}
            `}
          >
            {/* Mobile back button */}
            <div className="flex md:hidden items-center px-4 py-3 border-b border-gray-100">
              <button
                onClick={() => setShowMobileDetail(false)}
                className="flex items-center gap-1 text-sm text-blue-600 font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            </div>

            {selectedOrder ? (
              <OrderDetailPanel
                key={selectedOrder._id}
                order={selectedOrder}
                axiosInstance={axiosInstance}
                onResult={(result, method) =>
                  applyPaymentResult(selectedOrder._id, result, method)
                }
                onPrint={handlePrint}
                onMethodChange={setPaymentMethod}
                onTenderedChange={setAmountTendered}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-300">
                <CreditCard className="w-12 h-12" />
                <p className="text-sm font-medium text-gray-400">
                  Select an order to process payment
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
