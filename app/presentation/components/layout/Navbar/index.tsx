"use client";

import { useEffect, useRef } from "react";
import { useNavbarViewModel } from "./NavbarViewModel";
import { NavbarProps } from "./types";
import { useAuth } from "../../../../contexts/AuthContext";

const Navbar = ({ onMenuToggle, isMenuOpen }: NavbarProps) => {
  const { handleMenuToggle, handleClickOutside } = useNavbarViewModel(
    onMenuToggle,
    isMenuOpen,
  );
  const { user, logout } = useAuth();

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      handleClickOutside(event);
    };

    document.addEventListener("mousedown", handleDocumentClick);
    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, [handleClickOutside]);

  const getUserInitials = () => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = () => {
    if (!user?.role) return "Guest";
    return user.role.charAt(0).toUpperCase() + user.role.slice(1);
  };

  return (
    <nav
      ref={containerRef}
      className="fixed top-0 z-50 w-full bg-gradient-to-r from-gray-900 to-gray-950 shadow-xl border-b border-gray-800/50 backdrop-blur-sm"
    >
      <div className="px-4 h-16 flex items-center justify-between">
        {/* Left section with hamburger and brand */}
        <div className="flex items-center space-x-4">
          <button
            data-hamburger
            onClick={handleMenuToggle}
            className="p-2 rounded-lg hover:bg-gray-800/50 transition-colors group"
            aria-label="Toggle menu"
          >
            <div className="w-6 h-5 flex flex-col justify-between">
              <span
                className={`block h-0.5 w-full bg-gray-300 transition-transform ${isMenuOpen ? "rotate-45 translate-y-2" : ""}`}
              />
              <span
                className={`block h-0.5 w-full bg-gray-300 transition-opacity ${isMenuOpen ? "opacity-0" : ""}`}
              />
              <span
                className={`block h-0.5 w-full bg-gray-300 transition-transform ${isMenuOpen ? "-rotate-45 -translate-y-2" : ""}`}
              />
            </div>
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">RP</span>
            </div>
            <div>
              <h1 className="text-white font-semibold text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Restaurant Pro
              </h1>
              <p className="text-gray-400 text-xs">Management System</p>
            </div>
          </div>
        </div>

        {/* Right section with notifications and profile */}
        <div className="flex items-center space-x-3">
          <button
            className="p-2 rounded-lg hover:bg-gray-800/50 transition-colors relative"
            onClick={() => {
              /* Add notification handler */
            }}
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
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          <div className="h-8 w-px bg-gray-700" />

          <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-800/50 transition-colors">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {getUserInitials()}
              </span>
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-200">
                {user?.name || "Guest User"}
              </p>
              <p className="text-xs text-gray-400">{getRoleLabel()}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="hidden md:flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-red-500/10 transition-colors text-red-400 hover:text-red-300"
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
