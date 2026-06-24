"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import {
  APIIngredientRepository,
  IngredientItem,
  IngredientInput,
} from "../../../infrastructure/repositories/APIIngredientRepository";
import { hasPermission } from "../../../config/rbac";

type Filter = "all" | "low" | "critical";
type SortKey = "name" | "currentStock" | "value" | "status";
type ModalState =
  | { type: "create" }
  | { type: "edit"; item: IngredientItem }
  | { type: "adjust"; item: IngredientItem }
  | null;

interface SupplierOption {
  id: string;
  name: string;
}

const STATUS_RANK: Record<string, number> = { CRITICAL: 0, LOW: 1, NORMAL: 2 };
const PAGE_SIZE = 10;

const statusBadge = (item: IngredientItem) => {
  if (item.needsReorder) return "bg-red-100 text-red-800 border-red-300";
  if (item.isLowStock) return "bg-yellow-100 text-yellow-800 border-yellow-300";
  return "bg-green-100 text-green-800 border-green-300";
};

const statusLabel = (item: IngredientItem) => {
  if (item.needsReorder) return "Critical";
  if (item.isLowStock) return "Low";
  return "In stock";
};

export const IngredientStockDashboard: React.FC = () => {
  const { token, user } = useAuth();
  const canWrite = hasPermission(user?.role, "inventory:write");

  const repo = useMemo(
    () =>
      new APIIngredientRepository(process.env.NEXT_PUBLIC_API_URL || "", token),
    [token],
  );

  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("status");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);

  const [modal, setModal] = useState<ModalState>(null);

  const load = useCallback(async () => {
    if (!token) {
      setError("Authentication required");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const result = await repo.listIngredients();
    if (!result.ok) {
      setError(result.error);
      setIngredients([]);
    } else {
      setIngredients(result.value);
      setLastUpdated(new Date());
    }
    setLoading(false);
  }, [repo, token]);

  const loadSuppliers = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/supplier`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
        },
      );
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data) ? data : data?.value || [];
      setSuppliers(
        list.map((s: { _id?: string; id?: string; name: string }) => ({
          id: s._id || s.id || "",
          name: s.name,
        })),
      );
    } catch {
      // suppliers are optional for viewing; ignore failures
    }
  }, [token]);

  useEffect(() => {
    load();
    loadSuppliers();
  }, [load, loadSuppliers]);

  const visible = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const filtered = ingredients.filter((i) => {
      if (term && !i.name.toLowerCase().includes(term)) return false;
      if (filter === "low") return i.isLowStock;
      if (filter === "critical") return i.needsReorder;
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "currentStock") cmp = a.currentStock - b.currentStock;
      else if (sortKey === "value")
        cmp = a.currentStock * a.costPerUnit - b.currentStock * b.costPerUnit;
      else cmp = STATUS_RANK[a.status] - STATUS_RANK[b.status];
      return sortAsc ? cmp : -cmp;
    });
    return sorted;
  }, [ingredients, searchTerm, filter, sortKey, sortAsc]);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const pageItems = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    if (page > pageCount) setPage(1);
  }, [page, pageCount]);

  const totals = useMemo(
    () => ({
      count: ingredients.length,
      low: ingredients.filter((i) => i.isLowStock).length,
      critical: ingredients.filter((i) => i.needsReorder).length,
      value: ingredients.reduce(
        (sum, i) => sum + i.currentStock * i.costPerUnit,
        0,
      ),
    }),
    [ingredients],
  );

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const handleDelete = async (item: IngredientItem) => {
    if (!confirm(`Deactivate "${item.name}"? It will be hidden from the list.`))
      return;
    const result = await repo.deleteIngredient(item.id);
    if (!result.ok) setError(result.error);
    else load();
  };

  if (!token) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
          Please log in to view inventory.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Ingredient Inventory
          </h1>
          <p className="text-sm text-gray-600">
            Manage stock, thresholds, and suppliers
            {lastUpdated && (
              <span className="ml-2 text-gray-400">
                · updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="rounded-lg border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Refresh
          </button>
          {canWrite && (
            <button
              onClick={() => setModal({ type: "create" })}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              + Add Ingredient
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-medium">
            Dismiss
          </button>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Total ingredients" value={totals.count} />
        <KpiCard label="Low stock" value={totals.low} accent="text-yellow-600" />
        <KpiCard
          label="Critical"
          value={totals.critical}
          accent="text-red-600"
        />
        <KpiCard
          label="Inventory value"
          value={`$${totals.value.toFixed(2)}`}
          accent="text-green-600"
        />
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2">
          {(["all", "low", "critical"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-4 py-2 text-sm capitalize ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search ingredients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 md:w-64"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <Th onClick={() => toggleSort("name")} active={sortKey === "name"} asc={sortAsc}>
                  Ingredient
                </Th>
                <Th
                  onClick={() => toggleSort("currentStock")}
                  active={sortKey === "currentStock"}
                  asc={sortAsc}
                >
                  Stock
                </Th>
                <Th onClick={() => toggleSort("status")} active={sortKey === "status"} asc={sortAsc}>
                  Status
                </Th>
                <th className="px-4 py-3">Cost / unit</th>
                <Th onClick={() => toggleSort("value")} active={sortKey === "value"} asc={sortAsc}>
                  Value
                </Th>
                {canWrite && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                    Loading inventory...
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                    No ingredients found.
                  </td>
                </tr>
              ) : (
                pageItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="text-xs text-gray-500">
                        Min {item.minStock}
                        {item.unit} · Reorder {item.reorderPoint}
                        {item.unit}
                        {item.category ? ` · ${item.category}` : ""}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-900">
                        {item.currentStock} {item.unit}
                      </div>
                      <div className="mt-1 h-1.5 w-28 rounded-full bg-gray-200">
                        <div
                          className={`h-1.5 rounded-full ${
                            item.needsReorder
                              ? "bg-red-600"
                              : item.isLowStock
                                ? "bg-yellow-500"
                                : "bg-green-600"
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              (item.currentStock /
                                Math.max(1, item.minStock * 2)) *
                                100,
                            )}%`,
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${statusBadge(item)}`}
                      >
                        {statusLabel(item)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      ${item.costPerUnit.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      ${(item.currentStock * item.costPerUnit).toFixed(2)}
                    </td>
                    {canWrite && (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-3 text-xs font-medium">
                          <button
                            onClick={() => setModal({ type: "adjust", item })}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Adjust
                          </button>
                          <button
                            onClick={() => setModal({ type: "edit", item })}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && visible.length > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-gray-600">
            <span>
              {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, visible.length)} of {visible.length}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded border px-3 py-1 disabled:opacity-40"
              >
                Prev
              </button>
              <span className="px-2 py-1">
                {page} / {pageCount}
              </span>
              <button
                disabled={page >= pageCount}
                onClick={() => setPage((p) => p + 1)}
                className="rounded border px-3 py-1 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {modal?.type === "create" && (
        <IngredientFormModal
          title="Add Ingredient"
          suppliers={suppliers}
          onClose={() => setModal(null)}
          onSubmit={async (input) => {
            const result = await repo.createIngredient(input);
            if (!result.ok) return result.error;
            setModal(null);
            load();
            return null;
          }}
        />
      )}

      {modal?.type === "edit" && (
        <IngredientFormModal
          title="Edit Ingredient"
          suppliers={suppliers}
          initial={modal.item}
          onClose={() => setModal(null)}
          onSubmit={async (input) => {
            const result = await repo.updateIngredient(modal.item.id, input);
            if (!result.ok) return result.error;
            setModal(null);
            load();
            return null;
          }}
        />
      )}

      {modal?.type === "adjust" && (
        <AdjustStockModal
          item={modal.item}
          onClose={() => setModal(null)}
          onSubmit={async (delta, reason) => {
            const result = await repo.adjustStock(modal.item.id, delta, reason);
            if (!result.ok) return result.error;
            setModal(null);
            load();
            return null;
          }}
        />
      )}
    </div>
  );
};

