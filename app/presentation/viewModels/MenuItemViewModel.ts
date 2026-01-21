import { MenuItem } from "../../hooks/useMenuData";

/**
 * ViewModel for MenuItemCard
 * Handles all UI logic and data transformation for displaying menu items
 */
export class MenuItemViewModel {
  /**
   * Check if item is available
   */
  static isAvailable(item: MenuItem): boolean {
    return item.availability;
  }

  /**
   * Get availability status text
   */
  static getAvailabilityStatus(item: MenuItem): string {
    return item.availability ? "Available" : "Out of Stock";
  }

  /**
   * Format price with currency
   */
  static formatPrice(price: number): string {
    return `$${price.toFixed(2)}`;
  }

  /**
   * Get badge text for special items
   */
  static getChefSpecialBadge(item: MenuItem): string {
    return "✨ Chef's Special";
  }

  /**
   * Determine if item should show a special badge
   */
  static shouldShowSpecialBadge(item: MenuItem): boolean {
    return item.chefSpecial;
  }

  /**
   * Get dietary tags display info
   */
  static getDietaryTagsDisplay(tags: string[] | undefined): string[] {
    return tags?.map((tag) => tag.toLowerCase()) || [];
  }

  /**
   * Get rating display text
   */
  static getRatingDisplay(rating: number): string {
    return rating > 0 ? `${rating.toFixed(1)} ⭐` : "No ratings";
  }

  /**
   * Determine card styling based on availability
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

  /**
   * Get truncated description
   */
  static getTruncatedDescription(
    description: string,
    maxLines: number = 2,
  ): string {
    return description;
  }
}
