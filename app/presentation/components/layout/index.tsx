"use client";

import { useState } from "react";
import Navbar from "./Navbar";
import CollapsibleSidebar from "./Sidebar/CollapsibleSidebar";
import { LayoutCoordinator } from "./LayoutCoordinator";
import { useAuth } from "../../../contexts/AuthContext";

/**
 * Layout – Root layout component that composes the main UI shell.
 *
 * This component is responsible for rendering the application's persistent
 * layout elements: the top navbar and the collapsible sidebar.
 * It uses a `LayoutCoordinator` instance to manage shared layout state
 * (e.g., sidebar expansion, mobile menu visibility) in a coordinated manner
 * across different parts of the layout. The coordinator is instantiated once
 * using `useState` to ensure it survives re‑renders without being recreated.
 *
 * Authentication state is obtained from `useAuth()`, and the logout handler
 * is wired to both the auth context and the coordinator, allowing the
 * coordinator to perform any additional cleanup (e.g., resetting UI state)
 * when the user logs out.
 */
const Layout = () => {
  // Stable reference to the layout coordinator – created once using lazy initialisation.
  // The coordinator holds shared state and methods for the navbar and sidebar,
  // enabling them to communicate without prop drilling.
  const [coordinator] = useState(() => new LayoutCoordinator());

  // Get current user and logout function from the authentication context.
  const { user, logout } = useAuth();

  /**
   * Custom logout handler.
   * - Calls the auth context's `logout` to clear authentication state.
   * - Notifies the layout coordinator so it can reset any layout‑specific state
   *   (e.g., close the sidebar, reset expanded items) when the user logs out.
   */
  const handleLogout = () => {
    logout();
    coordinator.handleLogout();
  };

  return (
    <div className="bg-black">
      {/* Top navigation bar – receives user data for display (avatar, name). */}
      <Navbar user={user} />

      {/* Collapsible sidebar – always present, but can be collapsed/expanded.
          It receives the user and the logout handler to show user info and
          trigger logout from within the sidebar. */}
      <CollapsibleSidebar user={user} onLogout={handleLogout} />
    </div>
  );
};

export default Layout;
