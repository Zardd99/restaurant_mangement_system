"use client";

import { useState } from "react";
import Navbar from "./Navbar";
import CollapsibleSidebar from "./Sidebar/CollapsibleSidebar";
import { LayoutCoordinator } from "./LayoutCoordinator";
import { useAuth } from "../../../contexts/AuthContext";

const Layout = () => {
  const [coordinator] = useState(() => new LayoutCoordinator());
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    coordinator.handleLogout();
  };

  return (
    <div className="bg-black">
      <Navbar user={user} />

      {/* Collapsible Sidebar - Always visible, expands on hover */}
      <CollapsibleSidebar user={user} onLogout={handleLogout} />
    </div>
  );
};

export default Layout;
