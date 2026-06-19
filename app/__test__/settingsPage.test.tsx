process.env.NEXT_PUBLIC_API_URL = "http://localhost:5000";

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mock next/navigation
// ---------------------------------------------------------------------------

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// ---------------------------------------------------------------------------
// Mock AuthContext
// ---------------------------------------------------------------------------

const mockDeleteAccount = jest.fn();
const mockLogout       = jest.fn();

jest.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({
    axiosInstance: { delete: mockDeleteAccount },
    user: { name: "Jane Smith", email: "jane@restaurant.com", role: "manager" },
    logout: mockLogout,
    isLoading: false,
  }),
}));

// ---------------------------------------------------------------------------
// Mock SettingsContext
// ---------------------------------------------------------------------------

const mockUpdateSetting   = jest.fn();
const mockUpdateToastType = jest.fn();
const mockResetSettings   = jest.fn();

const currentSettings = {
  theme: "light" as const,
  toastsEnabled: true,
  toastTypes: {
    order_created:   true,
    order_preparing: true,
    order_ready:     true,
    order_served:    true,
  },
  soundEnabled:              false,
  kitchenDefaultFilter:      "all" as const,
  kitchenAutoRefreshSeconds: 0 as const,
  compactCards:              false,
};

jest.mock("../contexts/SettingsContext", () => ({
  useSettings: () => ({
    settings: currentSettings,
    updateSetting:   mockUpdateSetting,
    updateToastType: mockUpdateToastType,
    resetSettings:   mockResetSettings,
  }),
}));

import SettingsPage from "../settings/page";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function enterDeleteModal() {
  fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));
}

function fillDeleteModal(password: string, phrase: string) {
  fireEvent.change(screen.getByPlaceholderText("Your password"), {
    target: { value: password },
  });
  fireEvent.change(screen.getByPlaceholderText(/Type "DELETE MY ACCOUNT"/i), {
    target: { value: phrase },
  });
}

