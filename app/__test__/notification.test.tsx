process.env.NEXT_PUBLIC_API_URL = "http://localhost:5000";

import React from "react";
import { render, screen, act, fireEvent } from "@testing-library/react";

// Render portals inline so screen queries work without document.body traversal
jest.mock("react-dom", () => ({
  ...jest.requireActual("react-dom"),
  createPortal: (node: React.ReactNode) => node,
}));

// jsdom does not implement requestAnimationFrame — stub it as a no-op so the
// slide-in and progress-bar animations don't run during tests while the
// underlying DOM nodes are still rendered and queryable.
global.requestAnimationFrame = jest.fn(() => 0) as unknown as typeof requestAnimationFrame;
global.cancelAnimationFrame = jest.fn();

// ---------------------------------------------------------------------------
// Socket mock — captures registered handlers so we can fire events manually
// ---------------------------------------------------------------------------
type Handler = (...args: unknown[]) => void;
const capturedHandlers: Record<string, Handler[]> = {};

const mockSocket = {
  on: jest.fn((event: string, handler: Handler) => {
    capturedHandlers[event] = capturedHandlers[event] ?? [];
    capturedHandlers[event].push(handler);
  }),
  off: jest.fn((event: string, handler: Handler) => {
    if (capturedHandlers[event]) {
      capturedHandlers[event] = capturedHandlers[event].filter(
        (h) => h !== handler,
      );
    }
  }),
  connected: true,
};

jest.mock("../contexts/SocketContext", () => ({
  useSocket: () => ({ socket: mockSocket }),
}));

jest.mock("../contexts/SettingsContext", () => ({
  useSettings: () => ({
    settings: {
      soundEnabled: false,
      toastsEnabled: true,
      toastTypes: {
        order_created:   true,
        order_preparing: true,
        order_ready:     true,
        order_served:    true,
      },
    },
  }),
}));

jest.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    isLoading: false,
    axiosInstance: {
      get: jest.fn().mockResolvedValue({ data: { count: 0 } }),
      patch: jest.fn().mockResolvedValue({}),
    },
  }),
}));

// Import after mocks are registered
import {
  NotificationProvider,
  useNotifications,
  OrderNotification,
} from "../contexts/NotificationContext";
import NotificationToast from "../presentation/components/NotificationToast";

// ---------------------------------------------------------------------------
// Test utilities
// ---------------------------------------------------------------------------

function emitSocketNotification(notification: OrderNotification) {
  act(() => {
    (capturedHandlers["order:notification"] ?? []).forEach((h) =>
      h(notification),
    );
  });
}

