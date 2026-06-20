"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  CreditCard,
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
  menuItem: PopulatedMenuItem;
  quantity: number;
  price: number;
  finalPrice?: number;
  discountAmount?: number;
  specialInstructions?: string;
}

interface BillingOrder {
  _id: string;
  status: "served";
  paymentStatus: "unpaid" | "paid";
  paymentMethod?: "cash" | "credit_card" | "debit_card" | "KHQR" | null;
  paidAt?: string;
  tableNumber?: number;
  customerName?: string;
  orderType: "dine-in" | "takeaway" | "delivery";
  totalAmount: number;
  totalDiscountAmount?: number;
  items: OrderItem[];
  updatedAt: string;
  createdAt: string;
}

type PaymentMethod = "cash" | "credit_card" | "debit_card" | "KHQR";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const labelFor: Record<string, string> = {
  cash: "Cash",
  credit_card: "Credit Card",
  debit_card: "Debit Card",
  KHQR: "KHQR",
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
  method: PaymentMethod;
  selected: boolean;
  onClick: () => void;
}) {
  const icons: Record<PaymentMethod, React.ReactNode> = {
    cash: <Wallet className="w-4 h-4" />,
    credit_card: <CreditCard className="w-4 h-4" />,
    debit_card: <CreditCard className="w-4 h-4" />,
    KHQR: <Smartphone className="w-4 h-4" />,
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
// Order detail + payment panel
// ---------------------------------------------------------------------------

function OrderDetailPanel({
  order,
  paymentMethod,
  setPaymentMethod,
  amountTendered,
  setAmountTendered,
  processing,
  onPay,
  onPrint,
}: {
  order: BillingOrder;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (m: PaymentMethod) => void;
  amountTendered: string;
  setAmountTendered: (v: string) => void;
  processing: boolean;
  onPay: () => void;
  onPrint: () => void;
}) {
  const subtotal = orderSubtotal(order);
  const discount = order.totalDiscountAmount ?? 0;
  const total = order.totalAmount;

  const tendered = parseFloat(amountTendered) || 0;
  const change = tendered - total;
  const insufficientFunds = tendered > 0 && change < 0;

  const isPaid = order.paymentStatus === "paid";

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
        <div className="flex justify-between text-base font-bold text-gray-900 pt-1 border-t border-gray-200 mt-1">
          <span>Total</span>
          <span>${fmt(total)}</span>
        </div>
      </div>

      {/* Payment section */}
      {!isPaid && (
        <div className="px-5 py-4 border-t border-gray-100 space-y-4">
          {/* Method selector */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Payment Method
            </p>
            <div className="flex flex-wrap gap-2">
              {(["cash", "credit_card", "debit_card", "KHQR"] as PaymentMethod[]).map((m) => (
                <PaymentMethodButton
                  key={m}
                  method={m}
                  selected={paymentMethod === m}
                  onClick={() => setPaymentMethod(m)}
                />
              ))}
            </div>
          </div>

          {/* Cash calculator */}
          {paymentMethod === "cash" && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Cash Received
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
                  value={amountTendered}
                  onChange={(e) => setAmountTendered(e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {tendered > 0 && (
                <div
                  className={`flex justify-between items-center px-3 py-2 rounded-lg text-sm font-semibold ${
                    insufficientFunds
                      ? "bg-red-50 text-red-600 border border-red-200"
                      : "bg-green-50 text-green-700 border border-green-200"
                  }`}
                >
                  <span>{insufficientFunds ? "Insufficient" : "Change"}</span>
                  <span>
                    {insufficientFunds
                      ? `-$${fmt(Math.abs(change))}`
                      : `$${fmt(change)}`}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onPrint}
              className="flex items-center justify-center gap-2 flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={onPay}
              disabled={processing || (paymentMethod === "cash" && insufficientFunds)}
              className="flex items-center justify-center gap-2 flex-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              {processing ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              {processing ? "Processing…" : "Mark as Paid"}
            </button>
          </div>
        </div>
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
// Main page
// ---------------------------------------------------------------------------

export default function BillingPage() {
  const { axiosInstance } = useAuth();
  const { socket } = useSocket();

  const [orders, setOrders] = useState<BillingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"pending" | "paid">("pending");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [amountTendered, setAmountTendered] = useState("");
  const [processing, setProcessing] = useState(false);

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
    () => orders.filter((o) => o.paymentStatus === "unpaid"),
    [orders],
  );

  const paidToday = useMemo(() => {
    const today = new Date().toDateString();
    return orders.filter(
      (o) => o.paymentStatus === "paid" && o.paidAt && new Date(o.paidAt).toDateString() === today,
    );
  }, [orders]);

  const displayOrders = tab === "pending" ? pendingOrders : paidToday;
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

  const handlePay = async () => {
    if (!selectedOrder) return;
    setProcessing(true);
    try {
      await axiosInstance.patch(`/api/billing/${selectedOrder._id}/pay`, { paymentMethod });
      setOrders((prev) =>
        prev.map((o) =>
          o._id === selectedOrder._id
            ? { ...o, paymentStatus: "paid", paymentMethod, paidAt: new Date().toISOString() }
            : o,
        ),
      );
    } catch {
      // stay on the same order so the user can retry
    } finally {
      setProcessing(false);
    }
  };

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
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden min-h-0 relative">

          {/* ORDER LIST */}
          <div
            className={`
              w-full md:w-80 lg:w-96 shrink-0
              border-r border-gray-200 bg-white
              overflow-y-auto
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
                  {tab === "pending" ? "No pending payments" : "No payments today yet"}
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
                </button>
              ))}
          </div>

          {/* DETAIL PANEL — desktop always visible, mobile = slide-in */}
          <div
            className={`
              flex-1 flex flex-col bg-white overflow-hidden
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
                order={selectedOrder}
                paymentMethod={paymentMethod}
                setPaymentMethod={(m) => { setPaymentMethod(m); setAmountTendered(""); }}
                amountTendered={amountTendered}
                setAmountTendered={setAmountTendered}
                processing={processing}
                onPay={handlePay}
                onPrint={handlePrint}
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
