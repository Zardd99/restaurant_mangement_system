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
import { useRouter } from "next/navigation";
import { NavbarProps } from "./types";
import { useAuth } from "../../../../contexts/AuthContext";

const Navbar = ({ user }: NavbarProps) => {
  const { logout } = useAuth();
  const router = useRouter();

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
      className="fixed top-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 rounded-full border border-white/40 bg-white/60 shadow-lg shadow-black/5 ring-1 ring-black/5 backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-black/40 dark:shadow-black/30 dark:ring-white/5"
    >
      <div className="flex h-14 items-center justify-between gap-3 pl-3 pr-2 sm:pl-5 sm:pr-3">
        {/* -------------------- Left Section: Brand -------------------- */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500 shadow-sm shadow-indigo-500/30">
            <span className="text-sm font-bold text-white">RP</span>
          </div>
          <div className="leading-tight">
            <h1 className="text-base font-semibold text-gray-900 dark:text-white">
              Restaurant Pro
            </h1>
            <p className="hidden text-xs text-gray-500 sm:block dark:text-gray-400">
              Management System
            </p>
          </div>
        </div>

        {/* -------------------- Right Section: Notifications & Profile -------------------- */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Notification Bell (placeholder) */}
          <button
            className="relative rounded-full p-2 text-gray-600 transition-colors hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/10"
            onClick={() => router.push("/notifications")}
            title="Notifications"
          >
            <svg
              className="h-5 w-5"
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
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white/70 dark:ring-black/40" />
          </button>

          {/* Vertical divider */}
          <div className="hidden h-7 w-px bg-black/10 sm:block dark:bg-white/15" />

          {/* User profile area */}
          <div className="flex items-center gap-2 rounded-full p-1 pr-2 transition-colors hover:bg-black/5 dark:hover:bg-white/10">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-white/10">
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {getUserInitials()}
              </span>
            </div>
            {/* User name and role (hidden on mobile, shown on md and up) */}
            <div className="hidden text-left md:block">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {user?.name || "Guest User"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {getRoleLabel()}
              </p>
            </div>
          </div>

          {/* Logout button – hidden on mobile, shown on md and up */}
          <button
            onClick={logout}
            className="hidden items-center gap-2 rounded-full px-3 py-2 text-red-500 transition-colors hover:bg-red-500/10 hover:text-red-600 md:flex dark:text-red-400 dark:hover:text-red-300"
            title="Logout"
          >
            <svg
              className="h-4 w-4"
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
