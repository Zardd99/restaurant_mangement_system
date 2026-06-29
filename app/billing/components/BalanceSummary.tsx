"use client";

import { fmt } from "../utils";

// Total / Paid / Remaining strip shown above the payment controls.
export function BalanceSummary({
  total,
  paid,
  remaining,
}: {
  total: number;
  paid: number;
  remaining: number;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 text-center">
      <div className="bg-gray-50 rounded-lg py-2">
        <p className="text-[11px] uppercase tracking-wider text-gray-400">Total</p>
        <p className="text-sm font-semibold text-gray-900">${fmt(total)}</p>
      </div>
      <div className="bg-gray-50 rounded-lg py-2">
        <p className="text-[11px] uppercase tracking-wider text-gray-400">Paid</p>
        <p className="text-sm font-semibold text-green-600">${fmt(paid)}</p>
      </div>
      <div className="bg-amber-50 rounded-lg py-2">
        <p className="text-[11px] uppercase tracking-wider text-amber-500">
          Remaining
        </p>
        <p className="text-sm font-bold text-amber-700">${fmt(remaining)}</p>
      </div>
    </div>
  );
}
