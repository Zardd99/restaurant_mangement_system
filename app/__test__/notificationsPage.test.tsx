process.env.NEXT_PUBLIC_API_URL = "http://localhost:5000";

import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { OrderNotification } from "../contexts/NotificationContext";

// ---------------------------------------------------------------------------
// Mock useAuth — provides a controllable axiosInstance
// ---------------------------------------------------------------------------

const mockGet    = jest.fn();
const mockDelete = jest.fn();

jest.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({
    axiosInstance: { get: mockGet, delete: mockDelete },
    isLoading: false,
  }),
}));

import NotificationsPage from "../notifications/page";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type NotifRecord = OrderNotification & { _id: string; read: boolean };

function makeRecord(overrides: Partial<NotifRecord> = {}): NotifRecord {
  return {
    _id:          overrides._id ?? "mongo-1",
    id:           overrides.id  ?? "notif-1",
    type:         "order_created",
    orderId:      "order-abc",
    tableNumber:  5,
    customerName: "Alice",
    itemCount:    3,
    actor:        { id: "u1", name: "John Doe", role: "waiter" },
    timestamp:    new Date().toISOString(),
    read:         false,
    ...overrides,
  };
}

function mockApiResponse(
  records: NotifRecord[],
  total = records.length,
  page = 1,
  totalPages = 1,
) {
  mockGet.mockResolvedValue({ data: { data: records, total, page, totalPages, limit: 20 } });
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
  });

  // ---- Initial load ------------------------------------------------------- //

  it("shows loading skeletons while the first fetch is in flight", () => {
    mockGet.mockReturnValue(new Promise(() => {})); // never resolves
    renderPage();
    expect(document.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("shows the empty state when the API returns no records", async () => {
    mockApiResponse([]);
    renderPage();
    await waitFor(() =>
      expect(screen.getByText("No notifications yet")).toBeInTheDocument(),
    );
  });

  it("shows total count from the API in the header", async () => {
    mockApiResponse([makeRecord()], 42);
    renderPage();
    await waitFor(() =>
      expect(screen.getByText("42 total in database")).toBeInTheDocument(),
    );
  });

  // ---- Notification cards ------------------------------------------------- //

  it("renders a row for each returned record", async () => {
    mockApiResponse([
      makeRecord({ _id: "a", type: "order_created" }),
      makeRecord({ _id: "b", type: "order_ready" }),
    ]);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("New Order")).toBeInTheDocument();
      expect(screen.getByText("Ready to Serve")).toBeInTheDocument();
    });
  });

  it.each([
    ["order_created"   as const, "New Order"],
    ["order_preparing" as const, "Now Preparing"],
    ["order_ready"     as const, "Ready to Serve"],
    ["order_served"    as const, "Order Served"],
  ])("renders correct label for type %s", async (type, label) => {
    mockApiResponse([makeRecord({ _id: type, type })]);
    renderPage();
    await waitFor(() => expect(screen.getByText(label)).toBeInTheDocument());
  });

  it("shows table number on the card", async () => {
    mockApiResponse([makeRecord({ tableNumber: 7 })]);
    renderPage();
    await waitFor(() => expect(screen.getByText(/Table 7/)).toBeInTheDocument());
  });

  it("shows customer name when no table number", async () => {
    mockApiResponse([makeRecord({ tableNumber: undefined, customerName: "Maria" })]);
    renderPage();
    await waitFor(() => expect(screen.getByText(/Maria/)).toBeInTheDocument());
  });

  it('falls back to "Takeaway / Delivery"', async () => {
    mockApiResponse([makeRecord({ tableNumber: undefined, customerName: undefined })]);
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/Takeaway \/ Delivery/)).toBeInTheDocument(),
    );
  });

  it("shows item count with plural label", async () => {
    mockApiResponse([makeRecord({ itemCount: 4 })]);
    renderPage();
    await waitFor(() => expect(screen.getByText(/4 items/)).toBeInTheDocument());
  });

  it('uses singular "item" when itemCount is 1', async () => {
    mockApiResponse([makeRecord({ itemCount: 1 })]);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/· 1 item/)).toBeInTheDocument();
      expect(screen.queryByText(/1 items/)).not.toBeInTheDocument();
    });
  });

  it("shows actor name and role badge", async () => {
    mockApiResponse([makeRecord({ actor: { id: "u2", name: "Chef Marco", role: "chef" } })]);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("Chef Marco")).toBeInTheDocument();
      expect(screen.getByText("Chef")).toBeInTheDocument();
    });
  });

  it("shows an unread dot for unread notifications", async () => {
    mockApiResponse([makeRecord({ read: false })]);
    renderPage();
    await waitFor(() =>
      expect(document.querySelector('[title="Unread"]')).toBeInTheDocument(),
    );
  });

  it("does not show unread dot for read notifications", async () => {
    mockApiResponse([makeRecord({ read: true })]);
    renderPage();
    await waitFor(() => expect(screen.getByText("New Order")).toBeInTheDocument());
    expect(document.querySelector('[title="Unread"]')).not.toBeInTheDocument();
  });

  // ---- Error state -------------------------------------------------------- //

  it("shows an error message when the fetch fails", async () => {
    mockGet.mockRejectedValue(new Error("Network error"));
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/Failed to load notifications/)).toBeInTheDocument(),
    );
  });

  // ---- Refresh ------------------------------------------------------------ //

  it("re-fetches when the refresh button is clicked", async () => {
    mockApiResponse([makeRecord()]);
    renderPage();
    await waitFor(() => expect(screen.getByText("New Order")).toBeInTheDocument());

    mockApiResponse([]);
    fireEvent.click(screen.getByTitle("Refresh"));
    await waitFor(() =>
      expect(screen.getByText("No notifications yet")).toBeInTheDocument(),
    );
  });

  // ---- Filter tabs -------------------------------------------------------- //

  it("renders all five filter tabs", async () => {
    mockApiResponse([]);
    renderPage();
    await waitFor(() => expect(screen.getByText("No notifications yet")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /^All/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /New Orders/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Preparing/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Ready/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Served/i })).toBeInTheDocument();
  });

  it("re-fetches with type param when a filter tab is clicked", async () => {
    mockApiResponse([]);
    renderPage();
    await waitFor(() => expect(screen.getByText("No notifications yet")).toBeInTheDocument());

    mockApiResponse([]);
    fireEvent.click(screen.getByRole("button", { name: /New Orders/i }));

    await waitFor(() => {
      const lastCall = mockGet.mock.calls[mockGet.mock.calls.length - 1][0] as string;
      expect(lastCall).toContain("type=order_created");
    });
  });

  // ---- Load more ---------------------------------------------------------- //

  it("shows 'Load more' button when more pages exist", async () => {
    mockApiResponse([makeRecord()], 40, 1, 2);
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Load more/i })).toBeInTheDocument(),
    );
  });

  it("appends next page records when 'Load more' is clicked", async () => {
    mockApiResponse([makeRecord({ _id: "p1", type: "order_created" })], 2, 1, 2);
    renderPage();
    await waitFor(() => expect(screen.getByText("New Order")).toBeInTheDocument());

    mockGet.mockResolvedValue({
      data: {
        data: [makeRecord({ _id: "p2", type: "order_ready" })],
        total: 2, page: 2, totalPages: 2, limit: 20,
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /Load more/i }));
    await waitFor(() => expect(screen.getByText("Ready to Serve")).toBeInTheDocument());
    expect(screen.getByText("New Order")).toBeInTheDocument();
  });

  it("hides 'Load more' when on the last page", async () => {
    mockApiResponse([makeRecord()], 1, 1, 1);
    renderPage();
    await waitFor(() => expect(screen.getByText("New Order")).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: /Load more/i })).not.toBeInTheDocument();
  });

  // ---- Clear all ---------------------------------------------------------- //

  it("hides 'Clear all' when there are no notifications", async () => {
    mockApiResponse([]);
    renderPage();
    await waitFor(() => expect(screen.getByText("No notifications yet")).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: /clear all/i })).not.toBeInTheDocument();
  });

  it("shows 'Clear all' when notifications exist", async () => {
    mockApiResponse([makeRecord()], 1);
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /clear all/i })).toBeInTheDocument(),
    );
  });

  it("calls DELETE and empties the list when 'Clear all' is clicked", async () => {
    mockApiResponse([makeRecord()], 1);
    mockDelete.mockResolvedValue({});
    renderPage();
    await waitFor(() => expect(screen.getByText("New Order")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /clear all/i }));
    await waitFor(() =>
      expect(screen.getByText("No notifications yet")).toBeInTheDocument(),
    );
    expect(mockDelete).toHaveBeenCalledWith("/api/notifications");
  });

  it("shows an error when clear all fails", async () => {
    mockApiResponse([makeRecord()], 1);
    mockDelete.mockRejectedValue(new Error("Server error"));
    renderPage();
    await waitFor(() => expect(screen.getByText("New Order")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /clear all/i }));
    await waitFor(() =>
      expect(screen.getByText(/Failed to clear notifications/)).toBeInTheDocument(),
    );
  });
});
