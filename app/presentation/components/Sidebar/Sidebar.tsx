"use client";

import { forwardRef, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import SidebarMobile from "./SidebarMobile";
import sidebarContents from "../../../constants/sidebar";
import { AuthProvider, useAuth } from "../../../contexts/AuthContext";

interface SidebarProps {
  isOpens: boolean;
  handleToggles: () => void;
}

const Sidebar = forwardRef<HTMLDivElement, SidebarProps>((props, ref) => {
  // contexts and props
  const { isOpens, handleToggles } = props;
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth(); // Get logout function and user from auth context

  // state
  const [isUsersOpen, setIsUsersOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);

  // -- functions / useEffects -- //

  const handleToggle = (type: "auth" | "users") => {
    if (type === "auth") {
      setIsAuthOpen((prev) => !prev);
    } else if (type === "users") {
      setIsUsersOpen((prev) => !prev);
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    router.push("/login"); // Redirect to login page after logout
  };

  // Close dropdowns when sidebar is closed
  useEffect(() => {
    if (!isOpens) {
      setIsAuthOpen(false);
      setIsUsersOpen(false);
    }
  }, [isOpens]);

  // -- End -- //

  // Main UI
  return (
    <AuthProvider>
      <>
        {isOpens ? (
          <div
            onMouseLeave={() => handleToggles()}
            className="min-h-screen mt-18 w-72 fixed top-0 left-0 z-50 transition-all duration-300 ease-in-out bg-black border-r border-gray-700/50 shadow-2xl"
            ref={ref}
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-700/30">
              <div className="flex items-center space-x-3">
                <div>
                  <h1 className="text-white font-semibold text-lg">
                    Dashboard
                  </h1>
                  <p className="text-slate-400 text-sm">
                    Welcome to our Restaurant
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-120px)]">
              {sidebarContents.map((section) => (
                <div key={section.label} className="space-y-2">
                  <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-wider px-3 py-2">
                    {section.label}
                  </h2>

                  <div className="space-y-1">
                    {section.content.map((item) => {
                      // Handle Authentication dropdown
                      if (item.text === "Authentication") {
                        return (
                          <div key={item.text} className="space-y-1">
                            <div
                              className="group flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer transition-all duration-200 hover:bg-slate-700/50 active:scale-95"
                              onClick={() => handleToggle("auth")}
                              id="auth-menu"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="text-slate-300 group-hover:text-white transition-colors">
                                  {item.icon}
                                </div>
                                <span className="text-slate-200 font-medium group-hover:text-white transition-colors">
                                  {item.text}
                                </span>
                              </div>
                              <div
                                className={`text-slate-400 transition-all duration-200 ${
                                  isAuthOpen
                                    ? "rotate-180 text-blue-400"
                                    : "group-hover:text-slate-300"
                                }`}
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  fill="currentColor"
                                  viewBox="0 0 256 256"
                                >
                                  <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
                                </svg>
                              </div>
                            </div>

                            {isAuthOpen && (
                              <div className="ml-6 space-y-1 animate-in slide-in-from-top-1 duration-200">
                                <Link
                                  href="/login"
                                  className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                    pathname === "/login"
                                      ? "bg-blue-500/20 text-blue-300 border-l-2 border-blue-500"
                                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/30"
                                  }`}
                                >
                                  Login
                                </Link>
                                <Link
                                  href="/register"
                                  className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                    pathname === "/register"
                                      ? "bg-blue-500/20 text-blue-300 border-l-2 border-blue-500"
                                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/30"
                                  }`}
                                >
                                  Register
                                </Link>
                              </div>
                            )}
                          </div>
                        );
                      }

                      // Handle Users dropdown
                      if (item.text === "Users") {
                        return (
                          <div key={item.text} className="space-y-1">
                            <div
                              className="group flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer transition-all duration-200 hover:bg-slate-700/50 active:scale-95"
                              onClick={() => handleToggle("users")}
                            >
                              <div className="flex items-center space-x-3">
                                <div className="text-slate-300 group-hover:text-white transition-colors">
                                  {item.icon}
                                </div>
                                <span className="text-slate-200 font-medium group-hover:text-white transition-colors">
                                  {item.text}
                                </span>
                              </div>
                              <div
                                className={`text-slate-400 transition-all duration-200 ${
                                  isUsersOpen
                                    ? "rotate-180 text-blue-400"
                                    : "group-hover:text-slate-300"
                                }`}
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  fill="currentColor"
                                  viewBox="0 0 256 256"
                                >
                                  <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
                                </svg>
                              </div>
                            </div>

                            {isUsersOpen && (
                              <div className="ml-6 space-y-1 animate-in slide-in-from-top-1 duration-200">
                                <Link
                                  href="/profile"
                                  className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                    pathname === "/profile"
                                      ? "bg-blue-500/20 text-blue-300 border-l-2 border-blue-500"
                                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/30"
                                  }`}
                                >
                                  Profile
                                </Link>

                                {/* Replace the logout Link with a button that calls handleLogout */}
                                <button
                                  onClick={handleLogout}
                                  className={`block w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-slate-400 hover:text-red-300 hover:bg-red-500/10`}
                                >
                                  Logout
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      }

                      // Default sidebar item
                      return (
                        <Link
                          href={item.link}
                          key={item.text}
                          className={`group flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 hover:bg-slate-700/50 active:scale-95 ${
                            pathname === item.link
                              ? "bg-gray-700 bg-opacity-30 text-white border-l-2 border-white"
                              : "text-slate-200 hover:text-white"
                          }`}
                        >
                          <div
                            className={`transition-colors ${
                              pathname === item.link
                                ? "text-blue-400"
                                : "text-slate-400 group-hover:text-white"
                            }`}
                          >
                            {item.icon}
                          </div>
                          <span className="font-medium">{item.text}</span>
                        </Link>
                      );
                    })}
                  </div>

                  {/* Modern divider */}
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700/30 bg-slate-900/50 backdrop-blur">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.name || "User Name"}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {user?.email || "user@example.com"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <SidebarMobile ref={ref} handleTog={handleToggles} />
        )}
      </>
    </AuthProvider>
  );
});
Sidebar.displayName = "Sidebar";

export default Sidebar;
