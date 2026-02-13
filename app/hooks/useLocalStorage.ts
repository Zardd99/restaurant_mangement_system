/**
 * =============================================================================
 * CUSTOM HOOK: useLocalStorage
 * =============================================================================
 *
 * A React hook that synchronises a state value with `localStorage`.
 * It reads the initial value from localStorage on mount and persists
 * the value to localStorage whenever it changes.
 *
 * ✅ Features:
 *   - SSR‑safe (checks for `window` before accessing localStorage).
 *   - Supports functional updates (same API as `useState`).
 *   - Graceful error handling (logs error, falls back to `initialValue`).
 *
 * @template T - Type of the stored value.
 *
 * @param key          - The localStorage key to read/write.
 * @param initialValue - The default value if no item exists in localStorage.
 * @returns            - A tuple `[storedValue, setValue]` (identical to useState).
 *
 * @example
 * const [name, setName] = useLocalStorage('user_name', 'Guest');
 *
 * @module useLocalStorage
 */

import { useState } from "react";

export const useLocalStorage = <T>(key: string, initialValue: T) => {
  // -------------------------------------------------------------------------
  // STATE INITIALISATION (lazy)
  // -------------------------------------------------------------------------
  const [storedValue, setStoredValue] = useState<T>(() => {
    // Guard: SSR – no window object
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // -------------------------------------------------------------------------
  // SETTER FUNCTION
  // -------------------------------------------------------------------------
  /**
   * Updates the state and persists the new value to localStorage.
   * Accepts either a direct value or an updater function.
   *
   * @param value - New value or function that receives current value and returns new value.
   */
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;

      // Update React state
      setStoredValue(valueToStore);

      // Persist to localStorage (SSR guard)
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  // -------------------------------------------------------------------------
  // RETURN
  // -------------------------------------------------------------------------
  // Use `as const` to infer a tuple type (like useState)
  return [storedValue, setValue] as const;
};
