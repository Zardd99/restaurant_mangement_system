"use client";

import { useRef, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SidebarConfig } from "../../../../lib/sidebar/sidebarConfig";
import { useAuth } from "../../../../contexts/AuthContext";
import Link from "next/link";

interface CollapsibleSidebarProps {
  user?: any;
  onLogout?: () => void;
}

const CollapsibleSidebar = ({ user, onLogout }: CollapsibleSidebarProps) => {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const sections = SidebarConfig.getFilteredItems(user?.role || "guest");

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    } else {
      logout();
    }
  };

  const handleItemClick = (itemId: string) => {
    if (itemId === "logout") {
      handleLogoutClick();
    }
  };

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
      {/* Header */}
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

      {/* Navigation Container */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide py-4">
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.id} className="space-y-1 px-2">
              {/* Section Label - Only show when hovered */}
              {isHovered && (
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 px-3 py-2 truncate">
                  {section.label}
                </h3>
              )}

              {/* Section Items */}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = item.link === pathname;
                  const hasChildren = item.children && item.children.length > 0;

                  return (
                    <div key={item.id} className="relative">
                      {/* Main Item */}
                      {hasChildren ? (
                        <button
                          onClick={() => toggleDropdown(item.id)}
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

                          {/* Text - Only show when hovered */}
                          {isHovered && (
                            <span className="ml-3 flex-1 text-left text-sm font-medium truncate">
                              {item.text}
                            </span>
                          )}

                          {/* Badge */}
                          {item.badge && isHovered && (
                            <span className="ml-2 px-2 py-0.5 bg-gray-700 text-white text-xs rounded fg-shrink-0">
                              {item.badge}
                            </span>
                          )}

                          {/* Dropdown Arrow - Only show when hovered */}
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

                          {/* Active indicator */}
                          {isActive && (
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-l" />
                          )}
                        </button>
                      ) : (
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

                          {/* Text - Only show when hovered */}
                          {isHovered && (
                            <span className="ml-3 flex-1 text-left text-sm font-medium truncate">
                              {item.text}
                            </span>
                          )}

                          {/* Badge */}
                          {item.badge && isHovered && (
                            <span className="ml-2 px-2 py-0.5 bg-gray-700 text-white text-xs rounded flex-shrink-0">
                              {item.badge}
                            </span>
                          )}

                          {/* Active indicator */}
                          {isActive && (
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-l" />
                          )}

                          {/* Tooltip when collapsed */}
                          {!isHovered && (
                            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-gray-700 shadow-xl">
                              {item.text}
                              <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-800"></div>
                            </div>
                          )}
                        </Link>
                      )}

                      {/* Dropdown Items */}
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

              {/* Divider */}
              <div className="my-2">
                <div className="border-t border-gray-800/50"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Profile - Bottom */}
      <div className="border-t border-gray-800 bg-gray-900/50 backdrop-blur flex-shrink-0 p-3">
        {isHovered ? (
          <div className="flex items-center space-x-3 animate-in fade-in duration-200">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
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

              {/* Tooltip */}
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
