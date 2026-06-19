process.env.NEXT_PUBLIC_API_URL = "http://localhost:5000";

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { OrderNotification } from "../contexts/NotificationContext";

// ---------------------------------------------------------------------------
// Mock useNotifications — the page is a pure consumer, no socket needed
// ---------------------------------------------------------------------------

const mockClearHistory = jest.fn();
let mockHistory: OrderNotification[] = [];

jest.mock("../contexts/NotificationContext", () => ({
  useNotifications: () => ({
    history: mockHistory,
    clearHistory: mockClearHistory,
  }),
  // Re-export the type constant so the page import doesn't break
  NotificationType: {},
}));

// Import after mocks
import NotificationsPage from "../notifications/page";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeNotification(
  overrides: Partial<OrderNotification> = {},
): OrderNotification {
  return {
    id: "n1",
    type: "order_created",
    orderId: "order-abc",
    tableNumber: 5,
    customerName: "Alice",
    itemCount: 3,
    actor: { id: "u1", name: "John Doe", role: "waiter" },
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

function renderPage() {
  return render(<NotificationsPage />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("NotificationsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHistory = [];
  });

  // ---- Empty state -------------------------------------------------------- //

  it("shows the empty state when there are no notifications", () => {
    renderPage();
    expect(screen.getByText("No notifications yet")).toBeInTheDocument();
    expect(
      screen.getByText(/Order events will appear here in real time/),
    ).toBeInTheDocument();
  });

  it("does not render a 'Clear all' button when history is empty", () => {
    renderPage();
    expect(
      screen.queryByRole("button", { name: /clear all/i }),
    ).not.toBeInTheDocument();
  });

  it("shows the total count in the header subtitle", () => {
    mockHistory = [makeNotification({ id: "a" }), makeNotification({ id: "b" })];
    renderPage();
    expect(screen.getByText("2 total received this session")).toBeInTheDocument();
  });

  // ---- Notification cards ------------------------------------------------- //

  it("renders a card for each history entry", () => {
    mockHistory = [
      makeNotification({ id: "c1", type: "order_created" }),
      makeNotification({ id: "c2", type: "order_ready" }),
    ];
    renderPage();
    expect(screen.getByText("New Order")).toBeInTheDocument();
    expect(screen.getByText("Ready to Serve")).toBeInTheDocument();
  });

  it("shows table number on the card", () => {
    mockHistory = [makeNotification({ tableNumber: 7 })];
    renderPage();
    expect(screen.getByText(/Table 7/)).toBeInTheDocument();
  });

  it("shows customer name when there is no table number", () => {
    mockHistory = [
      makeNotification({ tableNumber: undefined, customerName: "Maria" }),
    ];
    renderPage();
    expect(screen.getByText(/Maria/)).toBeInTheDocument();
  });

  it('falls back to "Takeaway / Delivery" when no table or customer', () => {
    mockHistory = [
      makeNotification({ tableNumber: undefined, customerName: undefined }),
    ];
    renderPage();
    expect(screen.getByText(/Takeaway \/ Delivery/)).toBeInTheDocument();
  });

  it("shows item count with plural label", () => {
    mockHistory = [makeNotification({ itemCount: 4 })];
    renderPage();
    expect(screen.getByText(/4 items/)).toBeInTheDocument();
  });

  it('uses singular "item" when itemCount is 1', () => {
    mockHistory = [makeNotification({ itemCount: 1 })];
    renderPage();
    expect(screen.getByText(/· 1 item/)).toBeInTheDocument();
    expect(screen.queryByText(/1 items/)).not.toBeInTheDocument();
  });

  it("shows the actor name and role badge on the card", () => {
    mockHistory = [
      makeNotification({
        actor: { id: "u2", name: "Chef Marco", role: "chef" },
      }),
    ];
    renderPage();
    expect(screen.getByText("Chef Marco")).toBeInTheDocument();
    expect(screen.getByText("Chef")).toBeInTheDocument();
  });

  // ---- Type labels on cards ---------------------------------------------- //

  it.each([
    ["order_created" as const, "New Order"],
    ["order_preparing" as const, "Now Preparing"],
    ["order_ready" as const, "Ready to Serve"],
    ["order_served" as const, "Order Served"],
  ])('card label is "%s" for type %s', (type, label) => {
    mockHistory = [makeNotification({ id: type, type })];
    renderPage();
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  // ---- Clear all ---------------------------------------------------------- //

  it("shows 'Clear all' button when history has entries", () => {
    mockHistory = [makeNotification()];
    renderPage();
    expect(
      screen.getByRole("button", { name: /clear all/i }),
    ).toBeInTheDocument();
  });

  it("calls clearHistory when 'Clear all' is clicked", () => {
    mockHistory = [makeNotification()];
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /clear all/i }));
    expect(mockClearHistory).toHaveBeenCalledTimes(1);
  });

  // ---- Filter tabs -------------------------------------------------------- //

  it("renders all five filter tabs", () => {
    renderPage();
    expect(screen.getByRole("button", { name: /^All/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /New Orders/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Preparing/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ready/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Served/i })).toBeInTheDocument();
  });

  it("filters to only order_created when 'New Orders' tab is active", () => {
    mockHistory = [
      makeNotification({ id: "x1", type: "order_created" }),
      makeNotification({ id: "x2", type: "order_ready" }),
    ];
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /New Orders/i }));

    expect(screen.getByText("New Order")).toBeInTheDocument();
    expect(screen.queryByText("Ready to Serve")).not.toBeInTheDocument();
  });

  it("filters to only order_ready when 'Ready' tab is active", () => {
    mockHistory = [
      makeNotification({ id: "y1", type: "order_created" }),
      makeNotification({ id: "y2", type: "order_ready" }),
    ];
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /^Ready/i }));

    expect(screen.getByText("Ready to Serve")).toBeInTheDocument();
    expect(screen.queryByText("New Order")).not.toBeInTheDocument();
  });

  it("shows all entries when 'All' tab is selected after a filter", () => {
    mockHistory = [
      makeNotification({ id: "z1", type: "order_created" }),
      makeNotification({ id: "z2", type: "order_served" }),
    ];
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /Served/i }));
    fireEvent.click(screen.getByRole("button", { name: /^All/i }));

    expect(screen.getByText("New Order")).toBeInTheDocument();
    expect(screen.getByText("Order Served")).toBeInTheDocument();
  });

  it("shows the empty state when the active filter has no matches", () => {
    mockHistory = [makeNotification({ type: "order_created" })];
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /Served/i }));

    expect(screen.getByText("No notifications yet")).toBeInTheDocument();
  });

  it("tab count badges reflect the number of notifications for that type", () => {
    mockHistory = [
      makeNotification({ id: "b1", type: "order_created" }),
      makeNotification({ id: "b2", type: "order_created" }),
      makeNotification({ id: "b3", type: "order_ready" }),
    ];
    renderPage();

    // The "All" tab badge should show 3; "New Orders" should show 2
    const allBtn = screen.getByRole("button", { name: /^All/i });
    const newOrdersBtn = screen.getByRole("button", { name: /New Orders/i });

    expect(allBtn).toHaveTextContent("3");
    expect(newOrdersBtn).toHaveTextContent("2");
  });
});
