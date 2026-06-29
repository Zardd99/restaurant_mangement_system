"use client";

import { CheckCircle, Clock, Printer } from "lucide-react";
import type {
  AxiosInstance,
  BillingOrder,
  PaymentResult,
  PayMethod,
} from "../types";
import {
  fmt,
  itemTotal,
  labelFor,
  orderLabel,
  orderSubtotal,
  round2,
  timeAgo,
} from "../utils";
import { PaymentPanel } from "./PaymentPanel";

// Order detail + payment panel.
export function OrderDetailPanel({
  order,
  axiosInstance,
  onResult,
  onPrint,
  onMethodChange,
  onTenderedChange,
}: {
  order: BillingOrder;
  axiosInstance: AxiosInstance;
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
            <h2 className="text-lg font-semibold text-gray-900">
              {orderLabel(order)}
            </h2>
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
              <p className="text-sm font-medium text-gray-900 truncate">
                {item.menuItem.name}
              </p>
              {item.specialInstructions && (
                <p className="text-xs text-gray-400 truncate">
                  {item.specialInstructions}
                </p>
              )}
              {(item.discountAmount ?? 0) > 0 && (
                <p className="text-xs text-green-600">
                  Disc: -${fmt(item.discountAmount! * item.quantity)}
                </p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm text-gray-500">×{item.quantity}</p>
              <p className="text-sm font-semibold text-gray-900">
                ${fmt(itemTotal(item))}
              </p>
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
            <p className="text-sm font-semibold text-green-700">
              Payment Complete
            </p>
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
