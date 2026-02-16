import { useState, useCallback, useEffect } from "react";
import { SidebarSection } from "./types";
import { SidebarConfig } from "../../../../lib/sidebar/sidebarConfig";

/**
 * Interface defining the props accepted by the useSidebarViewModel hook.
 *
 * @property isOpen - Boolean indicating whether the sidebar is currently open (e.g., on mobile).
 * @property onClose - Callback to close the sidebar (used when navigating or clicking outside).
 * @property userRole - Current user's role (e.g., "admin", "manager", "guest") for filtering menu items.
 * @property onLogout - Optional custom logout handler; if not provided, the hook relies on item.onClick.
 */
interface UseSidebarViewModelProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: string;
  onLogout?: () => void;
}

/**
 * Custom hook: useSidebarViewModel
 *
 * This hook encapsulates all the state and logic needed for a dynamic, role-based sidebar.
 * It manages:
 * - The list of sidebar sections (filtered by user role).
 * - The expanded/collapsed state of dropdown items (using a Set of item IDs).
 * - Handlers for toggling items, closing the sidebar, and handling item clicks.
 *
 * The hook is designed to be used by a top-level sidebar component, providing a clean separation
 * of concerns and making the sidebar logic easily testable and reusable.
 *
 * @param props - See UseSidebarViewModelProps.
 * @returns An object containing:
 *   - sections: The filtered sidebar sections (each with items).
 *   - expandedItems: Set of currently expanded item IDs.
 *   - toggleItem: Function to expand/collapse a dropdown item.
 *   - isItemExpanded: Function to check if a specific item is expanded.
 *   - handleClose: Function to close the sidebar (calls onClose if isOpen is true).
 *   - handleItemClick: Function to handle clicks on sidebar items (triggers any custom onClick and logout logic).
 *   - isOpen: The current open state (passed through for convenience).
 */
export const useSidebarViewModel = ({
  isOpen,
  onClose,
  userRole,
  onLogout,
}: UseSidebarViewModelProps) => {
  // State to track which dropdown items are expanded. Using a Set provides O(1) lookup.
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // State to hold the sidebar sections after filtering by user role.
  const [sections, setSections] = useState<SidebarSection[]>([]);

  /**
   * Effect: Re‑fetch and filter sidebar sections whenever the user role changes.
   * This ensures the sidebar always shows the correct items for the current user.
   *
   * Note: The code maps over filteredSections and adds both `items` and `content`
   * properties. The duplication (items || items) is redundant and may indicate a
   * data structure inconsistency. We preserve it to match the original logic,
   * but it could be simplified to just use `items`.
   */
  useEffect(() => {
    // Get filtered sections from the config based on user role.
    const filteredSections = SidebarConfig.getFilteredItems(userRole);

    // Transform the config sections into the expected format (ensuring items array exists).
    const mappedSections: SidebarSection[] = filteredSections.map(
      (section) => ({
        ...section,
        items: section.items || section.items || [], // Redundant; could be `section.items || []`
        content: section.items || section.items || [], // Also redundant; likely `content` is not used.
      }),
    );

    setSections(mappedSections);
  }, [userRole]); // Only re-run when userRole changes.

  /**
   * Toggles the expanded state of a dropdown item.
   * Uses functional update to avoid stale closure issues.
   * Creates a new Set to ensure immutability and trigger re-render.
   *
   * @param itemId - ID of the item to toggle.
   */
  const toggleItem = useCallback((itemId: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  /**
   * Checks whether a given item is expanded.
   * Wrapped in useCallback to maintain referential stability.
   *
   * @param itemId - ID of the item.
   * @returns True if the item is expanded.
   */
  const isItemExpanded = useCallback(
    (itemId: string) => {
      return expandedItems.has(itemId);
    },
    [expandedItems],
  );

  /**
   * Closes the sidebar if it is currently open.
   * This is typically called after navigation or when clicking outside.
   * The conditional check prevents unnecessary onClose calls when already closed.
   */
  const handleClose = useCallback(() => {
    if (isOpen) {
      onClose();
    }
  }, [isOpen, onClose]);

  /**
   * Handles a click on a sidebar item.
   * It retrieves the full item definition from SidebarConfig (by ID) and,
   * if the item has a custom onClick handler, executes it.
   * Additionally, if the item ID is "logout" and an external onLogout handler is provided,
   * it calls that handler. This allows the parent to control logout behavior.
   *
   * Note: The logic assumes that SidebarConfig.getItemById exists and returns an item with an optional onClick.
   * If the item is not found, nothing happens.
   *
   * @param itemId - ID of the clicked item.
   */
  const handleItemClick = useCallback(
    (itemId: string) => {
      const item = SidebarConfig.getItemById(itemId);
      if (item?.onClick) {
        item.onClick();
        // Special case for logout: if the item has onClick, it might already handle logout,
        // but we also support an external onLogout prop for consistency.
        if (itemId === "logout" && onLogout) {
          onLogout();
        }
      }
    },
    [onLogout],
  );

  // Return all state and handlers needed by the sidebar component.
  return {
    sections,
    expandedItems,
    toggleItem,
    isItemExpanded,
    handleClose,
    handleItemClick,
    isOpen, // Pass through for convenience (e.g., to conditionally render a backdrop).
  };
};