function makeNotification(
  overrides: Partial<OrderNotification> = {},
): OrderNotification {
  return {
    id: "notif-1",
    type: "order_created",
    orderId: "order-abc",
    tableNumber: 5,
    customerName: "Alice",
    itemCount: 3,
    actor: { id: "user-1", name: "John Doe", role: "waiter" },
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

// Renders the context and exposes its state via data-testid attributes
function NotificationSpy() {
  const { notifications, dismiss } = useNotifications();
  return (
    <div>
      <span data-testid="count">{notifications.length}</span>
      {notifications.map((n) => (
        <div key={n.id} data-testid={`notif-${n.id}`}>
          <span data-testid={`type-${n.id}`}>{n.type}</span>
          <span data-testid={`actor-${n.id}`}>{n.actor?.name}</span>
          <button
            data-testid={`dismiss-${n.id}`}
            onClick={() => dismiss(n.id)}
          >
            Dismiss
          </button>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// NotificationContext — unit tests for queue management
// ---------------------------------------------------------------------------
describe("NotificationContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(capturedHandlers).forEach((k) => {
      delete capturedHandlers[k];
    });
    // Fake timers for setTimeout (auto-dismiss), but keep RAF as our global stub
    jest.useFakeTimers({
      doNotFake: ["requestAnimationFrame", "cancelAnimationFrame"],
    });
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it("starts with an empty notification list", () => {
    render(
      <NotificationProvider>
        <NotificationSpy />
      </NotificationProvider>,
    );
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  it('registers a listener for "order:notification" on mount', () => {
    render(
      <NotificationProvider>
        <NotificationSpy />
      </NotificationProvider>,
    );
    expect(mockSocket.on).toHaveBeenCalledWith(
      "order:notification",
      expect.any(Function),
    );
  });

  it('unregisters the listener for "order:notification" on unmount', () => {
    const { unmount } = render(
      <NotificationProvider>
        <NotificationSpy />
      </NotificationProvider>,
    );
    unmount();
    expect(mockSocket.off).toHaveBeenCalledWith(
      "order:notification",
      expect.any(Function),
    );
  });

  it("enqueues a notification when the socket event fires", () => {
    render(
      <NotificationProvider>
        <NotificationSpy />
      </NotificationProvider>,
    );
    emitSocketNotification(makeNotification());

    expect(screen.getByTestId("count")).toHaveTextContent("1");
    expect(screen.getByTestId("type-notif-1")).toHaveTextContent(
      "order_created",
    );
    expect(screen.getByTestId("actor-notif-1")).toHaveTextContent("John Doe");
  });

  it("ignores a duplicate notification with the same id", () => {
    render(
      <NotificationProvider>
        <NotificationSpy />
      </NotificationProvider>,
    );
    const n = makeNotification({ id: "dup" });
    emitSocketNotification(n);
    emitSocketNotification(n);

    expect(screen.getByTestId("count")).toHaveTextContent("1");
  });

  it("places the newest notification first", () => {
    render(
      <NotificationProvider>
        <NotificationSpy />
      </NotificationProvider>,
    );
    emitSocketNotification(makeNotification({ id: "old" }));
    emitSocketNotification(makeNotification({ id: "new" }));

    const cards = document.querySelectorAll("[data-testid^='notif-']");
    expect(cards[0].getAttribute("data-testid")).toBe("notif-new");
    expect(cards[1].getAttribute("data-testid")).toBe("notif-old");
  });

  it("caps the visible queue at 5 notifications", () => {
    render(
      <NotificationProvider>
        <NotificationSpy />
      </NotificationProvider>,
    );
    for (let i = 1; i <= 7; i++) {
      emitSocketNotification(makeNotification({ id: `n${i}` }));
    }
    expect(screen.getByTestId("count")).toHaveTextContent("5");
  });

  it("auto-dismisses a notification after 6 seconds", () => {
    render(
      <NotificationProvider>
        <NotificationSpy />
      </NotificationProvider>,
    );
    emitSocketNotification(makeNotification({ id: "auto" }));
    expect(screen.getByTestId("count")).toHaveTextContent("1");

    act(() => {
      jest.advanceTimersByTime(6_001);
    });

    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  it("does not dismiss before 6 seconds have fully elapsed", () => {
    render(
      <NotificationProvider>
        <NotificationSpy />
      </NotificationProvider>,
    );
    emitSocketNotification(makeNotification({ id: "hold" }));

    act(() => {
      jest.advanceTimersByTime(5_000);
    });

    expect(screen.getByTestId("count")).toHaveTextContent("1");
  });

  it("dismiss() removes the specific notification immediately", () => {
    render(
      <NotificationProvider>
        <NotificationSpy />
      </NotificationProvider>,
    );
    emitSocketNotification(makeNotification({ id: "manual" }));
    expect(screen.getByTestId("count")).toHaveTextContent("1");

    fireEvent.click(screen.getByTestId("dismiss-manual"));

    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  it("dismiss() cancels the auto-dismiss timer so no double-update fires", () => {
    render(
      <NotificationProvider>
        <NotificationSpy />
      </NotificationProvider>,
    );
    emitSocketNotification(makeNotification({ id: "cancelled-timer" }));
    fireEvent.click(screen.getByTestId("dismiss-cancelled-timer"));

    // Advancing past the original timeout should not throw or change anything
    act(() => {
      jest.advanceTimersByTime(7_000);
    });

    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  it("multiple different notification types are all enqueued", () => {
    render(
      <NotificationProvider>
        <NotificationSpy />
      </NotificationProvider>,
    );
    const types: OrderNotification["type"][] = [
      "order_created",
      "order_preparing",
      "order_ready",
      "order_served",
    ];
    types.forEach((type, i) =>
      emitSocketNotification(makeNotification({ id: `t${i}`, type })),
    );

    expect(screen.getByTestId("count")).toHaveTextContent("4");
    types.forEach((type, i) => {
      expect(screen.getByTestId(`type-t${i}`)).toHaveTextContent(type);
    });
  });

});

// ---------------------------------------------------------------------------
// NotificationToast — component rendering tests
// ---------------------------------------------------------------------------
describe("NotificationToast", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(capturedHandlers).forEach((k) => {
      delete capturedHandlers[k];
    });
    jest.useFakeTimers({
      doNotFake: ["requestAnimationFrame", "cancelAnimationFrame"],
    });
  });

  afterEach(() => {
    // Flush pending timers inside act so state updates (auto-dismiss) don't
    // trigger "not wrapped in act" warnings between tests.
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  function renderToast() {
    return render(
      <NotificationProvider>
        <NotificationToast />
      </NotificationProvider>,
    );
  }

  // ---- Empty state ------------------------------------------------------- //

  it("renders nothing when there are no notifications", () => {
    renderToast();
    expect(screen.queryByText("New Order")).not.toBeInTheDocument();
    expect(screen.queryByText("Now Preparing")).not.toBeInTheDocument();
    expect(screen.queryByText("Ready to Serve")).not.toBeInTheDocument();
    expect(screen.queryByText("Order Served")).not.toBeInTheDocument();
  });

  // ---- Type labels ------------------------------------------------------- //

  it.each([
    ["order_created" as const, "New Order"],
    ["order_preparing" as const, "Now Preparing"],
    ["order_ready" as const, "Ready to Serve"],
    ["order_served" as const, "Order Served"],
  ])('shows "%s" label for %s notification', (type, expectedLabel) => {
    renderToast();
    emitSocketNotification(makeNotification({ id: type, type }));
    expect(screen.getByText(expectedLabel)).toBeInTheDocument();
  });

  // ---- Location display -------------------------------------------------- //

  it("shows the table number when present", () => {
    renderToast();
    emitSocketNotification(makeNotification({ tableNumber: 12 }));
    expect(screen.getByText(/Table 12/)).toBeInTheDocument();
  });

  it("shows the customer name when there is no table number", () => {
    renderToast();
    emitSocketNotification(
      makeNotification({ tableNumber: undefined, customerName: "Charlie" }),
    );
    expect(screen.getByText(/Charlie/)).toBeInTheDocument();
  });

  it('falls back to "Takeaway / Delivery" when neither table nor customer name', () => {
    renderToast();
    emitSocketNotification(
      makeNotification({ tableNumber: undefined, customerName: undefined }),
    );
    expect(screen.getByText(/Takeaway \/ Delivery/)).toBeInTheDocument();
  });

  // ---- Item count -------------------------------------------------------- //

  it('shows item count with plural "items"', () => {
    renderToast();
    emitSocketNotification(makeNotification({ itemCount: 4 }));
    expect(screen.getByText(/4 items/)).toBeInTheDocument();
  });

  it('uses singular "item" when itemCount is 1', () => {
    renderToast();
    emitSocketNotification(makeNotification({ itemCount: 1 }));
    expect(screen.getByText(/· 1 item$/)).toBeInTheDocument();
    expect(screen.queryByText(/1 items/)).not.toBeInTheDocument();
  });

  // ---- Actor info -------------------------------------------------------- //

  it("displays the actor name", () => {
    renderToast();
    emitSocketNotification(
      makeNotification({
        actor: { id: "u1", name: "Chef Marco", role: "chef" },
      }),
    );
    expect(screen.getByText("Chef Marco")).toBeInTheDocument();
  });

  it.each([
    ["admin", "Admin"],
    ["manager", "Manager"],
    ["chef", "Chef"],
    ["waiter", "Waiter"],
    ["cashier", "Cashier"],
    ["customer", "Customer"],
  ])('shows "%s" role badge for role "%s"', (role, expectedLabel) => {
    renderToast();
    emitSocketNotification(
      makeNotification({
        id: `role-${role}`,
        actor: { id: "u", name: "Test User", role },
      }),
    );
    expect(screen.getByText(expectedLabel)).toBeInTheDocument();
  });

  // ---- Timestamp --------------------------------------------------------- //

  it('shows "Just now" for a freshly created notification', () => {
    renderToast();
    emitSocketNotification(
      makeNotification({ timestamp: new Date().toISOString() }),
    );
    expect(screen.getByText("Just now")).toBeInTheDocument();
  });

  // ---- Multi-toast ------------------------------------------------------- //

  it("renders a card for each notification in the queue", () => {
    renderToast();
    emitSocketNotification(makeNotification({ id: "a", type: "order_created" }));
    emitSocketNotification(makeNotification({ id: "b", type: "order_ready" }));

    expect(screen.getByText("New Order")).toBeInTheDocument();
    expect(screen.getByText("Ready to Serve")).toBeInTheDocument();
  });

  // ---- Dismiss ----------------------------------------------------------- //

  it("clicking the dismiss button removes that toast", () => {
    renderToast();
    emitSocketNotification(makeNotification({ id: "dismiss-me" }));
    expect(screen.getByText("New Order")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /dismiss notification/i }),
    );

    expect(screen.queryByText("New Order")).not.toBeInTheDocument();
  });

  it("only removes the dismissed toast, leaving others intact", () => {
    renderToast();
    emitSocketNotification(makeNotification({ id: "keep", type: "order_ready" }));
    emitSocketNotification(makeNotification({ id: "remove", type: "order_created" }));

    // Two toasts are rendered — one dismiss button each; click the first
    // (newest-first order means "New Order" button is first in the DOM)
    const buttons = screen.getAllByRole("button", { name: /dismiss notification/i });
    fireEvent.click(buttons[0]);

    expect(screen.queryByText("New Order")).not.toBeInTheDocument();
    expect(screen.getByText("Ready to Serve")).toBeInTheDocument();
  });

  // ---- Auto-dismiss ------------------------------------------------------ //

  it("toasts disappear after the 6-second auto-dismiss window", () => {
    renderToast();
    emitSocketNotification(makeNotification({ id: "fade" }));
    expect(screen.getByText("New Order")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(6_001);
    });

    expect(screen.queryByText("New Order")).not.toBeInTheDocument();
  });

  it("does not hide the toast before 6 seconds have elapsed", () => {
    renderToast();
    emitSocketNotification(makeNotification({ id: "stay" }));

    act(() => {
      jest.advanceTimersByTime(5_000);
    });

    expect(screen.getByText("New Order")).toBeInTheDocument();
  });
});
