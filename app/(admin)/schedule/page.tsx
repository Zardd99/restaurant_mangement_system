"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  X,
  Clock,
  CalendarDays,
  Users,
} from "lucide-react";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type ShiftRole = "admin" | "manager" | "chef" | "waiter" | "cashier";

interface Shift {
  id: string;
  staffName: string;
  role: ShiftRole;
  date: string;       // "YYYY-MM-DD"
  startTime: string;  // "HH:mm"
  endTime: string;    // "HH:mm"
  note?: string;
}

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const ROLES: ShiftRole[] = ["admin", "manager", "chef", "waiter", "cashier"];

const ROLE_STYLE: Record<ShiftRole, { card: string; badge: string; dot: string }> = {
  admin:   { card: "border-l-red-400 bg-red-50",    badge: "bg-red-100 text-red-700",     dot: "bg-red-400" },
  manager: { card: "border-l-purple-400 bg-purple-50", badge: "bg-purple-100 text-purple-700", dot: "bg-purple-400" },
  chef:    { card: "border-l-orange-400 bg-orange-50", badge: "bg-orange-100 text-orange-700", dot: "bg-orange-400" },
  waiter:  { card: "border-l-blue-400 bg-blue-50",  badge: "bg-blue-100 text-blue-700",   dot: "bg-blue-400" },
  cashier: { card: "border-l-green-400 bg-green-50", badge: "bg-green-100 text-green-700", dot: "bg-green-400" },
};

const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function displayDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function buildSeedShifts(monday: Date): Shift[] {
  const seeds: Array<Omit<Shift, "id">> = [
    { staffName: "Alice Wong",  role: "manager", date: toISODate(monday),          startTime: "09:00", endTime: "17:00" },
    { staffName: "Marco Rossi", role: "chef",    date: toISODate(monday),          startTime: "10:00", endTime: "22:00", note: "Head chef — dinner service" },
    { staffName: "Ben Carter",  role: "waiter",  date: toISODate(addDays(monday,1)), startTime: "11:00", endTime: "19:00" },
    { staffName: "Sara Kim",    role: "cashier", date: toISODate(addDays(monday,1)), startTime: "12:00", endTime: "20:00" },
    { staffName: "Tom Lee",     role: "chef",    date: toISODate(addDays(monday,2)), startTime: "08:00", endTime: "16:00", note: "Prep shift" },
    { staffName: "Diana Pham",  role: "waiter",  date: toISODate(addDays(monday,2)), startTime: "16:00", endTime: "23:00" },
    { staffName: "Alice Wong",  role: "manager", date: toISODate(addDays(monday,3)), startTime: "09:00", endTime: "17:00" },
    { staffName: "Ben Carter",  role: "waiter",  date: toISODate(addDays(monday,4)), startTime: "14:00", endTime: "22:00" },
    { staffName: "Marco Rossi", role: "chef",    date: toISODate(addDays(monday,5)), startTime: "10:00", endTime: "22:00" },
    { staffName: "Diana Pham",  role: "waiter",  date: toISODate(addDays(monday,5)), startTime: "10:00", endTime: "18:00" },
    { staffName: "Sara Kim",    role: "cashier", date: toISODate(addDays(monday,6)), startTime: "12:00", endTime: "20:00" },
  ];
  return seeds.map((s) => ({ ...s, id: uid() }));
}

// -----------------------------------------------------------------------------
// ShiftModal
// -----------------------------------------------------------------------------

interface ModalState {
  mode: "add" | "edit";
  shift?: Shift;
  defaultDate?: string;
}

