"use client";

/**
 * CollapsibleSidebar Component
 *
 * This component renders a collapsible sidebar navigation menu.
 * It is designed for admin/dashboard layouts with a fixed position,
 * hover-to-expand behavior, and support for nested dropdown items.
 *
 * Key features:
 * - Collapses to icons-only (64px width) when not hovered, expands to 256px on hover.
 * - Uses Tailwind CSS for styling with smooth transitions.
 * - Dynamic sections and items based on user role, sourced from SidebarConfig.
 * - Supports dropdown menus for items with children.
 * - Highlights active item based on current pathname.
 * - Shows tooltips for collapsed items when hovered.
 * - Includes user profile section at the bottom with logout button.
 *
 * The component is a client component because it uses interactivity hooks
 * (useState, useRef, usePathname) and responds to hover events.
 */

import { useRef, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SidebarConfig } from "../../../../lib/sidebar/sidebarConfig";
import { useAuth } from "../../../../contexts/AuthContext";
import Link from "next/link";

interface CollapsibleSidebarProps {
  user?: any; // User object, can be undefined (e.g., guest)
  onLogout?: () => void; // Optional custom logout handler, falls back to AuthContext logout
}

const CollapsibleSidebar = ({ user, onLogout }: CollapsibleSidebarProps) => {
  // Ref to the sidebar DOM element – can be used for click‑outside detection or measuring.
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Hover expands the sidebar on pointer (desktop) devices.
  const [isHovered, setIsHovered] = useState(false);

  // Manual open expands it on touch (iPad) devices, where hover is unavailable:
  // tap the header toggle to open/close. Expanded when either source is active.
  const [isOpen, setIsOpen] = useState(false);
  const expanded = isHovered || isOpen;

  // State to track which dropdown items are expanded.
  // Uses a Set of item IDs for O(1) lookup.
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Next.js hooks for routing and path detection.
  const pathname = usePathname();
  const router = useRouter();

  // Auth context for logout as fallback.
  const { logout } = useAuth();

  // Get filtered navigation items based on user role (or "guest" if no user).
  // SidebarConfig.getFilteredItems returns an array of sections, each containing items.
  const sections = SidebarConfig.getFilteredItems(user?.role || "guest");

  /**
   * Handles logout click.
   * If an external onLogout prop is provided, use it; otherwise fallback to context logout.
   */
  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    } else {
      logout();
    }
  };

  /**
   * Handles click on a main navigation item.
   * Currently only special‑cases the "logout" item to trigger logout.
   * Could be extended for other non‑link items.
   */
  const handleItemClick = (itemId: string) => {
    if (itemId === "logout") {
      handleLogoutClick();
    }
  };

  /**
   * Toggles dropdown state for a given item ID.
   * Creates a new Set to ensure immutability and trigger re‑render.
   */
  const toggleDropdown = (itemId: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  /**
   * Checks if a dropdown item is expanded.
   */
  const isItemExpanded = (itemId: string) => expandedItems.has(itemId);

  return (
    <>
      {/* Tap-outside backdrop — closes the manually-opened drawer on touch */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
      <div
        ref={sidebarRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed top-0 left-0 h-screen z-40 transition-all duration-300 ease-in-out ${
          expanded ? "w-64" : "w-16"
        } bg-white/70 dark:bg-black/50 backdrop-blur-xl backdrop-saturate-150 border-r border-black/10 dark:border-white/10 shadow-xl overflow-hidden group`}
      >
      {/* Header: menu toggle (tap to expand/collapse on touch) + brand */}
      <div className="h-16 flex items-center gap-2 px-3 border-b border-black/10 dark:border-white/10 flex-shrink-0">
        <button
          onClick={() => setIsOpen((v) => !v)}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0"
          aria-label={expanded ? "Collapse menu" : "Expand menu"}
          aria-expanded={expanded}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {expanded ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
        {expanded && (
          <div className="flex items-center gap-2 animate-in fade-in duration-200">
            <div className="w-9 h-9 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
              <span className="text-white font-bold text-xs">RP</span>
            </div>
            <div className="flex flex-col">
              <h2 className="text-gray-900 dark:text-white font-semibold text-sm leading-tight">
                Restaurant Pro
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-xs leading-tight">
                Management
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Container – scrollable area for menu items */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide py-4">
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.id} className="space-y-1 px-2">
              {/* Section Label – only visible when sidebar is expanded */}
              {expanded && (
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 px-3 py-2 truncate">
                  {section.label}
                </h3>
              )}

              {/* Section Items */}
              <div className="space-y-1">
                {section.items.map((item) => {
                  // Determine if this item (or one of its children) matches the current path.
                  // For simplicity, we only highlight the exact link match here.
                  // (Could be extended to highlight parent if a child is active.)
                  const isActive = item.link === pathname;

                  // Check if this item has children (dropdown).
                  const hasChildren = item.children && item.children.length > 0;

                  return (
                    <div key={item.id} className="relative">
                      {/* Main Item Rendering */}
                      {hasChildren ? (
                        // Dropdown parent: rendered as a button that toggles expansion.
                        <button
                          onClick={() => toggleDropdown(item.id)}
                          className={`w-full group/item flex items-center px-3 py-3 rounded-lg transition-all duration-200 relative ${
                            isActive
                              ? "bg-black/5 dark:bg-white/10 text-gray-900 dark:text-white"
                              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
                          }`}
                          title={!expanded ? item.text : ""} // Title attribute shows native tooltip when collapsed (fallback)
                        >
                          {/* Icon – always visible */}
                          <div className="flex-shrink-0 flex items-center justify-center w-5">
                            {item.icon}
                          </div>

                          {/* Text label – only visible when expanded */}
                          {expanded && (
                            <span className="ml-3 flex-1 text-left text-sm font-medium truncate">
                              {item.text}
                            </span>
                          )}

                          {/* Badge – only visible when expanded */}
                          {item.badge && expanded && (
                            <span className="ml-2 px-2 py-0.5 bg-black/10 dark:bg-white/10 text-gray-700 dark:text-white text-xs rounded shrink-0">
                              {item.badge}
                            </span>
                          )}

                          {/* Dropdown arrow – only visible when expanded, rotates when open */}
                          {expanded && (
                            <svg
                              className={`w-4 h-4 transition-transform ${
                                isItemExpanded(item.id) ? "rotate-180" : ""
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 14l-7 7m0 0l-7-7m7 7V3"
                              />
                            </svg>
                          )}

                          {/* Active indicator – a vertical white bar on the right when item is active */}
                          {isActive && (
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 dark:bg-white rounded-l" />
                          )}
                        </button>
                      ) : (
                        // Regular link item (no children)
                        <Link
                          href={item.link || "#"}
                          onClick={() => setIsOpen(false)}
                          className={`w-full group/item flex items-center px-3 py-3 rounded-lg transition-all duration-200 relative ${
                            isActive
                              ? "bg-black/5 dark:bg-white/10 text-gray-900 dark:text-white"
                              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
                          }`}
                          title={!expanded ? item.text : ""}
                        >
                          {/* Icon */}
                          <div className="flex-shrink-0 flex items-center justify-center w-5">
                            {item.icon}
                          </div>

                          {/* Text – only when expanded */}
                          {expanded && (
                            <span className="ml-3 flex-1 text-left text-sm font-medium truncate">
                              {item.text}
                            </span>
                          )}

                          {/* Badge – only when expanded */}
                          {item.badge && expanded && (
                            <span className="ml-2 px-2 py-0.5 bg-black/10 dark:bg-white/10 text-gray-700 dark:text-white text-xs rounded shrink-0">
                              {item.badge}
                            </span>
                          )}

                          {/* Active indicator */}
                          {isActive && (
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 dark:bg-white rounded-l" />
                          )}

                          {/* Tooltip when collapsed – appears to the right of the icon with a pointer arrow */}
                          {!expanded && (
                            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-gray-700 shadow-xl">
                              {item.text}
                              {/* Arrow pointing left */}
                              <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-800"></div>
                            </div>
                          )}
                        </Link>
                      )}

                      {/* Dropdown Items (children) – only rendered when expanded and hovered (so they appear when expanded) */}
                      {hasChildren && isItemExpanded(item.id) && expanded && (
                        <div className="ml-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
                          {item.children?.map((child) => (
                            <Link
                              key={child.id}
                              href={child.link || "#"}
                              onClick={() => setIsOpen(false)}
                              className={`block px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                                child.link === pathname
                                  ? "bg-black/5 dark:bg-white/10 text-gray-900 dark:text-white border-l-2 border-indigo-500 dark:border-white"
                                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10"
                              }`}
                            >
                              {child.text}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Divider between sections */}
              <div className="my-2">
                <div className="border-t border-black/10 dark:border-white/10"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Profile Section – pinned to bottom */}
      <div className="border-t border-black/10 dark:border-white/10 shrink-0 p-3">
        {expanded ? (
          // Expanded view: shows user avatar, name, role, and logout button.
          <div className="flex items-center space-x-3 animate-in fade-in duration-200">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 bg-gray-200 dark:bg-white/10 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-gray-900 dark:text-white font-bold text-sm">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
              {/* Online status indicator */}
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-black"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.role || "Guest"}
              </p>
            </div>
            <button
              onClick={handleLogoutClick}
              className="p-2 rounded-lg hover:bg-red-500/20 transition-colors text-gray-400 hover:text-red-400 flex-shrink-0"
              title="Logout"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        ) : (
          // Collapsed view: only avatar with logout on click and tooltip.
          <div className="flex justify-center">
            <button
              onClick={handleLogoutClick}
              className="w-10 h-10 bg-gray-200 dark:bg-white/10 rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg relative group"
              title="Logout"
            >
              <span className="text-gray-900 dark:text-white font-bold text-sm">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </span>
              <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white dark:border-black"></div>

              {/* Tooltip for collapsed avatar */}
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-gray-700 shadow-xl">
                {user?.name || "Logout"}
                <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-800"></div>
              </div>
            </button>
          </div>
        )}
      </div>
      </div>
    </>
  );
};

export default CollapsibleSidebar;
