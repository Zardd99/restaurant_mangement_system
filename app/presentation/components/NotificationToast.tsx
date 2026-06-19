"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  useNotifications,
  OrderNotification,
  NotificationType,
} from "../../contexts/NotificationContext";
import { useSettings } from "../../contexts/SettingsContext";

// ---------------------------------------------------------------------------
// Per-type visual config
// ---------------------------------------------------------------------------

const TYPE_CONFIG: Record<
  NotificationType,
  {
    icon: string;
    label: string;
    borderColor: string;
    iconBg: string;
    labelColor: string;
    progressColor: string;
  }
> = {
  order_created: {
    icon: "🆕",
    label: "New Order",
    borderColor: "border-blue-400",
    iconBg: "bg-blue-100",
    labelColor: "text-blue-700",
    progressColor: "bg-blue-400",
  },
  order_preparing: {
    icon: "👨‍🍳",
    label: "Now Preparing",
    borderColor: "border-amber-400",
    iconBg: "bg-amber-100",
    labelColor: "text-amber-700",
    progressColor: "bg-amber-400",
  },
  order_ready: {
    icon: "✅",
    label: "Ready to Serve",
    borderColor: "border-green-400",
    iconBg: "bg-green-100",
    labelColor: "text-green-700",
    progressColor: "bg-green-400",
  },
  order_served: {
    icon: "🍽️",
    label: "Order Served",
    borderColor: "border-gray-400",
    iconBg: "bg-gray-100",
    labelColor: "text-gray-700",
    progressColor: "bg-gray-400",
  },
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  manager: "Manager",
  chef: "Chef",
  waiter: "Waiter",
  cashier: "Cashier",
  customer: "Customer",
};

const AUTO_DISMISS_MS = 6_000;

// ---------------------------------------------------------------------------
// Single toast card
// ---------------------------------------------------------------------------

function ToastCard({
  notification,
  onDismiss,
}: {
  notification: OrderNotification;
  onDismiss: (id: string) => void;
}) {
  const config = TYPE_CONFIG[notification.type];
  const [visible, setVisible] = useState(false);
  // progress bar width 100 → 0 over AUTO_DISMISS_MS
  const [progress, setProgress] = useState(100);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  // Slide-in on mount
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Animate progress bar with rAF for perfect smoothness
  useEffect(() => {
    const tick = (now: number) => {
      if (!startRef.current) startRef.current = now;
      const elapsed = now - startRef.current;
      const remaining = Math.max(0, 100 - (elapsed / AUTO_DISMISS_MS) * 100);
      setProgress(remaining);
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const timeAgo = (() => {
    const diff = Date.now() - new Date(notification.timestamp).getTime();
    if (diff < 5_000) return "Just now";
    if (diff < 60_000) return `${Math.floor(diff / 1_000)}s ago`;
    return `${Math.floor(diff / 60_000)}m ago`;
  })();

  const roleLabel =
    ROLE_LABELS[notification.actor.role] ?? notification.actor.role;

  return (
    <div
      className={`
        relative flex flex-col w-80 bg-white rounded-xl shadow-lg border-l-4
        overflow-hidden transition-all duration-300 ease-out
        ${config.borderColor}
        ${visible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
      `}
    >
      {/* Main content row */}
      <div className="flex items-start gap-3 p-4 pr-10">
        {/* Icon */}
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg ${config.iconBg}`}
        >
          {config.icon}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${config.labelColor}`}>
            {config.label}
          </p>

          {/* Table + item count */}
          <p className="text-sm text-gray-800 font-medium mt-0.5">
            {notification.tableNumber
              ? `Table ${notification.tableNumber}`
              : notification.customerName ?? "Takeaway / Delivery"}
            {notification.itemCount > 0 && (
              <span className="text-gray-500 font-normal">
                {" · "}
                {notification.itemCount}{" "}
                {notification.itemCount === 1 ? "item" : "items"}
              </span>
            )}
          </p>

          {/* Actor */}
          <p className="text-xs text-gray-500 mt-1 truncate">
            By{" "}
            <span className="font-medium text-gray-700">
              {notification.actor.name}
            </span>
            <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
              {roleLabel}
            </span>
          </p>

          {/* Timestamp */}
          <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo}</p>
        </div>
      </div>

      {/* Dismiss button */}
      <button
        onClick={() => onDismiss(notification.id)}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded"
        aria-label="Dismiss notification"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Auto-dismiss progress bar */}
      <div className="h-1 bg-gray-100">
        <div
          className={`h-full transition-none ${config.progressColor}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Container — portal into document.body
// ---------------------------------------------------------------------------

export default function NotificationToast() {
  const { notifications, dismiss } = useNotifications();
  const { settings } = useSettings();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const visible = notifications.filter(
    (n) => settings.toastsEnabled && settings.toastTypes[n.type],
  );

  if (!mounted || visible.length === 0) return null;

  return createPortal(
    <div
      className="fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-3 pointer-events-none"
      aria-live="polite"
      aria-label="Order notifications"
    >
      {visible.map((n) => (
        <div key={n.id} className="pointer-events-auto">
          <ToastCard notification={n} onDismiss={dismiss} />
        </div>
      ))}
    </div>,
    document.body,
  );
}
