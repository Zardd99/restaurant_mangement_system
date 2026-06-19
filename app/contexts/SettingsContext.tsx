"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export type Theme = "light" | "dark" | "system";

export interface AppSettings {
  theme: Theme;
  toastsEnabled: boolean;
  toastTypes: {
    order_created: boolean;
    order_preparing: boolean;
    order_ready: boolean;
    order_served: boolean;
  };
  soundEnabled: boolean;
  kitchenDefaultFilter: "all" | "pending" | "confirmed" | "preparing" | "ready";
  kitchenAutoRefreshSeconds: 0 | 30 | 60 | 120;
  compactCards: boolean;
}

const STORAGE_KEY = "rms_settings";

const DEFAULTS: AppSettings = {
  theme: "light",
  toastsEnabled: true,
  toastTypes: {
    order_created: true,
    order_preparing: true,
    order_ready: true,
    order_served: true,
  },
  soundEnabled: false,
  kitchenDefaultFilter: "all",
  kitchenAutoRefreshSeconds: 0,
  compactCards: false,
};

interface SettingsContextType {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  updateToastType: (type: keyof AppSettings["toastTypes"], value: boolean) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULTS,
  updateSetting: () => {},
  updateToastType: () => {},
  resetSettings: () => {},
});

export const useSettings = () => useContext(SettingsContext);

function load(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

function save(s: AppSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = theme === "dark" || (theme === "system" && prefersDark);
  root.classList.toggle("dark", isDark);
}

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);

  useEffect(() => {
    const loaded = load();
    setSettings(loaded);
    applyTheme(loaded.theme);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const current = load();
      if (current.theme === "system") applyTheme("system");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const updateSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      save(next);
      if (key === "theme") applyTheme(value as Theme);
      return next;
    });
  }, []);

  const updateToastType = useCallback((type: keyof AppSettings["toastTypes"], value: boolean) => {
    setSettings((prev) => {
      const next = { ...prev, toastTypes: { ...prev.toastTypes, [type]: value } };
      save(next);
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    save(DEFAULTS);
    setSettings(DEFAULTS);
    applyTheme(DEFAULTS.theme);
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, updateToastType, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