const KpiCard = ({
  label,
  value,
  accent = "text-gray-900",
}: {
  label: string;
  value: number | string;
  accent?: string;
}) => (
  <div className="rounded-lg border bg-white p-4 shadow-sm">
    <p className="text-xs text-gray-500">{label}</p>
    <p className={`text-2xl font-bold ${accent}`}>{value}</p>
  </div>
);

const Th = ({
  children,
  onClick,
  active,
  asc,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active: boolean;
  asc: boolean;
}) => (
  <th
    onClick={onClick}
    className="cursor-pointer select-none px-4 py-3 hover:text-gray-700"
  >
    {children}
    {active && <span className="ml-1">{asc ? "▲" : "▼"}</span>}
  </th>
);

const ModalShell = ({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    onClick={onClose}
  >
    <div
      className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          ✕
        </button>
      </div>
      {children}
    </div>
  </div>
);

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <label className="block">
    <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>
    {children}
  </label>
);

const inputCls =
  "w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500";

const IngredientFormModal = ({
  title,
  suppliers,
  initial,
  onClose,
  onSubmit,
}: {
  title: string;
  suppliers: SupplierOption[];
  initial?: IngredientItem;
  onClose: () => void;
  onSubmit: (input: IngredientInput) => Promise<string | null>;
}) => {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    unit: initial?.unit ?? "",
    currentStock: initial?.currentStock ?? 0,
    minStock: initial?.minStock ?? 0,
    reorderPoint: initial?.reorderPoint ?? 0,
    costPerUnit: initial?.costPerUnit ?? 0,
    supplierId: initial?.supplierId ?? "",
    category: initial?.category ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const set = (k: keyof typeof form, v: string | number) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setErr(null);
    if (!form.name || !form.unit || !form.supplierId) {
      setErr("Name, unit, and supplier are required.");
      return;
    }
    setBusy(true);
    const result = await onSubmit({
      name: form.name,
      description: form.description,
      unit: form.unit,
      currentStock: Number(form.currentStock),
      minStock: Number(form.minStock),
      reorderPoint: Number(form.reorderPoint),
      costPerUnit: Number(form.costPerUnit),
      supplierId: form.supplierId,
      category: form.category,
    });
    setBusy(false);
    if (result) setErr(result);
  };

  return (
    <ModalShell title={title} onClose={onClose}>
      <div className="space-y-3">
        <Field label="Name">
          <input
            className={inputCls}
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Unit (e.g. kg, L, pcs)">
            <input
              className={inputCls}
              value={form.unit}
              onChange={(e) => set("unit", e.target.value)}
            />
          </Field>
          <Field label="Category">
            <input
              className={inputCls}
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
            />
          </Field>
        </div>
        <Field label="Supplier">
          <select
            className={inputCls}
            value={form.supplierId}
            onChange={(e) => set("supplierId", e.target.value)}
          >
            <option value="">Select supplier…</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Current stock">
            <input
              type="number"
              className={inputCls}
              value={form.currentStock}
              onChange={(e) => set("currentStock", e.target.value)}
            />
          </Field>
          <Field label="Cost per unit ($)">
            <input
              type="number"
              step="0.01"
              className={inputCls}
              value={form.costPerUnit}
              onChange={(e) => set("costPerUnit", e.target.value)}
            />
          </Field>
          <Field label="Min stock">
            <input
              type="number"
              className={inputCls}
              value={form.minStock}
              onChange={(e) => set("minStock", e.target.value)}
            />
          </Field>
          <Field label="Reorder point (≥ min)">
            <input
              type="number"
              className={inputCls}
              value={form.reorderPoint}
              onChange={(e) => set("reorderPoint", e.target.value)}
            />
          </Field>
        </div>
        <Field label="Description">
          <textarea
            className={inputCls}
            rows={2}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </Field>

        {err && <p className="text-sm text-red-600">{err}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
};

const AdjustStockModal = ({
  item,
  onClose,
  onSubmit,
}: {
  item: IngredientItem;
  onClose: () => void;
  onSubmit: (delta: number, reason: string) => Promise<string | null>;
}) => {
  const [delta, setDelta] = useState(0);
  const [reason, setReason] = useState("restock");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const projected = item.currentStock + Number(delta || 0);

  const submit = async () => {
    setErr(null);
    if (!delta || Number(delta) === 0) {
      setErr("Enter a non-zero amount.");
      return;
    }
    setBusy(true);
    const result = await onSubmit(Number(delta), reason);
    setBusy(false);
    if (result) setErr(result);
  };

  return (
    <ModalShell title={`Adjust stock — ${item.name}`} onClose={onClose}>
      <div className="space-y-3">
        <p className="text-sm text-gray-600">
          Current: <strong>{item.currentStock} {item.unit}</strong>
        </p>
        <Field label={`Change (+ to restock, − for wastage) in ${item.unit}`}>
          <input
            type="number"
            className={inputCls}
            value={delta}
            onChange={(e) => setDelta(Number(e.target.value))}
          />
        </Field>
        <Field label="Reason">
          <select
            className={inputCls}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            <option value="restock">Restock / delivery</option>
            <option value="wastage">Wastage / spoilage</option>
            <option value="correction">Stock-take correction</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <p
          className={`text-sm ${projected < 0 ? "text-red-600" : "text-gray-700"}`}
        >
          New level: <strong>{projected} {item.unit}</strong>
          {projected < 0 && " — cannot go below zero"}
        </p>

        {err && <p className="text-sm text-red-600">{err}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy || projected < 0}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {busy ? "Applying…" : "Apply"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
};

export default IngredientStockDashboard;
