import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarItem as SidebarItemType } from "./types";

interface SidebarItemProps {
  item: SidebarItemType;
  isExpanded?: boolean;
  onToggle?: () => void;
  onClick?: () => void;
  level?: number;
  showBadge?: boolean;
}

/**
 * SidebarItem – Renders a single navigation item within the sidebar.
 *
 * This component is highly flexible: it can render as:
 * - A Next.js Link (if `item.link` is provided)
 * - A button that toggles a nested list (if `item.children` exist and `onToggle` is supplied)
 * - A button that triggers a custom action (if `item.onClick` is provided)
 *
 * It also displays:
 * - An optional icon (from `item.icon`)
 * - A text label
 * - A badge or "NEW" indicator (configurable via `showBadge`)
 * - A chevron icon for expandable items
 *
 * Active state is determined by comparing `item.link` with the current pathname.
 * Indentation is controlled via the `level` prop (used for nested items).
 *
 * @param item        – The sidebar item data (icon, text, link, children, etc.)
 * @param isExpanded  – Whether the item's children are currently expanded (only relevant if item has children)
 * @param onToggle    – Callback to toggle expansion (only relevant if item has children)
 * @param onClick     – Optional callback when the item is clicked (e.g., for custom actions or closing the sidebar)
 * @param level       – Nesting level (0 for top-level, 1 for first child, etc.) Used to calculate left padding.
 * @param showBadge   – Whether to show the badge and "NEW" indicator (default true)
 */
const SidebarItem = ({
  item,
  isExpanded = false,
  onToggle,
  onClick,
  level = 0,
  showBadge = true,
}: SidebarItemProps) => {
  const pathname = usePathname();
  const hasChildren = item.children && item.children.length > 0;
  const isActive = item.link === pathname;

  // Base classes for all item containers – ensures consistent styling.
  const baseClasses =
    "flex items-center justify-between w-full p-3 rounded-lg transition-all duration-200 group relative";

  // Active vs. inactive styling.
  // Active items get a left border, stronger background, and white text.
  // Inactive items are muted with a hover effect.
  const activeClasses = isActive
    ? "bg-gray-700 bg-opacity-30 text-white border-l-2 border-white shadow-lg"
    : "text-gray-300 hover:text-white hover:bg-gray-800/50 hover:shadow-md";

  // Icon color also changes based on active state.
  const iconClasses = isActive
    ? "text-blue-400"
    : "text-gray-400 group-hover:text-gray-300";

  // The main content of the item (icon, text, badges, chevron).
  // This fragment is reused across all rendering paths.
  const content = (
    <>
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <div className={`flex-shrink-0 ${iconClasses}`}>{item.icon}</div>
        <span className="font-medium text-sm truncate">{item.text}</span>
      </div>

      {/* Badges and indicators – placed on the right side */}
      <div className="flex items-center space-x-2 ml-2">
        {showBadge && item.badge && (
          <span
            className={`px-2 py-0.5 text-xs rounded-full ${
              typeof item.badge === "number"
                ? "bg-red-500/20 text-red-300" // numeric badge – e.g., count of pending items
                : "bg-blue-500/20 text-blue-300" // text badge – e.g., "Beta"
            }`}
          >
            {item.badge}
          </span>
        )}

        {item.isNew && (
          <span className="px-1.5 py-0.5 text-xs bg-green-500/20 text-green-300 rounded">
            NEW
          </span>
        )}

        {/* Chevron for expandable items – rotates 180° when expanded */}
        {hasChildren && (
          <div
            className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
          >
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        )}
      </div>
    </>
  );

  // Calculate left padding based on nesting level.
  // Tailwind's arbitrary value syntax (`pl-${level * 4 + 8}`) works here because the class is fully dynamic.
  // Example: level 0 → pl-8, level 1 → pl-12, etc.
  const paddingLeft = level > 0 ? `pl-${level * 4 + 8}` : "";

  // Unified click handler: if the item has children and a toggle function, call it; otherwise call the provided onClick.
  const handleClick = () => {
    if (hasChildren && onToggle) {
      onToggle();
    } else if (onClick) {
      onClick();
    }
  };

  // Render as a button with toggle functionality (expandable item)
  if (hasChildren && onToggle) {
    return (
      <button
        onClick={handleClick}
        className={`${baseClasses} ${activeClasses} ${paddingLeft}`}
        type="button"
      >
        {content}
      </button>
    );
  }

  // Render as a Next.js Link (navigation)
  if (item.link) {
    return (
      <Link
        href={item.link}
        className={`${baseClasses} ${activeClasses} ${paddingLeft}`}
        onClick={() => onClick?.()} // optional additional callback (e.g., close sidebar)
      >
        {content}
      </Link>
    );
  }

  // Render as a button with a custom action (no navigation, no children)
  if (item.onClick) {
    return (
      <button
        onClick={handleClick}
        className={`${baseClasses} ${activeClasses} ${paddingLeft} text-left`}
        type="button"
      >
        {content}
      </button>
    );
  }

  // If none of the above conditions match, render nothing.
  // This could happen if the item is malformed (e.g., no link, no onClick, no children).
  return null;
};

export default SidebarItem;
