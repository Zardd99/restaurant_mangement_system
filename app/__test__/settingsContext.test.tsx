import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { SettingsProvider, useSettings, AppSettings } from "../contexts/SettingsContext";

// jsdom does not implement matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  })),
});

const STORAGE_KEY = "rms_settings";

// ---------------------------------------------------------------------------
// Spy component — surfaces context values as text nodes for assertions
// ---------------------------------------------------------------------------

function SettingsSpy() {
  const { settings, updateSetting, updateToastType, resetSettings } = useSettings();
  return (
    <div>
      <span data-testid="theme">{settings.theme}</span>
      <span data-testid="toastsEnabled">{String(settings.toastsEnabled)}</span>
      <span data-testid="soundEnabled">{String(settings.soundEnabled)}</span>
      <span data-testid="compactCards">{String(settings.compactCards)}</span>
      <span data-testid="order_created">{String(settings.toastTypes.order_created)}</span>
      <span data-testid="order_served">{String(settings.toastTypes.order_served)}</span>
      <span data-testid="kitchenFilter">{settings.kitchenDefaultFilter}</span>
      <span data-testid="kitchenRefresh">{settings.kitchenAutoRefreshSeconds}</span>

      <button data-testid="set-dark"   onClick={() => updateSetting("theme", "dark")}>set-dark</button>
      <button data-testid="set-light"  onClick={() => updateSetting("theme", "light")}>set-light</button>
      <button data-testid="set-system" onClick={() => updateSetting("theme", "system")}>set-system</button>
      <button data-testid="toggle-sound"   onClick={() => updateSetting("soundEnabled",   !settings.soundEnabled)}>snd</button>
      <button data-testid="toggle-compact" onClick={() => updateSetting("compactCards",   !settings.compactCards)}>compact</button>
      <button data-testid="toggle-toasts"  onClick={() => updateSetting("toastsEnabled",  !settings.toastsEnabled)}>toasts</button>
      <button data-testid="toggle-created" onClick={() => updateToastType("order_created", !settings.toastTypes.order_created)}>tc</button>
      <button data-testid="toggle-served"  onClick={() => updateToastType("order_served",  !settings.toastTypes.order_served)}>ts</button>
      <button data-testid="reset"          onClick={resetSettings}>reset</button>
    </div>
  );
}

