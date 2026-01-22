"use client";

import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import SidebarMobile from "./Sidebar/SidebarMobile";
import { LayoutCoordinator } from "./LayoutCoordinator";
import { useAuth } from "../../../contexts/AuthContext";

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [coordinator] = useState(() => new LayoutCoordinator());
  const { user, logout } = useAuth();

  const handleMenuToggle = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const handleLogout = () => {
    logout();
    coordinator.handleLogout();
  };

  const handleItemClick = (itemId: string) => {
    if (itemId === "logout") {
      handleLogout();
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <Navbar
        onMenuToggle={handleMenuToggle}
        isMenuOpen={isSidebarOpen}
        user={user}
      />

      {/* Desktop Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        user={user}
        onLogout={handleLogout}
      />

      {/* Mobile Sidebar (always visible when main sidebar is closed) */}
      {!isSidebarOpen && (
        <SidebarMobile
          userRole={user?.role || "guest"}
          onItemClick={handleItemClick}
          onExpand={() => setIsSidebarOpen(true)}
        />
      )}
    </div>
  );
};

export default Layout;
