"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Sun, Moon, Monitor, Bell, BellOff, Volume2, VolumeX,
  Trash2, ChefHat, RefreshCw, LayoutGrid, AlertTriangle,
  RotateCcw, Shield, Eye, EyeOff,
} from "lucide-react";
import { useSettings, Theme, AppSettings } from "../contexts/SettingsContext";
import { useAuth } from "../contexts/AuthContext";

// ---------------------------------------------------------------------------
// Reusable primitives
// ---------------------------------------------------------------------------

function Section({ title, description, children }: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
        {description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Toggle({ label, description, checked, onChange }: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</p>
        {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
          checked ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-600"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function Divider() {
  return <hr className="border-gray-100 dark:border-gray-700" />;
}

// ---------------------------------------------------------------------------
// Theme picker
// ---------------------------------------------------------------------------

const THEMES: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: "light", label: "Light", icon: <Sun className="w-4 h-4" /> },
  { value: "dark",  label: "Dark",  icon: <Moon className="w-4 h-4" /> },
  { value: "system", label: "System", icon: <Monitor className="w-4 h-4" /> },
];

function ThemePicker({ value, onChange }: { value: Theme; onChange: (t: Theme) => void }) {
  return (
    <div className="flex gap-2">
      {THEMES.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium border transition-all ${
            value === t.value
              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
              : "bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
          }`}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delete account modal
// ---------------------------------------------------------------------------

function DeleteAccountModal({ onClose }: { onClose: () => void }) {
  const { axiosInstance, logout } = useAuth();
  const router = useRouter();

  const [password, setPassword]     = useState("");
  const [confirm, setConfirm]       = useState("");
  const [showPw, setShowPw]         = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  const CONFIRM_PHRASE = "DELETE MY ACCOUNT";
  const ready = confirm === CONFIRM_PHRASE && password.length >= 6;

  const handleDelete = async () => {
    if (!ready) return;
    setLoading(true);
    setError("");
    try {
      await axiosInstance.delete("/api/auth/account", { data: { password } });
      logout();
      router.push("/login");
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to delete account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Delete Account</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">This action cannot be undone</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">
          All your data will be permanently removed. To confirm, enter your password and type{" "}
          <span className="font-mono font-semibold text-red-600 select-all">{CONFIRM_PHRASE}</span> below.
        </p>

        <div className="space-y-3">
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <button
              type="button"
              onClick={() => setShowPw((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <input
            type="text"
            placeholder={`Type "${CONFIRM_PHRASE}"`}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 font-mono"
          />
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={!ready || loading}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const { settings, updateSetting, updateToastType, resetSettings } = useSettings();
  const { user } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [resetConfirm, setResetConfirm]       = useState(false);

  const handleReset = useCallback(() => {
    if (!resetConfirm) { setResetConfirm(true); return; }
    resetSettings();
    setResetConfirm(false);
  }, [resetConfirm, resetSettings]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors duration-200">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Header */}
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Preferences are saved locally on this device.
          </p>
        </div>

        {/* Appearance */}
        <Section title="Appearance" description="Choose how the interface looks on this device.">
          <ThemePicker
            value={settings.theme}
            onChange={(t) => updateSetting("theme", t)}
          />
          <Divider />
          <Toggle
            label="Compact cards"
            description="Reduce padding on order cards for denser layouts"
            checked={settings.compactCards}
            onChange={(v) => updateSetting("compactCards", v)}
          />
        </Section>

        {/* Notifications */}
        <Section title="Notifications" description="Control which alerts appear as pop-up toasts.">
          <Toggle
            label="Enable toast notifications"
            description="Show live order alerts in the bottom-right corner"
            checked={settings.toastsEnabled}
            onChange={(v) => updateSetting("toastsEnabled", v)}
          />

          {settings.toastsEnabled && (
            <>
              <Divider />
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Show toasts for
              </p>
              {(
                [
                  { key: "order_created",   label: "New Orders",     icon: <Bell className="w-4 h-4 text-blue-500" /> },
                  { key: "order_preparing", label: "Now Preparing",  icon: <ChefHat className="w-4 h-4 text-amber-500" /> },
                  { key: "order_ready",     label: "Ready to Serve", icon: <Bell className="w-4 h-4 text-green-500" /> },
                  { key: "order_served",    label: "Order Served",   icon: <BellOff className="w-4 h-4 text-gray-400" /> },
                ] as const
              ).map(({ key, label, icon }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {icon}
                    <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                  </div>
                  <button
                    role="switch"
                    aria-checked={settings.toastTypes[key]}
                    aria-label={label}
                    onClick={() => updateToastType(key, !settings.toastTypes[key])}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                      settings.toastTypes[key] ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-600"
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 ${settings.toastTypes[key] ? "translate-x-4" : "translate-x-0"}`} />
                  </button>
                </div>
              ))}
            </>
          )}

          <Divider />
          <Toggle
            label="Sound alerts"
            description="Play a soft chime when a new order arrives"
            checked={settings.soundEnabled}
            onChange={(v) => updateSetting("soundEnabled", v)}
          />
        </Section>

        {/* Kitchen Display */}
        <Section title="Kitchen Display" description="Defaults applied when opening the kitchen order board.">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Default order filter
            </label>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { value: "all",        label: "All" },
                  { value: "pending",    label: "Pending" },
                  { value: "confirmed",  label: "Confirmed" },
                  { value: "preparing",  label: "Preparing" },
                  { value: "ready",      label: "Ready" },
                ] as const
              ).map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => updateSetting("kitchenDefaultFilter", value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    settings.kitchenDefaultFilter === value
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <Divider />

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Auto-refresh interval
            </label>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { value: 0,   label: "Off" },
                  { value: 30,  label: "30s" },
                  { value: 60,  label: "1 min" },
                  { value: 120, label: "2 min" },
                ] as const
              ).map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => updateSetting("kitchenAutoRefreshSeconds", value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    settings.kitchenAutoRefreshSeconds === value
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Automatically re-fetch orders on the kitchen display. WebSocket updates are always live regardless of this setting.
            </p>
          </div>
        </Section>

        {/* Account */}
        <Section title="Account" description={`Signed in as ${user?.name ?? "—"} (${user?.role ?? "—"})`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Email</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email ?? "—"}</p>
              </div>
            </div>
          </div>

          <Divider />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Delete account</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Permanently remove your account and all associated data
              </p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </Section>

        {/* Reset */}
        <div className="flex justify-end pb-8">
          <button
            onClick={handleReset}
            onBlur={() => setResetConfirm(false)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              resetConfirm
                ? "bg-orange-600 text-white"
                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            {resetConfirm ? "Click again to confirm reset" : "Reset all settings"}
          </button>
        </div>
      </div>

      {showDeleteModal && (
        <DeleteAccountModal onClose={() => setShowDeleteModal(false)} />
      )}
    </div>
  );
}