function renderSettings() {
  return render(
    <SettingsProvider>
      <SettingsSpy />
    </SettingsProvider>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SettingsContext", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  // ---- Default state ------------------------------------------------------- //

  it("starts with default settings when localStorage is empty", () => {
    renderSettings();
    expect(screen.getByTestId("theme")).toHaveTextContent("light");
    expect(screen.getByTestId("toastsEnabled")).toHaveTextContent("true");
    expect(screen.getByTestId("soundEnabled")).toHaveTextContent("false");
    expect(screen.getByTestId("compactCards")).toHaveTextContent("false");
    expect(screen.getByTestId("kitchenFilter")).toHaveTextContent("all");
    expect(screen.getByTestId("kitchenRefresh")).toHaveTextContent("0");
  });

  it("all toast types are enabled by default", () => {
    renderSettings();
    expect(screen.getByTestId("order_created")).toHaveTextContent("true");
    expect(screen.getByTestId("order_served")).toHaveTextContent("true");
  });

  // ---- localStorage loading ------------------------------------------------ //

  it("loads persisted theme and soundEnabled from localStorage on mount", () => {
    const saved: Partial<AppSettings> = { theme: "dark", soundEnabled: true };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    renderSettings();
    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    expect(screen.getByTestId("soundEnabled")).toHaveTextContent("true");
  });

  it("merges partial saved settings — missing keys fall back to defaults", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ soundEnabled: true }));
    renderSettings();
    expect(screen.getByTestId("soundEnabled")).toHaveTextContent("true");
    expect(screen.getByTestId("theme")).toHaveTextContent("light");
  });

  it("falls back to defaults when localStorage contains invalid JSON", () => {
    localStorage.setItem(STORAGE_KEY, "not-valid-json{{{{");
    renderSettings();
    expect(screen.getByTestId("theme")).toHaveTextContent("light");
    expect(screen.getByTestId("soundEnabled")).toHaveTextContent("false");
  });

  // ---- updateSetting ------------------------------------------------------- //

  it("updateSetting updates in-memory state immediately", () => {
    renderSettings();
    fireEvent.click(screen.getByTestId("toggle-sound"));
    expect(screen.getByTestId("soundEnabled")).toHaveTextContent("true");
  });

  it("updateSetting persists the new value to localStorage", () => {
    renderSettings();
    fireEvent.click(screen.getByTestId("toggle-sound"));
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(saved.soundEnabled).toBe(true);
  });

  it("updateSetting for compactCards toggles correctly", () => {
    renderSettings();
    expect(screen.getByTestId("compactCards")).toHaveTextContent("false");
    fireEvent.click(screen.getByTestId("toggle-compact"));
    expect(screen.getByTestId("compactCards")).toHaveTextContent("true");
  });

  // ---- Theme → dark class -------------------------------------------------- //

  it('adds "dark" class to <html> when theme is set to "dark"', () => {
    renderSettings();
    fireEvent.click(screen.getByTestId("set-dark"));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it('removes "dark" class from <html> when theme is set to "light"', () => {
    document.documentElement.classList.add("dark");
    renderSettings();
    fireEvent.click(screen.getByTestId("set-light"));
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it('does not add "dark" class for "system" when matchMedia returns light', () => {
    // matchMedia.matches is mocked to false (light mode)
    renderSettings();
    fireEvent.click(screen.getByTestId("set-system"));
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it('adds "dark" class for "system" when matchMedia returns dark', () => {
    (window.matchMedia as jest.Mock).mockImplementation((q: string) => ({
      matches: true,
      media: q,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));
    renderSettings();
    fireEvent.click(screen.getByTestId("set-system"));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    // restore
    (window.matchMedia as jest.Mock).mockImplementation((q: string) => ({
      matches: false, media: q, addEventListener: jest.fn(), removeEventListener: jest.fn(),
    }));
  });

  // ---- updateToastType ----------------------------------------------------- //

  it("updateToastType disables a specific notification type", () => {
    renderSettings();
    expect(screen.getByTestId("order_created")).toHaveTextContent("true");
    fireEvent.click(screen.getByTestId("toggle-created"));
    expect(screen.getByTestId("order_created")).toHaveTextContent("false");
  });

  it("updateToastType leaves other types unchanged", () => {
    renderSettings();
    fireEvent.click(screen.getByTestId("toggle-created"));
    expect(screen.getByTestId("order_served")).toHaveTextContent("true");
  });

  it("updateToastType persists the change to localStorage", () => {
    renderSettings();
    fireEvent.click(screen.getByTestId("toggle-created"));
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(saved.toastTypes.order_created).toBe(false);
    expect(saved.toastTypes.order_served).toBe(true);
  });

  // ---- resetSettings ------------------------------------------------------- //

  it("resetSettings restores all default values", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme: "dark", soundEnabled: true, compactCards: true }));
    renderSettings();
    fireEvent.click(screen.getByTestId("reset"));
    expect(screen.getByTestId("theme")).toHaveTextContent("light");
    expect(screen.getByTestId("soundEnabled")).toHaveTextContent("false");
    expect(screen.getByTestId("compactCards")).toHaveTextContent("false");
  });

  it("resetSettings removes the dark class from <html>", () => {
    document.documentElement.classList.add("dark");
    renderSettings();
    fireEvent.click(screen.getByTestId("reset"));
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("resetSettings writes defaults to localStorage", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ soundEnabled: true }));
    renderSettings();
    fireEvent.click(screen.getByTestId("reset"));
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(saved.soundEnabled).toBe(false);
    expect(saved.theme).toBe("light");
  });
});
