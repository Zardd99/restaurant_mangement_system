"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useSocket } from "./SocketContext";

// ---------------------------------------------------------------------------
// Shared type — re-export so the toast component imports from one place
// ---------------------------------------------------------------------------

export type NotificationType =
  | "order_created"
  | "order_preparing"
  | "order_ready"
  | "order_served";

export interface OrderNotification {
  /** Unique id — used as React key and for dismissal */
  id: string;
  type: NotificationType;
  orderId: string;
  tableNumber?: number;
  customerName?: string;
  itemCount: number;
  actor: { id: string; name: string; role: string };
  /** ISO timestamp from the server */
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface NotificationContextType {
  notifications: OrderNotification[];
  history: OrderNotification[];
  dismiss: (id: string) => void;
  clearHistory: () => void;
}

const MAX_HISTORY = 100;

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  history: [],
  dismiss: () => {},
  clearHistory: () => {},
});

export const useNotifications = () => useContext(NotificationContext);

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_VISIBLE = 5;
const AUTO_DISMISS_MS = 6_000;

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [history, setHistory] = useState<OrderNotification[]>([]);
  const { socket } = useSocket();

  // Keep a ref to timers so we can cancel on unmount
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const enqueue = useCallback(
    (notification: OrderNotification) => {
      setNotifications((prev) => {
        if (prev.some((n) => n.id === notification.id)) return prev;
        return [notification, ...prev].slice(0, MAX_VISIBLE);
      });

      setHistory((prev) => {
        if (prev.some((n) => n.id === notification.id)) return prev;
        return [notification, ...prev].slice(0, MAX_HISTORY);
      });

      const timer = setTimeout(() => dismiss(notification.id), AUTO_DISMISS_MS);
      timers.current.set(notification.id, timer);
    },
    [dismiss],
  );

  useEffect(() => {
    if (!socket) return;

    socket.on("order:notification", enqueue);

    return () => {
      socket.off("order:notification", enqueue);
    };
  }, [socket, enqueue]);

  // Clean up all timers on unmount
  useEffect(() => {
    const t = timers.current;
    return () => {
      t.forEach((timer) => clearTimeout(timer));
      t.clear();
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, history, dismiss, clearHistory }}>
      {children}
    </NotificationContext.Provider>
  );
};
