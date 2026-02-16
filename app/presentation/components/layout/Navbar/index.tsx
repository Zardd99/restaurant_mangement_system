"use client";

/**
 * Navbar Component
 *
 * This component renders the main navigation bar for the application.
 * It is a client component (uses "use client") because it relies on client-side
 * hooks (useRef, useAuth) and interactive elements (logout button).
 *
 * The navbar includes:
 * - Branding and system title.
 * - Notification bell (placeholder, with mock unread indicator).
 * - User profile display with initials and role.
 * - Logout button (desktop only, with hover effect).
 *
 * It receives a `user` prop from the parent (likely a layout or page),
 * which contains user details like name and role. The logout function
 * is obtained from the AuthContext.
 *
 * Styling uses Tailwind CSS classes for a consistent dark theme with
 * backdrop blur and hover transitions. The navbar is fixed at the top
 * with a high z-index to stay above other content.
 */

import { useRef } from "react";
import { NavbarProps } from "./types";
import { useAuth } from "../../../../contexts/AuthContext";

const Navbar = ({ user }: NavbarProps) => {
  const { logout } = useAuth();

  // Ref to the container div – currently unused but kept for potential future
  // needs (e.g., detecting clicks outside, measuring dimensions, or animations).
  // Could be used for a dropdown menu or to adjust padding on scroll.
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Derives user initials from the user's name.
   * - Splits name by spaces, takes first character of each part.
   * - Joins and uppercases, limited to 2 characters.
   * - Falls back to "U" if no name is provided.
   *
   * Example: "John Doe" -> "JD"
   */
  const getUserInitials = () => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  /**
   * Formats the user role for display.
   * - Capitalizes first letter, lowercases the rest.
   * - Falls back to "Guest" if role is missing.
   *
   * Example: "admin" -> "Admin"
   */
  const getRoleLabel = () => {
    if (!user?.role) return "Guest";
    return user.role.charAt(0).toUpperCase() + user.role.slice(1);
  };

  return (
    <nav
      ref={containerRef}
      className="fixed top-0 z-50 w-full bg-black shadow-xl border-b border-gray-800/50 backdrop-blur-sm"
    >
      <div className="px-4 h-16 flex items-center justify-between">
        {/* -------------------- Left Section: Brand -------------------- */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            {/* Brand icon with initials "RP" (Restaurant Pro) */}
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">RP</span>
            </div>
            {/* Brand name and tagline */}
            <div>
              <h1 className="text-white font-semibold text-lg">
                Restaurant Pro
              </h1>
              <p className="text-gray-400 text-xs">Management System</p>
            </div>
          </div>
        </div>

        {/* -------------------- Right Section: Notifications & Profile -------------------- */}
        <div className="flex items-center space-x-3">
          {/* Notification Bell (placeholder) */}
          <button
            className="p-2 rounded-lg hover:bg-gray-800/50 transition-colors relative"
            onClick={() => {
              /* Add notification handler later – currently placeholder */
            }}
            title="Notifications"
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
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {/* Mock unread indicator (small red dot) */}
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* Vertical divider */}
          <div className="h-8 w-px bg-gray-700" />

          {/* User profile area */}
          <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-800/50 transition-colors">
            {/* Avatar with initials */}
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {getUserInitials()}
              </span>
            </div>
            {/* User name and role (hidden on mobile, shown on md and up) */}
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-200">
                {user?.name || "Guest User"}
              </p>
              <p className="text-xs text-gray-400">{getRoleLabel()}</p>
            </div>
          </div>

          {/* Logout button – hidden on mobile, shown on md and up */}
          <button
            onClick={logout}
            className="hidden md:flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-red-500/10 transition-colors text-red-400 hover:text-red-300"
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
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
