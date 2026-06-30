"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle, Printer } from "lucide-react";
import type {
  AxiosInstance,
  BillingOrder,
  PaymentResult,
  PayMethod,
  SplitMode,
  SplitPortion,
} from "../types";
import { errMsg, fmt, itemTotal, round2 } from "../utils";
import { BalanceSummary } from "./BalanceSummary";
import { PaymentMethodButton } from "./PaymentMethodButton";

// Payment panel — full / partial / even-split / by-item, with tips + KHQR.
export function PaymentPanel({
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
  const [khqr, setKhqr] = useState<{
    qrPayload: string;
    referenceId: string;
  } | null>(null);
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
      <BalanceSummary total={total} paid={paidSoFar} remaining={remaining} />

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

      {/* Mode body — full / partial */}
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

      {/* Mode body — even split */}
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
              <span className="text-sm font-semibold w-6 text-center">
                {ways}
              </span>
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

      {/* Mode body — by item */}
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
