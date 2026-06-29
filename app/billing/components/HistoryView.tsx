"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, FileText, Filter } from "lucide-react";
import type { AxiosInstance, HistoricalReceipt, PaymentMethod } from "../types";
import { fmt, labelFor, statusColors } from "../utils";
import { ReceiptHistoryDetail } from "./ReceiptHistoryDetail";
import { ReceiptHistoryPrintArea } from "./ReceiptHistoryPrintArea";

const receiptLabel = (receipt: HistoricalReceipt) =>
  receipt.order?.tableNumber
    ? `Table ${receipt.order.tableNumber}`
    : receipt.order?.customerName || receipt.customer?.name || "Takeaway";

// Receipt history view (admin / manager only).
export function HistoryView({ axiosInstance }: { axiosInstance: AxiosInstance }) {
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
      const res = await axiosInstance.get<HistoricalReceipt[]>(
        "/api/receipts",
        { params },
      );
      setReceipts(res.data);
    } catch {
      setError("Failed to load receipt history.");
    } finally {
      setLoading(false);
    }
  }, [axiosInstance, filterMethod, filterFrom, filterTo]);

  useEffect(() => {
    fetchReceipts();
    // Initial load only; subsequent loads are explicit via Apply.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <ReceiptHistoryPrintArea receipt={selectedReceipt} />

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* List side */}
        <div
          className={`w-full md:w-80 lg:w-96 shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-hidden ${
            showMobileDetail ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Filters */}
          <div className="px-4 py-3 border-b border-gray-100 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <Filter className="w-3.5 h-3.5" />
              Filters
            </div>
            <select
              value={filterMethod}
              onChange={(e) =>
                setFilterMethod(e.target.value as PaymentMethod | "")
              }
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All payment methods</option>
              {(["cash", "credit_card", "debit_card", "KHQR"] as PaymentMethod[]).map(
                (m) => (
                  <option key={m} value={m}>
                    {labelFor[m]}
                  </option>
                ),
              )}
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
            {error && (
              <div className="p-6 text-center text-sm text-red-500">{error}</div>
            )}
            {!loading && !error && receipts.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 gap-2 text-gray-400">
                <FileText className="w-8 h-8" />
                <p className="text-sm font-medium">No receipts found</p>
              </div>
            )}
            {!loading &&
              receipts.map((receipt) => (
                <button
                  key={receipt._id}
                  onClick={() => {
                    setSelectedId(receipt._id);
                    setShowMobileDetail(true);
                  }}
                  className={`w-full text-left px-4 py-4 border-b border-gray-100 transition-colors ${
                    selectedId === receipt._id
                      ? "bg-blue-50 border-l-4 border-l-blue-500"
                      : "hover:bg-gray-50 border-l-4 border-l-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-900 text-sm">
                      {receiptLabel(receipt)}
                    </span>
                    <span className="font-bold text-gray-900 text-sm">
                      ${fmt(receipt.totalAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-mono">
                      {receipt.receiptNumber}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(receipt.issuedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-xs text-blue-600 font-medium bg-blue-50 rounded px-1.5 py-0.5">
                      {labelFor[receipt.paymentMethod]}
                    </span>
                    <span
                      className={`text-xs font-medium border rounded px-1.5 py-0.5 capitalize ${
                        statusColors[receipt.paymentStatus] ?? ""
                      }`}
                    >
                      {receipt.paymentStatus}
                    </span>
                  </div>
                </button>
              ))}
          </div>
        </div>

        {/* Detail side */}
        <div
          className={`flex-1 flex flex-col bg-white overflow-hidden ${
            showMobileDetail ? "flex" : "hidden md:flex"
          }`}
        >
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
              <p className="text-sm font-medium text-gray-400">
                Select a receipt to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
