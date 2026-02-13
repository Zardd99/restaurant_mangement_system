/**
 * @module MenuItemViewModel
 * @description ViewModel layer for menu item presentation.
 *
 * This class encapsulates all UI‑specific logic and data transformations
 * required to display a `MenuItem` in the user interface. It separates
 * presentation concerns from domain/API data structures, making the component
 * layer simpler and more testable.
 *
 * All methods are static and pure; they receive a `MenuItem` and return
 * formatted strings, flags, or style classes.
 *
 * @see {@link MenuItem} - The underlying domain entity.
 */

// ============================================================================
// Domain Imports
// ============================================================================
import { MenuItem } from "../../hooks/useMenuData";

// ============================================================================
// ViewModel Class
// ============================================================================

export class MenuItemViewModel {
  // --------------------------------------------------------------------------
  // Availability Methods
  // --------------------------------------------------------------------------

  /**
   * Determines whether the menu item is currently available for ordering.
   *
   * @param item - The menu item entity.
   * @returns `true` if the item is available; otherwise `false`.
   */
  static isAvailable(item: MenuItem): boolean {
    return item.availability;
  }

  /**
   * Returns a human‑readable availability status.
   *
   * @param item - The menu item entity.
   * @returns "Available" or "Out of Stock".
   */
  static getAvailabilityStatus(item: MenuItem): string {
    return item.availability ? "Available" : "Out of Stock";
  }

  // --------------------------------------------------------------------------
  // Pricing Methods
  // --------------------------------------------------------------------------

  /**
   * Formats a numeric price as USD currency.
   *
   * @param price - The price in base units (e.g., dollars).
   * @returns A string like `$12.99`.
   */
  static formatPrice(price: number): string {
    return `$${price.toFixed(2)}`;
  }

  // --------------------------------------------------------------------------
  // Badge & Special Indicators
  // --------------------------------------------------------------------------

  /**
   * Returns the badge text for a chef's special item.
   *
   * @param item - The menu item entity (unused but kept for API consistency).
   * @returns "✨ Chef's Special".
   */
  static getChefSpecialBadge(item: MenuItem): string {
    return "✨ Chef's Special";
  }

  /**
   * Checks whether the chef's special badge should be displayed.
   *
   * @param item - The menu item entity.
   * @returns `true` if the item is marked as a chef's special.
   */
  static shouldShowSpecialBadge(item: MenuItem): boolean {
    return item.chefSpecial;
  }

  // --------------------------------------------------------------------------
  // Dietary Tags
  // --------------------------------------------------------------------------

  /**
   * Transforms dietary tag strings into a consistent lowercase format
   * suitable for display or filtering.
   *
   * @param tags - Optional array of dietary tag strings (e.g., "Vegan", "GlutenFree").
   * @returns An array of lowercase tag strings; empty array if input is undefined.
   */
  static getDietaryTagsDisplay(tags: string[] | undefined): string[] {
    return tags?.map((tag) => tag.toLowerCase()) || [];
  }

  // --------------------------------------------------------------------------
  // Rating Display
  // --------------------------------------------------------------------------

  /**
   * Formats the average rating for display.
   * - If rating is greater than zero, shows one decimal and a star.
   * - Otherwise shows "No ratings".
   *
   * @param rating - The average rating value (0‑5 scale).
   * @returns A formatted string, e.g., `4.5 ⭐` or `No ratings`.
   */
  static getRatingDisplay(rating: number): string {
    return rating > 0 ? `${rating.toFixed(1)} ⭐` : "No ratings";
  }

  // --------------------------------------------------------------------------
  // Styling Helpers
  // --------------------------------------------------------------------------

  /**
   * Generates CSS class names for the card container and overlay based on
   * the item's availability.
   *
   * @param isAvailable - Whether the item is available.
   * @returns An object with `container` and `overlay` class strings.
   */
  static getCardStateClasses(isAvailable: boolean): {
    container: string;
    overlay: string;
  } {
    return {
      container: isAvailable ? "" : "opacity-75",
      overlay: isAvailable ? "" : "ring-2 ring-red-300",
    };
  }

  // --------------------------------------------------------------------------
  // Text Utilities
  // --------------------------------------------------------------------------

  /**
   * Returns a truncated description for the menu item.
   *
   * @remarks
   * Currently returns the full description; this method is a placeholder for
   * future truncation logic (e.g., `maxLines` parameter). It is kept for API
   * stability.
   *
   * @param description - The original item description.
   * @param maxLines    - Maximum number of lines to display (currently unused).
   * @returns The full description (no truncation applied yet).
   */
  static getTruncatedDescription(
    description: string,
    maxLines: number = 2,
  ): string {
    // TODO: Implement actual truncation logic (e.g., `slice` with ellipsis).
    return description;
  }
}