function submitDeleteModal() {
  const btn = screen.getByRole("button", { name: /^delete account$/i });
  fireEvent.click(btn);
  return btn;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SettingsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---- Page structure ------------------------------------------------------ //

  it("renders the Settings heading", () => {
    render(<SettingsPage />);
    expect(screen.getByRole("heading", { name: /settings/i })).toBeInTheDocument();
  });

  it("renders Appearance, Notifications, Kitchen Display, and Account sections", () => {
    render(<SettingsPage />);
    expect(screen.getByText("Appearance")).toBeInTheDocument();
    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("Kitchen Display")).toBeInTheDocument();
    expect(screen.getByText("Account")).toBeInTheDocument();
  });

  // ---- Theme picker -------------------------------------------------------- //

  it("renders Light, Dark, and System theme buttons", () => {
    render(<SettingsPage />);
    expect(screen.getByRole("button", { name: /^Light$/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Dark$/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^System$/ })).toBeInTheDocument();
  });

  it("calls updateSetting('theme', 'dark') when Dark is clicked", () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByRole("button", { name: /^Dark$/ }));
    expect(mockUpdateSetting).toHaveBeenCalledWith("theme", "dark");
  });

  it("calls updateSetting('theme', 'system') when System is clicked", () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByRole("button", { name: /^System$/ }));
    expect(mockUpdateSetting).toHaveBeenCalledWith("theme", "system");
  });

  it("calls updateSetting('theme', 'light') when Light is clicked", () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByRole("button", { name: /^Light$/ }));
    expect(mockUpdateSetting).toHaveBeenCalledWith("theme", "light");
  });

  // ---- Notification toggles ----------------------------------------------- //

  it("shows the master 'Enable toast notifications' toggle", () => {
    render(<SettingsPage />);
    expect(
      screen.getByRole("switch", { name: /enable toast notifications/i }),
    ).toBeInTheDocument();
  });

  it("clicking the master toggle calls updateSetting('toastsEnabled', false)", () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByRole("switch", { name: /enable toast notifications/i }));
    expect(mockUpdateSetting).toHaveBeenCalledWith("toastsEnabled", false);
  });

  it("shows per-type toast toggles when toastsEnabled is true", () => {
    render(<SettingsPage />);
    expect(screen.getByRole("switch", { name: /new orders/i })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: /now preparing/i })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: /ready to serve/i })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: /order served/i })).toBeInTheDocument();
  });

  it("clicking 'New Orders' toggle calls updateToastType('order_created', false)", () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByRole("switch", { name: /new orders/i }));
    expect(mockUpdateToastType).toHaveBeenCalledWith("order_created", false);
  });

  it("clicking 'Sound alerts' toggle calls updateSetting('soundEnabled', true)", () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByRole("switch", { name: /sound alerts/i }));
    expect(mockUpdateSetting).toHaveBeenCalledWith("soundEnabled", true);
  });

  // ---- Account section ---------------------------------------------------- //

  it("shows the signed-in user name and email", () => {
    render(<SettingsPage />);
    expect(screen.getByText(/Jane Smith/)).toBeInTheDocument();
    expect(screen.getByText(/jane@restaurant\.com/)).toBeInTheDocument();
  });

  // ---- Delete account modal ----------------------------------------------- //

  it("opens the delete modal when the Delete button is clicked", () => {
    render(<SettingsPage />);
    enterDeleteModal();
    expect(screen.getByRole("heading", { name: "Delete Account" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Your password")).toBeInTheDocument();
  });

  it("closes the modal when Cancel is clicked", () => {
    render(<SettingsPage />);
    enterDeleteModal();
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByPlaceholderText("Your password")).not.toBeInTheDocument();
  });

  it("delete button is disabled when password is empty", () => {
    render(<SettingsPage />);
    enterDeleteModal();
    fillDeleteModal("", "DELETE MY ACCOUNT");
    expect(screen.getByRole("button", { name: /^delete account$/i })).toBeDisabled();
  });

  it("delete button is disabled when confirm phrase is wrong", () => {
    render(<SettingsPage />);
    enterDeleteModal();
    fillDeleteModal("mypassword123", "delete my account");
    expect(screen.getByRole("button", { name: /^delete account$/i })).toBeDisabled();
  });

  it("delete button is enabled when both password and phrase are correct", () => {
    render(<SettingsPage />);
    enterDeleteModal();
    fillDeleteModal("mypassword123", "DELETE MY ACCOUNT");
    expect(screen.getByRole("button", { name: /^delete account$/i })).not.toBeDisabled();
  });

  it("calls DELETE /api/auth/account, logout, and redirects to /login on success", async () => {
    mockDeleteAccount.mockResolvedValue({});
    render(<SettingsPage />);
    enterDeleteModal();
    fillDeleteModal("mypassword123", "DELETE MY ACCOUNT");
    submitDeleteModal();

    await waitFor(() => {
      expect(mockDeleteAccount).toHaveBeenCalledWith("/api/auth/account", {
        data: { password: "mypassword123" },
      });
      expect(mockLogout).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });

  it("shows server error message when account deletion fails", async () => {
    mockDeleteAccount.mockRejectedValue({
      response: { data: { message: "Incorrect password" } },
    });
    render(<SettingsPage />);
    enterDeleteModal();
    fillDeleteModal("wrongpass1", "DELETE MY ACCOUNT");
    submitDeleteModal();

    await waitFor(() => {
      expect(screen.getByText(/Incorrect password/)).toBeInTheDocument();
    });
  });

  it("shows fallback error when server returns no message", async () => {
    mockDeleteAccount.mockRejectedValue(new Error("Network failure"));
    render(<SettingsPage />);
    enterDeleteModal();
    fillDeleteModal("somepass1", "DELETE MY ACCOUNT");
    submitDeleteModal();

    await waitFor(() => {
      expect(screen.getByText(/Failed to delete account/)).toBeInTheDocument();
    });
  });

  // ---- Reset settings ----------------------------------------------------- //

  it("first click on reset shows confirmation text", () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByRole("button", { name: /reset all settings/i }));
    expect(screen.getByText(/click again to confirm reset/i)).toBeInTheDocument();
  });

  it("second click on reset calls resetSettings", () => {
    render(<SettingsPage />);
    const btn = screen.getByRole("button", { name: /reset all settings/i });
    fireEvent.click(btn);
    fireEvent.click(screen.getByText(/click again to confirm reset/i));
    expect(mockResetSettings).toHaveBeenCalledTimes(1);
  });
});
