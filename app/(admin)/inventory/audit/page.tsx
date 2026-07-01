"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ClipboardCheck,
  Loader2,
  Search,
  AlertTriangle,
  CheckCircle2,
  PackageSearch,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { hasPermission } from "../../../config/rbac";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SheetRow {
  ingredientId: string;
  name: string;
  unit: string;
  category: string;
  theoreticalStock: number;
  costPerUnit: number;
  isPrepped: boolean;
  storageRequirement: string;
}

interface SubmitResult {
  auditId: string;
  status: string;
  totalVarianceCost: number;
  shrinkageCost: number;
  itemsReconciled: number;
}

type Phase = "idle" | "counting" | "done";
type RowFilter = "all" | "counted" | "uncounted";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const money = (n: number) =>
  `${n < 0 ? "-" : ""}$${Math.abs(n).toFixed(2)}`;

const round2 = (n: number) => Math.round(n * 100) / 100;

function errMsg(error: unknown, fallback: string): string {
  return (
    (error as { response?: { data?: { error?: string; message?: string } } })
      ?.response?.data?.error ||
    (error as { response?: { data?: { message?: string } } })?.response?.data
      ?.message ||
    fallback
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function InventoryAuditPage() {
  const { axiosInstance, user } = useAuth();
  const canAudit = hasPermission(user?.role, "inventory:write");

  const [phase, setPhase] = useState<Phase>("idle");
  const [auditId, setAuditId] = useState<string | null>(null);
  const [rows, setRows] = useState<SheetRow[]>([]);
  const [counts, setCounts] = useState<Record<string, string>>({});

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<RowFilter>("all");

  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);

  // ----- Start a new stock take -----
  const startAudit = useCallback(async () => {
    setStarting(true);
    setError(null);
    try {
      const [draftRes, sheetRes] = await Promise.all([
        axiosInstance.post<{ auditId: string }>("/api/inventory/audit/draft"),
        axiosInstance.get<{ items: SheetRow[] }>("/api/inventory/audit/sheet"),
      ]);
      setAuditId(draftRes.data.auditId);
      setRows(sheetRes.data.items ?? []);
      setCounts({});
      setResult(null);
      setPhase("counting");
    } catch (err) {
      setError(errMsg(err, "Could not start the stock take. Please try again."));
    } finally {
      setStarting(false);
    }
  }, [axiosInstance]);

  // ----- Derived: counted lines + estimated variance -----
  const countedRows = useMemo(
    () =>
      rows
        .filter((r) => {
          const v = counts[r.ingredientId];
          return v !== undefined && v.trim() !== "" && !Number.isNaN(Number(v));
        })
        .map((r) => {
          const actual = Number(counts[r.ingredientId]);
          const variance = round2(actual - r.theoreticalStock);
          return { row: r, actual, variance, cost: round2(variance * r.costPerUnit) };
        }),
    [rows, counts],
  );

  const estVarianceCost = round2(
    countedRows.reduce((sum, c) => sum + c.cost, 0),
  );
  const estShrinkage = round2(
    countedRows.filter((c) => c.cost < 0).reduce((s, c) => s + c.cost, 0),
  );

  // ----- Filtered + grouped view -----
  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q) && !r.category.toLowerCase().includes(q)) {
        return false;
      }
      const isCounted =
        counts[r.ingredientId] !== undefined &&
        counts[r.ingredientId].trim() !== "";
      if (filter === "counted") return isCounted;
      if (filter === "uncounted") return !isCounted;
      return true;
    });
  }, [rows, search, filter, counts]);

  const groups = useMemo(() => {
    const map = new Map<string, SheetRow[]>();
    for (const r of visibleRows) {
      const key = r.category || "Uncategorised";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return Array.from(map.entries());
  }, [visibleRows]);

  // ----- Submit (reconcile) -----
  const submit = useCallback(async () => {
    if (!auditId) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await axiosInstance.post<SubmitResult>("/api/inventory/audit", {
        auditId,
        items: countedRows.map((c) => ({
          ingredientId: c.row.ingredientId,
          actualStock: c.actual,
        })),
      });
      setResult(res.data);
      setConfirming(false);
      setPhase("done");
    } catch (err) {
      setError(errMsg(err, "Could not submit the stock take. Please try again."));
      setConfirming(false);
    } finally {
      setSubmitting(false);
    }
  }, [auditId, axiosInstance, countedRows]);

  // Warn before leaving with an unsubmitted count in progress.
  useEffect(() => {
    if (phase !== "counting" || countedRows.length === 0) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [phase, countedRows.length]);

  // -------------------------------------------------------------------------
  // Render: access guard
  // -------------------------------------------------------------------------
  if (!canAudit) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-amber-500" />
          <h1 className="text-lg font-semibold text-gray-800">
            Manager access required
          </h1>
          <p className="text-sm text-gray-500">
            You need the inventory:write permission to run a stock take.
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render: result screen
  // -------------------------------------------------------------------------
  if (phase === "done" && result) {
    const loss = result.shrinkageCost;
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-green-500" />
            <h1 className="text-2xl font-bold text-gray-900">
              Stock take complete
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Inventory has been reconciled to your physical counts.
            </p>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-2xl font-bold text-gray-900">
                  {result.itemsReconciled}
                </p>
                <p className="text-xs text-gray-500">Items reconciled</p>
              </div>
              <div className="rounded-xl bg-red-50 p-4">
                <p className="text-2xl font-bold text-red-600">{money(loss)}</p>
                <p className="text-xs text-gray-500">Shrinkage cost</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <p
                  className={`text-2xl font-bold ${
                    result.totalVarianceCost < 0
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {money(result.totalVarianceCost)}
                </p>
                <p className="text-xs text-gray-500">Net variance</p>
              </div>
            </div>

            <button
              onClick={() => {
                setPhase("idle");
                setAuditId(null);
                setRows([]);
                setCounts({});
                setResult(null);
              }}
              className="mt-8 w-full rounded-xl bg-indigo-600 px-5 py-3 font-medium text-white hover:bg-indigo-700"
            >
              Start another stock take
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render: idle (start screen)
  // -------------------------------------------------------------------------
  if (phase === "idle") {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100">
              <ClipboardCheck className="h-7 w-7 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory Stock Take</h1>
            <p className="mt-2 text-sm text-gray-500">
              Walk the kitchen and count what you physically see. The system will
              compare against its theoretical stock, reset to your counts, and
              record any shrinkage as a costed variance.
            </p>

            {error && (
              <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              onClick={startAudit}
              disabled={starting}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {starting && <Loader2 className="h-4 w-4 animate-spin" />}
              {starting ? "Preparing count sheet…" : "Start new stock take"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render: counting
  // -------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Sticky header: search + filter */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur px-4 py-3 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-lg font-bold text-gray-900">Stock Take</h1>
            <span className="text-xs text-gray-500">
              {countedRows.length} / {rows.length} counted
            </span>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ingredient or category…"
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="mt-2 flex gap-2">
            {(["all", "uncounted", "counted"] as RowFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  filter === f
                    ? "bg-indigo-600 text-white"
                    : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Count list grouped by category */}
      <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6">
        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {groups.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400">
            <PackageSearch className="mb-3 h-10 w-10" />
            <p className="text-sm">No ingredients match this view.</p>
          </div>
        )}

        {groups.map(([category, items]) => (
          <div key={category} className="mb-6">
            <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
              {category}
            </h2>
            <div className="space-y-2">
              {items.map((row) => {
                const raw = counts[row.ingredientId] ?? "";
                const counted = raw.trim() !== "" && !Number.isNaN(Number(raw));
                const variance = counted
                  ? round2(Number(raw) - row.theoreticalStock)
                  : 0;
                const varianceCost = round2(variance * row.costPerUnit);

                return (
                  <div
                    key={row.ingredientId}
                    className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {row.name}
                        {row.isPrepped && (
                          <span className="ml-2 rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-700">
                            prepped
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        System: {row.theoreticalStock} {row.unit}
                        {counted && (
                          <span
                            className={`ml-2 font-medium ${
                              variance < 0
                                ? "text-red-600"
                                : variance > 0
                                  ? "text-green-600"
                                  : "text-gray-400"
                            }`}
                          >
                            Δ {variance > 0 ? "+" : ""}
                            {variance} {row.unit}
                            {variance !== 0 && ` (${money(varianceCost)})`}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="any"
                        value={raw}
                        onChange={(e) =>
                          setCounts((prev) => ({
                            ...prev,
                            [row.ingredientId]: e.target.value,
                          }))
                        }
                        placeholder="count"
                        className={`w-24 rounded-lg border px-3 py-2 text-right text-base focus:ring-2 focus:ring-indigo-500 ${
                          counted
                            ? "border-indigo-300 bg-indigo-50/40"
                            : "border-gray-300"
                        }`}
                      />
                      <span className="w-10 text-xs text-gray-400">{row.unit}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Sticky submit bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="text-sm">
            <p className="font-medium text-gray-900">
              Est. variance{" "}
              <span
                className={
                  estVarianceCost < 0 ? "text-red-600" : "text-green-600"
                }
              >
                {money(estVarianceCost)}
              </span>
            </p>
            <p className="text-xs text-gray-500">
              {countedRows.length} item{countedRows.length === 1 ? "" : "s"}{" "}
              counted
            </p>
          </div>
          <button
            onClick={() => setConfirming(true)}
            disabled={countedRows.length === 0 || submitting}
            className="rounded-xl bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            Submit count
          </button>
        </div>
      </div>

      {/* Confirmation modal */}
      {confirming && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-gray-900">Confirm stock take</h2>
            <p className="mt-1 text-sm text-gray-500">
              This will reset system stock to your counts for{" "}
              <strong>{countedRows.length}</strong> ingredient
              {countedRows.length === 1 ? "" : "s"} and record the variance. This
              cannot be undone.
            </p>

            <div className="mt-4 space-y-1 rounded-lg bg-gray-50 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Net variance</span>
                <span className="font-medium">{money(estVarianceCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Estimated shrinkage</span>
                <span className="font-medium text-red-600">
                  {money(estShrinkage)}
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setConfirming(false)}
                disabled={submitting}
                className="rounded-lg border border-gray-300 px-5 py-2 text-gray-700 hover:bg-gray-50"
              >
                Keep counting
              </button>
              <button
                onClick={submit}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? "Reconciling…" : "Confirm & reconcile"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
