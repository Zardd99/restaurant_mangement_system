/**
 * Format a date string to a readable format (MM/DD/YYYY)
 * @param dateString - ISO date string or Date object
 * @returns Formatted date string
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
 * Format a date string with time (MM/DD/YYYY HH:MM AM/PM)
 * @param dateString - ISO date string or Date object
 * @returns Formatted date and time string
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
 * Get relative time string (e.g., "2 hours ago", "in 3 days")
 * @param dateString - ISO date string or Date object
 * @returns Relative time string
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
      // Past
      const absMinutes = Math.abs(diffMinutes);
      if (absMinutes < 60)
        return `${absMinutes} minute${absMinutes > 1 ? "s" : ""} ago`;
      const absHours = Math.floor(absMinutes / 60);
      if (absHours < 24)
        return `${absHours} hour${absHours > 1 ? "s" : ""} ago`;
      const absDays = Math.floor(absHours / 24);
      return `${absDays} day${absDays > 1 ? "s" : ""} ago`;
    } else {
      // Future
      if (diffMinutes < 60)
        return `in ${diffMinutes} minute${diffMinutes > 1 ? "s" : ""}`;
      if (diffHours < 24)
        return `in ${diffHours} hour${diffHours > 1 ? "s" : ""}`;
      return `in ${diffDays} day${diffDays > 1 ? "s" : ""}`;
    }
  } catch {
    return "Unknown";
  }
}
