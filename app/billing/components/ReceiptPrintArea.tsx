"use client";

import type { BillingOrder, PaymentMethod } from "../types";
import { fmt, itemTotal, labelFor, orderLabel, orderSubtotal } from "../utils";

// Print-only receipt (hidden on screen, revealed by the @media print rules in
// the billing page). Used for live order payment receipts.
export function ReceiptPrintArea({
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
            {order.orderType.charAt(0).toUpperCase() +
              order.orderType.slice(1).replace("-", " ")}
          </div>
        </div>

        <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />

        {order.items.map((item, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "13px",
              marginBottom: "4px",
            }}
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
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                color: "#16a34a",
              }}
            >
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
