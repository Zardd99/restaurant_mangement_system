import { useState, useCallback } from "react";

/**
 * Custom hook: useNavbarViewModel
 *
 * This hook manages the state and behavior of a mobile navigation menu (typically a sidebar).
 * It implements a pattern where the menu can be controlled both internally (via local state)
 * and externally (via props). This is useful when the menu's open state needs to be
 * synchronized with a parent component (e.g., for URL sync or global state) while still
 * allowing local interactions like clicking outside to close.
 *
 * The hook receives:
 * - `onMenuToggle`: A callback fired when the menu toggle is triggered (internal or external).
 * - `isMenuOpen`: External open state from parent (e.g., from URL or global store).
 *
 * It maintains an `internalIsOpen` state to handle local interactions (like clicking the hamburger)
 * and combines it with the external prop to derive the effective `isMenuOpen` value.
 * This allows the parent to override the open state when needed (e.g., closing menu on route change).
 *
 * The hook also provides a click‑outside handler that closes the menu if the click occurs
 * outside both the sidebar and the hamburger button. This handler returns a boolean
 * indicating whether it handled the event, which can be used to stop propagation if necessary.
 *
 * @param onMenuToggle - Callback invoked when the menu toggle action occurs.
 * @param isMenuOpen - External open state from parent.
 * @returns An object containing:
 *   - isMenuOpen: The effective open state (internal OR external).
 *   - handleMenuToggle: Function to toggle the menu (updates internal state and calls callback).
 *   - handleClickOutside: Click handler to detect clicks outside the menu and close it.
 */
export const useNavbarViewModel = (
  onMenuToggle: () => void,
  isMenuOpen: boolean,
) => {
  // Internal state to track local toggle actions (e.g., user clicking the hamburger).
  // This state is independent of the external prop, allowing the menu to be opened/closed
  // locally even if the parent hasn't updated its prop yet.
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  /**
   * Toggles the menu state.
   * - Flips the internal open state.
   * - Invokes the external callback so the parent can react (e.g., update URL or global state).
   * This ensures that both local and external consumers are notified of the change.
   */
  const handleMenuToggle = useCallback(() => {
    setInternalIsOpen((prev) => !prev);
    onMenuToggle();
  }, [onMenuToggle]);

  /**
   * Handles clicks anywhere in the document to implement "click outside to close".
   * Checks if the click target is inside either the sidebar (data-sidebar) or the
   * hamburger button (data-hamburger). If not, and the menu is currently open,
   * it closes the menu (by updating internal state) and returns true to indicate
   * that the event was handled.
   *
   * The use of data attributes (data-sidebar, data-hamburger) decouples the logic from
   * specific CSS classes or DOM structure, making the hook reusable with different
   * components as long as they have these attributes.
   *
   * @param event - The mouse event from a click listener.
   * @returns boolean - True if the click was outside and menu was closed, false otherwise.
   */
  const handleClickOutside = useCallback(
    (event: MouseEvent): boolean => {
      const target = event.target as HTMLElement;
      // Check if the click occurred inside the sidebar or the hamburger button.
      const isSidebar = target.closest("[data-sidebar]");
      const isHamburger = target.closest("[data-hamburger]");

      // If click is outside both elements and the menu is internally open,
      // close it and return true.
      if (!isSidebar && !isHamburger && internalIsOpen) {
        setInternalIsOpen(false);
        return true; // Indicates that we handled the event (menu closed)
      }
      return false; // No action taken
    },
    [internalIsOpen],
  );

  // The effective open state combines internal and external sources.
  // Using logical OR means the menu is open if either the internal state is true
  // OR the external prop is true. This allows the parent to force the menu open
  // (e.g., on initial load when internal state is false) and also respects local toggles.
  // However, note that if the parent sets isMenuOpen to false, the menu will close
  // regardless of internalIsOpen. This is usually desired for external control.
  return {
    isMenuOpen: internalIsOpen || isMenuOpen,
    handleMenuToggle,
    handleClickOutside,
  };
};
