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

export type NotificationType =
  | "order_created"
  | "order_preparing"
  | "order_ready"
  | "order_served";

export interface OrderNotification {
  id: string;
  type: NotificationType;
  orderId: string;
  tableNumber?: number;
  customerName?: string;
  itemCount: number;
  actor: { id: string; name: string; role: string };
  timestamp: string;
}

interface NotificationContextType {
  notifications: OrderNotification[];
  dismiss: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  dismiss: () => {},
});

export const useNotifications = () => useContext(NotificationContext);

const MAX_VISIBLE = 5;
const AUTO_DISMISS_MS = 6_000;

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const { socket } = useSocket();
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const enqueue = useCallback(
    (notification: OrderNotification) => {
      setNotifications((prev) => {
        if (prev.some((n) => n.id === notification.id)) return prev;
        return [notification, ...prev].slice(0, MAX_VISIBLE);
      });

      const timer = setTimeout(() => dismiss(notification.id), AUTO_DISMISS_MS);
      timers.current.set(notification.id, timer);
    },
    [dismiss],
  );

  useEffect(() => {
    if (!socket) return;
    socket.on("order:notification", enqueue);
    return () => { socket.off("order:notification", enqueue); };
  }, [socket, enqueue]);

  useEffect(() => {
    const t = timers.current;
    return () => {
      t.forEach((timer) => clearTimeout(timer));
      t.clear();
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, dismiss }}>
      {children}
    </NotificationContext.Provider>
  );
};