function ShiftModal({
  state,
  onSave,
  onClose,
}: {
  state: ModalState;
  onSave: (data: Omit<Shift, "id"> & { id?: string }) => void;
  onClose: () => void;
}) {
  const { mode, shift, defaultDate } = state;

  const [form, setForm] = useState({
    staffName: shift?.staffName ?? "",
    role: shift?.role ?? ("waiter" as ShiftRole),
    date: shift?.date ?? defaultDate ?? toISODate(new Date()),
    startTime: shift?.startTime ?? "09:00",
    endTime: shift?.endTime ?? "17:00",
    note: shift?.note ?? "",
  });

  const [error, setError] = useState("");

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.staffName.trim()) { setError("Staff name is required."); return; }
    if (!form.date)             { setError("Date is required."); return; }
    if (form.startTime >= form.endTime && form.endTime !== "00:00") {
      setError("End time must be after start time.");
      return;
    }
    onSave({
      ...(shift ? { id: shift.id } : {}),
      staffName: form.staffName.trim(),
      role: form.role,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      note: form.note.trim() || undefined,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {mode === "add" ? "Add Shift" : "Edit Shift"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Staff Name
            </label>
            <input
              type="text"
              value={form.staffName}
              onChange={(e) => set("staffName", e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Role
            </label>
            <select
              value={form.role}
              onChange={(e) => set("role", e.target.value as ShiftRole)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Date
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Start Time
              </label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => set("startTime", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                End Time
              </label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => set("endTime", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Note{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              placeholder="e.g. Cover for evening rush"
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              {mode === "add" ? "Add Shift" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// ShiftCard
// -----------------------------------------------------------------------------

function ShiftCard({
  shift,
  onEdit,
  onDelete,
}: {
  shift: Shift;
  onEdit: (shift: Shift) => void;
  onDelete: (id: string) => void;
}) {
  const s = ROLE_STYLE[shift.role];
  return (
    <div
      className={`group relative border-l-4 rounded-lg p-2.5 border border-gray-100 shadow-sm ${s.card}`}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-800 truncate leading-tight">
            {shift.staffName}
          </p>
          <span
            className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-1 ${s.badge}`}
          >
            {shift.role}
          </span>
          <p className="flex items-center gap-1 text-[10px] text-gray-500 mt-1">
            <Clock className="w-2.5 h-2.5 flex-shrink-0" />
            {shift.startTime}–{shift.endTime}
          </p>
          {shift.note && (
            <p className="text-[10px] text-gray-400 mt-0.5 truncate">{shift.note}</p>
          )}
        </div>

        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(shift)}
            className="p-1 rounded hover:bg-white/80 text-gray-400 hover:text-blue-600 transition-colors"
            aria-label="Edit shift"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            onClick={() => onDelete(shift.id)}
            className="p-1 rounded hover:bg-white/80 text-gray-400 hover:text-red-600 transition-colors"
            aria-label="Delete shift"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// SchedulePage
// -----------------------------------------------------------------------------

export default function SchedulePage() {
  const { isLoading: authLoading, user } = useAuth();
  const router = useRouter();

  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [modal, setModal] = useState<ModalState | null>(null);

  // Seed on first render once weekStart is stable
  useEffect(() => {
    setShifts(buildSeedShifts(weekStart));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!authLoading && !["admin", "manager"].includes(user?.role ?? "")) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = toISODate(new Date());

  const shiftsForDate = useCallback(
    (date: string) => shifts.filter((s) => s.date === date),
    [shifts],
  );

  const totalThisWeek = weekDays.reduce(
    (sum, d) => sum + shiftsForDate(toISODate(d)).length,
    0,
  );

  function openAdd(defaultDate?: string) {
    setModal({ mode: "add", defaultDate });
  }

  function openEdit(shift: Shift) {
    setModal({ mode: "edit", shift });
  }

  function handleSave(data: Omit<Shift, "id"> & { id?: string }) {
    if (data.id) {
      setShifts((prev) =>
        prev.map((s) => (s.id === data.id ? ({ ...data, id: data.id! } as Shift) : s)),
      );
    } else {
      setShifts((prev) => [...prev, { ...data, id: uid() } as Shift]);
    }
    setModal(null);
  }

  function handleDelete(id: string) {
    setShifts((prev) => prev.filter((s) => s.id !== id));
  }

  const weekLabel = `${displayDate(weekStart)} – ${displayDate(addDays(weekStart, 6))}, ${weekStart.getFullYear()}`;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {modal && (
        <ShiftModal state={modal} onSave={handleSave} onClose={() => setModal(null)} />
      )}

      <div className="max-w-7xl mx-auto">
        {/* ------------------------------------------------------------------ */}
        {/* Header                                                              */}
        {/* ------------------------------------------------------------------ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Work Schedule</h1>
              <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                <Users className="w-3.5 h-3.5" />
                {totalThisWeek} shift{totalThisWeek !== 1 ? "s" : ""} this week
              </p>
            </div>
          </div>

          <button
            onClick={() => openAdd()}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Shift
          </button>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Week navigation                                                     */}
        {/* ------------------------------------------------------------------ */}
        <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 mb-4">
          <button
            onClick={() => setWeekStart((d) => addDays(d, -7))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            Prev
          </button>

          <div className="text-center">
            <p className="text-sm font-semibold text-gray-900">{weekLabel}</p>
            <button
              onClick={() => setWeekStart(getMonday(new Date()))}
              className="text-xs text-blue-600 hover:text-blue-700 mt-0.5"
            >
              Jump to today
            </button>
          </div>

          <button
            onClick={() => setWeekStart((d) => addDays(d, 7))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors font-medium"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Calendar grid                                                       */}
        {/* ------------------------------------------------------------------ */}
        <div className="overflow-x-auto pb-4">
          <div className="grid grid-cols-7 gap-3 min-w-[700px]">
            {weekDays.map((day, i) => {
              const iso = toISODate(day);
              const isToday = iso === today;
              const dayShifts = shiftsForDate(iso);

              return (
                <div key={iso} className="flex flex-col">
                  {/* Day header */}
                  <div
                    className={`flex flex-col items-center py-2.5 rounded-xl mb-2 ${
                      isToday
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-white border border-gray-100 text-gray-700"
                    }`}
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-wide opacity-80">
                      {DAY_SHORT[i]}
                    </span>
                    <span className={`text-xl font-bold leading-tight ${isToday ? "text-white" : "text-gray-900"}`}>
                      {day.getDate()}
                    </span>
                    {dayShifts.length > 0 && (
                      <span
                        className={`text-[10px] mt-0.5 ${
                          isToday ? "text-blue-200" : "text-gray-400"
                        }`}
                      >
                        {dayShifts.length} shift{dayShifts.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {/* Shift cards */}
                  <div className="flex flex-col gap-2 flex-1 min-h-[120px]">
                    {dayShifts.map((shift) => (
                      <ShiftCard
                        key={shift.id}
                        shift={shift}
                        onEdit={openEdit}
                        onDelete={handleDelete}
                      />
                    ))}

                    {/* Add button for this day */}
                    <button
                      onClick={() => openAdd(iso)}
                      className="mt-auto flex items-center justify-center gap-1 w-full py-2 rounded-lg border border-dashed border-gray-200 text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-colors text-xs font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Role legend                                                         */}
        {/* ------------------------------------------------------------------ */}
        <div className="flex flex-wrap gap-3 mt-4">
          {ROLES.map((role) => (
            <div key={role} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${ROLE_STYLE[role].dot}`} />
              <span className="text-xs text-gray-500 capitalize">{role}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
