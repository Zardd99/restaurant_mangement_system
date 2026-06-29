"use client";

import type { HistoricalReceipt } from "../types";
import { fmt, labelFor } from "../utils";

// Print-only receipt for the history view (hidden on screen, revealed by the
// @media print rules in the billing page).
export function ReceiptHistoryPrintArea({
  receipt,
}: {
  receipt: HistoricalReceipt | null;
}) {
  if (!receipt) return null;

  return (
    <div
      id="receipt-print-area"
      className="hidden"
      style={{ fontFamily: "monospace" }}
    >
      <div style={{ width: "300px", margin: "0 auto", padding: "16px" }}>
        <div style={{ textAlign: "center", marginBottom: "12px" }}>
          <div style={{ fontWeight: "bold", fontSize: "18px" }}>RESTAURANT</div>
          <div style={{ fontSize: "12px", color: "#555" }}>
            Receipt #{receipt.receiptNumber}
          </div>
          <div style={{ fontSize: "11px", marginTop: "4px" }}>
            {new Date(receipt.issuedAt).toLocaleString("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </div>
        </div>
        <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />
        {receipt.items.map((item, idx) => (
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
              {item.name} ×{item.quantity}
            </span>
            <span>${fmt(item.price * item.quantity)}</span>
          </div>
        ))}
        <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />
        <div style={{ fontSize: "13px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Subtotal</span>
            <span>${fmt(receipt.subtotal)}</span>
          </div>
          {receipt.discount > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                color: "#16a34a",
              }}
            >
              <span>Discount</span>
              <span>-${fmt(receipt.discount)}</span>
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
            <span>${fmt(receipt.totalAmount)}</span>
          </div>
        </div>
        <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />
        <div
          style={{
            fontSize: "13px",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>Payment</span>
          <span>{labelFor[receipt.paymentMethod]}</span>
        </div>
        <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />
        <div style={{ textAlign: "center", fontSize: "12px", color: "#555" }}>
          <div>Thank you for dining with us!</div>
        </div>
      </div>
    </div>
  );
}
