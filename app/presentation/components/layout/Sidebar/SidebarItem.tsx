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

  const baseClasses =
    "flex items-center justify-between w-full p-3 rounded-lg transition-all duration-200 group relative";
  const activeClasses = isActive
    ? "bg-gray-700 bg-opacity-30 text-white border-l-2 border-white shadow-lg"
    : "text-gray-300 hover:text-white hover:bg-gray-800/50 hover:shadow-md";

  const iconClasses = isActive
    ? "text-blue-400"
    : "text-gray-400 group-hover:text-gray-300";

  const content = (
    <>
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <div className={`flex-shrink-0 ${iconClasses}`}>{item.icon}</div>
        <span className="font-medium text-sm truncate">{item.text}</span>
      </div>

      {/* Badges and indicators */}
      <div className="flex items-center space-x-2 ml-2">
        {showBadge && item.badge && (
          <span
            className={`px-2 py-0.5 text-xs rounded-full ${
              typeof item.badge === "number"
                ? "bg-red-500/20 text-red-300"
                : "bg-blue-500/20 text-blue-300"
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

  const paddingLeft = level > 0 ? `pl-${level * 4 + 8}` : "";

  // Handle clickable items
  const handleClick = () => {
    if (hasChildren && onToggle) {
      onToggle();
    } else if (onClick) {
      onClick();
    }
  };

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

  if (item.link) {
    return (
      <Link
        href={item.link}
        className={`${baseClasses} ${activeClasses} ${paddingLeft}`}
        onClick={() => onClick?.()}
      >
        {content}
      </Link>
    );
  }

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

  return null;
};

export default SidebarItem;
