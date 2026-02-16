import { SidebarSection, SidebarItem } from "./types";

/**
 * SidebarCoordinator Class
 *
 * This class serves as the central coordinator for sidebar navigation structure.
 * It manages a collection of sidebar sections, each containing navigation items.
 * The class provides methods to:
 * - Retrieve all sections.
 * - Filter sections based on user role (for role-based access control).
 * - Find a specific item by its URL path (useful for highlighting active items).
 *
 * The design assumes a hierarchical structure where sections contain items,
 * and items may have children (dropdowns). The data structure is defined
 * by the imported types SidebarSection and SidebarItem.
 *
 * This class is intended to be used in conjunction with a configuration object
 * (e.g., SidebarConfig) that provides the initial sections, but it can also
 * be instantiated with any valid section array.
 */
export class SidebarCoordinator {
  private sections: SidebarSection[];

  /**
   * Constructs a SidebarCoordinator with a given set of sidebar sections.
   * @param sections - Array of SidebarSection objects defining the sidebar structure.
   */
  constructor(sections: SidebarSection[]) {
    this.sections = sections;
  }

  /**
   * Returns the raw (unfiltered) array of sidebar sections.
   * Useful for cases where no role-based filtering is needed, or when
   * the caller wants to apply custom filtering.
   *
   * @returns The complete array of sidebar sections.
   */
  getSections(): SidebarSection[] {
    return this.sections;
  }

  /**
   * Filters the sidebar sections based on a user role.
   * Currently, this method only returns a shallow copy of sections with
   * a placeholder filtering logic (always returns true). The intention is
   * to implement role-based filtering where each item can specify allowed roles.
   *
   * Important considerations:
   * - The method maps over sections and creates a new array, but the items themselves
   *   are shallow copies. If items are mutated elsewhere, it could affect the original.
   * - The current implementation does not filter sections themselves; it only filters
   *   items within each section. If a section becomes empty after filtering, it may be
   *   desirable to remove that section entirely. That logic could be added.
   * - For production, this method should be extended to check item.roles or a similar
   *   property against the provided user role.
   *
   * @param role - The user role (e.g., "admin", "manager", "guest") to filter by.
   * @returns A new array of SidebarSection with items filtered by role.
   */
  filterByUserRole(role: string): SidebarSection[] {
    // TODO: Implement actual role-based filtering based on item metadata.
    // Currently, this is a stub that returns all items.
    return this.sections.map((section) => ({
      ...section,
      content: section.items.filter((item) => {
        // Add role-based filtering logic here
        return true; // Placeholder: include all items
      }),
    }));
  }

  /**
   * Finds a sidebar item (either a parent or a child) by its exact URL path.
   * This is useful for determining the currently active item in the UI.
   *
   * The search is performed in the following order:
   * 1. Iterate through each section.
   * 2. For each item in the section, check if item.link matches the path.
   * 3. If not, and the item has children, search through the children.
   * 4. Return the first match found, or null if no match.
   *
   * Note: There is a typo in the original code: `section.items || section.items || []`
   * is redundant and always evaluates to section.items (which may be undefined).
   * The safe way is to use optional chaining or default to an empty array.
   * We'll keep the original logic but add a comment about the redundancy.
   *
   * @param path - The URL path to search for (e.g., "/dashboard/orders").
   * @returns The matching SidebarItem, or null if not found.
   */
  findItemByPath(path: string): SidebarItem | null {
    for (const section of this.sections) {
      // Original code had `section.items || section.items || []` – this is redundant.
      // It effectively means: use section.items if truthy, else [].
      // A cleaner approach would be `section.items || []`.
      for (const item of section.items || section.items || []) {
        if (item.link === path) {
          return item;
        }
        if (item.children) {
          const found = item.children.find((child) => child.link === path);
          if (found) return found;
        }
      }
    }
    return null;
  }
}
