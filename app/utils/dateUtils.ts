/**
 * =============================================================================
 * DATE UTILITIES
 * =============================================================================
 *
 * A collection of pure utility functions for formatting and manipulating dates.
 * These functions are safe to use in both server and client environments.
 *
 * ✅ Responsibilities:
 *   - Format dates to human‑readable strings (MM/DD/YYYY).
 *   - Format dates with time (MM/DD/YYYY HH:MM AM/PM).
 *   - Generate relative time descriptions (e.g., "2 hours ago").
 *
 * 🚫 Does NOT:
 *   - Perform date arithmetic beyond simple comparisons.
 *   - Handle timezone conversions (uses local timezone).
 *
 * @module dateUtils
 */

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Formats a date as a localized string in the format MM/DD/YYYY.
 *
 * @param dateString - ISO 8601 date string or Date object.
 * @returns          - Formatted date string (e.g., "12/31/2024").
 *                     Returns "Invalid date" if parsing fails.
 *
 * @example
 * formatDate("2024-12-31T00:00:00.000Z") // "12/31/2024"
 * formatDate(new Date(2024, 11, 31))     // "12/31/2024"
 */
export function formatDate(dateString: string | Date): string {
  try {
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return "Invalid date";
  }
}

/**
 * Formats a date with both date and time in 12‑hour format.
 * Output pattern: MM/DD/YYYY HH:MM AM/PM
 *
 * @param dateString - ISO 8601 date string or Date object.
 * @returns          - Formatted date and time string.
 *                     Returns "Invalid date" if parsing fails.
 *
 * @example
 * formatDateTime("2024-12-31T14:30:00.000Z") // "12/31/2024 02:30 PM"
 */
export function formatDateTime(dateString: string | Date): string {
  try {
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "Invalid date";
  }
}

/**
 * Returns a human‑readable relative time description (past or future).
 * Examples: "2 minutes ago", "in 3 days", "5 hours ago", "in 1 hour".
 *
 * @param dateString - ISO 8601 date string or Date object.
 * @returns          - Relative time string.
 *                     Returns "Unknown" if parsing fails.
 *
 * @remarks
 * The calculation uses the local system time. Differences are truncated
 * (floor) rather than rounded. For example, 1 minute 59 seconds becomes
 * "1 minute ago", not "2 minutes ago".
 *
 * @example
 * // If current time is 2024-12-31T10:00:00
 * getRelativeTime("2024-12-31T09:58:00") // "2 minutes ago"
 * getRelativeTime("2025-01-01T10:00:00") // "in 1 day"
 */
export function getRelativeTime(dateString: string | Date): string {
  try {
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 0) {
      // Past event
      const absMinutes = Math.abs(diffMinutes);
      if (absMinutes < 60) {
        return `${absMinutes} minute${absMinutes > 1 ? "s" : ""} ago`;
      }
      const absHours = Math.floor(absMinutes / 60);
      if (absHours < 24) {
        return `${absHours} hour${absHours > 1 ? "s" : ""} ago`;
      }
      const absDays = Math.floor(absHours / 24);
      return `${absDays} day${absDays > 1 ? "s" : ""} ago`;
    } else {
      // Future event
      if (diffMinutes < 60) {
        return `in ${diffMinutes} minute${diffMinutes > 1 ? "s" : ""}`;
      }
      if (diffHours < 24) {
        return `in ${diffHours} hour${diffHours > 1 ? "s" : ""}`;
      }
      return `in ${diffDays} day${diffDays > 1 ? "s" : ""}`;
    }
  } catch {
    return "Unknown";
  }
}
