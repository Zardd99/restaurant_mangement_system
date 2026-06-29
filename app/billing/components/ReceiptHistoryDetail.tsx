"use client";

import { Printer } from "lucide-react";
import type { HistoricalReceipt } from "../types";
import { fmt, labelFor, statusColors } from "../utils";

const receiptLabel = (receipt: HistoricalReceipt) =>
  receipt.order?.tableNumber
    ? `Table ${receipt.order.tableNumber}`
    : receipt.order?.customerName || receipt.customer?.name || "Takeaway";

export function ReceiptHistoryDetail({
  receipt,
  onPrint,
}: {
  receipt: HistoricalReceipt;
  onPrint: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">
              {receipt.receiptNumber}
            </p>
            <h2 className="text-lg font-semibold text-gray-900 mt-0.5">
              {receiptLabel(receipt)}
            </h2>
            <p className="text-sm text-gray-500">
              {new Date(receipt.issuedAt).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>
          <span
            className={`text-xs font-medium border rounded-full px-2.5 py-1 capitalize ${
              statusColors[receipt.paymentStatus] ?? ""
            }`}
          >
            {receipt.paymentStatus}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 min-h-0">
        {receipt.items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {item.name}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm text-gray-500">×{item.quantity}</p>
              <p className="text-sm font-semibold text-gray-900">
                ${fmt(item.price * item.quantity)}
              </p>
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
          <span className="text-sm font-semibold text-gray-900">
            {labelFor[receipt.paymentMethod]}
          </span>
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
