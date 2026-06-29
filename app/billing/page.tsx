"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CreditCard, FileText, RefreshCw } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import type {
  BillingOrder,
  PaymentMethod,
  PaymentResult,
  PayMethod,
} from "./types";
import { HistoryView } from "./components/HistoryView";
import { OrderDetailPanel } from "./components/OrderDetailPanel";
import { OrderList } from "./components/OrderList";
import { ReceiptPrintArea } from "./components/ReceiptPrintArea";

type Tab = "pending" | "paid" | "history";

export default function BillingPage() {
  const { axiosInstance, user } = useAuth();
  const { socket } = useSocket();

  const canViewHistory = user?.role === "admin" || user?.role === "manager";

  const [orders, setOrders] = useState<BillingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("pending");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PayMethod>("cash");
  const [amountTendered, setAmountTendered] = useState("");

  const receiptRef = useRef<HTMLDivElement>(null);

  const fetchOrders = useCallback(async () => {
    setError(null);
    try {
      const res = await axiosInstance.get<{
        success: boolean;
        orders: BillingOrder[];
      }>("/api/billing/served");
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

  // Real-time sync: reflect payments settled elsewhere.
  useEffect(() => {
    if (!socket) return;
    const handlePaymentUpdate = (data: {
      orderId: string;
      paymentStatus: "paid";
      paymentMethod: PaymentMethod;
    }) => {
      setOrders((prev) =>
        prev.map((o) =>
          o._id === data.orderId
            ? {
                ...o,
                paymentStatus: data.paymentStatus,
                paymentMethod: data.paymentMethod,
                paidAt: new Date().toISOString(),
              }
            : o,
        ),
      );
    };
    socket.on("billing:payment_updated", handlePaymentUpdate);
    return () => {
      socket.off("billing:payment_updated", handlePaymentUpdate);
    };
  }, [socket]);

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
      (o) =>
        o.paymentStatus === "paid" &&
        o.paidAt &&
        new Date(o.paidAt).toDateString() === today,
    );
  }, [orders]);

  const displayOrders = tab === "paid" ? paidToday : pendingOrders;
  const selectedOrder = orders.find((o) => o._id === selectedId) ?? null;

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

  const handlePrint = () => window.print();

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
            <h1 className="text-xl font-bold text-gray-900">
              Billing & Payments
            </h1>
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

          {/* Order list */}
          <div
            className={`
              w-full md:w-80 lg:w-96 shrink-0
              border-r border-gray-200 bg-white
              overflow-y-auto
              ${tab === "history" ? "hidden" : ""}
              ${showMobileDetail ? "hidden md:block" : "block"}
            `}
          >
            <OrderList
              orders={displayOrders}
              loading={loading}
              error={error}
              selectedId={selectedId}
              tab={tab === "paid" ? "paid" : "pending"}
              onSelect={selectOrder}
            />
          </div>

          {/* Detail panel — desktop always visible, mobile = slide-in */}
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
