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

  // State to track whether the sidebar is being hovered (controls expanded/collapsed).
  const [isHovered, setIsHovered] = useState(false);

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
    <div
      ref={sidebarRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed top-0 left-0 h-screen z-40 transition-all duration-300 ease-in-out ${
        isHovered ? "w-64" : "w-16"
      } bg-black border-r border-gray-800 overflow-hidden group`}
    >
      {/* Header Section: Brand Logo and Name (name only visible when expanded) */}
      <div className="h-16 flex items-center justify-center border-b border-gray-800 flex-shrink-0">
        <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-sm">RP</span>
        </div>
        {isHovered && (
          <div className="ml-3 flex flex-col animate-in fade-in duration-200">
            <h2 className="text-white font-semibold text-sm">Restaurant Pro</h2>
            <p className="text-gray-400 text-xs">Management</p>
          </div>
        )}
      </div>

      {/* Navigation Container – scrollable area for menu items */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide py-4">
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.id} className="space-y-1 px-2">
              {/* Section Label – only visible when sidebar is expanded */}
              {isHovered && (
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
                              ? "bg-gray-700 bg-opacity-30 text-white"
                              : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                          }`}
                          title={!isHovered ? item.text : ""} // Title attribute shows native tooltip when collapsed (fallback)
                        >
                          {/* Icon – always visible */}
                          <div className="flex-shrink-0 flex items-center justify-center w-5">
                            {item.icon}
                          </div>

                          {/* Text label – only visible when expanded */}
                          {isHovered && (
                            <span className="ml-3 flex-1 text-left text-sm font-medium truncate">
                              {item.text}
                            </span>
                          )}

                          {/* Badge – only visible when expanded */}
                          {item.badge && isHovered && (
                            <span className="ml-2 px-2 py-0.5 bg-gray-700 text-white text-xs rounded fg-shrink-0">
                              {item.badge}
                            </span>
                          )}

                          {/* Dropdown arrow – only visible when expanded, rotates when open */}
                          {isHovered && (
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
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-l" />
                          )}
                        </button>
                      ) : (
                        // Regular link item (no children)
                        <Link
                          href={item.link || "#"}
                          className={`w-full group/item flex items-center px-3 py-3 rounded-lg transition-all duration-200 relative ${
                            isActive
                              ? "bg-gray-700 bg-opacity-30 text-white"
                              : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                          }`}
                          title={!isHovered ? item.text : ""}
                        >
                          {/* Icon */}
                          <div className="flex-shrink-0 flex items-center justify-center w-5">
                            {item.icon}
                          </div>

                          {/* Text – only when expanded */}
                          {isHovered && (
                            <span className="ml-3 flex-1 text-left text-sm font-medium truncate">
                              {item.text}
                            </span>
                          )}

                          {/* Badge – only when expanded */}
                          {item.badge && isHovered && (
                            <span className="ml-2 px-2 py-0.5 bg-gray-700 text-white text-xs rounded flex-shrink-0">
                              {item.badge}
                            </span>
                          )}

                          {/* Active indicator */}
                          {isActive && (
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-l" />
                          )}

                          {/* Tooltip when collapsed – appears to the right of the icon with a pointer arrow */}
                          {!isHovered && (
                            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-gray-700 shadow-xl">
                              {item.text}
                              {/* Arrow pointing left */}
                              <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-800"></div>
                            </div>
                          )}
                        </Link>
                      )}

                      {/* Dropdown Items (children) – only rendered when expanded and hovered (so they appear when expanded) */}
                      {hasChildren && isItemExpanded(item.id) && isHovered && (
                        <div className="ml-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
                          {item.children?.map((child) => (
                            <Link
                              key={child.id}
                              href={child.link || "#"}
                              className={`block px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                                child.link === pathname
                                  ? "bg-gray-700 text-white border-l-2 border-white"
                                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/30"
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
                <div className="border-t border-gray-800/50"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Profile Section – pinned to bottom */}
      <div className="border-t border-gray-800 bg-gray-900/50 backdrop-blur flex-shrink-0 p-3">
        {isHovered ? (
          // Expanded view: shows user avatar, name, role, and logout button.
          <div className="flex items-center space-x-3 animate-in fade-in duration-200">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
              {/* Online status indicator (always shown as white dot) */}
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-white rounded-full border-2 border-gray-900"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-gray-400 truncate">
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
              className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg relative group"
              title="Logout"
            >
              <span className="text-white font-bold text-sm">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </span>
              <div className="absolute bottom-0 right-0 w-2 h-2 bg-white rounded-full border border-gray-900"></div>

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
  );
};

export default CollapsibleSidebar;
