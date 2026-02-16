"use client";

import { useEffect, useRef } from "react";
import { useSidebarViewModel } from "./SidebarViewModel";
import SidebarSectionComponent from "./SidebarSection";
import { SidebarProps } from "./types";
import { SidebarConfig } from "../../../../lib/sidebar/sidebarConfig";

/**
 * Sidebar – Main navigation sidebar component.
 *
 * Renders a collapsible sidebar with user profile, role‑based navigation sections,
 * and a system status footer. It supports keyboard (Escape) closing and handles
 * overlay clicks. State and logic are delegated to a custom view model hook
 * (`useSidebarViewModel`) for separation of concerns and testability.
 *
 * @param isOpen        - Controls visibility of the sidebar.
 * @param onClose       - Callback to close the sidebar.
 * @param user          - Current user object (or null/undefined).
 * @param onLogout      - Logout handler passed to view model.
 */
const Sidebar = ({ isOpen, onClose, user, onLogout }: SidebarProps) => {
  // Ref to the sidebar DOM element – could be used for focus trapping or click‑outside,
  // though overlay click is handled separately. Kept for potential future enhancements.
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Delegate all internal state and logic to the view model.
  // This includes sections, expanded items, toggle handlers, and a memoized handleClose.
  const {
    sections,
    expandedItems,
    toggleItem,
    isItemExpanded,
    handleClose,
    handleItemClick,
    isOpen: internalIsOpen, // internal sync of open state (not used directly here)
  } = useSidebarViewModel({
    isOpen,
    onClose,
    userRole: user?.role || "guest",
    onLogout,
  });

  // Effect: Close sidebar on Escape key press.
  // Uses the memoized handleClose from view model to ensure stable reference.
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, handleClose]);

  // Early return: render nothing if sidebar is not open.
  // This avoids rendering the overlay and sidebar DOM elements when hidden.
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay – dims background and closes sidebar on click.
          backdrop‑blur provides a modern frosted‑glass effect.
          aria‑hidden because it's decorative and not focusable. */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Sidebar container – fixed position, slides in from left.
          transform + transition create the slide animation.
          z‑50 ensures it appears above the overlay. */}
      <div
        ref={sidebarRef}
        data-sidebar
        className={` fixed top-0 left-0 h-full w-64 bg-black border-r border-gray-800 z-50 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header – brand logo, title, and close button.
            Fixed height (h‑16) to align with typical app bars. */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">RP</span>
            </div>
            <div>
              <h2 className="text-white font-semibold">Restaurant Pro</h2>
              <p className="text-gray-400 text-xs">Management System</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
            aria-label="Close sidebar"
          >
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* User Profile – shown only if user object exists.
            Displays avatar (initial), name, email, and role badge.
            Green dot indicates online status (static for now). */}
        {user && (
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
                {user.role && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-gray-800 text-gray-300 text-xs rounded-full">
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation – scrollable area containing sidebar sections.
            Uses SidebarSectionComponent to render each section and its items.
            The view model provides sections, expanded state, and handlers. */}
        <div className="flex-1 overflow-y-auto py-4">
          <div className="space-y-6">
            {sections.map((section) => (
              <SidebarSectionComponent
                key={section.id}
                section={section}
                expandedItems={expandedItems}
                onItemToggle={toggleItem}
                onItemClick={handleItemClick}
              />
            ))}
          </div>
        </div>

        {/* Footer – system status and version.
            Animated pulse dot gives a sense of liveness.
            Version number is hardcoded; could be moved to config. */}
        <div className="p-4 border-t border-gray-800 bg-gray-900/50">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>System Online</span>
            </div>
            <span className="text-xs">v2.1.0</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
